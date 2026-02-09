# Quick Setup - Demo Accounts

## 🚀 **FASTEST WAY - Copy & Paste This:**

### Step 1: Open your app
Go to `http://localhost:3000`

### Step 2: Open Browser Console
Press **F12** → Go to **Console** tab

### Step 3: Copy and paste this ENTIRE code:

```javascript
// === DEMO ACCOUNTS SETUP ===
(function() {
  // Hash password function
  function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
  
  // Generate ID
  function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Demo accounts data
  const demoAccounts = [
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
  
  // Create accounts
  const accounts = demoAccounts.map(demo => ({
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
  
  // Get existing users
  const existingUsers = JSON.parse(localStorage.getItem('poybash_users') || '[]');
  const demoEmails = demoAccounts.map(u => u.email);
  
  // Remove existing demo accounts
  const filteredUsers = existingUsers.filter(u => !demoEmails.includes(u.email));
  
  // Add new demo accounts
  const allUsers = [...filteredUsers, ...accounts];
  localStorage.setItem('poybash_users', JSON.stringify(allUsers));
  
  console.log('✅ Created 5 demo accounts!');
  console.log('\n📋 Login Credentials:');
  console.table(demoAccounts.map(u => ({
    Email: u.email,
    Password: u.password,
    Role: u.role
  })));
  
  console.log('\n🔐 Go to /login and use any of the credentials above!');
  
  // Test hash function
  console.log('\n🧪 Testing password hashing:');
  console.log('Owner@2024 hash:', hashPassword('Owner@2024'));
  console.log('Stored hash:', accounts[0].passwordHash);
  console.log('Match:', hashPassword('Owner@2024') === accounts[0].passwordHash ? '✅ YES' : '❌ NO');
})();
```

### Step 4: You should see this output:
```
✅ Created 5 demo accounts!

📋 Login Credentials:
(table showing all accounts)

🔐 Go to /login and use any of the credentials above!
```

### Step 5: Go to `/login` and try:
- **Email:** owner@poybash.com
- **Password:** Owner@2024

---

## 🐛 Troubleshooting

### If login still fails:

**1. Check if accounts were created:**
In console, run:
```javascript
JSON.parse(localStorage.getItem('poybash_users') || '[]').map(u => u.email)
```

You should see:
```
['owner@poybash.com', 'admin@poybash.com', 'staff@poybash.com', 'clerk@poybash.com', 'customer@poybash.com']
```

**2. Clear and recreate:**
```javascript
localStorage.clear();
// Then run the setup script again
```

**3. Test password hashing:**
```javascript
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

console.log('Expected hash:', hashPassword('Owner@2024'));
console.log('Stored hash:', JSON.parse(localStorage.getItem('poybash_users'))[0].passwordHash);
```

---

## 📋 All Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@poybash.com | Owner@2024 |
| Admin | admin@poybash.com | Admin@2024 |
| Staff | staff@poybash.com | Staff@2024 |
| Clerk | clerk@poybash.com | Clerk@2024 |
| Customer | customer@poybash.com | Customer@2024 |

---

## 🔧 Alternative: Use Node Script

If you prefer, you can also use:
```bash
node seed-accounts.js
# Then copy the output and paste in browser console
```

But the script above is faster - just one copy-paste!
