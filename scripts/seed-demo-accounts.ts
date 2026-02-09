/**
 * Seed Demo Accounts Script
 *
 * Creates 5 demo accounts with different roles for testing
 * Run this once to populate localStorage with demo users
 *
 * Usage: Copy and paste this into browser console, or run with ts-node
 */

interface DemoUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "customer" | "staff" | "inventory-clerk" | "admin" | "owner";
}

const demoUsers: DemoUser[] = [
  {
    email: "owner@poybash.com",
    password: "Owner@2024",
    firstName: "Maria",
    lastName: "Santos",
    phone: "+63 912 345 6789",
    role: "owner",
  },
  {
    email: "admin@poybash.com",
    password: "Admin@2024",
    firstName: "Juan",
    lastName: "Dela Cruz",
    phone: "+63 912 345 6780",
    role: "admin",
  },
  {
    email: "staff@poybash.com",
    password: "Staff@2024",
    firstName: "Ana",
    lastName: "Reyes",
    phone: "+63 912 345 6781",
    role: "staff",
  },
  {
    email: "clerk@poybash.com",
    password: "Clerk@2024",
    firstName: "Pedro",
    lastName: "Garcia",
    phone: "+63 912 345 6782",
    role: "inventory-clerk",
  },
  {
    email: "customer@poybash.com",
    password: "Customer@2024",
    firstName: "Sofia",
    lastName: "Gonzales",
    phone: "+63 912 345 6783",
    role: "customer",
  },
];

// Helper: Generate unique ID
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper: Hash password (simple implementation)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

/**
 * Seed demo accounts to localStorage
 */
export function seedDemoAccounts(): void {
  console.log("🌱 Seeding demo accounts...\n");

  // Get existing users from localStorage
  const existingUsersJson = localStorage.getItem("poybash_users");
  let existingUsers = existingUsersJson ? JSON.parse(existingUsersJson) : [];

  // Remove existing demo accounts (based on email)
  const demoEmails = demoUsers.map((u) => u.email);
  existingUsers = existingUsers.filter(
    (u: any) => !demoEmails.includes(u.email),
  );

  // Create new demo users
  const newUsers = demoUsers.map((demo) => ({
    id: generateId(),
    email: demo.email,
    firstName: demo.firstName,
    lastName: demo.lastName,
    phone: demo.phone,
    role: demo.role,
    addresses: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    emailVerified: true,
    active: true,
    passwordHash: hashPassword(demo.password),
  }));

  // Save to localStorage
  const allUsers = [...existingUsers, ...newUsers];
  localStorage.setItem("poybash_users", JSON.stringify(allUsers));

  console.log("✅ Demo accounts created successfully!\n");
  console.log("📋 Demo Account Credentials:\n");
  console.log(
    "┌────────────────────┬──────────────────────┬──────────────────┐",
  );
  console.log(
    "│ Role               │ Email                │ Password         │",
  );
  console.log(
    "├────────────────────┼──────────────────────┼──────────────────┤",
  );

  demoUsers.forEach((user) => {
    const roleName = user.role.padEnd(18);
    const email = user.email.padEnd(20);
    const password = user.password.padEnd(16);
    console.log(`│ ${roleName} │ ${email} │ ${password} │`);
  });

  console.log(
    "└────────────────────┴──────────────────────┴──────────────────┘\n",
  );

  console.log("🔐 To login:");
  console.log("1. Go to /login");
  console.log("2. Use any of the emails and passwords above");
  console.log("3. Each role has different permissions\n");

  console.log("🎭 Role Descriptions:");
  console.log("• Owner: Full system access (can create admins)");
  console.log("• Admin: Operational management (cannot create other admins)");
  console.log("• Staff: Sales operations, refund processing");
  console.log("• Inventory Clerk: Warehouse & stock management");
  console.log("• Customer: Shopping and account management\n");
}

/**
 * Clear all demo accounts
 */
export function clearDemoAccounts(): void {
  const existingUsersJson = localStorage.getItem("poybash_users");
  if (!existingUsersJson) {
    console.log("No users found in localStorage");
    return;
  }

  let existingUsers = JSON.parse(existingUsersJson);
  const demoEmails = demoUsers.map((u) => u.email);
  existingUsers = existingUsers.filter(
    (u: any) => !demoEmails.includes(u.email),
  );

  localStorage.setItem("poybash_users", JSON.stringify(existingUsers));
  console.log("✅ Demo accounts cleared");
}

/**
 * Show demo account info
 */
export function showDemoAccounts(): void {
  console.log("📋 Demo Account Credentials:\n");
  console.log(
    "┌────────────────────┬──────────────────────┬──────────────────┐",
  );
  console.log(
    "│ Role               │ Email                │ Password         │",
  );
  console.log(
    "├────────────────────┼──────────────────────┼──────────────────┤",
  );

  demoUsers.forEach((user) => {
    const roleName = user.role.padEnd(18);
    const email = user.email.padEnd(20);
    const password = user.password.padEnd(16);
    console.log(`│ ${roleName} │ ${email} │ ${password} │`);
  });

  console.log(
    "└────────────────────┴──────────────────────┴──────────────────┘",
  );
}

// Browser console usage
if (typeof window !== "undefined") {
  (window as any).seedDemoAccounts = seedDemoAccounts;
  (window as any).clearDemoAccounts = clearDemoAccounts;
  (window as any).showDemoAccounts = showDemoAccounts;

  console.log("🎯 Demo Account Commands Available:");
  console.log("• seedDemoAccounts()  - Create all demo accounts");
  console.log("• showDemoAccounts()  - Display account credentials");
  console.log("• clearDemoAccounts() - Remove all demo accounts\n");
}

// Node.js usage
if (require.main === module) {
  console.log("This script should be run in the browser console");
  console.log(
    "Copy the seedDemoAccounts function and run it in your browser DevTools",
  );
}
