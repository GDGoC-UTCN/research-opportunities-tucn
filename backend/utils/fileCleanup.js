const { all } = require('../db');
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
  await deleteObjectsFromRows(rows);
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

async function deleteObjectsFromRows(rows) {
  const keys = rows.flatMap(row => [row.cv_file_key, row.transcript_file_key]).filter(Boolean);
  await Promise.all(keys.map(key => deleteObject(key).catch(err => {
    console.error('Failed to delete uploaded object', key, err);
  })));
}

module.exports = {
  deleteApplicationObjectsForOpportunity,
  deleteApplicationObjectsForStudent,
  deleteApplicationObjectsForProfessor,
};
