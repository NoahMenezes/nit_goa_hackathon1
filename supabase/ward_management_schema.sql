-- Ward Management Schema Extension
-- Run this after the main schema.sql

-- Create wards table
CREATE TABLE IF NOT EXISTS wards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_number VARCHAR(10) UNIQUE NOT NULL,
  ward_name VARCHAR(255) NOT NULL,
  ward_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  population INTEGER,
  area_sq_km DECIMAL(10, 2),
  boundary_geojson JSONB,
  description TEXT,
  contact_number VARCHAR(20),
  email VARCHAR(255),
  office_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add ward_id to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS ward_id UUID REFERENCES wards(id) ON DELETE SET NULL;

-- Create ward_analytics table for storing AI-generated insights
CREATE TABLE IF NOT EXISTS ward_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_id UUID REFERENCES wards(id) ON DELETE CASCADE NOT NULL,
  analysis_date DATE NOT NULL,
  total_issues INTEGER DEFAULT 0,
  open_issues INTEGER DEFAULT 0,
  resolved_issues INTEGER DEFAULT 0,
  avg_resolution_time_hours DECIMAL(10, 2),
  category_breakdown JSONB,
  priority_breakdown JSONB,
  performance_score DECIMAL(5, 2),
  trend_analysis JSONB,
  ai_insights TEXT,
  ai_recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ward_id, analysis_date)
);

-- Create ward_performance_metrics table
CREATE TABLE IF NOT EXISTS ward_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_id UUID REFERENCES wards(id) ON DELETE CASCADE NOT NULL,
  metric_date DATE NOT NULL,
  response_time_hours DECIMAL(10, 2),
  resolution_rate DECIMAL(5, 2),
  citizen_satisfaction DECIMAL(3, 2),
  sla_compliance_rate DECIMAL(5, 2),
  resource_utilization DECIMAL(5, 2),
  budget_spent DECIMAL(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ward_id, metric_date)
);

-- Create ward_resources table
CREATE TABLE IF NOT EXISTS ward_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_id UUID REFERENCES wards(id) ON DELETE CASCADE NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_name VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'in-use', 'maintenance', 'unavailable')),
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ward_budget table
CREATE TABLE IF NOT EXISTS ward_budget (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_id UUID REFERENCES wards(id) ON DELETE CASCADE NOT NULL,
  fiscal_year INTEGER NOT NULL,
  allocated_budget DECIMAL(12, 2) NOT NULL,
  spent_budget DECIMAL(12, 2) DEFAULT 0,
  category VARCHAR(100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ward_id, fiscal_year, category)
);

