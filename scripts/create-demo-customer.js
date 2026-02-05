/**
 * Demo Customer Account Creation Script
 * Run this to create a test customer account in Supabase
 * Usage: node scripts/create-demo-customer.js
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && !key.startsWith("#")) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase credentials\n");
  console.error("Please create or update .env.local with:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n");
  console.error("You can get these from your Supabase project settings.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createDemoCustomer() {
  try {
    const email = "demo@poybash.com";
    const password = "Demo123!@";

    console.log("Creating demo customer account...");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    // Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          first_name: "Demo",
          last_name: "Customer",
        },
      });

    if (authError) {
      console.error("❌ Auth error:", authError.message);
      console.error("\nMake sure your SUPABASE_SERVICE_ROLE_KEY is correct.");
      return;
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user created: ${userId}`);

    // Manually confirm the email since email_confirm option didn't work
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        email_confirm: true,
      },
    );

    if (updateError) {
      console.log("⚠️  Could not confirm email:", updateError.message);
    } else {
      console.log("✅ Email confirmed");
    }

    // Create user profile
    const { error: profileError } = await supabase.from("users").insert({
      id: userId,
      email: email,
      first_name: "Demo",
      last_name: "Customer",
      phone: "+63 932 549 0596",
      role: "customer",
      active: true,
    });

    if (profileError) {
      console.error("❌ Profile error:", profileError.message);
      // If profile fails but auth succeeded, user can still login
      console.log("⚠️  Auth user created but profile creation failed");
      console.log(
        "You may still be able to login, but profile info is incomplete",
      );
      return;
    }

    console.log("✅ User profile created");
    console.log("\n🎉 Demo customer account created successfully!");
    console.log("\nYou can now login with:");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

createDemoCustomer();
