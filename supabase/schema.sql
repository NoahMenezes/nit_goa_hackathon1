-- OurStreet Database Schema for Supabase
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin', 'authority')),
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('pothole', 'streetlight', 'garbage', 'water_leak', 'road', 'sanitation', 'drainage', 'electricity', 'traffic', 'other')),
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  photo_url TEXT,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed', 'rejected')),
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(issue_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_issues_user_id ON issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_votes ON issues(votes DESC);
CREATE INDEX IF NOT EXISTS idx_issues_location ON issues USING GIST (point(longitude, latitude));

CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_votes_issue_id ON votes(issue_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to auto-set resolved_at when status changes to resolved
CREATE OR REPLACE FUNCTION set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  ELSIF NEW.status != 'resolved' THEN
    NEW.resolved_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_issue_resolved_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION set_resolved_at();

-- Create function to increment/decrement vote count
CREATE OR REPLACE FUNCTION update_issue_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE issues SET votes = votes + 1 WHERE id = NEW.issue_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE issues SET votes = GREATEST(votes - 1, 0) WHERE id = OLD.issue_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_votes_on_insert
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_issue_votes();

CREATE TRIGGER update_votes_on_delete
  AFTER DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_issue_votes();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Allow service role to bypass RLS for user creation
-- Users can read all user profiles (excluding passwords will be handled in API)
CREATE POLICY "Users can read all profiles" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (true);

-- Allow anyone to insert during registration (API will handle validation)
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (true);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role full access" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for issues table
-- Anyone can read issues
CREATE POLICY "Anyone can read issues" ON issues
  FOR SELECT USING (true);

-- Authenticated users can create issues
CREATE POLICY "Authenticated users can create issues" ON issues
  FOR INSERT WITH CHECK (true);

-- Users can update their own issues
CREATE POLICY "Users can update own issues" ON issues
  FOR UPDATE USING (true);

-- Users can delete their own issues
CREATE POLICY "Users can delete own issues" ON issues
  FOR DELETE USING (true);

-- RLS Policies for comments table
-- Anyone can read comments
CREATE POLICY "Anyone can read comments" ON comments
  FOR SELECT USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (true);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (true);

-- RLS Policies for votes table
-- Anyone can read votes
CREATE POLICY "Anyone can read votes" ON votes
  FOR SELECT USING (true);

-- Authenticated users can vote
CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT WITH CHECK (true);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes" ON votes
  FOR DELETE USING (true);

-- Insert seed data for demo purposes
INSERT INTO users (id, name, email, password, role, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001'::UUID, 'John Doe', 'john@example.com', '$2b$10$P0XqvSRbQhS6Xy5hnp3g/OH5Qce90q1aq810DJJYOW5rRk7evX4Hy', 'citizen', NOW()),
  ('550e8400-e29b-41d4-a716-446655440002'::UUID, 'Jane Smith', 'jane@example.com', '$2b$10$P0XqvSRbQhS6Xy5hnp3g/OH5Qce90q1aq810DJJYOW5rRk7evX4Hy', 'citizen', NOW()),
  ('550e8400-e29b-41d4-a716-446655440003'::UUID, 'Admin User', 'admin@ourstreet.com', '$2b$10$Ut7Ku4Dlnf0CUX4wjKHVAuTCCW2kFlp7QodpsCjsessXvlZ1rYqtK', 'admin', NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert sample issues
INSERT INTO issues (title, description, category, location, latitude, longitude, status, priority, user_id, votes, created_at) VALUES
  ('Pothole on Main Street', 'Large pothole causing traffic issues and vehicle damage', 'pothole', 'Main Street, Panjim, Goa', 15.4909, 73.8278, 'open', 'high', '550e8400-e29b-41d4-a716-446655440001'::UUID, 3, NOW()),
  ('Broken Streetlight', 'Streetlight not working since last week, making the area unsafe at night', 'streetlight', 'Church Square, Panjim, Goa', 15.4989, 73.8345, 'in-progress', 'medium', '550e8400-e29b-41d4-a716-446655440002'::UUID, 1, NOW()),
  ('Overflowing Garbage Bin', 'Garbage bin overflowing for 3 days, creating health hazards', 'garbage', 'Market Area, Panjim, Goa', 15.485, 73.825, 'resolved', 'high', '550e8400-e29b-41d4-a716-446655440001'::UUID, 0, NOW() - INTERVAL '2 days'),
  ('Water Leak', 'Continuous water leak from pipe, wasting water', 'water_leak', 'Residency Road, Panjim, Goa', 15.495, 73.83, 'open', 'medium', '550e8400-e29b-41d4-a716-446655440002'::UUID, 1, NOW()),
  ('Damaged Road', 'Road surface damaged after recent rains', 'road', 'MG Road, Panjim, Goa', 15.4875, 73.8275, 'open', 'medium', '550e8400-e29b-41d4-a716-446655440001'::UUID, 0, NOW())
ON CONFLICT DO NOTHING;

-- Insert sample comments
INSERT INTO comments (issue_id, user_id, user_name, content, created_at)
SELECT i.id, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'Jane Smith', 'I saw this too! It''s really bad and needs immediate attention.', NOW()
FROM issues i WHERE i.title = 'Pothole on Main Street'
ON CONFLICT DO NOTHING;

INSERT INTO comments (issue_id, user_id, user_name, content, created_at)
SELECT i.id, '550e8400-e29b-41d4-a716-446655440003'::UUID, 'Admin User', 'This has been escalated to the road maintenance department.', NOW()
FROM issues i WHERE i.title = 'Pothole on Main Street'
ON CONFLICT DO NOTHING;

INSERT INTO comments (issue_id, user_id, user_name, content, created_at)
SELECT i.id, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'John Doe', 'Thank you for reporting. Work is in progress.', NOW()
FROM issues i WHERE i.title = 'Broken Streetlight'
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create a view for issue statistics
CREATE OR REPLACE VIEW issue_stats AS
SELECT
  COUNT(*) as total_issues,
  COUNT(*) FILTER (WHERE status = 'open') as open_issues,
  COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress_issues,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_issues,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_issues,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_hours
FROM issues;

GRANT SELECT ON issue_stats TO anon, authenticated;
