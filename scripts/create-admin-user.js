#!/usr/bin/env node

/**
 * CityPulse Admin User Creation Script
 *
 * This script helps generate admin user accounts with properly hashed passwords
 * for insertion into the Supabase database.
 *
 * Usage:
 *   node scripts/create-admin-user.js
 *
 * Or make it executable:
 *   chmod +x scripts/create-admin-user.js
 *   ./scripts/create-admin-user.js
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify readline question
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// Generate random admin ID
function generateAdminId() {
  const crypto = require('crypto');
  return 'ADMIN_' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

// Validate email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Hash password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Print header
function printHeader() {
  console.log('\n' + colors.cyan + '╔══════════════════════════════════════════════════════════════╗' + colors.reset);
  console.log(colors.cyan + '║        CityPulse Admin User Creation Script                 ║' + colors.reset);
  console.log(colors.cyan + '╚══════════════════════════════════════════════════════════════╝' + colors.reset + '\n');
}

// Print SQL instructions
function printSQLInstructions(adminData) {
  console.log('\n' + colors.green + '═══════════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.green + '  Admin User Created Successfully!' + colors.reset);
  console.log(colors.green + '═══════════════════════════════════════════════════════════════' + colors.reset + '\n');

  console.log(colors.yellow + '📋 Admin User Details:' + colors.reset);
  console.log('   Name: ' + colors.cyan + adminData.name + colors.reset);
  console.log('   Email: ' + colors.cyan + adminData.email + colors.reset);
  console.log('   Role: ' + colors.cyan + adminData.role + colors.reset);
  console.log('   Admin ID: ' + colors.magenta + adminData.adminId + colors.reset);
  console.log('   Password: ' + colors.cyan + adminData.plainPassword + colors.reset);
  console.log('   Password Hash: ' + colors.blue + adminData.hashedPassword.substring(0, 40) + '...' + colors.reset + '\n');

  console.log(colors.yellow + '🔐 IMPORTANT - Save These Credentials Securely!' + colors.reset);
  console.log('   ⚠️  Store the Admin ID and password in a secure location');
  console.log('   ⚠️  The admin will need the Admin ID to log in');
  console.log('   ⚠️  Never share these credentials via email or messaging apps\n');

  console.log(colors.yellow + '📝 Step 1: Add Admin ID to Environment Variables' + colors.reset);
  console.log('   Add this to your .env.local file:\n');
  console.log(colors.cyan + '   ADMIN_IDS=' + adminData.adminId + ',ADMIN002,ADMIN003' + colors.reset);
  console.log('   (Or append to existing ADMIN_IDS list)\n');

  console.log(colors.yellow + '📝 Step 2: Insert Admin User into Supabase Database' + colors.reset);
  console.log('   Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/editor');
  console.log('   Run this SQL command:\n');

  const sqlCommand = `INSERT INTO users (id, name, email, password, role, created_at, updated_at)
VALUES (
  '${adminData.id}',
  '${adminData.name}',
  '${adminData.email}',
  '${adminData.hashedPassword}',
  '${adminData.role}',
  NOW(),
  NOW()
);`;

  console.log(colors.blue + sqlCommand + colors.reset + '\n');

  console.log(colors.yellow + '📝 Alternative: Insert via Table Editor' + colors.reset);
  console.log('   1. Go to Supabase Table Editor → users table');
  console.log('   2. Click "Insert row"');
  console.log('   3. Fill in the fields:');
  console.log('      - id: ' + colors.cyan + adminData.id + colors.reset);
  console.log('      - name: ' + colors.cyan + adminData.name + colors.reset);
  console.log('      - email: ' + colors.cyan + adminData.email + colors.reset);
  console.log('      - password: ' + colors.cyan + adminData.hashedPassword + colors.reset);
  console.log('      - role: ' + colors.cyan + adminData.role + colors.reset);
  console.log('   4. Click "Save"\n');

  console.log(colors.yellow + '📝 Step 3: Update Vercel Environment Variables (if deployed)' + colors.reset);
  console.log('   1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.log('   2. Update ADMIN_IDS to include: ' + colors.magenta + adminData.adminId + colors.reset);
  console.log('   3. Redeploy the application\n');

  console.log(colors.yellow + '📝 Step 4: Test Admin Login' + colors.reset);
  console.log('   1. Go to: http://localhost:3000/login (or your deployed URL)');
  console.log('   2. Click "Admin Login" button');
  console.log('   3. Enter:');
  console.log('      - Email: ' + colors.cyan + adminData.email + colors.reset);
  console.log('      - Password: ' + colors.cyan + adminData.plainPassword + colors.reset);
  console.log('      - Admin ID: ' + colors.magenta + adminData.adminId + colors.reset);
  console.log('   4. Click "Login as Administrator"\n');

  console.log(colors.green + '═══════════════════════════════════════════════════════════════' + colors.reset + '\n');
}

// Main script
async function main() {
  try {
    printHeader();

    console.log(colors.blue + 'This script will help you create an admin user account.' + colors.reset);
    console.log(colors.blue + 'Please provide the following information:\n' + colors.reset);

    // Get admin name
    let name = '';
    while (!name || name.trim().length < 2) {
      name = await question(colors.yellow + '👤 Admin Full Name: ' + colors.reset);
      if (!name || name.trim().length < 2) {
        console.log(colors.red + '   ❌ Name must be at least 2 characters long\n' + colors.reset);
      }
    }

    // Get admin email
    let email = '';
    while (!validateEmail(email)) {
      email = await question(colors.yellow + '📧 Admin Email: ' + colors.reset);
      if (!validateEmail(email)) {
        console.log(colors.red + '   ❌ Invalid email format\n' + colors.reset);
      }
    }

    // Get password
    let password = '';
    let passwordValid = false;
    while (!passwordValid) {
      password = await question(colors.yellow + '🔑 Admin Password: ' + colors.reset);
      const validation = validatePassword(password);

      if (!validation.valid) {
        console.log(colors.red + '   ❌ Password requirements not met:' + colors.reset);
        validation.errors.forEach((error) => {
          console.log(colors.red + '      • ' + error + colors.reset);
        });
        console.log('');
      } else {
        passwordValid = true;
      }
    }

    // Confirm password
    let confirmPassword = '';
    while (confirmPassword !== password) {
      confirmPassword = await question(colors.yellow + '🔑 Confirm Password: ' + colors.reset);
      if (confirmPassword !== password) {
        console.log(colors.red + '   ❌ Passwords do not match\n' + colors.reset);
      }
    }

    // Select role
    console.log('\n' + colors.yellow + '👔 Select Admin Role:' + colors.reset);
    console.log('   1. admin - Full system administrator');
    console.log('   2. authority - Government authority/department\n');

    let roleChoice = '';
    while (roleChoice !== '1' && roleChoice !== '2') {
      roleChoice = await question(colors.yellow + 'Enter choice (1 or 2): ' + colors.reset);
      if (roleChoice !== '1' && roleChoice !== '2') {
        console.log(colors.red + '   ❌ Invalid choice. Please enter 1 or 2\n' + colors.reset);
      }
    }

    const role = roleChoice === '1' ? 'admin' : 'authority';

    // Generate Admin ID option
    console.log('\n' + colors.yellow + '🆔 Admin ID Generation:' + colors.reset);
    const useGeneratedId = await question(colors.yellow + 'Generate random Admin ID? (y/n): ' + colors.reset);

    let adminId = '';
    if (useGeneratedId.toLowerCase() === 'y' || useGeneratedId.toLowerCase() === 'yes') {
      adminId = generateAdminId();
      console.log(colors.green + '   ✓ Generated Admin ID: ' + colors.magenta + adminId + colors.reset + '\n');
    } else {
      while (!adminId || adminId.trim().length < 5) {
        adminId = await question(colors.yellow + '🆔 Enter Custom Admin ID: ' + colors.reset);
        if (!adminId || adminId.trim().length < 5) {
          console.log(colors.red + '   ❌ Admin ID must be at least 5 characters long\n' + colors.reset);
        }
      }
    }

    // Hash password
    console.log('\n' + colors.blue + '⏳ Generating secure password hash...' + colors.reset);
    const hashedPassword = await hashPassword(password);
    const id = generateUUID();

    // Prepare admin data
    const adminData = {
      id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      plainPassword: password,
      hashedPassword,
      role,
      adminId: adminId.trim(),
    };

    // Print instructions
    printSQLInstructions(adminData);

    // Save to file option
    const saveToFile = await question(colors.yellow + '💾 Save SQL command to file? (y/n): ' + colors.reset);

    if (saveToFile.toLowerCase() === 'y' || saveToFile.toLowerCase() === 'yes') {
      const fs = require('fs');
      const filename = `admin-user-${adminId.replace(/[^a-zA-Z0-9]/g, '_')}.sql`;

      const sqlContent = `-- Admin User Creation Script
-- Generated: ${new Date().toISOString()}
--
-- Admin Details:
-- Name: ${adminData.name}
-- Email: ${adminData.email}
-- Admin ID: ${adminData.adminId}
-- Role: ${adminData.role}
--
-- IMPORTANT: Add this Admin ID to your environment variables:
-- ADMIN_IDS=${adminData.adminId}

INSERT INTO users (id, name, email, password, role, created_at, updated_at)
VALUES (
  '${adminData.id}',
  '${adminData.name}',
  '${adminData.email}',
  '${adminData.hashedPassword}',
  '${adminData.role}',
  NOW(),
  NOW()
);

-- Verify the user was created:
SELECT id, name, email, role, created_at FROM users WHERE email = '${adminData.email}';
`;

      fs.writeFileSync(filename, sqlContent);
      console.log(colors.green + '   ✓ SQL command saved to: ' + colors.cyan + filename + colors.reset + '\n');
    }

    console.log(colors.green + '✅ Admin user creation completed successfully!' + colors.reset);
    console.log(colors.yellow + '⚠️  Remember to add the Admin ID to your environment variables!\n' + colors.reset);

  } catch (error) {
    console.error(colors.red + '\n❌ Error: ' + error.message + colors.reset + '\n');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
main();
