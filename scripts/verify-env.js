#!/usr/bin/env node

/**
 * Environment Variables Verification Script for Vercel Deployment
 *
 * This script checks that all critical environment variables are properly set
 * before deployment to Vercel.
 *
 * Usage:
 *   node scripts/verify-env.js
 *   npm run verify-env (if added to package.json scripts)
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

// Environment variable configuration
const envConfig = {
  critical: [
    {
      name: "JWT_SECRET",
      description: "Secret key for JWT token generation",
      example: "Generate with: openssl rand -base64 32",
      validation: (value) => value && value.length >= 32,
      errorMessage: "JWT_SECRET must be at least 32 characters long",
    },
    {
      name: "NEXT_PUBLIC_APP_URL",
      description: "Public URL of the application",
      example: "https://your-app.vercel.app",
      validation: (value) =>
        value && (value.startsWith("http://") || value.startsWith("https://")),
      errorMessage:
        "NEXT_PUBLIC_APP_URL must be a valid URL starting with http:// or https://",
    },
  ],
  recommended: [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      description: "Supabase project URL for data persistence",
      example: "https://your-project.supabase.co",
      validation: (value) => value && value.includes("supabase"),
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      description: "Supabase anonymous key",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      validation: (value) => value && value.length > 20,
    },
  ],
  optional: [
    {
      name: "SUPABASE_SERVICE_ROLE_KEY",
      description: "Supabase service role key for admin operations",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      validation: (value) => value && value.length > 20,
    },
    {
      name: "GEMINI_API_KEY",
      description: "Google Gemini API key for AI categorization",
      example: "AIzaSy...",
    },
    {
      name: "NEXT_PUBLIC_MAPTILER_API_KEY",
      description: "MapTiler API key for interactive maps",
      example: "abc123...",
    },
    {
      name: "NEXT_PUBLIC_AGENT_ID",
      description: "ElevenLabs voice agent ID",
      example: "agent_xxxxx",
    },
    {
      name: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
      description: "Cloudinary cloud name for image uploads",
      example: "your-cloud-name",
    },
    {
      name: "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
      description: "Cloudinary upload preset for image uploads",
      example: "your-preset",
    },
    {
      name: "RESEND_API_KEY",
      description: "Resend API key for email notifications",
      example: "re_...",
    },
    {
      name: "TWILIO_ACCOUNT_SID",
      description: "Twilio Account SID for SMS notifications",
      example: "AC...",
    },
    {
      name: "TWILIO_AUTH_TOKEN",
      description: "Twilio Auth Token",
      example: "abc...",
    },
    {
      name: "TWILIO_PHONE_NUMBER",
      description: "Twilio phone number",
      example: "+1234567890",
    },
  ],
  security: [
    {
      name: "REQUIRE_AUTH_FOR_ISSUES",
      description:
        "Require authentication for issue creation (recommended for production)",
      example: "true",
      validation: (value) => !value || value === "true" || value === "false",
      errorMessage: "Must be 'true' or 'false'",
    },
  ],
};

// Check if running in CI/CD environment
const isCI = process.env.CI === "true" || process.env.VERCEL === "1";
const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production";

// Results tracking
const results = {
  critical: { passed: 0, failed: 0, missing: [] },
  recommended: { passed: 0, failed: 0, missing: [] },
  optional: { passed: 0, failed: 0, missing: [] },
  security: { passed: 0, failed: 0, missing: [] },
};

/**
 * Print formatted header
 */
function printHeader() {
  console.log("\n");
  console.log(
    colors.bold +
      colors.cyan +
      "╔══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║     Environment Variables Verification - CityPulse App      ║",
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝" +
      colors.reset,
  );
  console.log("");

  if (isCI) {
    console.log(
      colors.yellow + "🔄 Running in CI/CD environment" + colors.reset,
    );
  }
  if (isProduction) {
    console.log(
      colors.yellow + "🚀 Production environment detected" + colors.reset,
    );
  }
  console.log("");
}

/**
 * Check a single environment variable
 */
