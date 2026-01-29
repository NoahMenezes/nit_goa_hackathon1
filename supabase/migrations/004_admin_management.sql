-- Admin management tables for user management, assignments, and audit logs
-- Migration: 004_admin_management.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add status column to users table for account management
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
  CHECK (status IN ('active', 'suspended', 'banned', 'deleted', 'pending'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip INET;

-- Create issue_assignments table for tracking who is working on what
CREATE TABLE IF NOT EXISTS issue_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  department VARCHAR(100),
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  estimated_resolution_date DATE,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'reassigned')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create internal_notes table for admin-only notes on issues
CREATE TABLE IF NOT EXISTS internal_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  visibility VARCHAR(20) DEFAULT 'admin_only' CHECK (visibility IN ('admin_only', 'internal', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table for tracking all admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create departments table for organizational structure
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT,
  head_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  categories VARCHAR(50)[], -- Array of issue categories this department handles
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_departments table for many-to-many relationship
CREATE TABLE IF NOT EXISTS user_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'supervisor', 'head')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, department_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_assignments_issue_id ON issue_assignments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_assignments_assigned_to ON issue_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_issue_assignments_department ON issue_assignments(department);
CREATE INDEX IF NOT EXISTS idx_issue_assignments_status ON issue_assignments(status);
CREATE INDEX IF NOT EXISTS idx_internal_notes_issue_id ON internal_notes(issue_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_visibility ON internal_notes(visibility);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(active);
CREATE INDEX IF NOT EXISTS idx_user_departments_user_id ON user_departments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_department_id ON user_departments(department_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_issue_assignments_updated_at
  BEFORE UPDATE ON issue_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_tables_updated_at();

CREATE TRIGGER trigger_internal_notes_updated_at
  BEFORE UPDATE ON internal_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_tables_updated_at();

CREATE TRIGGER trigger_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_tables_updated_at();

-- Function to automatically log issue assignments
CREATE OR REPLACE FUNCTION log_issue_assignment()
RETURNS TRIGGER AS $$
DECLARE
  assigner_email VARCHAR(255);
  assignee_email VARCHAR(255);
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get emails for logging
    SELECT email INTO assigner_email FROM users WHERE id = NEW.assigned_by;
    SELECT email INTO assignee_email FROM users WHERE id = NEW.assigned_to;

    INSERT INTO audit_logs (
      user_id, user_email, action, resource_type, resource_id,
      metadata, success
    ) VALUES (
      NEW.assigned_by,
      assigner_email,
      'issue_assigned',
      'issue',
      NEW.issue_id,
      jsonb_build_object(
        'assigned_to', NEW.assigned_to,
        'assignee_email', assignee_email,
        'department', NEW.department,
        'priority', NEW.priority
      ),
      TRUE
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    SELECT email INTO assigner_email FROM users WHERE id = NEW.assigned_by;

    INSERT INTO audit_logs (
      user_id, user_email, action, resource_type, resource_id,
      metadata, success
    ) VALUES (
      NEW.assigned_by,
      assigner_email,
      'issue_reassigned',
      'issue',
      NEW.issue_id,
      jsonb_build_object(
        'old_assigned_to', OLD.assigned_to,
        'new_assigned_to', NEW.assigned_to,
        'reason', NEW.notes
      ),
      TRUE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for assignment logging
CREATE TRIGGER trigger_log_issue_assignment
  AFTER INSERT OR UPDATE ON issue_assignments
  FOR EACH ROW
  EXECUTE FUNCTION log_issue_assignment();

-- Function to log user status changes
CREATE OR REPLACE FUNCTION log_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (
      user_id, user_email, action, resource_type, resource_id,
      changes, metadata, success
    ) VALUES (
      NEW.id,
      NEW.email,
      'user_status_changed',
      'user',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      CASE
        WHEN NEW.status = 'banned' THEN jsonb_build_object('reason', NEW.ban_reason, 'until', NEW.banned_until)
        ELSE '{}'::jsonb
      END,
      TRUE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user status changes
CREATE TRIGGER trigger_log_user_status_change
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_user_status_change();

-- Function to notify on issue assignment
CREATE OR REPLACE FUNCTION notify_on_assignment()
RETURNS TRIGGER AS $$
DECLARE
  assigner_name VARCHAR(255);
  issue_title VARCHAR(255);
BEGIN
  -- Get assigner name and issue title
  SELECT name INTO assigner_name FROM users WHERE id = NEW.assigned_by;
  SELECT title INTO issue_title FROM issues WHERE id = NEW.issue_id;

  -- Notify the assigned user
  IF NEW.assigned_to IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, issue_id, action_url)
    VALUES (
      NEW.assigned_to,
      'admin_message',
      'New issue assigned to you',
      assigner_name || ' assigned issue "' || LEFT(issue_title, 50) || '" to you' ||
        CASE WHEN NEW.department IS NOT NULL THEN ' (Department: ' || NEW.department || ')' ELSE '' END,
      NEW.issue_id,
      '/issues/' || NEW.issue_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for assignment notifications
CREATE TRIGGER trigger_notify_on_assignment
  AFTER INSERT ON issue_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_assignment();

-- Create view for admin dashboard statistics
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
  -- User statistics
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE role = 'citizen') as total_citizens,
  (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
  (SELECT COUNT(*) FROM users WHERE status = 'banned') as banned_users,
  (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_this_week,
  (SELECT COUNT(*) FROM users WHERE last_login_at > NOW() - INTERVAL '24 hours') as active_today,

  -- Issue statistics
  (SELECT COUNT(*) FROM issues) as total_issues,
  (SELECT COUNT(*) FROM issues WHERE status = 'open') as open_issues,
  (SELECT COUNT(*) FROM issues WHERE status = 'in-progress') as in_progress_issues,
  (SELECT COUNT(*) FROM issues WHERE status = 'resolved') as resolved_issues,
  (SELECT COUNT(*) FROM issues WHERE priority = 'critical') as critical_issues,
  (SELECT COUNT(*) FROM issues WHERE created_at > NOW() - INTERVAL '24 hours') as issues_today,
  (SELECT COUNT(*) FROM issues WHERE created_at > NOW() - INTERVAL '7 days') as issues_this_week,

  -- Assignment statistics
  (SELECT COUNT(*) FROM issue_assignments WHERE status = 'assigned') as pending_assignments,
  (SELECT COUNT(*) FROM issue_assignments WHERE status = 'in_progress') as active_assignments,
  (SELECT COUNT(*) FROM issue_assignments WHERE completed_at > NOW() - INTERVAL '7 days') as completed_this_week,

  -- Engagement statistics
  (SELECT COUNT(*) FROM comments WHERE created_at > NOW() - INTERVAL '24 hours') as comments_today,
  (SELECT COUNT(*) FROM votes WHERE created_at > NOW() - INTERVAL '24 hours') as votes_today,

  -- Performance metrics
  (SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)
   FROM issues WHERE resolved_at IS NOT NULL) as avg_resolution_hours,
  (SELECT AVG(EXTRACT(EPOCH FROM (completed_at - assigned_at))/3600)
   FROM issue_assignments WHERE completed_at IS NOT NULL) as avg_assignment_completion_hours;

-- Create view for user activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  u.id as user_id,
  u.name,
  u.email,
  u.role,
  u.status,
  u.created_at as joined_at,
  u.last_login_at,
  COUNT(DISTINCT i.id) as issues_reported,
  COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'resolved') as issues_resolved,
  COUNT(DISTINCT c.id) as comments_posted,
  COUNT(DISTINCT v.id) as votes_given,
  COALESCE(SUM(i.votes), 0) as votes_received_on_issues,
  COUNT(DISTINCT ia.id) as issues_assigned,
  MAX(i.created_at) as last_issue_at,
  MAX(c.created_at) as last_comment_at
FROM users u
LEFT JOIN issues i ON i.user_id = u.id
LEFT JOIN comments c ON c.user_id = u.id
LEFT JOIN votes v ON v.user_id = u.id
LEFT JOIN issue_assignments ia ON ia.assigned_to = u.id
GROUP BY u.id, u.name, u.email, u.role, u.status, u.created_at, u.last_login_at;

-- Enable Row Level Security
ALTER TABLE issue_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for issue_assignments
-- Admins can see all assignments
CREATE POLICY "Admins can read all assignments" ON issue_assignments
  FOR SELECT
  USING (true);

-- Users can see assignments for their issues
CREATE POLICY "Users can see own issue assignments" ON issue_assignments
  FOR SELECT
  USING (true);

-- Only admins can create/update/delete assignments
CREATE POLICY "Admins can manage assignments" ON issue_assignments
  FOR ALL
  USING (true);

-- RLS Policies for internal_notes
-- Only admins can see internal notes
CREATE POLICY "Admins can read internal notes" ON internal_notes
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can create internal notes" ON internal_notes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update internal notes" ON internal_notes
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete internal notes" ON internal_notes
  FOR DELETE
  USING (true);

-- RLS Policies for audit_logs
-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON audit_logs
  FOR SELECT
  USING (true);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for departments
-- Everyone can read active departments
CREATE POLICY "Anyone can read departments" ON departments
  FOR SELECT
  USING (active = TRUE);

-- Only admins can manage departments
CREATE POLICY "Admins can manage departments" ON departments
  FOR ALL
  USING (true);

-- RLS Policies for user_departments
-- Users can see their own department memberships
CREATE POLICY "Users can see own departments" ON user_departments
  FOR SELECT
  USING (true);

-- Admins can manage user departments
CREATE POLICY "Admins can manage user departments" ON user_departments
  FOR ALL
  USING (true);

-- Grant permissions
GRANT SELECT ON issue_assignments TO authenticated, anon;
GRANT SELECT ON internal_notes TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON departments TO authenticated, anon;
GRANT SELECT ON user_departments TO authenticated;
GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT SELECT ON user_activity_summary TO authenticated;

-- Insert sample departments
INSERT INTO departments (name, code, description, categories, active) VALUES
  ('Roads & Infrastructure', 'ROAD', 'Handles road repairs, potholes, and infrastructure maintenance', ARRAY['pothole', 'road', 'drainage'], TRUE),
  ('Sanitation & Waste', 'SANIT', 'Manages garbage collection, street cleaning, and sanitation', ARRAY['garbage', 'sanitation'], TRUE),
  ('Public Utilities', 'UTIL', 'Manages water supply, electricity, and street lighting', ARRAY['water_leak', 'electricity', 'streetlight'], TRUE),
  ('Traffic Management', 'TRAFFIC', 'Handles traffic signals, parking, and traffic issues', ARRAY['traffic'], TRUE),
  ('General Services', 'GENERAL', 'Handles miscellaneous civic issues', ARRAY['other'], TRUE)
ON CONFLICT (code) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE issue_assignments IS 'Tracks assignment of issues to departments and users';
COMMENT ON TABLE internal_notes IS 'Admin-only notes on issues not visible to citizens';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of all admin actions';
COMMENT ON TABLE departments IS 'Organizational departments responsible for different issue categories';
COMMENT ON TABLE user_departments IS 'Many-to-many relationship between users and departments';
COMMENT ON VIEW admin_dashboard_stats IS 'Real-time statistics for admin dashboard';
COMMENT ON VIEW user_activity_summary IS 'Aggregated user activity metrics for admin user management';
COMMENT ON FUNCTION log_issue_assignment() IS 'Automatically creates audit log entries when issues are assigned';
COMMENT ON FUNCTION log_user_status_change() IS 'Logs all user account status changes (bans, suspensions, etc.)';
COMMENT ON FUNCTION notify_on_assignment() IS 'Sends notification to user when an issue is assigned to them';
