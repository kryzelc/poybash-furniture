#!/usr/bin/env node

/**
 * Seed Demo Accounts Script
 * Creates 5 demo accounts (owner, admin, staff, clerk, customer)
 * 
 * USAGE:
 *   1. Run: node seed-accounts.js
 *   2. Copy the generated JavaScript code
 *   3. Open your app in browser (http://localhost:3000)
 *   4. Open DevTools Console (F12)
 *   5. Paste and run the code
 *   6. Go to /login and test with the credentials shown
 * 
 * CREDENTIALS:
 *   - Owner:    owner@poybash.com    / Owner@2024
 *   - Admin:    admin@poybash.com    / Admin@2024
 *   - Staff:    staff@poybash.com    / Staff@2024
 *   - Clerk:    clerk@poybash.com    / Clerk@2024
 *   - Customer: customer@poybash.com / Customer@2024
 */

const demoUsers = [
  {
    email: 'owner@poybash.com',
    password: 'Owner@2024',
    firstName: 'Maria',
    lastName: 'Santos',
    phone: '+63 912 345 6789',
    role: 'owner',
  },
  {
    email: 'admin@poybash.com',
    password: 'Admin@2024',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    phone: '+63 912 345 6780',
    role: 'admin',
  },
  {
    email: 'staff@poybash.com',
    password: 'Staff@2024',
    firstName: 'Ana',
    lastName: 'Reyes',
    phone: '+63 912 345 6781',
    role: 'staff',
  },
  {
    email: 'clerk@poybash.com',
    password: 'Clerk@2024',
    firstName: 'Pedro',
    lastName: 'Garcia',
    phone: '+63 912 345 6782',
    role: 'inventory-clerk',
  },
  {
    email: 'customer@poybash.com',
    password: 'Customer@2024',
    firstName: 'Sofia',
    lastName: 'Gonzales',
    phone: '+63 912 345 6783',
    role: 'customer',
  },
];

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function generateAccounts() {
  const accounts = demoUsers.map((demo) => ({
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

  return accounts;
}

// Main execution
console.log('🌱 PoyBash Furniture - Demo Accounts Generator\n');
console.log('═══════════════════════════════════════════════════════════\n');

const accounts = generateAccounts();

console.log('📋 Demo Account Credentials:\n');
console.log('┌────────────────────┬──────────────────────┬──────────────────┐');
console.log('│ Role               │ Email                │ Password         │');
console.log('├────────────────────┼──────────────────────┼──────────────────┤');

demoUsers.forEach((user) => {
  const roleName = user.role.padEnd(18);
  const email = user.email.padEnd(20);
  const password = user.password.padEnd(16);
  console.log(`│ ${roleName} │ ${email} │ ${password} │`);
});

console.log('└────────────────────┴──────────────────────┴──────────────────┘\n');

console.log('🔧 To create these accounts:\n');
console.log('1. Go to your app (http://localhost:3000)');
console.log('2. Open Browser DevTools (F12)');
console.log('3. Go to Console tab');
console.log('4. Copy and paste the command below:\n');
console.log('═══════════════════════════════════════════════════════════\n');

const jsCode = `
// Seed Demo Accounts
(function() {
  const accounts = ${JSON.stringify(accounts, null, 2)};
  
  const existingUsers = JSON.parse(localStorage.getItem('poybash_users') || '[]');
  const demoEmails = ${JSON.stringify(demoUsers.map(u => u.email))};
  
  // Remove existing demo accounts
  const filteredUsers = existingUsers.filter(u => !demoEmails.includes(u.email));
  
  // Add new demo accounts
  const allUsers = [...filteredUsers, ...accounts];
  localStorage.setItem('poybash_users', JSON.stringify(allUsers));
  
  console.log('✅ Created ${accounts.length} demo accounts!');
  console.log('🔐 You can now login at /login with the credentials shown above.');
})();
`.trim();

console.log(jsCode);
console.log('\n═══════════════════════════════════════════════════════════\n');

console.log('✨ After running the command, you can login with any of the accounts above!');
console.log('');

// Also output to file for easy copy-paste
const fs = require('fs');
fs.writeFileSync(
  'seed-accounts-command.txt',
  jsCode + '\n\n// Copy and paste this entire script into your browser console'
);

console.log('💾 Command also saved to: seed-accounts-command.txt\n');
