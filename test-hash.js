// Test password hashing
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

const passwords = [
    'Owner@2024',
    'Admin@2024',
    'Staff@2024',
    'Clerk@2024',
    'Customer@2024'
];

console.log('Password Hashes:');
passwords.forEach(pwd => {
    console.log(`${pwd.padEnd(15)} => ${hashPassword(pwd)}`);
});
