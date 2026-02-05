const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && !key.startsWith("#")) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

(async () => {
  const userId = "ed56eb9f-f1a4-4d9c-b5ed-04021a63b14e";

  // Delete existing record
  await supabase.from("users").delete().eq("id", userId);

  // Insert fresh record
  const { error: insertError } = await supabase.from("users").insert({
    id: userId,
    email: "demo@poybash.com",
    first_name: "Demo",
    last_name: "Customer",
    phone: "+63 932 549 0596",
    role: "customer",
    active: true,
  });

  if (insertError) {
    console.log("❌ Error:", insertError.message);
  } else {
    console.log("✅ User profile created successfully!");
    console.log("\nYou can now login with:");
    console.log("Email: demo@poybash.com");
    console.log("Password: Demo123!@");
  }
})();
