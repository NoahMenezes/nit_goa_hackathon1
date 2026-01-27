#!/usr/bin/env node

// Verification script for OurStreet Supabase setup
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

console.log("🔍 OurStreet Setup Verification\n");

// Check 1: .env.local file
console.log("1️⃣ Checking .env.local file...");
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  console.log("   ✅ .env.local file exists");
  const envContent = fs.readFileSync(envPath, "utf8");

  const hasUrl = envContent.includes("NEXT_PUBLIC_SUPABASE_URL");
  const hasKey = envContent.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const hasJwt = envContent.includes("JWT_SECRET");

  console.log(
    `   ${hasUrl ? "✅" : "❌"} NEXT_PUBLIC_SUPABASE_URL ${hasUrl ? "set" : "missing"}`,
  );
  console.log(
    `   ${hasKey ? "✅" : "❌"} NEXT_PUBLIC_SUPABASE_ANON_KEY ${hasKey ? "set" : "missing"}`,
  );
  console.log(
    `   ${hasJwt ? "✅" : "⚠️"} JWT_SECRET ${hasJwt ? "set" : "missing (optional but recommended)"}`,
  );
} else {
  console.log("   ❌ .env.local file NOT found");
  console.log(
    "   💡 Copy .env.local.example to .env.local and fill in your Supabase credentials",
  );
}

// Check 2: Dependencies
console.log("\n2️⃣ Checking dependencies...");
const packageJson = require("../package.json");
const hasSupabase = packageJson.dependencies["@supabase/supabase-js"];
const hasBcrypt = packageJson.dependencies["bcryptjs"];
const hasJwt = packageJson.dependencies["jsonwebtoken"];

console.log(
  `   ${hasSupabase ? "✅" : "❌"} @supabase/supabase-js ${hasSupabase || "missing"}`,
);
console.log(`   ${hasBcrypt ? "✅" : "❌"} bcryptjs ${hasBcrypt || "missing"}`);
console.log(`   ${hasJwt ? "✅" : "❌"} jsonwebtoken ${hasJwt || "missing"}`);

// Check 3: Required files
console.log("\n3️⃣ Checking required files...");
const requiredFiles = [
  "lib/supabase.ts",
  "lib/db.ts",
  "lib/db-supabase.ts",
  "lib/auth.ts",
  "supabase/schema.sql",
  "supabase/fix-passwords.sql",
];

requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, "..", file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? "✅" : "❌"} ${file}`);
});

// Summary
console.log("\n📋 Summary:");
console.log("   If all checks pass, your setup is ready!");
console.log("   Next steps:");
console.log("   1. Run: npm run dev");
console.log('   2. Look for "✅ Using Supabase database" in console');
console.log(
  "   3. Open Supabase SQL Editor and run: supabase/fix-passwords.sql",
);
console.log("   4. Try logging in with: john@example.com / Demo1234");
console.log("\n   For detailed help, see TROUBLESHOOTING.md\n");
