const { db } = require('../database/db');
const { changeUserPassword } = require('../services/authService');

const newPassword = process.argv[2] || 'admin123';
const adminUser = db.prepare("SELECT * FROM users WHERE role = 'admin' OR username = 'admin' LIMIT 1").get();

if (!adminUser) {
  console.error('Error: Admin user not found in database.');
  process.exit(1);
}

changeUserPassword(adminUser.id, newPassword);

console.log('==================================================');
console.log('✅ ND30 Chief Administrator Password Reset Successful');
console.log('--------------------------------------------------');
console.log('User ID:   ', adminUser.id);
console.log('Full Name: ', adminUser.full_name);
console.log('Username:  ', adminUser.username);
console.log('Email:     ', adminUser.email);
console.log('Password:  ', newPassword);
console.log('Login URL:  http://localhost:3030/login');
console.log('==================================================');

