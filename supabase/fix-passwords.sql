-- Fix existing user passwords in Supabase
-- Run this in Supabase SQL Editor to update user passwords

-- Update john@example.com password to Demo1234
UPDATE users
SET password = '$2b$10$P0XqvSRbQhS6Xy5hnp3g/OH5Qce90q1aq810DJJYOW5rRk7evX4Hy'
WHERE email = 'john@example.com';

-- Update jane@example.com password to Demo1234
UPDATE users
SET password = '$2b$10$P0XqvSRbQhS6Xy5hnp3g/OH5Qce90q1aq810DJJYOW5rRk7evX4Hy'
WHERE email = 'jane@example.com';

-- Update admin@ourstreet.com password to Admin1234
UPDATE users
SET password = '$2b$10$Ut7Ku4Dlnf0CUX4wjKHVAuTCCW2kFlp7QodpsCjsessXvlZ1rYqtK'
WHERE email = 'admin@ourstreet.com';

-- Verify the update
SELECT email, name, role, created_at
FROM users
WHERE email IN ('john@example.com', 'jane@example.com', 'admin@ourstreet.com');
