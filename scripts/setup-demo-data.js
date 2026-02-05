/**
 * Demo Account Setup Script for PoyBash Furniture
 * 
 * INSTRUCTIONS:
 * 1. Open your app at localhost:3000
 * 2. Open browser console (F12 or Right-click > Inspect > Console)
 * 3. Copy this entire file and paste it into the console
 * 4. Press Enter
 * 5. Refresh the page
 * 6. Login with any demo account below
 * 
 * DEMO ACCOUNTS:
 * - customer@demo.com / customer123 (has 3 orders & addresses)
 * - staff@demo.com / staff123
 * - inventory@demo.com / inventory123
 * - admin@demo.com / admin123
 * - owner@demo.com / owner123
 */

console.log('🚀 Setting up demo data for PoyBash Furniture...\n');

// Helper: Hash password (matches AuthContext implementation)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

// Helper: Generate ID
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Demo Users
const demoUsers = [
    {
        id: "demo-customer-1",
        email: "customer@demo.com",
        firstName: "John",
        lastName: "Doe",
        phone: "+639171234567",
        role: "customer",
        addresses: [
            {
                id: "addr-1",
                label: "Home",
                firstName: "John",
                lastName: "Doe",
                address: "123 Main Street",
                barangay: "Poblacion",
                city: "Ozamiz City",
                state: "Misamis Occidental",
                zipCode: "7200",
                country: "Philippines",
                phone: "+639171234567",
                isDefault: true,
            },
        ],
        createdAt: new Date("2024-01-15").toISOString(),
        active: true,
        passwordHash: hashPassword("customer123"),
    },
    {
        id: "demo-staff-1",
        email: "staff@demo.com",
        firstName: "Jane",
        lastName: "Smith",
        phone: "+639187654321",
        role: "staff",
        addresses: [],
        createdAt: new Date("2024-02-01").toISOString(),
        active: true,
        passwordHash: hashPassword("staff123"),
    },
    {
        id: "demo-inventory-1",
        email: "inventory@demo.com",
        firstName: "Mike",
        lastName: "Johnson",
        phone: "+639191112222",
        role: "inventory-clerk",
        addresses: [],
        createdAt: new Date("2024-02-10").toISOString(),
        active: true,
        passwordHash: hashPassword("inventory123"),
    },
    {
        id: "demo-admin-1",
        email: "admin@demo.com",
        firstName: "Sarah",
        lastName: "Williams",
        phone: "+639193334444",
        role: "admin",
        addresses: [],
        createdAt: new Date("2024-01-01").toISOString(),
        active: true,
        passwordHash: hashPassword("admin123"),
    },
    {
        id: "demo-owner-1",
        email: "owner@demo.com",
        firstName: "Robert",
        lastName: "Brown",
        phone: "+639195556666",
        role: "owner",
        addresses: [],
        createdAt: new Date("2023-12-01").toISOString(),
        active: true,
        passwordHash: hashPassword("owner123"),
    },
];

