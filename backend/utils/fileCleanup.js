const { all, get } = require('../db');
const { deleteObject } = require('../services/storage');

async function deleteApplicationObjectsForOpportunity(opportunityId) {
  const rows = await all(
    'SELECT cv_file_key, transcript_file_key FROM applications WHERE opportunity_id = ?',
    [opportunityId]
  );
  await deleteObjectsFromRows(rows);
}

async function deleteApplicationObjectsForStudent(studentId) {
  const rows = await all(
    'SELECT cv_file_key, transcript_file_key FROM applications WHERE student_id = ?',
    [studentId]
  );
  const profile = await get(
    `SELECT avatar_file_key, cv_file_key, transcript_file_key
     FROM user_profiles WHERE user_id = ?`,
    [String(studentId)]
  );
  await deleteObjectsFromRows(rows, { includeProfileKeys: true });
  await deleteObjects([
    profile?.avatar_file_key,
    profile?.cv_file_key,
    profile?.transcript_file_key,
  ]);
}

async function deleteApplicationObjectsForProfessor(professorId) {
  const rows = await all(
    `SELECT a.cv_file_key, a.transcript_file_key
     FROM applications a
     INNER JOIN opportunities o ON o.id = a.opportunity_id
     WHERE o.author_id = ?`,
    [professorId]
  );
  await deleteObjectsFromRows(rows);
}

async function deleteObjectsFromRows(rows, options = {}) {
  const keys = rows
    .flatMap(row => [row.cv_file_key, row.transcript_file_key])
    .filter(Boolean)
    .filter(key => options.includeProfileKeys || key.startsWith('applications/'));
  await deleteObjects(keys);
}

async function deleteObjects(keys) {
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)));
  await Promise.all(uniqueKeys.map(key => deleteObject(key).catch(err => {
    console.error('Failed to delete uploaded object', key, err);
  })));
}

module.exports = {
  deleteApplicationObjectsForOpportunity,
  deleteApplicationObjectsForStudent,
  deleteApplicationObjectsForProfessor,
};
