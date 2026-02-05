/**
 * Quick Verification Script
 * Run this in browser console to check if demo data exists
 */

console.log("🔍 Checking localStorage for demo data...\n");

const users = localStorage.getItem("poybash_users");
const orders = localStorage.getItem("poybash_orders");
const session = localStorage.getItem("poybash_session");

if (users) {
    const userList = JSON.parse(users);
    console.log(`✅ Found ${userList.length} users in storage:`);
    userList.forEach(u => {
        console.log(`   - ${u.email} (${u.role})`);
    });
} else {
    console.log("❌ No users found in localStorage");
    console.log("   Run setup-demo-data.js first!");
}

if (orders) {
    const orderList = JSON.parse(orders);
    console.log(`\n✅ Found ${orderList.length} orders in storage`);
} else {
    console.log("\n❌ No orders found in localStorage");
}

if (session) {
    const sessionData = JSON.parse(session);
    console.log(`\n📌 Active session: ${sessionData.userId}`);
} else {
    console.log("\n📌 No active session (not logged in)");
}

console.log("\n" + "=".repeat(50));
if (users && JSON.parse(users).length === 5) {
    console.log("✨ Demo data is ready! You can login now.");
} else {
    console.log("⚠️ Demo data not found. Run setup-demo-data.js");
}