// Demo Orders for customer
const demoOrders = [
    {
        id: "order-demo-1",
        userId: "demo-customer-1",
        items: [
            {
                productId: 1,
                name: "Modern Sofa",
                price: 25000,
                quantity: 1,
                variantId: "one-size-gray",
                color: "Gray",
                imageUrl: "https://ktcadsqclaszdyymftvf.supabase.co/storage/v1/object/public/assets/products/modern-sofa.jpg",
                warehouseSource: "Lorenzo",
            },
            {
                productId: 5,
                name: "Coffee Table",
                price: 8500,
                quantity: 1,
                variantId: "one-size-walnut",
                color: "Walnut",
                imageUrl: "https://ktcadsqclaszdyymftvf.supabase.co/storage/v1/object/public/assets/products/coffee-table.jpg",
                warehouseSource: "Lorenzo",
            },
        ],
        subtotal: 33500,
        deliveryFee: 500,
        total: 34000,
        status: "completed",
        deliveryMethod: "store-pickup",
        shippingAddress: {
            firstName: "John",
            lastName: "Doe",
            address: "123 Main Street",
            barangay: "Poblacion",
            city: "Ozamiz City",
            state: "Misamis Occidental",
            zipCode: "7200",
            country: "Philippines",
            phone: "+639171234567",
        },
        pickupDetails: {
            pickupPerson: "John Doe",
            pickupPhone: "+639171234567",
        },
        paymentMethod: "gcash",
        paymentStatus: "paid",
        createdAt: new Date("2024-11-15T10:30:00").toISOString(),
        updatedAt: new Date("2024-11-20T14:00:00").toISOString(),
        completedAt: new Date("2024-11-20T14:00:00").toISOString(),
    },
    {
        id: "order-demo-2",
        userId: "demo-customer-1",
        items: [
            {
                productId: 3,
                name: "Dining Table Set",
                price: 35000,
                quantity: 1,
                variantId: "one-size-oak",
                color: "Oak",
                imageUrl: "https://ktcadsqclaszdyymftvf.supabase.co/storage/v1/object/public/assets/products/dining-table.jpg",
                warehouseSource: "Oroquieta",
            },
        ],
        subtotal: 35000,
        deliveryFee: 1000,
        total: 36000,
        status: "processing",
        deliveryMethod: "customer-arranged",
        shippingAddress: {
            firstName: "John",
            lastName: "Doe",
            address: "123 Main Street",
            barangay: "Poblacion",
            city: "Ozamiz City",
            state: "Misamis Occidental",
            zipCode: "7200",
            country: "Philippines",
            phone: "+639171234567",
        },
        paymentMethod: "bank-transfer",
        paymentStatus: "pending",
        createdAt: new Date("2024-12-01T09:15:00").toISOString(),
        updatedAt: new Date("2024-12-01T09:15:00").toISOString(),
    },
    {
        id: "order-demo-3",
        userId: "demo-customer-1",
        items: [
            {
                productId: 7,
                name: "Bookshelf",
                price: 12000,
                quantity: 2,
                variantId: "one-size-white",
                color: "White",
                imageUrl: "https://ktcadsqclaszdyymftvf.supabase.co/storage/v1/object/public/assets/products/bookshelf.jpg",
                warehouseSource: "Lorenzo",
            },
        ],
        subtotal: 24000,
        isReservation: true,
        reservationPercentage: 30,
        reservationFee: 7200,
        total: 7200,
        status: "reserved",
        deliveryMethod: "store-pickup",
        shippingAddress: {
            firstName: "John",
            lastName: "Doe",
            address: "123 Main Street",
            barangay: "Poblacion",
            city: "Ozamiz City",
            state: "Misamis Occidental",
            zipCode: "7200",
            country: "Philippines",
            phone: "+639171234567",
        },
        pickupDetails: {
            pickupPerson: "John Doe",
            pickupPhone: "+639171234567",
        },
        paymentMethod: "cash",
        paymentStatus: "pending",
        createdAt: new Date("2024-12-10T16:45:00").toISOString(),
        updatedAt: new Date("2024-12-10T16:45:00").toISOString(),
    },
];

// 1. Set up users
localStorage.setItem("poybash_users", JSON.stringify(demoUsers));
console.log("✅ Created 5 demo users:");
console.log("   📧 customer@demo.com (password: customer123) - Customer with orders");
console.log("   📧 staff@demo.com (password: staff123) - Sales Staff");
console.log("   📧 inventory@demo.com (password: inventory123) - Inventory Clerk");
console.log("   📧 admin@demo.com (password: admin123) - Administrator");
console.log("   📧 owner@demo.com (password: owner123) - Owner");

// 2. Set up orders
localStorage.setItem("poybash_orders", JSON.stringify(demoOrders));
console.log("\n✅ Created 3 demo orders for customer@demo.com:");
console.log("   📦 Order 1: Completed (Modern Sofa + Coffee Table)");
console.log("   📦 Order 2: Processing (Dining Table Set)");
console.log("   📦 Order 3: Reserved (2x Bookshelf)");

// 3. Clear any existing session
localStorage.removeItem("poybash_session");
console.log("\n✅ Cleared existing session");

console.log("\n🎉 Demo data setup complete!");
console.log("\n📝 Next steps:");
console.log("   1. Refresh this page (F5)");
console.log("   2. Go to the login page");
console.log("   3. Login with any demo account");
console.log("\n💡 Tip: Use customer@demo.com to see orders and addresses");

// Verification
console.log("\n🔍 Verifying setup...");
const verifyUsers = JSON.parse(localStorage.getItem("poybash_users") || "[]");
const verifyOrders = JSON.parse(localStorage.getItem("poybash_orders") || "[]");
console.log(`✅ Users in storage: ${verifyUsers.length}`);
console.log(`✅ Orders in storage: ${verifyOrders.length}`);

if (verifyUsers.length === 5 && verifyOrders.length === 3) {
    console.log("\n✨ SUCCESS! All demo data verified and ready to use!");
} else {
    console.warn("\n⚠️ Warning: Data count mismatch. Expected 5 users and 3 orders.");
    console.log("Try running the script again.");
}