function checkEnvVar(config, severity) {
  const value = process.env[config.name];
  const isSet = !!value;

  let status = "missing";
  let icon = "❌";
  let message = "";

  if (isSet) {
    if (config.validation) {
      const isValid = config.validation(value);
      if (isValid) {
        status = "valid";
        icon = "✅";
        results[severity].passed++;
      } else {
        status = "invalid";
        icon = "⚠️";
        message = config.errorMessage || "Validation failed";
        results[severity].failed++;
      }
    } else {
      status = "valid";
      icon = "✅";
      results[severity].passed++;
    }
  } else {
    results[severity].missing.push(config.name);
    if (severity === "critical") {
      results[severity].failed++;
    }
  }

  // Print result
  const color =
    status === "valid"
      ? colors.green
      : status === "invalid"
        ? colors.yellow
        : colors.red;
  console.log(`  ${icon} ${color}${config.name}${colors.reset}`);
  console.log(`     ${colors.cyan}${config.description}${colors.reset}`);

  if (status === "missing") {
    console.log(`     ${colors.yellow}Status: Not set${colors.reset}`);
    if (config.example) {
      console.log(
        `     ${colors.blue}Example: ${config.example}${colors.reset}`,
      );
    }
  } else if (status === "invalid") {
    console.log(
      `     ${colors.yellow}Status: Invalid - ${message}${colors.reset}`,
    );
  } else {
    console.log(`     ${colors.green}Status: Configured ✓${colors.reset}`);
  }
  console.log("");

  return status;
}

/**
 * Print section header
 */
function printSection(title, severity) {
  const emoji =
    severity === "critical" ? "🔴" : severity === "recommended" ? "🟡" : "⚪";
  console.log(colors.bold + `${emoji} ${title.toUpperCase()}` + colors.reset);
  console.log("─".repeat(64));
  console.log("");
}

/**
 * Print summary
 */
function printSummary() {
  console.log("");
  console.log(colors.bold + colors.cyan + "═".repeat(64));
  console.log("SUMMARY");
  console.log("═".repeat(64) + colors.reset);
  console.log("");

  // Critical variables
  const criticalTotal = envConfig.critical.length;
  const criticalPassed = results.critical.passed;
  const criticalFailed = results.critical.failed;

  console.log(colors.bold + "🔴 CRITICAL Variables:" + colors.reset);
  console.log(
    `   Passed: ${colors.green}${criticalPassed}/${criticalTotal}${colors.reset}`,
  );
  console.log(
    `   Failed: ${colors.red}${criticalFailed}/${criticalTotal}${colors.reset}`,
  );
  if (results.critical.missing.length > 0) {
    console.log(`   Missing: ${results.critical.missing.join(", ")}`);
  }
  console.log("");

  // Recommended variables
  const recommendedTotal = envConfig.recommended.length;
  const recommendedPassed = results.recommended.passed;

  console.log(colors.bold + "🟡 RECOMMENDED Variables:" + colors.reset);
  console.log(
    `   Configured: ${colors.green}${recommendedPassed}/${recommendedTotal}${colors.reset}`,
  );
  if (results.recommended.missing.length > 0) {
    console.log(`   Missing: ${results.recommended.missing.join(", ")}`);
  }
  console.log("");

  // Optional variables
  const optionalTotal = envConfig.optional.length;
  const optionalPassed = results.optional.passed;

  console.log(colors.bold + "⚪ OPTIONAL Variables:" + colors.reset);
  console.log(
    `   Configured: ${colors.green}${optionalPassed}/${optionalTotal}${colors.reset}`,
  );
  console.log("");

  // Overall status
  console.log(colors.bold + "📊 OVERALL STATUS:" + colors.reset);

  if (criticalFailed === 0) {
    console.log(
      colors.green +
        "   ✅ All critical variables are properly configured!" +
        colors.reset,
    );
  } else {
    console.log(
      colors.red +
        `   ❌ ${criticalFailed} critical variable(s) missing or invalid` +
        colors.reset,
    );
  }

  if (recommendedPassed < recommendedTotal) {
    console.log(
      colors.yellow +
        `   ⚠️  ${recommendedTotal - recommendedPassed} recommended variable(s) not configured` +
        colors.reset,
    );
    console.log(
      colors.yellow +
        "   Note: App will use in-memory database (data will be lost on restart)" +
        colors.reset,
    );
  }

  console.log("");

  // Deployment readiness
  const readinessScore =
    (criticalPassed / criticalTotal) * 60 +
    (recommendedPassed / recommendedTotal) * 30 +
    (optionalPassed / optionalTotal) * 10;

  console.log(colors.bold + "🎯 DEPLOYMENT READINESS:" + colors.reset);
  console.log(`   Score: ${readinessScore.toFixed(1)}/100`);

  if (criticalFailed === 0 && recommendedPassed === recommendedTotal) {
    console.log(
      colors.green + "   Status: READY FOR PRODUCTION ✅" + colors.reset,
    );
  } else if (criticalFailed === 0) {
    console.log(
      colors.yellow + "   Status: READY (with warnings) ⚠️" + colors.reset,
    );
  } else {
    console.log(colors.red + "   Status: NOT READY ❌" + colors.reset);
  }

  console.log("");
}

