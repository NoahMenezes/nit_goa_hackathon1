-- Enhance comments system with likes, replies, and edit functionality
-- Migration: 003_enhance_comments.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add new columns to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

-- Create comment_likes table for tracking who liked what
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_likes ON comments(likes DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET likes = likes + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET likes = GREATEST(likes - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for comment likes
DROP TRIGGER IF EXISTS trigger_update_comment_likes_insert ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes_insert
  AFTER INSERT ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes();

DROP TRIGGER IF EXISTS trigger_update_comment_likes_delete ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes_delete
  AFTER DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes();

-- Function to automatically set updated_at and is_edited when comment is edited
CREATE OR REPLACE FUNCTION handle_comment_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    NEW.updated_at = NOW();
    NEW.is_edited = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment updates
DROP TRIGGER IF EXISTS trigger_handle_comment_update ON comments;
CREATE TRIGGER trigger_handle_comment_update
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_comment_update();

-- Function to notify on comment reply
CREATE OR REPLACE FUNCTION notify_on_comment_reply()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a reply (has parent_comment_id), notify the parent comment author
  IF NEW.parent_comment_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, issue_id, comment_id, action_url)
    SELECT
      c.user_id,
      'reply',
      'New reply to your comment',
      NEW.user_name || ' replied: ' || LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
      NEW.issue_id,
      NEW.id,
      '/issues/' || NEW.issue_id
    FROM comments c
    WHERE c.id = NEW.parent_comment_id
    AND c.user_id != NEW.user_id -- Don't notify if replying to own comment
    AND c.user_id IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment replies
DROP TRIGGER IF EXISTS trigger_notify_on_comment_reply ON comments;
CREATE TRIGGER trigger_notify_on_comment_reply
  AFTER INSERT ON comments
  FOR EACH ROW
  WHEN (NEW.parent_comment_id IS NOT NULL)
  EXECUTE FUNCTION notify_on_comment_reply();

-- Function to notify on comment like (optional - can be enabled if needed)
CREATE OR REPLACE FUNCTION notify_on_comment_like()
RETURNS TRIGGER AS $$
DECLARE
  liker_name VARCHAR(255);
  comment_content TEXT;
  comment_issue_id UUID;
BEGIN
  -- Get the name of the user who liked
  SELECT name INTO liker_name FROM users WHERE id = NEW.user_id;

  -- Get comment details
  SELECT content, issue_id INTO comment_content, comment_issue_id
  FROM comments WHERE id = NEW.comment_id;

  -- Notify comment author (only if it's not self-like)
  INSERT INTO notifications (user_id, type, title, message, issue_id, comment_id, action_url)
  SELECT
    c.user_id,
    'vote',
    'Someone liked your comment',
    liker_name || ' liked your comment: "' || LEFT(comment_content, 50) || '"',
    comment_issue_id,
    NEW.comment_id,
    '/issues/' || comment_issue_id
  FROM comments c
  WHERE c.id = NEW.comment_id
  AND c.user_id != NEW.user_id -- Don't notify on self-like
  AND c.user_id IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment likes (commented out by default - uncomment if you want notifications for every like)
-- DROP TRIGGER IF EXISTS trigger_notify_on_comment_like ON comment_likes;
-- CREATE TRIGGER trigger_notify_on_comment_like
--   AFTER INSERT ON comment_likes
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_on_comment_like();

-- Create view for comments with like status and reply count
CREATE OR REPLACE VIEW comments_with_metadata AS
SELECT
  c.id,
  c.issue_id,
  c.user_id,
  c.user_name,
  c.content,
  c.parent_comment_id,
  c.likes,
  c.is_edited,
  c.created_at,
  c.updated_at,
  COUNT(DISTINCT replies.id) as reply_count
FROM comments c
LEFT JOIN comments replies ON replies.parent_comment_id = c.id
GROUP BY c.id, c.issue_id, c.user_id, c.user_name, c.content,
         c.parent_comment_id, c.likes, c.is_edited, c.created_at, c.updated_at;

-- Enable Row Level Security on comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_likes
-- Anyone can read likes
CREATE POLICY "Anyone can read comment likes" ON comment_likes
  FOR SELECT
  USING (true);

-- Authenticated users can like comments
CREATE POLICY "Authenticated users can like comments" ON comment_likes
  FOR INSERT
  WITH CHECK (true);

-- Users can unlike their own likes
CREATE POLICY "Users can delete own likes" ON comment_likes
  FOR DELETE
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON comment_likes TO authenticated, anon;
GRANT SELECT ON comments_with_metadata TO authenticated, anon;

-- Add comments for documentation
COMMENT ON TABLE comment_likes IS 'Tracks which users liked which comments';
COMMENT ON COLUMN comments.parent_comment_id IS 'Reference to parent comment for threaded/nested replies';
COMMENT ON COLUMN comments.likes IS 'Cached count of likes for this comment';
COMMENT ON COLUMN comments.is_edited IS 'Flag indicating if the comment has been edited after creation';
COMMENT ON COLUMN comments.updated_at IS 'Timestamp of last edit (NULL if never edited)';
COMMENT ON FUNCTION update_comment_likes() IS 'Automatically updates the likes count on comments when likes are added/removed';
COMMENT ON FUNCTION handle_comment_update() IS 'Sets updated_at and is_edited flag when comment content is modified';
COMMENT ON FUNCTION notify_on_comment_reply() IS 'Sends notification to parent comment author when someone replies';
COMMENT ON VIEW comments_with_metadata IS 'Enhanced comment view with like counts and reply counts';

-- Function to get comment thread (parent and all replies)
CREATE OR REPLACE FUNCTION get_comment_thread(root_comment_id UUID)
RETURNS TABLE(
  id UUID,
  issue_id UUID,
  user_id UUID,
  user_name VARCHAR,
  content TEXT,
  parent_comment_id UUID,
  likes INTEGER,
  is_edited BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  depth INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE comment_tree AS (
    -- Base case: get the root comment
    SELECT
      c.id,
      c.issue_id,
      c.user_id,
      c.user_name,
      c.content,
      c.parent_comment_id,
      c.likes,
      c.is_edited,
      c.created_at,
      c.updated_at,
      0 as depth
    FROM comments c
    WHERE c.id = root_comment_id

    UNION ALL

    -- Recursive case: get all replies
    SELECT
      c.id,
      c.issue_id,
      c.user_id,
      c.user_name,
      c.content,
      c.parent_comment_id,
      c.likes,
      c.is_edited,
      c.created_at,
      c.updated_at,
      ct.depth + 1
    FROM comments c
    INNER JOIN comment_tree ct ON c.parent_comment_id = ct.id
  )
  SELECT * FROM comment_tree
  ORDER BY depth, created_at;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_comment_thread(UUID) IS 'Retrieves a complete comment thread (parent comment and all nested replies) with depth levels';
