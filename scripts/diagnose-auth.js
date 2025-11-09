#!/usr/bin/env node

/**
 * CityPulse Authentication & Database Diagnostic Script
 * Checks the current state of authentication and database configuration
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const symbols = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

function printHeader(text) {
  console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset);
  console.log(colors.cyan + text + colors.reset);
  console.log(colors.cyan + '═'.repeat(70) + colors.reset + '\n');
}

function printStatus(status, message, details = '') {
  const symbol = symbols[status] || '';
  const color = status === 'success' ? colors.green : status === 'error' ? colors.red : colors.yellow;
  console.log(`${symbol} ${color}${message}${colors.reset}`);
  if (details) {
    console.log(`   ${colors.blue}${details}${colors.reset}`);
  }
}

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    return null;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) {
      return;
    }

    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  return env;
}

function checkEnvironmentVariables() {
  printHeader('Environment Variables Check');

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    printStatus('error', '.env.local file not found');
    printStatus('info', 'Create it by copying .env.local.example');
    console.log('   Command: cp .env.local.example .env.local\n');
    return false;
  }

  printStatus('success', '.env.local file exists');

  // Load environment variables
  const env = loadEnvFile();
  if (!env) {
    printStatus('error', 'Failed to load .env.local');
    return false;
  }

  let hasAllRequired = true;

  // Check JWT_SECRET
  if (!env.JWT_SECRET || env.JWT_SECRET === 'your_secure_jwt_secret_here_change_in_production') {
    printStatus('error', 'JWT_SECRET not configured or using default value');
    printStatus('info', 'Generate a secure secret with: openssl rand -base64 32');
    hasAllRequired = false;
  } else {
    printStatus('success', 'JWT_SECRET is configured');
  }

  // Check NEXT_PUBLIC_SUPABASE_URL
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    printStatus('error', 'NEXT_PUBLIC_SUPABASE_URL not set');
    hasAllRequired = false;
  } else {
    printStatus('success', `NEXT_PUBLIC_SUPABASE_URL is set: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  }

  // Check NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your_supabase_anon_key_here') {
    printStatus('error', 'NEXT_PUBLIC_SUPABASE_ANON_KEY not configured or using default value');
    printStatus('info', 'Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api');
    hasAllRequired = false;
  } else {
    const maskedKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...';
    printStatus('success', `NEXT_PUBLIC_SUPABASE_ANON_KEY is set: ${maskedKey}`);
  }

  // Check SUPABASE_SERVICE_ROLE_KEY (critical for user creation)
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    printStatus('error', 'SUPABASE_SERVICE_ROLE_KEY not set - USER REGISTRATION WILL FAIL!');
    printStatus('info', 'This key is REQUIRED for creating users in Supabase');
    printStatus('info', 'Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api');
    hasAllRequired = false;
  } else {
    const maskedKey = env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...';
    printStatus('success', `SUPABASE_SERVICE_ROLE_KEY is set: ${maskedKey}`);
  }

  console.log('');
  return hasAllRequired;
}

function checkDatabaseFiles() {
  printHeader('Database Configuration Files');

  const files = [
    { path: 'lib/db.ts', description: 'Database abstraction layer' },
    { path: 'lib/db-supabase.ts', description: 'Supabase database implementation' },
    { path: 'lib/db-memory.ts', description: 'In-memory database (fallback)' },
    { path: 'lib/supabase.ts', description: 'Supabase client configuration' },
  ];

  let allExist = true;

  files.forEach(file => {
    const filePath = path.join(process.cwd(), file.path);
    if (fs.existsSync(filePath)) {
      printStatus('success', `${file.path} - ${file.description}`);
    } else {
      printStatus('error', `${file.path} not found`);
      allExist = false;
    }
  });

  console.log('');
  return allExist;
}

function checkAuthFiles() {
  printHeader('Authentication Files');

  const files = [
    { path: 'lib/auth.ts', description: 'Authentication utilities' },
    { path: 'app/api/auth/signup/route.ts', description: 'User registration endpoint' },
    { path: 'app/api/auth/login/route.ts', description: 'User login endpoint' },
    { path: 'app/api/health/route.ts', description: 'Health check endpoint' },
  ];

  let allExist = true;

  files.forEach(file => {
    const filePath = path.join(process.cwd(), file.path);
    if (fs.existsSync(filePath)) {
      printStatus('success', `${file.path} - ${file.description}`);
    } else {
      printStatus('error', `${file.path} not found`);
      allExist = false;
    }
  });

  console.log('');
  return allExist;
}

function checkSupabaseSchema() {
  printHeader('Supabase Schema');

  const schemaPath = path.join(process.cwd(), 'supabase/schema.sql');

  if (!fs.existsSync(schemaPath)) {
    printStatus('error', 'supabase/schema.sql not found');
    console.log('');
    return false;
  }

  printStatus('success', 'Schema file exists');

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  // Check for required tables
  const tables = ['users', 'issues', 'comments', 'votes'];
  tables.forEach(table => {
    if (schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      printStatus('success', `Table definition found: ${table}`);
    } else {
      printStatus('warning', `Table definition not found: ${table}`);
    }
  });

  console.log('');
  return true;
}

function analyzeIssues(results) {
  printHeader('Issue Analysis & Recommendations');

  const issues = [];
  const recommendations = [];

  if (!results.envVars) {
    issues.push('Environment variables are not properly configured');
    recommendations.push('1. Copy .env.local.example to .env.local');
    recommendations.push('2. Get Supabase credentials from https://supabase.com/dashboard');
    recommendations.push('3. Generate JWT secret: openssl rand -base64 32');
    recommendations.push('4. Update all placeholder values in .env.local');
  }

  if (results.envVars && !results.serviceRoleKey) {
    issues.push('SUPABASE_SERVICE_ROLE_KEY is missing - this is CRITICAL!');
    recommendations.push('Without SERVICE_ROLE_KEY, user registration will fail');
    recommendations.push('Get the key from Supabase Dashboard → Settings → API');
    recommendations.push('Add it to .env.local as SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  }

  if (issues.length === 0) {
    printStatus('success', 'No critical issues detected!');
    console.log('\n' + colors.green + 'Your authentication and database setup appears to be correct.' + colors.reset);
    console.log('\nTo verify everything is working:');
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Visit: http://localhost:3000/api/health');
    console.log('3. Try registering a user through the UI or API');
  } else {
    printStatus('error', 'Issues detected:');
    issues.forEach(issue => {
      console.log(`   • ${issue}`);
    });

    console.log('\n' + colors.yellow + 'Recommendations:' + colors.reset);
    recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
  }

  console.log('');
}

function printSystemInfo() {
  printHeader('System Information');

  console.log(`Node Version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Working Directory: ${process.cwd()}`);

  // Check if package.json exists
  const packagePath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    console.log(`Project: ${pkg.name} v${pkg.version}`);
    printStatus('success', 'package.json found');
  } else {
    printStatus('error', 'package.json not found - are you in the project root?');
  }

  console.log('');
}

// Main execution
console.log('\n' + colors.cyan + '╔══════════════════════════════════════════════════════════════╗' + colors.reset);
console.log(colors.cyan + '║     CityPulse Authentication & Database Diagnostic          ║' + colors.reset);
console.log(colors.cyan + '╚══════════════════════════════════════════════════════════════╝' + colors.reset);

printSystemInfo();

const results = {
  envVars: checkEnvironmentVariables(),
  dbFiles: checkDatabaseFiles(),
  authFiles: checkAuthFiles(),
  schema: checkSupabaseSchema(),
};

// Load env to check for service role key
const env = loadEnvFile();
results.serviceRoleKey = env && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY !== '';

analyzeIssues(results);

printHeader('Documentation');
console.log('For detailed setup instructions, see:');
console.log(`   ${colors.blue}SETUP_GUIDE.md${colors.reset}`);
console.log('');
console.log('To automatically fix common issues, run:');
console.log(`   ${colors.green}bash fix-auth-setup.sh${colors.reset}`);
console.log('');

// Exit with appropriate code
if (results.envVars && results.dbFiles && results.authFiles && results.serviceRoleKey) {
  process.exit(0);
} else {
  process.exit(1);
}
