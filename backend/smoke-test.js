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
const LOCAL_STORAGE_DIR = path.join(os.tmpdir(), `tucn-smoke-uploads-${process.pid}`);
const validPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n');
const validPng = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

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

async function request(method, route, jar, body, options = {}) {
  const headers = new Headers();
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (jar?.header()) headers.set('Cookie', jar.header());
  if (options.origin) headers.set('Origin', options.origin);

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

async function multipartRequest(route, jar, fields, files = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  for (const [field, file] of Object.entries(files)) {
    form.append(field, new Blob([file.buffer], { type: file.type }), file.name);
  }
  const headers = new Headers();
  if (jar?.header()) headers.set('Cookie', jar.header());
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
  const response = await fetch(`${BASE_URL}${route}`, {
    method: 'POST',
    headers,
    body: form,
  });
  jar?.store(response.headers);
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  return { response, json };
}

async function download(route, jar) {
  const headers = jar?.header() ? { Cookie: jar.header() } : undefined;
  const response = await fetch(`${BASE_URL}${route}`, { headers });
  const buffer = Buffer.from(await response.arrayBuffer());
  return { response, buffer };
}

async function rawJsonRequest(method, route, body, headers = {}) {
  const response = await fetch(`${BASE_URL}${route}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
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
      CORS_ORIGIN: 'http://localhost:3000,http://10.20.7.149:8080',
      NODE_ENV: 'production',
      COOKIE_SECURE: 'false',
      COOKIE_SAME_SITE: 'lax',
      STORAGE_PROVIDER: 'local',
      LOCAL_STORAGE_DIR,
      MAX_UPLOAD_MB: '1',
      PROFILE_IMAGE_MAX_MB: '1',
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
    const guest = new CookieJar();
    const otherStudent = new CookieJar();
    const professor = new CookieJar();
    const otherProfessor = new CookieJar();
    const pendingProfessor = new CookieJar();
    const allowedOrigin = 'http://10.20.7.149:8080';
    const unknownOrigin = 'https://evil.example';

    let preflight = await fetch(`${BASE_URL}/api/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: allowedOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,X-CSRF-Token',
      },
    });
    assert(preflight.status === 204, 'allowed login preflight should succeed', String(preflight.status));
    assert(preflight.headers.get('access-control-allow-origin') === allowedOrigin, 'preflight should echo allowed origin');
    assert(preflight.headers.get('access-control-allow-credentials') === 'true', 'preflight should allow credentials');
    assert((preflight.headers.get('access-control-allow-headers') || '').toLowerCase().includes('x-csrf-token'), 'preflight should allow X-CSRF-Token');

    preflight = await fetch(`${BASE_URL}/api/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://airi.example:8080',
        Host: 'api:4000',
        'X-Forwarded-Host': 'airi.example:8080',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,X-CSRF-Token',
      },
    });
    assert(preflight.status === 204, 'proxied same-host preflight should succeed', String(preflight.status));
    assert(preflight.headers.get('access-control-allow-origin') === 'http://airi.example:8080', 'proxied same-host preflight should echo origin');

    preflight = await fetch(`${BASE_URL}/api/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: unknownOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,X-CSRF-Token',
      },
    });
    assert(preflight.status === 403, 'unknown production origin should be rejected', String(preflight.status));

    let result = await rawJsonRequest('POST', '/api/login', {
      email: 'admin@example.com',
      password: adminPass,
      role: 'admin',
    }, { Origin: allowedOrigin });
    assert(result.response.status === 403 && /csrf/i.test(result.json.error || ''), 'login without CSRF should be rejected');

    const csrfProbe = new CookieJar();
    const csrfResponse = await fetch(`${BASE_URL}/api/csrf-token`, { headers: { Origin: allowedOrigin } });
    csrfProbe.store(csrfResponse.headers);
    const csrfJson = await csrfResponse.json();
    csrfProbe.csrfToken = csrfJson.csrfToken;
    assert(csrfResponse.status === 200 && csrfProbe.csrfToken, 'CSRF token endpoint should issue token');
    assert(csrfResponse.headers.get('access-control-allow-origin') === allowedOrigin, 'CSRF endpoint should include CORS origin');

    result = await request('POST', '/api/signup', student, {
      name: 'Smoke Student',
      email: 'student@example.com',
      password: 'studentpass123',
      role: 'student',
    });
    assert(result.response.status === 201, 'student signup should succeed', `${result.response.status} ${JSON.stringify(result.json)}`);

    result = await request('GET', '/api/me', student);
    assert(result.response.status === 200 && result.json.user.role === 'student', '/me should restore student');
    const studentId = result.json.user.id;

    result = await request('GET', '/api/profile', student);
    assert(result.response.status === 200 && result.json.profile.user.id === studentId, 'student can fetch own profile');

    result = await request('PATCH', '/api/profile', student, {
      name: 'Smoke Student Updated',
      department: 'Computer Science',
      linkedinUrl: 'https://www.linkedin.com/in/smoke-student',
    });
    assert(result.response.status === 200 && result.json.profile.linkedinUrl.includes('linkedin.com'), 'student can update profile');

    result = await request('PATCH', '/api/profile', student, {
      linkedinUrl: 'https://example.com/not-linkedin',
    });
    assert(result.response.status === 400, 'invalid LinkedIn URL should be rejected');

    result = await multipartRequest('/api/profile/documents', student, {}, {
      cv: { name: 'bad.txt', type: 'text/plain', buffer: Buffer.from('not a pdf') },
    });
    assert(result.response.status === 400, 'non-PDF profile document should be rejected');

    result = await multipartRequest('/api/profile/documents', student, {}, {
      cv: { name: 'large.pdf', type: 'application/pdf', buffer: Buffer.concat([Buffer.from('%PDF'), Buffer.alloc(1024 * 1024 + 1)]) },
    });
    assert(result.response.status === 400, 'oversized profile document should be rejected');

    result = await multipartRequest('/api/profile/documents', student, {}, {
      cv: { name: 'profile-cv.pdf', type: 'application/pdf', buffer: validPdf },
      transcript: { name: 'profile-transcript.pdf', type: 'application/pdf', buffer: validPdf },
    });
    assert(result.response.status === 201 && result.json.profile.cvFile && result.json.profile.transcriptFile, 'student can upload profile CV and transcript');

    result = await multipartRequest('/api/profile/avatar', student, {}, {
      avatar: { name: 'avatar.txt', type: 'text/plain', buffer: Buffer.from('bad') },
    });
    assert(result.response.status === 400, 'invalid avatar should be rejected');

    result = await multipartRequest('/api/profile/avatar', student, {}, {
      avatar: { name: 'avatar.png', type: 'image/png', buffer: validPng },
    });
    assert(result.response.status === 201 && result.json.profile.avatar, 'student can upload avatar image');

    let profileFileResult = await download('/api/profile/documents/cv', student);
    assert(profileFileResult.response.status === 200 && profileFileResult.buffer.subarray(0, 4).toString() === '%PDF', 'student can download own profile CV');

    await request('POST', '/api/signup', otherStudent, {
      name: 'Other Student',
      email: 'student2@example.com',
      password: 'studentpass123',
      role: 'student',
    });

    profileFileResult = await download('/api/profile/documents/cv', otherStudent);
    assert(profileFileResult.response.status !== 200, 'other user cannot download student profile CV');

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
    }, { origin: allowedOrigin });
    assert(result.response.status === 200, 'admin login should succeed');
    assert(result.response.headers.get('access-control-allow-origin') === allowedOrigin, 'login should include allowed CORS origin');
    assert(result.response.headers.get('access-control-allow-credentials') === 'true', 'login should allow credentials');
    assert((result.response.headers.get('set-cookie') || '').includes('tucn_auth='), 'login should set auth cookie');

    result = await request('GET', '/api/me', admin, undefined, { origin: allowedOrigin });
    assert(result.response.status === 200 && result.json.user.role === 'admin', '/me should work with login cookie and CORS origin');

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

    result = await request('GET', `/api/opportunities/${opportunityId}`, guest);
    assert(result.response.status === 200 && result.json.opportunity.id === String(opportunityId), 'public opportunity detail should work');

    result = await request('GET', '/api/opportunities/99999999', guest);
    assert(result.response.status === 404, 'unknown opportunity detail should return 404');

    result = await request('POST', `/api/profile/saved-opportunities/${opportunityId}`, guest);
    assert(result.response.status === 401, 'unauthenticated user cannot save opportunity');

    result = await request('POST', `/api/profile/saved-opportunities/${opportunityId}`, student);
    assert(result.response.status === 201 && result.json.saved === true, 'student can save opportunity');

    result = await request('POST', `/api/profile/saved-opportunities/${opportunityId}`, student);
    assert(result.response.status === 201 && result.json.saved === true, 'saving opportunity should be idempotent');

    result = await request('GET', '/api/profile/saved-opportunities', student);
    assert(
      result.response.status === 200 && result.json.savedOpportunities.some(item => item.opportunity.id === String(opportunityId)),
      'student can list own saved opportunities'
    );

    result = await request('GET', '/api/profile/saved-opportunities', otherStudent);
    assert(
      result.response.status === 200 && !result.json.savedOpportunities.some(item => item.opportunity.id === String(opportunityId)),
      'users cannot see another user saved opportunities'
    );

    result = await request('DELETE', `/api/profile/saved-opportunities/${opportunityId}`, student);
    assert(result.response.status === 200 && result.json.saved === false, 'student can unsave opportunity');

    result = await request('DELETE', `/api/profile/saved-opportunities/${opportunityId}`, student);
    assert(result.response.status === 200 && result.json.saved === false, 'unsaving opportunity should be idempotent');

    result = await request('POST', '/api/opportunities', professor, {
      title: 'Smoke Opportunity With CV',
      description: 'Short description',
      abstract: 'Research abstract',
      duration: '1 month',
      stipend: 'None',
      tags: ['AI'],
      applicationFields: [],
      requireCv: true,
    });
    assert(result.response.status === 201, 'professor should create opportunity requiring CV');
    const requiredCvOpportunityId = result.json.id;

    result = await request('POST', '/api/opportunities', professor, {
      title: 'Smoke Opportunity With Alternate CV',
      description: 'Short description',
      abstract: 'Research abstract',
      duration: '1 month',
      stipend: 'None',
      tags: ['AI'],
      applicationFields: [],
      requireCv: true,
    });
    assert(result.response.status === 201, 'professor should create second CV opportunity');
    const uploadedCvOpportunityId = result.json.id;

    result = await multipartRequest('/api/applications', student, {
      opportunityId,
      studentId: '999',
      studentName: 'Imposter',
      message: 'Please consider me',
      answers: '[]',
    });
    assert(result.response.status === 400, 'student-sent identity fields should be rejected');

    result = await multipartRequest('/api/applications', student, {
      opportunityId,
      message: 'Please consider me',
      answers: '[]',
    });
    assert(result.response.status === 201, 'student should apply');
    const applicationId = result.json.id;

    result = await multipartRequest('/api/applications', student, {
      opportunityId: requiredCvOpportunityId,
      message: 'Missing CV',
      answers: '[]',
    });
    assert(result.response.status === 400, 'missing required CV should be rejected');

    result = await multipartRequest('/api/applications', student, {
      opportunityId: requiredCvOpportunityId,
      message: 'Bad CV',
      answers: '[]',
    }, {
      cv: { name: 'bad.txt', type: 'text/plain', buffer: Buffer.from('not a pdf') },
    });
    assert(result.response.status === 400, 'non-PDF upload should be rejected');

    result = await multipartRequest('/api/applications', student, {
      opportunityId: requiredCvOpportunityId,
      message: 'Large CV',
      answers: '[]',
    }, {
      cv: { name: 'large.pdf', type: 'application/pdf', buffer: Buffer.concat([Buffer.from('%PDF'), Buffer.alloc(1024 * 1024 + 1)]) },
    });
    assert(result.response.status === 400, 'oversized upload should be rejected');

    result = await multipartRequest('/api/applications', student, {
      opportunityId: requiredCvOpportunityId,
      message: 'Please consider my saved profile CV',
      answers: JSON.stringify([]),
      useProfileCv: 'true',
    });
    assert(result.response.status === 201, 'student should apply with profile CV');
    const profileFileApplicationId = result.json.id;

    result = await multipartRequest('/api/applications', student, {
      opportunityId: uploadedCvOpportunityId,
      message: 'Please consider my uploaded PDF',
      answers: JSON.stringify([]),
      saveUploadedCvToProfile: 'true',
    }, {
      cv: { name: 'cv.pdf', type: 'application/pdf', buffer: validPdf },
    });
    assert(result.response.status === 201, 'student should apply with uploaded CV and save it to profile');
    const fileApplicationId = result.json.id;

    result = await request('GET', '/api/applications', student);
    assert(result.response.status === 200, 'student should list own applications');
    assert(result.json.applications[0].studentId === studentId && result.json.applications[0].studentName === 'Smoke Student Updated', 'application should use authenticated student identity');
    assert(result.json.applications.some(app => app.id === profileFileApplicationId && app.cvFile && !app.cvFile.dataUrl), 'profile CV application should return file metadata without base64 data');
    assert(result.json.applications.some(app => app.id === fileApplicationId && app.cvFile && !app.cvFile.dataUrl), 'new application should return file metadata without base64 data');

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

    let fileResult = await download(`/api/applications/${fileApplicationId}/files/cv`, student);
    assert(fileResult.response.status === 200 && fileResult.buffer.subarray(0, 4).toString() === '%PDF', 'student can download own file');

    fileResult = await download(`/api/applications/${fileApplicationId}/files/cv`, otherStudent);
    assert(fileResult.response.status === 403, 'student cannot download another student file');

    fileResult = await download(`/api/applications/${fileApplicationId}/files/cv`, professor);
    assert(fileResult.response.status === 200, 'owner professor can download file');

    fileResult = await download(`/api/applications/${fileApplicationId}/files/cv`, otherProfessor);
    assert(fileResult.response.status === 403, 'non-owner professor cannot download file');

    fileResult = await download(`/api/applications/${fileApplicationId}/files/cv`, admin);
    assert(fileResult.response.status === 200, 'admin can download file');

    fileResult = await download(`/api/applications/${fileApplicationId}/files/cv`);
    assert(fileResult.response.status === 401, 'unauthenticated download should be rejected');

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
    await request('DELETE', `/api/opportunities/${requiredCvOpportunityId}`, admin);
    await request('DELETE', `/api/opportunities/${uploadedCvOpportunityId}`, admin);
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
    fs.rmSync(LOCAL_STORAGE_DIR, { recursive: true, force: true });
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
