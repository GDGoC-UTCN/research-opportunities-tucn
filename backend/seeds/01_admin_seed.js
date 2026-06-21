// DEPRECATED: This knex seed is no longer used. Admin seeding now runs through
// the DB_PATH-aware `node seed-admin.js` script (see backend/package.json
// "seed-admin" and the deploy/start.sh flow). The knex seed connected using the
// development SQLite path from knexfile.js, which does not match the Docker
// DB_PATH (/data/data.sqlite) and produced a noisy "no such table: users"
// error during deploy. Kept only for reference; do not wire it into npm scripts.
const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'AIRI@campus.utcluj.ro').trim().toLowerCase();
  const ADMIN_PASS = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASS;
  const ADMIN_NAME = process.env.ADMIN_NAME || 'AIRi Admin';
  const RESET_ADMIN_PASSWORD = process.env.RESET_ADMIN_PASSWORD === 'true';

  const existing = await knex('users').whereRaw('lower(email) = ?', [ADMIN_EMAIL]).first();
  if (existing) {
    if (!RESET_ADMIN_PASSWORD) {
      console.log('Admin already exists, skipping password reset');
      return;
    }
    if (!ADMIN_PASS) throw new Error('RESET_ADMIN_PASSWORD=true requires ADMIN_INITIAL_PASSWORD');
    const hashed = bcrypt.hashSync(ADMIN_PASS, 12);
    await knex('users')
      .where({ id: existing.id })
      .update({ name: ADMIN_NAME, email: ADMIN_EMAIL, role: 'admin', password: hashed, approved: 1, updated_at: knex.fn.now() });
    console.log('Admin password reset via knex:', ADMIN_EMAIL);
    return;
  }

  if (!ADMIN_PASS) throw new Error('ADMIN_INITIAL_PASSWORD is required to seed a missing admin account');

  const hashed = bcrypt.hashSync(ADMIN_PASS, 12);
  await knex('users').insert({ name: ADMIN_NAME, email: ADMIN_EMAIL, role: 'admin', password: hashed, approved: 1 });
  console.log('Admin seeded via knex:', ADMIN_EMAIL);
};
