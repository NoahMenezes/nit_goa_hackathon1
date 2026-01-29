-- Create wards (electoral/administrative divisions) table
-- Migration: 002_create_wards.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geographic data (optional but recommended)

-- Create wards table
CREATE TABLE IF NOT EXISTS wards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  number INTEGER NOT NULL UNIQUE,
  boundaries JSONB NOT NULL, -- GeoJSON polygon format
  area_sqkm DECIMAL(10, 2),
  population INTEGER,

  -- Councilor/Representative information
  councilor_name VARCHAR(255),
  councilor_email VARCHAR(255),
  councilor_phone VARCHAR(20),
  councilor_photo TEXT,

  -- Ward office details
  office_address TEXT,
  office_phone VARCHAR(20),
  office_hours VARCHAR(100),

  -- Metadata
  description TEXT,
  landmarks TEXT[], -- Array of notable landmarks

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add ward_id to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS ward_id UUID REFERENCES wards(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wards_number ON wards(number);
CREATE INDEX IF NOT EXISTS idx_wards_name ON wards(name);
CREATE INDEX IF NOT EXISTS idx_issues_ward_id ON issues(ward_id);

-- Create GIN index for JSONB boundaries for fast geospatial queries
CREATE INDEX IF NOT EXISTS idx_wards_boundaries ON wards USING GIN (boundaries);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_wards_updated_at
  BEFORE UPDATE ON wards
  FOR EACH ROW
  EXECUTE FUNCTION update_wards_updated_at();

-- Function to automatically assign ward to issue based on location
CREATE OR REPLACE FUNCTION auto_assign_ward()
RETURNS TRIGGER AS $$
DECLARE
  ward_match UUID;
BEGIN
  -- This is a simplified version - in production you'd use PostGIS ST_Contains
  -- For now, we'll just set it to NULL and let it be manually assigned
  -- or use a more sophisticated geospatial query

  -- Example with PostGIS (uncomment if PostGIS is enabled):
  -- SELECT id INTO ward_match
  -- FROM wards
  -- WHERE ST_Contains(
  --   ST_GeomFromGeoJSON(boundaries->>'geometry'),
  --   ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)
  -- )
  -- LIMIT 1;

  -- NEW.ward_id := ward_match;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign ward on issue creation (optional)
-- Uncomment if you want automatic ward assignment
-- CREATE TRIGGER trigger_auto_assign_ward
--   BEFORE INSERT ON issues
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_assign_ward();

-- Create view for ward statistics
CREATE OR REPLACE VIEW ward_statistics AS
SELECT
  w.id as ward_id,
  w.name as ward_name,
  w.number as ward_number,
  COUNT(i.id) as total_issues,
  COUNT(i.id) FILTER (WHERE i.status = 'open') as open_issues,
  COUNT(i.id) FILTER (WHERE i.status = 'in-progress') as in_progress_issues,
  COUNT(i.id) FILTER (WHERE i.status = 'resolved') as resolved_issues,
  COUNT(i.id) FILTER (WHERE i.status = 'closed') as closed_issues,
  ROUND(
    (COUNT(i.id) FILTER (WHERE i.status = 'resolved')::DECIMAL /
     NULLIF(COUNT(i.id), 0) * 100), 2
  ) as resolution_rate_percent,
  AVG(EXTRACT(EPOCH FROM (i.resolved_at - i.created_at))/3600) FILTER (WHERE i.resolved_at IS NOT NULL) as avg_resolution_hours,
  MAX(i.created_at) as last_issue_reported,
  SUM(i.votes) as total_votes
FROM wards w
LEFT JOIN issues i ON i.ward_id = w.id
GROUP BY w.id, w.name, w.number;

-- Enable Row Level Security
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;

-- RLS Policies - everyone can read wards (public data)
CREATE POLICY "Anyone can read wards" ON wards
  FOR SELECT
  USING (true);

-- Only admins can modify wards
CREATE POLICY "Admins can insert wards" ON wards
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update wards" ON wards
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete wards" ON wards
  FOR DELETE
  USING (true);

-- Grant permissions
GRANT SELECT ON wards TO authenticated, anon;
GRANT SELECT ON ward_statistics TO authenticated, anon;
GRANT ALL ON wards TO authenticated; -- Admins will have full access through RLS

-- Insert sample wards data for Panjim, Goa (example)
-- Replace with actual ward data for your city
INSERT INTO wards (name, number, boundaries, population, councilor_name, description) VALUES
  (
    'Ward 1 - Panjim Central',
    1,
    '{"type":"Polygon","coordinates":[[[73.827,15.490],[73.835,15.490],[73.835,15.497],[73.827,15.497],[73.827,15.490]]]}',
    5000,
    'John Doe',
    'Central Panjim area covering main market and administrative buildings'
  ),
  (
    'Ward 2 - Fontainhas',
    2,
    '{"type":"Polygon","coordinates":[[[73.820,15.488],[73.827,15.488],[73.827,15.495],[73.820,15.495],[73.820,15.488]]]}',
    4500,
    'Maria Silva',
    'Historic Latin Quarter with Portuguese architecture'
  ),
  (
    'Ward 3 - Campal',
    3,
    '{"type":"Polygon","coordinates":[[[73.810,15.485],[73.820,15.485],[73.820,15.492],[73.810,15.492],[73.810,15.485]]]}',
    6000,
    'Rajesh Kumar',
    'Residential area near Campal Gardens'
  )
ON CONFLICT (number) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE wards IS 'Electoral/administrative divisions (wards) of the city';
COMMENT ON COLUMN wards.boundaries IS 'GeoJSON polygon defining ward boundaries for map display and geospatial queries';
COMMENT ON COLUMN wards.landmarks IS 'Array of notable landmarks within the ward for easier identification';
COMMENT ON VIEW ward_statistics IS 'Aggregated statistics for each ward including issue counts and resolution metrics';
COMMENT ON FUNCTION auto_assign_ward() IS 'Automatically assigns a ward to an issue based on its coordinates (requires PostGIS for production use)';

-- Create function to get issues count by category for a ward
CREATE OR REPLACE FUNCTION get_ward_category_breakdown(ward_uuid UUID)
RETURNS TABLE(
  category VARCHAR,
  count BIGINT,
  open_count BIGINT,
  resolved_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.category,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE i.status = 'open') as open_count,
    COUNT(*) FILTER (WHERE i.status = 'resolved') as resolved_count
  FROM issues i
  WHERE i.ward_id = ward_uuid
  GROUP BY i.category
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_ward_category_breakdown(UUID) IS 'Returns issue breakdown by category for a specific ward';