-- Create impact_reports table
CREATE TABLE IF NOT EXISTS impact_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  total_issues_addressed INTEGER DEFAULT 0,
  citizens_impacted INTEGER DEFAULT 0,
  cost_savings DECIMAL(12, 2),
  efficiency_improvement DECIMAL(5, 2),
  key_achievements JSONB,
  challenges JSONB,
  recommendations JSONB,
  ai_generated_summary TEXT,
  report_type VARCHAR(50) DEFAULT 'monthly' CHECK (report_type IN ('weekly', 'monthly', 'quarterly', 'annual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create audit_logs table for ward management
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value JSONB,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wards_ward_number ON wards(ward_number);
CREATE INDEX IF NOT EXISTS idx_wards_ward_officer_id ON wards(ward_officer_id);
CREATE INDEX IF NOT EXISTS idx_issues_ward_id ON issues(ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_analytics_ward_id ON ward_analytics(ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_analytics_date ON ward_analytics(analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_ward_performance_ward_id ON ward_performance_metrics(ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_performance_date ON ward_performance_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_ward_resources_ward_id ON ward_resources(ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_resources_status ON ward_resources(status);
CREATE INDEX IF NOT EXISTS idx_ward_budget_ward_id ON ward_budget(ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_budget_year ON ward_budget(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_impact_reports_ward_id ON impact_reports(ward_id);
CREATE INDEX IF NOT EXISTS idx_impact_reports_period ON impact_reports(report_period_start, report_period_end);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ward_id ON audit_logs(ward_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_wards_updated_at
  BEFORE UPDATE ON wards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ward_resources_updated_at
  BEFORE UPDATE ON ward_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ward_budget_updated_at
  BEFORE UPDATE ON ward_budget
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wards
CREATE POLICY "Anyone can read wards" ON wards FOR SELECT USING (true);
CREATE POLICY "Admins can manage wards" ON wards FOR ALL USING (true);

-- RLS Policies for ward_analytics
CREATE POLICY "Anyone can read ward analytics" ON ward_analytics FOR SELECT USING (true);
CREATE POLICY "Admins can manage ward analytics" ON ward_analytics FOR ALL USING (true);

-- RLS Policies for ward_performance_metrics
CREATE POLICY "Anyone can read ward performance" ON ward_performance_metrics FOR SELECT USING (true);
CREATE POLICY "Admins can manage ward performance" ON ward_performance_metrics FOR ALL USING (true);

-- RLS Policies for ward_resources
CREATE POLICY "Anyone can read ward resources" ON ward_resources FOR SELECT USING (true);
CREATE POLICY "Admins can manage ward resources" ON ward_resources FOR ALL USING (true);

-- RLS Policies for ward_budget
CREATE POLICY "Admins can read ward budget" ON ward_budget FOR SELECT USING (true);
CREATE POLICY "Admins can manage ward budget" ON ward_budget FOR ALL USING (true);

-- RLS Policies for impact_reports
CREATE POLICY "Anyone can read impact reports" ON impact_reports FOR SELECT USING (true);
CREATE POLICY "Admins can manage impact reports" ON impact_reports FOR ALL USING (true);

-- RLS Policies for audit_logs
CREATE POLICY "Admins can read audit logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- RLS Policies for settings
CREATE POLICY "Users can read own settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Users can manage own settings" ON settings FOR ALL USING (true);

-- Create views for ward statistics
CREATE OR REPLACE VIEW ward_stats AS
SELECT
  w.id as ward_id,
  w.ward_number,
  w.ward_name,
  COUNT(i.id) as total_issues,
  COUNT(i.id) FILTER (WHERE i.status = 'open') as open_issues,
  COUNT(i.id) FILTER (WHERE i.status = 'in-progress') as in_progress_issues,
  COUNT(i.id) FILTER (WHERE i.status = 'resolved') as resolved_issues,
  COUNT(i.id) FILTER (WHERE i.priority = 'critical') as critical_issues,
  AVG(EXTRACT(EPOCH FROM (i.resolved_at - i.created_at))/3600) FILTER (WHERE i.resolved_at IS NOT NULL) as avg_resolution_hours,
  COUNT(i.id) FILTER (WHERE i.created_at >= CURRENT_DATE - INTERVAL '7 days') as issues_last_week,
  COUNT(i.id) FILTER (WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days') as issues_last_month
FROM wards w
LEFT JOIN issues i ON i.ward_id = w.id
GROUP BY w.id, w.ward_number, w.ward_name;

-- Create view for ward performance comparison
CREATE OR REPLACE VIEW ward_performance_comparison AS
SELECT
  w.id as ward_id,
  w.ward_number,
  w.ward_name,
  w.population,
  ws.total_issues,
  ws.resolved_issues,
  ws.avg_resolution_hours,
  (ws.resolved_issues::FLOAT / NULLIF(ws.total_issues, 0) * 100) as resolution_rate,
  wpm.citizen_satisfaction,
  wpm.sla_compliance_rate,
  wpm.resource_utilization,
  wb.allocated_budget,
  wb.spent_budget,
  (wb.spent_budget / NULLIF(wb.allocated_budget, 1) * 100) as budget_utilization
FROM wards w
LEFT JOIN ward_stats ws ON ws.ward_id = w.id
LEFT JOIN LATERAL (
  SELECT * FROM ward_performance_metrics
  WHERE ward_id = w.id
  ORDER BY metric_date DESC
  LIMIT 1
) wpm ON true
LEFT JOIN LATERAL (
  SELECT
    SUM(allocated_budget) as allocated_budget,
    SUM(spent_budget) as spent_budget
  FROM ward_budget
  WHERE ward_id = w.id AND fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE)
) wb ON true;

-- Grant permissions
GRANT SELECT ON ward_stats TO anon, authenticated;
GRANT SELECT ON ward_performance_comparison TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert sample ward data
INSERT INTO wards (ward_number, ward_name, population, area_sq_km, description, contact_number, email, office_address) VALUES
  ('W001', 'Panjim Central', 15000, 2.5, 'Central business district of Panjim', '+91-832-2420000', 'ward1@panjim.gov.in', 'Municipal Building, Panjim'),
  ('W002', 'Fontainhas Heritage', 8000, 1.8, 'Historic Portuguese quarter', '+91-832-2420001', 'ward2@panjim.gov.in', 'Fontainhas Community Center'),
  ('W003', 'Miramar Coastal', 12000, 3.2, 'Coastal residential area', '+91-832-2420002', 'ward3@panjim.gov.in', 'Miramar Ward Office'),
  ('W004', 'Altinho Hills', 6000, 2.0, 'Hilltop residential area', '+91-832-2420003', 'ward4@panjim.gov.in', 'Altinho Community Hall'),
  ('W005', 'Santa Cruz', 18000, 4.5, 'Mixed residential and commercial', '+91-832-2420004', 'ward5@panjim.gov.in', 'Santa Cruz Municipal Office')
ON CONFLICT (ward_number) DO NOTHING;

-- Assign existing issues to wards based on location (approximate)
UPDATE issues SET ward_id = (
  SELECT id FROM wards WHERE ward_number = 'W001' LIMIT 1
) WHERE location LIKE '%Panjim%' AND ward_id IS NULL;

-- Insert sample performance metrics
INSERT INTO ward_performance_metrics (ward_id, metric_date, response_time_hours, resolution_rate, citizen_satisfaction, sla_compliance_rate, resource_utilization, budget_spent)
SELECT
  w.id,
  CURRENT_DATE,
  RANDOM() * 24 + 2,
  RANDOM() * 30 + 70,
  RANDOM() * 1 + 4,
  RANDOM() * 20 + 75,
  RANDOM() * 30 + 60,
  RANDOM() * 50000 + 100000
FROM wards w
ON CONFLICT (ward_id, metric_date) DO NOTHING;

-- Insert sample budget data
INSERT INTO ward_budget (ward_id, fiscal_year, allocated_budget, spent_budget, category, description)
SELECT
  w.id,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  1000000.00,
  RANDOM() * 500000 + 200000,
  'Infrastructure',
  'Annual infrastructure maintenance and development'
FROM wards w
ON CONFLICT (ward_id, fiscal_year, category) DO NOTHING;
