const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@utcn.edu';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'adminpass';
  const ADMIN_NAME = process.env.ADMIN_NAME || 'UTCN Admin';

  // Check if admin already exists
  const existing = await knex('users').where({ email: ADMIN_EMAIL }).first();
  if (existing) {
    console.log('Admin already exists, skipping seed');
    return;
  }

  const hashed = bcrypt.hashSync(ADMIN_PASS, 10);
  await knex('users').insert({ name: ADMIN_NAME, email: ADMIN_EMAIL, role: 'admin', password: hashed, approved: 1 });
  console.log('Admin seeded via knex:', ADMIN_EMAIL);
};
