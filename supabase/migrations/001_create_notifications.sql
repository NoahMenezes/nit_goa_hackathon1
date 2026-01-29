-- Create notifications table for in-app notifications
-- Migration: 001_create_notifications.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'comment',           -- New comment on user's issue
    'status_update',     -- Issue status changed
    'vote',             -- Someone voted on user's issue
    'resolution',       -- Issue was resolved
    'mention',          -- User was mentioned in comment
    'system',           -- System announcement
    'admin_message',    -- Message from admin
    'reply'             -- Reply to user's comment
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_issue_id ON notifications(issue_id);

-- Function to automatically create notification on new comment
CREATE OR REPLACE FUNCTION notify_on_new_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify issue owner (if different from commenter)
  IF EXISTS (
    SELECT 1 FROM issues
    WHERE id = NEW.issue_id
    AND user_id != NEW.user_id
    AND user_id IS NOT NULL
  ) THEN
    INSERT INTO notifications (user_id, type, title, message, issue_id, comment_id, action_url)
    SELECT
      i.user_id,
      'comment',
      'New comment on your issue',
      NEW.user_name || ' commented: ' || LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
      NEW.issue_id,
      NEW.id,
      '/issues/' || NEW.issue_id
    FROM issues i
    WHERE i.id = NEW.issue_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new comments
DROP TRIGGER IF EXISTS trigger_notify_on_new_comment ON comments;
CREATE TRIGGER trigger_notify_on_new_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_comment();

-- Function to notify on issue status change
CREATE OR REPLACE FUNCTION notify_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, issue_id, action_url)
    VALUES (
      NEW.user_id,
      'status_update',
      'Issue status updated',
      'Your issue "' || LEFT(NEW.title, 50) || '" status changed to: ' || NEW.status,
      NEW.id,
      '/issues/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS trigger_notify_on_status_change ON issues;
CREATE TRIGGER trigger_notify_on_status_change
  AFTER UPDATE ON issues
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_on_status_change();

-- Function to notify on issue resolution
CREATE OR REPLACE FUNCTION notify_on_resolution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, issue_id, action_url)
    VALUES (
      NEW.user_id,
      'resolution',
      'Your issue has been resolved! 🎉',
      'The issue "' || LEFT(NEW.title, 50) || '" has been marked as resolved.',
      NEW.id,
      '/issues/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for resolutions
DROP TRIGGER IF EXISTS trigger_notify_on_resolution ON issues;
CREATE TRIGGER trigger_notify_on_resolution
  AFTER UPDATE ON issues
  FOR EACH ROW
  WHEN (NEW.status = 'resolved' AND OLD.status IS DISTINCT FROM 'resolved')
  EXECUTE FUNCTION notify_on_resolution();

-- Function to clean up old read notifications (optional - run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete read notifications older than 90 days
  DELETE FROM notifications
  WHERE read = TRUE
  AND created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT
  USING (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE
  USING (true);

-- Only system/admin can create notifications (via triggers or admin actions)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated, anon;
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Create a view for unread notification count per user
CREATE OR REPLACE VIEW user_unread_notifications AS
SELECT
  user_id,
  COUNT(*) as unread_count,
  MAX(created_at) as latest_notification
FROM notifications
WHERE read = FALSE
GROUP BY user_id;

GRANT SELECT ON user_unread_notifications TO authenticated, anon;

-- Insert a welcome notification for existing users
INSERT INTO notifications (user_id, type, title, message, action_url)
SELECT
  id,
  'system',
  'Welcome to OurStreet! 👋',
  'Start reporting issues in your neighborhood and help make your city better.',
  '/issues'
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM notifications WHERE user_id = users.id
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE notifications IS 'Stores in-app notifications for users';
COMMENT ON COLUMN notifications.type IS 'Type of notification: comment, status_update, vote, resolution, mention, system, admin_message, reply';
COMMENT ON COLUMN notifications.metadata IS 'Additional flexible data stored as JSON';
COMMENT ON FUNCTION notify_on_new_comment() IS 'Automatically creates notification when someone comments on a user''s issue';
COMMENT ON FUNCTION notify_on_status_change() IS 'Notifies user when their issue status changes';
COMMENT ON FUNCTION notify_on_resolution() IS 'Sends celebration notification when issue is resolved';
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Removes old read notifications to keep table size manageable';
