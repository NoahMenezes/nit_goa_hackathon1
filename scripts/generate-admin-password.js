#!/usr/bin/env node

const bcrypt = require('bcryptjs');

// Password to hash
const password = 'admin123';

// Generate hash with 10 rounds (same as auth.ts uses)
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('Bcrypt Password Hash Generated');
  console.log('========================================');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('========================================');
  console.log('\nCopy this SQL to run in your ADMIN Supabase database:\n');
  console.log(`-- Delete existing user if exists`);
  console.log(`DELETE FROM users WHERE email = 'vibhuporobo@gmail.com';\n`);
  console.log(`-- Insert admin user`);
  console.log(`INSERT INTO users (name, email, password, role, created_at, updated_at)`);
  console.log(`VALUES ('Vibhu Poro Admin', 'vibhuporobo@gmail.com', '${hash}', 'admin', NOW(), NOW());\n`);
  console.log(`-- Create profile`);
  console.log(`INSERT INTO user_profiles (user_id, city, state, bio, created_at, updated_at)`);
  console.log(`VALUES ((SELECT id FROM users WHERE email = 'vibhuporobo@gmail.com'), 'Goa', 'Goa', 'System Administrator', NOW(), NOW());\n`);
  console.log(`-- Verify`);
  console.log(`SELECT id, name, email, role, created_at FROM users WHERE email = 'vibhuporobo@gmail.com';`);
  console.log('\n========================================\n');
  console.log('Login Credentials:');
  console.log('  Email: vibhuporobo@gmail.com');
  console.log('  Password: admin123');
  console.log('  Use: "Login as Admin" button');
  console.log('========================================\n');
});
