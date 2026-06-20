const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const PORT = Number(process.env.SMOKE_PORT || 4197);
const BASE_URL = `http://localhost:${PORT}`;
const DB_PATH = path.join(os.tmpdir(), `tucn-smoke-${process.pid}.sqlite`);
const JWT_SECRET = process.env.JWT_SECRET || 'abcdefghijklmnopqrstuvwxyz1234567890';

class CookieJar {
  constructor() {
    this.cookies = new Map();
    this.csrfToken = null;
  }

  store(headers) {
    const setCookie = headers.getSetCookie ? headers.getSetCookie() : headers.get('set-cookie')?.split(/,(?=[^;]+?=)/g) || [];
    for (const cookie of setCookie) {
      const [pair] = cookie.split(';');
      const [name, value] = pair.split('=');
      if (!name) continue;
      if (value) this.cookies.set(name.trim(), value.trim());
      else this.cookies.delete(name.trim());
    }
  }

  header() {
    return Array.from(this.cookies.entries()).map(([name, value]) => `${name}=${value}`).join('; ');
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForHealth() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) return;
    } catch {
      // keep waiting
    }
    await wait(250);
  }
  throw new Error('API did not become healthy');
}

function runSql(sql, params = []) {
  const db = new sqlite3.Database(DB_PATH);
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      db.close();
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function request(method, route, jar, body) {
  const headers = new Headers();
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (jar?.header()) headers.set('Cookie', jar.header());

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (!jar.csrfToken) {
      const csrfResponse = await fetch(`${BASE_URL}/api/csrf-token`, {
        headers: jar.header() ? { Cookie: jar.header() } : undefined,
      });
      jar.store(csrfResponse.headers);
      const csrfJson = await csrfResponse.json();
      jar.csrfToken = csrfJson.csrfToken;
      headers.set('Cookie', jar.header());
    }
    headers.set('X-CSRF-Token', jar.csrfToken);
  }

  const response = await fetch(`${BASE_URL}${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  jar?.store(response.headers);
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  return { response, json };
}

function assert(condition, message, detail) {
  if (!condition) throw new Error(`${message}${detail ? `: ${detail}` : ''}`);
}

async function main() {
  const child = spawn(process.execPath, ['index.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(PORT),
      DB_PATH,
      JWT_SECRET,
      CORS_ORIGIN: 'http://localhost:3000',
      NODE_ENV: 'development',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForHealth();

    const adminPass = 'adminpass123';
    await runSql(
      "INSERT INTO users (name,email,role,password,approved) VALUES ('Smoke Admin','admin@example.com','admin',?,1)",
      [bcrypt.hashSync(adminPass, 10)]
    );

    const admin = new CookieJar();
    const student = new CookieJar();
    const professor = new CookieJar();
    const otherProfessor = new CookieJar();
    const pendingProfessor = new CookieJar();

    let result = await request('POST', '/api/signup', student, {
      name: 'Smoke Student',
      email: 'student@example.com',
      password: 'studentpass123',
      role: 'student',
    });
    assert(result.response.status === 201, 'student signup should succeed', `${result.response.status} ${JSON.stringify(result.json)}`);

    result = await request('GET', '/api/me', student);
    assert(result.response.status === 200 && result.json.user.role === 'student', '/me should restore student');
    const studentId = result.json.user.id;

    result = await request('POST', '/api/signup', pendingProfessor, {
      name: 'Pending Professor',
      email: 'pending@example.com',
      password: 'profpass123',
      role: 'professor',
      department: 'CS',
    });
    assert(result.response.status === 201 && result.json.pendingApproval, 'professor signup should be pending');

    result = await request('POST', '/api/login', pendingProfessor, {
      email: 'pending@example.com',
      password: 'profpass123',
      role: 'professor',
    });
    assert(result.response.status === 403, 'pending professor login should be rejected');

    result = await request('POST', '/api/login', admin, {
      email: 'admin@example.com',
      password: adminPass,
      role: 'admin',
    });
    assert(result.response.status === 200, 'admin login should succeed');

    result = await request('GET', '/api/admin/users', student);
    assert(result.response.status === 403, 'student cannot list admin users');

    result = await request('POST', '/api/admin/approve', admin, { email: 'pending@example.com' });
    assert(result.response.status === 200, 'admin should approve pending professor');

    result = await request('POST', '/api/login', professor, {
      email: 'pending@example.com',
      password: 'profpass123',
      role: 'professor',
    });
    assert(result.response.status === 200, 'approved professor login should succeed');

    await runSql("UPDATE users SET role = 'student' WHERE email = 'pending@example.com'");
    result = await request('POST', '/api/opportunities', professor, {
      title: 'Role Changed Opportunity',
      description: 'No',
      abstract: 'No',
      duration: '1 month',
      stipend: 'None',
    });
    assert(result.response.status === 403, 'role-changed old JWT should use current DB role');
    await runSql("UPDATE users SET role = 'professor', approved = 0 WHERE email = 'pending@example.com'");
    result = await request('POST', '/api/opportunities', professor, {
      title: 'Approval Changed Opportunity',
      description: 'No',
      abstract: 'No',
      duration: '1 month',
      stipend: 'None',
    });
    assert(result.response.status === 403, 'approval-changed old JWT should use current DB approval');
    await runSql("UPDATE users SET approved = 1 WHERE email = 'pending@example.com'");

    result = await request('POST', '/api/opportunities', student, {
      title: 'Bad Student Opportunity',
      description: 'No',
      abstract: 'No',
      duration: '1 month',
      stipend: 'None',
    });
    assert(result.response.status === 403, 'student cannot create opportunity');

    result = await request('POST', '/api/opportunities', professor, {
      title: 'Smoke Opportunity',
      description: 'Short description',
      abstract: 'Research abstract',
      duration: '1 month',
      stipend: 'None',
      tags: ['AI'],
      applicationFields: [],
    });
    assert(result.response.status === 201, 'professor should create opportunity');
    const opportunityId = result.json.id;

    result = await request('POST', '/api/applications', student, {
      opportunityId,
      studentId: '999',
      studentName: 'Imposter',
      message: 'Please consider me',
      answers: [],
    });
    assert(result.response.status === 201, 'student should apply');
    const applicationId = result.json.id;

    result = await request('GET', '/api/applications', student);
    assert(result.response.status === 200, 'student should list own applications');
    assert(result.json.applications[0].studentId === studentId && result.json.applications[0].studentName === 'Smoke Student', 'application should use authenticated student identity');

    await request('POST', '/api/signup', otherProfessor, {
      name: 'Other Professor',
      email: 'other@example.com',
      password: 'profpass123',
      role: 'professor',
      department: 'CS',
    });
    await request('POST', '/api/admin/approve', admin, { email: 'other@example.com' });
    result = await request('POST', '/api/login', otherProfessor, {
      email: 'other@example.com',
      password: 'profpass123',
      role: 'professor',
    });
    assert(result.response.status === 200, 'other professor login should succeed');

    result = await request('PATCH', `/api/applications/${applicationId}`, otherProfessor, {
      status: 'rejected',
      professorReply: 'No',
    });
    assert(result.response.status === 403, 'non-owner professor cannot patch application');

    result = await request('PATCH', `/api/applications/${applicationId}`, professor, {
      status: 'accepted',
      professorReply: 'Welcome',
    });
    assert(result.response.status === 200, 'owner professor can patch application');

    await request('DELETE', `/api/opportunities/${opportunityId}`, admin);
    result = await request('GET', '/api/applications', admin);
    assert(result.response.status === 200, 'admin can list applications after post deletion');
    assert(!result.json.applications.some(app => app.id === applicationId), 'admin post deletion should delete dependent applications');

    await request('DELETE', '/api/admin/users/student@example.com', admin);
    result = await request('GET', '/api/me', student);
    assert(result.response.status === 401, 'deleted user old JWT should be rejected');

    await request('POST', '/api/logout', admin);
    result = await request('GET', '/api/me', admin);
    assert(result.response.status === 401, 'logout then /me should be unauthenticated');

    console.log('Smoke tests passed');
  } finally {
    child.kill();
    fs.rmSync(DB_PATH, { force: true });
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
