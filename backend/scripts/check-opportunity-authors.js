#!/usr/bin/env node
/*
 * Diagnostic for opportunity -> author linkage.
 *
 * Public Browse only shows opportunities whose author_id matches an APPROVED
 * professor (see backend/routes/opportunities.js). Older rows may carry legacy
 * string author_ids or names that no longer point at an approved professor, so
 * they are hidden publicly. This script reports those rows and can optionally
 * repair them when the author_name unambiguously matches one approved professor.
 *
 * Usage:
 *   node scripts/check-opportunity-authors.js            # report only (safe)
 *   node scripts/check-opportunity-authors.js --repair   # also relink by name
 *
 * It never deletes opportunities, never drops tables, and only ever updates the
 * author_id of orphaned rows when there is exactly one approved-professor match.
 */
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.sqlite');
const REPAIR = process.argv.includes('--repair');

const db = new sqlite3.Database(DB_PATH);

function all(sql, params = []) {
  return new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
}
function run(sql, params = []) {
  return new Promise((resolve, reject) => db.run(sql, params, function onRun(err) { return err ? reject(err) : resolve(this); }));
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

async function main() {
  console.log(`Checking opportunity authors in ${DB_PATH}`);
  console.log(REPAIR ? 'Mode: REPAIR (will relink unambiguous name matches)\n' : 'Mode: report only (use --repair to relink)\n');

  const opportunities = await all('SELECT id, title, author_id, author_name FROM opportunities ORDER BY id');
  const professors = await all("SELECT id, name, email, approved FROM users WHERE role = 'professor'");

  const approvedById = new Map();
  const approvedByName = new Map(); // name -> professor, or null when ambiguous
  for (const prof of professors) {
    if (!prof.approved) continue;
    approvedById.set(String(prof.id), prof);
    const key = normalizeName(prof.name);
    if (!key) continue;
    approvedByName.set(key, approvedByName.has(key) ? null : prof);
  }

  let visible = 0;
  let hidden = 0;
  let repaired = 0;

  for (const opp of opportunities) {
    const matched = approvedById.get(String(opp.author_id));
    if (matched) {
      visible += 1;
      console.log(`#${opp.id} "${opp.title}" author_id=${opp.author_id} author_name="${opp.author_name || ''}" => VISIBLE (approved professor: ${matched.name})`);
      continue;
    }

    hidden += 1;
    let note = 'HIDDEN (no approved-professor match)';
    const candidate = approvedByName.get(normalizeName(opp.author_name));
    if (candidate) {
      if (REPAIR) {
        await run('UPDATE opportunities SET author_id = ? WHERE id = ?', [String(candidate.id), opp.id]);
        repaired += 1;
        note += ` -> REPAIRED to author_id=${candidate.id} (${candidate.name})`;
      } else {
        note += ` -> can repair to author_id=${candidate.id} (${candidate.name}); rerun with --repair`;
      }
    } else if (approvedByName.get(normalizeName(opp.author_name)) === null) {
      note += ' -> name matches multiple approved professors; manual review needed';
    } else {
      note += ' -> no approved professor with this name; manual review needed';
    }
    console.log(`#${opp.id} "${opp.title}" author_id=${opp.author_id} author_name="${opp.author_name || ''}" => ${note}`);
  }

  console.log(`\nTotal opportunities: ${opportunities.length} | visible: ${visible} | hidden: ${hidden}${REPAIR ? ` | repaired: ${repaired}` : ''}`);
  if (!REPAIR && hidden > 0) {
    console.log('Hidden rows are not exposed publicly. Review the rows above and rerun with --repair to relink unambiguous name matches.');
  }
}

main()
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => db.close());
