"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

export default function SeedAccountsPage() {
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [accountCount, setAccountCount] = useState(0);

    useEffect(() => {
        // Check existing accounts on load
        const users = JSON.parse(localStorage.getItem("poybash_users") || "[]");
        setAccountCount(users.length);
    }, []);

    const seedAccounts = () => {
        try {
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

            const existingUsers = JSON.parse(
                localStorage.getItem("poybash_users") || "[]"
            );
            const demoEmails = demoUsers.map((u) => u.email);
            const filteredUsers = existingUsers.filter(
                (u: any) => !demoEmails.includes(u.email)
            );
            const allUsers = [...filteredUsers, ...accounts];

            localStorage.setItem("poybash_users", JSON.stringify(allUsers));

            setStatus("success");
            setMessage(`Successfully created ${accounts.length} demo accounts!`);
            setAccountCount(allUsers.length);

            console.log("✅ Demo accounts seeded successfully!");
            console.log("Accounts:", accounts);
        } catch (error) {
            setStatus("error");
            setMessage("Failed to seed accounts. Check console for details.");
            console.error("Error seeding accounts:", error);
        }
    };

    const clearAccounts = () => {
        if (confirm("Are you sure you want to clear ALL accounts?")) {
            localStorage.removeItem("poybash_users");
            localStorage.removeItem("auth_session");
            setStatus("success");
            setMessage("All accounts cleared!");
            setAccountCount(0);
        }
    };

    const viewAccounts = () => {
        const users = JSON.parse(localStorage.getItem("poybash_users") || "[]");
        console.log("📋 Accounts in localStorage:", users);
        alert(`Found ${users.length} accounts. Check console for details.`);
    };

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Card>
                    <CardHeader>
                        <CardTitle>🌱 Seed Demo Accounts</CardTitle>
                        <CardDescription>
                            Create demo accounts for testing the PoyBash Furniture application
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Status Message */}
                        {status !== "idle" && (
                            <div
                                className={`p-4 rounded-lg ${status === "success"
                                        ? "bg-green-50 text-green-800 border border-green-200"
                                        : "bg-red-50 text-red-800 border border-red-200"
                                    }`}
                            >
                                {message}
                            </div>
                        )}

                        {/* Current Status */}
                        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                            <p className="font-semibold">
                                Current accounts in localStorage: {accountCount}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                            <Button onClick={seedAccounts} size="lg">
                                🌱 Seed Demo Accounts
                            </Button>
                            <Button onClick={viewAccounts} variant="outline" size="lg">
                                👀 View Accounts
                            </Button>
                            <Button onClick={clearAccounts} variant="destructive" size="lg">
                                🗑️ Clear All Accounts
                            </Button>
                        </div>

                        {/* Demo Credentials Table */}
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4">
                                📋 Demo Account Credentials
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border p-3 text-left">Role</th>
                                            <th className="border p-3 text-left">Email</th>
                                            <th className="border p-3 text-left">Password</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {demoUsers.map((user) => (
                                            <tr key={user.email} className="hover:bg-gray-50">
                                                <td className="border p-3">{user.role}</td>
                                                <td className="border p-3 font-mono text-sm">
                                                    {user.email}
                                                </td>
                                                <td className="border p-3 font-mono text-sm">
                                                    {user.password}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
                            <h3 className="font-semibold mb-2">📝 Instructions:</h3>
                            <ol className="list-decimal list-inside space-y-1 text-sm">
                                <li>Click "🌱 Seed Demo Accounts" to create all 5 demo accounts</li>
                                <li>Go to <a href="/login" className="text-blue-600 hover:underline">/login</a></li>
                                <li>Use any of the credentials from the table above</li>
                                <li>Each role has different permissions in the system</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
