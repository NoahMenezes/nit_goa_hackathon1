-- Setup Admin User in Admin Database
-- Run this in your ADMIN Supabase project SQL Editor

-- ========================================
-- ADMIN USER SETUP
-- ========================================
-- Email: vibhuporobo@gmail.com
-- Password: admin123
-- ========================================

-- Delete existing user if exists (to avoid conflicts)
DELETE FROM users WHERE email = 'vibhuporobo@gmail.com';

-- Insert admin user with properly hashed password
INSERT INTO users (
  name,
  email,
  password,
  role,
  created_at,
  updated_at
) VALUES (
  'Vibhu Poro Admin',
  'vibhuporobo@gmail.com',
  '$2b$10$NMkpUM/dMkQGnkRIDHiRzOx56IL8C6lfZnjOy96AbmI6sNiYli6wC',
  'admin',
  NOW(),
  NOW()
);

-- Create user profile for the admin
INSERT INTO user_profiles (
  user_id,
  city,
  state,
  bio,
  email_notifications,
  push_notifications,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM users WHERE email = 'vibhuporobo@gmail.com'),
  'Goa',
  'Goa',
  'System Administrator',
  true,
  true,
  NOW(),
  NOW()
);

-- Verify the user was created successfully
SELECT
  id,
  name,
  email,
  role,
  created_at
FROM users
WHERE email = 'vibhuporobo@gmail.com';

-- Display success message
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users WHERE email = 'vibhuporobo@gmail.com';

  IF user_count > 0 THEN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ Admin User Created Successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Email: vibhuporobo@gmail.com';
    RAISE NOTICE 'Password: admin123';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Login Instructions:';
    RAISE NOTICE '1. Go to the login page';
    RAISE NOTICE '2. Click the "Login as Admin" button';
    RAISE NOTICE '3. Enter the credentials above';
    RAISE NOTICE '==============================================';
  ELSE
    RAISE NOTICE '❌ Failed to create admin user';
    RAISE NOTICE 'Please check for errors above';
  END IF;
END $$;