/**
 * Print recommendations
 */
function printRecommendations() {
  console.log(colors.bold + colors.cyan + "💡 RECOMMENDATIONS" + colors.reset);
  console.log("─".repeat(64));
  console.log("");

  if (results.critical.missing.length > 0) {
    console.log(
      colors.red +
        "🔴 CRITICAL: Set these variables before deploying:" +
        colors.reset,
    );
    console.log("");

    envConfig.critical.forEach((config) => {
      if (!process.env[config.name]) {
        console.log(`   ${colors.bold}${config.name}${colors.reset}`);
        if (config.example) {
          console.log(`   ${config.example}`);
        }
        console.log("");
      }
    });
  }

  if (results.recommended.missing.length > 0) {
    console.log(
      colors.yellow +
        "🟡 RECOMMENDED: Configure Supabase for data persistence:" +
        colors.reset,
    );
    console.log("   1. Sign up at https://supabase.com (free tier available)");
    console.log("   2. Create a new project");
    console.log("   3. Copy Project URL and Anon Key from Settings → API");
    console.log("   4. Add to Vercel environment variables");
    console.log("");
  }

  console.log(colors.cyan + "📚 Documentation:" + colors.reset);
  console.log("   - Quick Deploy: QUICK_DEPLOY.md");
  console.log("   - Full Guide: VERCEL_DEPLOYMENT_CHECKLIST.md");
  console.log("   - All Variables: .env.example");
  console.log("");
}

/**
 * Main execution
 */
function main() {
  printHeader();

  // Check critical variables
  printSection("Critical Variables (Required)", "critical");
  envConfig.critical.forEach((config) => checkEnvVar(config, "critical"));

  // Check recommended variables
  printSection("Recommended Variables (Data Persistence)", "recommended");
  envConfig.recommended.forEach((config) => checkEnvVar(config, "recommended"));

  // Check optional variables
  printSection("Optional Variables (Enhanced Features)", "optional");
  envConfig.optional.forEach((config) => checkEnvVar(config, "optional"));

  // Check security variables
  printSection("Security Configuration", "security");
  envConfig.security.forEach((config) => checkEnvVar(config, "security"));

  // Print summary
  printSummary();

  // Print recommendations
  if (
    results.critical.missing.length > 0 ||
    results.recommended.missing.length > 0
  ) {
    printRecommendations();
  }

  // Exit with appropriate code
  if (isProduction && results.critical.failed > 0) {
    console.log(
      colors.red +
        colors.bold +
        "❌ CRITICAL ERRORS IN PRODUCTION - BUILD SHOULD FAIL" +
        colors.reset,
    );
    console.log("");
    process.exit(1);
  } else if (results.critical.failed > 0) {
    console.log(
      colors.yellow +
        "⚠️  Critical variables missing - deployment not recommended" +
        colors.reset,
    );
    console.log("");
    process.exit(0); // Don't fail in development
  } else {
    console.log(
      colors.green + "✅ Environment verification passed!" + colors.reset,
    );
    console.log("");
    process.exit(0);
  }
}

// Run the script
main();
