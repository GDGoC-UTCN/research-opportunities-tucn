// Seed demo student and professor accounts using plaintext passwords from README
const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  const demoUsers = [
    { name: 'Alexandru Pop', email: 'alex.pop@student.utcn', role: 'student', plain: process.env.ALEX_PASS || 'studentpass', approved: 1 },
    { name: 'Maria Ionescu', email: 'maria.ionescu@student.utcn', role: 'student', plain: process.env.MARIA_PASS || 'studentpass2', approved: 1 },
    { name: 'Dr. Andrew Julian', email: 'andrew.julian@utcn', role: 'professor', department: 'Computer Science', plain: process.env.PROF_PASS || 'profpass', approved: 1 }
  ];

  if (process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASS) {
    demoUsers.unshift({
      name: 'AIRi Admin',
      email: (process.env.ADMIN_EMAIL || 'AIRI@campus.utcluj.ro').toLowerCase(),
      role: 'admin',
      plain: process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASS,
      approved: 1,
    });
  }

  for (const u of demoUsers) {
    const exists = await knex('users').whereRaw('lower(email) = ?', [u.email.toLowerCase()]).first();
    if (exists) {
      console.log('User exists, skipping:', u.email);
      continue;
    }
    const hashed = bcrypt.hashSync(u.plain, 10);
    const insert = {
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department || null,
      password: hashed,
      approved: u.approved || 0
    };
    await knex('users').insert(insert);
    console.log('Seeded demo user:', u.email);
  }
};
