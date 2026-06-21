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

async function waitForProfileMigration() {
  for (let i = 0; i < 40; i += 1) {
    const profileColumns = await allSql('PRAGMA table_info(user_profiles)');
    const profileColumnNames = new Set(profileColumns.map(column => column.name));
    if (
      profileColumnNames.has('created_at') &&
      profileColumnNames.has('updated_at') &&
      profileColumnNames.has('cv_file_key')
    ) {
      return profileColumnNames;
    }
    await wait(100);
  }
  throw new Error('user_profiles runtime migration did not complete');
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

function allSql(sql, params = []) {
  const db = new sqlite3.Database(DB_PATH);
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows);
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
  await runSql('CREATE TABLE user_profiles (user_id TEXT PRIMARY KEY, linkedin_url TEXT)');

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

    const profileColumnNames = await waitForProfileMigration();
    assert(profileColumnNames.has('created_at'), 'runtime migration should add user_profiles.created_at');
    assert(profileColumnNames.has('updated_at'), 'runtime migration should add user_profiles.updated_at');
    assert(profileColumnNames.has('cv_file_key'), 'runtime migration should add profile document columns');

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

    // Public listing is open to guests and surfaces approved-professor posts.
    result = await request('GET', '/api/opportunities', guest);
    assert(result.response.status === 200, 'public opportunities listing should be accessible without auth');
    assert(
      result.json.opportunities.some(o => o.id === String(opportunityId)),
      'approved professor opportunity should appear in public listing'
    );
    assert(
      result.json.opportunities.every(o => o.author && o.author.id && o.author.name),
      'public listing opportunities should include author identity'
    );

    // An unapproved professor's opportunities must disappear from public views.
    await runSql("UPDATE users SET approved = 0 WHERE email = 'pending@example.com'");
    result = await request('GET', '/api/opportunities', guest);
    assert(
      !result.json.opportunities.some(o => o.id === String(opportunityId)),
      'unapproved professor opportunity should be hidden from public listing'
    );
    result = await request('GET', `/api/opportunities/${opportunityId}`, guest);
    assert(result.response.status === 404, 'unapproved professor opportunity detail should return 404');
    await runSql("UPDATE users SET approved = 1 WHERE email = 'pending@example.com'");

    // Orphaned/demo rows whose author_id matches no approved professor stay hidden.
    await runSql(
      "INSERT INTO opportunities (title,description,abstract,duration,stipend,author_id,author_name) VALUES ('Orphan Demo Opportunity','x','x','1 month','None','99999','Ghost Professor')"
    );
    result = await request('GET', '/api/opportunities', guest);
    assert(
      !result.json.opportunities.some(o => o.title === 'Orphan Demo Opportunity'),
      'orphaned opportunity should be hidden from public listing'
    );

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

    result = await request('GET', '/api/profile/my-opportunities', guest);
    assert(result.response.status === 401, 'unauthenticated my-opportunities should be rejected');

    result = await request('GET', '/api/profile/my-opportunities', student);
    assert(
      result.response.status === 200 && result.json.saved.some(item => item.opportunity.id === String(opportunityId)),
      'saved opportunity should appear in my-opportunities.saved'
    );

    result = await request('DELETE', `/api/profile/saved-opportunities/${opportunityId}`, student);
    assert(result.response.status === 200 && result.json.saved === false, 'student can unsave opportunity');

    result = await request('DELETE', `/api/profile/saved-opportunities/${opportunityId}`, student);
    assert(result.response.status === 200 && result.json.saved === false, 'unsaving opportunity should be idempotent');

    await request('POST', `/api/profile/saved-opportunities/${opportunityId}`, student);

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

    result = await request('GET', '/api/profile/my-opportunities', student);
    assert(
      result.response.status === 200 &&
        !result.json.saved.some(item => item.opportunity.id === String(opportunityId)) &&
        result.json.applied.some(item => item.application.id === String(applicationId)),
      'applied saved opportunity should move from saved to applied'
    );

    result = await request('POST', `/api/profile/saved-opportunities/${opportunityId}`, student);
    assert(
      result.response.status === 200 && result.json.alreadyApplied === true && result.json.saved === false,
      'already applied opportunity should not be saved'
    );

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

    result = await request('GET', '/api/profile/my-opportunities', student);
    assert(
      result.response.status === 200 &&
        result.json.accepted.some(item => item.application.id === String(applicationId)) &&
        !result.json.applied.some(item => item.application.id === String(applicationId)),
      'accepted application should move from applied to accepted'
    );

    result = await request('PATCH', `/api/applications/${profileFileApplicationId}`, professor, {
      status: 'rejected',
      professorReply: 'Not this time',
    });
    assert(result.response.status === 200, 'owner professor can reject another application');

    result = await request('GET', '/api/profile/my-opportunities', student);
    assert(
      result.response.status === 200 && result.json.rejected.some(item => item.application.id === String(profileFileApplicationId)),
      'rejected application should appear in rejected'
    );

    // ── Q&A: student questions and professor replies ──────────────────
    result = await request('POST', `/api/opportunities/${opportunityId}/questions`, guest, { questionText: 'Anonymous question?' });
    assert(result.response.status === 401, 'unauthenticated cannot ask a question');

    result = await request('POST', `/api/opportunities/${opportunityId}/questions`, professor, { questionText: 'Professor question?' });
    assert(result.response.status === 403, 'professor cannot ask a question as a student');

    result = await request('POST', `/api/opportunities/${opportunityId}/questions`, student, { questionText: '   ' });
    assert(result.response.status === 400, 'empty question is rejected');

    result = await request('POST', `/api/opportunities/${opportunityId}/questions`, student, { questionText: 'Is prior PyTorch experience required?' });
    assert(result.response.status === 201 && result.json.question.status === 'open', 'student can ask a private question');
    const privateQuestionId = result.json.question.id;

    result = await request('POST', `/api/opportunities/${opportunityId}/questions`, otherStudent, { questionText: 'What is the weekly time commitment?', isPublic: true });
    assert(result.response.status === 201, 'student can ask a public question');
    const publicQuestionId = result.json.question.id;

    // Before any answer, guests see no questions (nothing answered+public yet).
    result = await request('GET', `/api/opportunities/${opportunityId}/questions`, guest);
    assert(
      result.response.status === 200 &&
        !result.json.questions.some(q => q.id === String(privateQuestionId)) &&
        !result.json.questions.some(q => q.id === String(publicQuestionId)),
      'guest does not see unanswered or private questions'
    );

    // A student cannot see another student's private question.
    result = await request('GET', `/api/opportunities/${opportunityId}/questions`, otherStudent);
    assert(
      result.response.status === 200 &&
        result.json.questions.some(q => q.id === String(publicQuestionId)) &&
        !result.json.questions.some(q => q.id === String(privateQuestionId)),
      'student sees own question but not another student private question'
    );

    // The owning professor sees every question, with student names.
    result = await request('GET', `/api/opportunities/${opportunityId}/questions`, professor);
    assert(
      result.response.status === 200 &&
        result.json.questions.some(q => q.id === String(privateQuestionId) && q.studentName) &&
        result.json.questions.some(q => q.id === String(publicQuestionId)),
      'owning professor sees all questions with names'
    );

    // A non-owning professor cannot see private/unanswered questions.
    result = await request('GET', `/api/opportunities/${opportunityId}/questions`, otherProfessor);
    assert(
      result.response.status === 200 && !result.json.questions.some(q => q.id === String(privateQuestionId)),
      'non-owning professor does not see private question'
    );

    // Professor dashboard question list is scoped to owned opportunities.
    result = await request('GET', '/api/professor/questions', professor);
    assert(
      result.response.status === 200 && result.json.questions.some(q => q.id === String(publicQuestionId) && q.opportunityTitle),
      'owning professor lists own opportunity questions'
    );
    result = await request('GET', '/api/professor/questions', otherProfessor);
    assert(
      result.response.status === 200 && !result.json.questions.some(q => q.id === String(publicQuestionId)),
      'non-owning professor does not list another professor questions'
    );

    // Answering authorization.
    result = await request('PATCH', `/api/opportunity-questions/${publicQuestionId}/answer`, otherProfessor, { answerText: 'Hijacked answer' });
    assert(result.response.status === 403, 'non-owning professor cannot answer the question');

    result = await request('PATCH', `/api/opportunity-questions/${publicQuestionId}/answer`, professor, { answerText: '' });
    assert(result.response.status === 400, 'empty answer is rejected');

    result = await request('PATCH', `/api/opportunity-questions/${publicQuestionId}/answer`, guest, { answerText: 'No auth' });
    assert(result.response.status === 401, 'unauthenticated cannot answer a question');

    result = await request('PATCH', `/api/opportunity-questions/${publicQuestionId}/answer`, professor, { answerText: 'About 10 hours per week.' });
    assert(result.response.status === 200 && result.json.question.status === 'answered', 'owning professor can answer the question');

    // Answer the private question too, to verify privacy holds after answering.
    await request('PATCH', `/api/opportunity-questions/${privateQuestionId}/answer`, professor, { answerText: 'Yes, basic PyTorch is expected.' });

    // The answered public question now appears publicly, anonymized.
    result = await request('GET', `/api/opportunities/${opportunityId}/questions`, guest);
    const publicSeen = result.json.questions.find(q => q.id === String(publicQuestionId));
    assert(publicSeen && publicSeen.answerText && publicSeen.studentName === null, 'answered public question is shown anonymously');
    assert(!result.json.questions.some(q => q.id === String(privateQuestionId)), 'answered private question stays hidden from the public');

    // The asking student sees their own answer.
    result = await request('GET', `/api/opportunities/${opportunityId}/questions`, otherStudent);
    assert(
      result.json.questions.some(q => q.id === String(publicQuestionId) && q.answerText),
      'student sees the answer to their own question'
    );

    // ── Professor public profiles ─────────────────────────────────────
    result = await request('GET', '/api/me', professor);
    const professorId = result.json.user.id;

    result = await request('PATCH', '/api/profile', professor, {
      bio: 'I research applied machine learning.',
      websiteUrl: 'https://example.com/lab',
      labName: 'Applied ML Lab',
      researchInterests: ['Machine Learning', 'Computer Vision'],
    });
    assert(result.response.status === 200 && result.json.profile.labName === 'Applied ML Lab', 'professor can edit own public profile');

    result = await request('GET', '/api/professors', guest);
    assert(result.response.status === 200 && result.json.professors.some(p => p.id === String(professorId)), 'approved professor appears in public directory');

    result = await request('GET', `/api/professors/${professorId}`, guest);
    assert(
      result.response.status === 200 &&
        result.json.professor.bio === 'I research applied machine learning.' &&
        result.json.professor.researchInterests.includes('Machine Learning') &&
        Array.isArray(result.json.professor.opportunities),
      'approved professor public profile shows details and opportunities'
    );

    const stillPending = new CookieJar();
    result = await request('POST', '/api/signup', stillPending, {
      name: 'Still Pending', email: 'stillpending@example.com', password: 'profpass123', role: 'professor', department: 'CS',
    });
    const stillPendingId = result.json.user.id;
    result = await request('GET', `/api/professors/${stillPendingId}`, guest);
    assert(result.response.status === 404, 'pending professor has no public profile');
    result = await request('GET', '/api/professors', guest);
    assert(!result.json.professors.some(p => p.id === String(stillPendingId)), 'pending professor is not listed publicly');

    // ── Recommendations ───────────────────────────────────────────────
    result = await request('POST', '/api/opportunities', professor, {
      title: 'Quantum Recommendation Target', description: 'Quantum research work', abstract: 'Quantum abstract',
      duration: '3 months', stipend: 'None', tags: ['QUANTUMX'], applicationFields: [],
    });
    assert(result.response.status === 201, 'professor creates a recommendation-target opportunity');
    const recTargetId = result.json.id;

    result = await request('PATCH', '/api/profile', student, {
      researchInterests: ['Quantum Computing'], skills: ['Python'], preferredTags: ['QUANTUMX'],
    });
    assert(result.response.status === 200 && result.json.profile.preferredTags.includes('QUANTUMX'), 'student can update interests/skills');

    result = await request('GET', '/api/recommendations/opportunities', student);
    assert(result.response.status === 200 && Array.isArray(result.json.recommendations), 'recommendations endpoint returns a list');
    const recTarget = result.json.recommendations.find(r => r.opportunity.id === String(recTargetId));
    assert(recTarget && recTarget.reasons.length > 0, 'recommendations include a relevant opportunity with reason labels');
    assert(!result.json.recommendations.some(r => r.opportunity.id === String(opportunityId)), 'recommendations exclude already applied opportunities');

    result = await request('GET', '/api/recommendations/opportunities', guest);
    assert(result.response.status === 401, 'recommendations require authentication');
    result = await request('GET', '/api/recommendations/opportunities', professor);
    assert(result.response.status === 403, 'recommendations are student-only');

    // ── Notifications ─────────────────────────────────────────────────
    result = await request('GET', '/api/notifications', professor);
    assert(result.response.status === 200 && result.json.notifications.some(n => n.type === 'question'), 'professor notified of a new question');
    assert(result.json.notifications.some(n => n.type === 'application'), 'professor notified of a new application');
    const profNotifId = result.json.notifications[0].id;

    result = await request('GET', '/api/notifications', student);
    assert(result.response.status === 200 && result.json.notifications.some(n => n.type === 'answer'), 'student notified of an answer');
    assert(result.json.notifications.some(n => n.type === 'application_accepted'), 'student notified of acceptance');
    const studentNotifId = result.json.notifications[0].id;

    result = await request('PATCH', `/api/notifications/${profNotifId}/read`, student);
    assert(result.response.status === 403, 'student cannot mark another user notification as read');

    result = await request('PATCH', `/api/notifications/${studentNotifId}/read`, student);
    assert(result.response.status === 200, 'student can mark own notification read');

    result = await request('PATCH', '/api/notifications/read-all', student);
    assert(result.response.status === 200, 'student can mark all notifications read');
    result = await request('GET', '/api/notifications', student);
    assert(result.json.unreadCount === 0, 'unread count is zero after mark all read');

    // ── Professor review workspace ─────────────────────────────────────
    result = await request('GET', '/api/professor/applications', professor);
    assert(result.response.status === 200 && result.json.applications.some(a => a.id === String(applicationId)), 'professor lists applications for own opportunities');
    const reviewApp = result.json.applications.find(a => a.id === String(applicationId));
    assert(reviewApp && reviewApp.studentEmail && Array.isArray(reviewApp.answers), 'review application includes student email and answers');

    result = await request('GET', '/api/professor/applications', otherProfessor);
    assert(result.response.status === 200 && !result.json.applications.some(a => a.id === String(applicationId)), 'professor cannot list another professor applications');

    await runSql("UPDATE users SET approved = 0 WHERE email = 'pending@example.com'");
    result = await request('GET', '/api/professor/applications', professor);
    assert(result.response.status === 403, 'unapproved professor cannot access review workspace');
    await runSql("UPDATE users SET approved = 1 WHERE email = 'pending@example.com'");

    // Notes/score update must NOT notify the student.
    result = await request('PATCH', `/api/professor/applications/${applicationId}/review`, professor, { score: 4, professorNotes: 'Strong candidate' });
    assert(result.response.status === 200 && result.json.application.score === 4 && result.json.application.professorNotes === 'Strong candidate', 'professor can set score and notes');

    result = await request('GET', '/api/notifications', student);
    assert(!result.json.notifications.some(n => n.type === 'application_under_review' || n.type === 'application_shortlisted'), 'notes/score changes do not notify the student');

    // Status change must notify the student.
    result = await request('PATCH', `/api/professor/applications/${applicationId}/review`, professor, { status: 'shortlisted' });
    assert(result.response.status === 200 && result.json.application.status === 'shortlisted', 'professor can change application status');

    result = await request('GET', '/api/notifications', student);
    assert(result.json.notifications.some(n => n.type === 'application_shortlisted'), 'status change creates a notification');

    result = await request('PATCH', `/api/professor/applications/${applicationId}/review`, otherProfessor, { status: 'rejected' });
    assert(result.response.status === 403, 'non-owning professor cannot review an application');

    // Students never see professor notes.
    result = await request('GET', '/api/applications', student);
    assert(!JSON.stringify(result.json).includes('Strong candidate'), 'students cannot see professor notes');

    // CSV export works and never leaks file URLs.
    const csvExport = await download('/api/professor/applications/export', professor);
    assert(csvExport.response.status === 200 && (csvExport.response.headers.get('content-type') || '').includes('text/csv'), 'CSV export returns a CSV file');
    const csvText = csvExport.buffer.toString('utf8');
    assert(csvText.includes('Opportunity,Student Name') && csvText.includes('Strong candidate'), 'CSV includes expected columns and notes');
    assert(!csvText.includes('/api/applications') && !csvText.includes('file_key') && !csvText.includes('downloadUrl'), 'CSV export does not expose file URLs');

    // ── Grouped review + interview scheduling ─────────────────────────
    result = await request('GET', '/api/professor/applications/grouped', professor);
    assert(result.response.status === 200 && result.json.opportunities.some(o => o.id === String(opportunityId)), 'professor gets applications grouped by own opportunities');
    const grouped = result.json.opportunities.find(o => o.id === String(opportunityId));
    assert(grouped && grouped.stats && grouped.applications.some(a => a.id === String(applicationId)), 'grouped opportunity includes its applications and stats');

    result = await request('GET', '/api/professor/applications/grouped', otherProfessor);
    assert(result.response.status === 200 && !result.json.opportunities.some(o => o.id === String(opportunityId)), 'professor cannot see another professor grouped applications');

    const slotStart = new Date(Date.now() + 2 * 86400000).toISOString();
    const slotEnd = new Date(Date.now() + 2 * 86400000 + 60 * 60000).toISOString();
    result = await request('POST', `/api/professor/opportunities/${opportunityId}/interview-slots`, professor, { startTime: slotStart, endTime: slotEnd, capacity: 1, location: 'Room 101' });
    assert(result.response.status === 201, 'professor creates an availability slot');
    const slotId = result.json.slot.id;

    result = await request('POST', `/api/professor/opportunities/${opportunityId}/interview-slots`, otherProfessor, { startTime: slotStart, endTime: slotEnd });
    assert(result.response.status === 404, 'professor cannot create a slot for another professor opportunity');

    // applicationId is shortlisted from the earlier review tests.
    result = await request('POST', `/api/professor/applications/${applicationId}/interview-invite`, professor, {});
    assert(result.response.status === 201 && result.json.interview.status === 'invited', 'professor invites a shortlisted applicant to interview');
    const interviewId = result.json.interview.id;

    result = await request('GET', '/api/student/interviews', student);
    assert(result.response.status === 200 && result.json.interviews.some(i => i.id === String(interviewId) && i.status === 'invited'), 'student sees the interview invite');

    result = await request('GET', `/api/opportunities/${opportunityId}/interview-slots`, student);
    assert(result.response.status === 200 && result.json.slots.some(s => s.id === String(slotId)), 'invited student sees available slots');

    result = await request('GET', `/api/opportunities/${opportunityId}/interview-slots`, otherStudent);
    assert(result.response.status === 403, 'student without an invite cannot view interview slots');

    result = await request('POST', `/api/student/interviews/${interviewId}/schedule`, student, { slotId });
    assert(result.response.status === 200 && result.json.interview.status === 'scheduled', 'student schedules an interview slot');

    const ics = await download(`/api/interviews/${interviewId}/calendar.ics`, student);
    assert(ics.response.status === 200 && (ics.response.headers.get('content-type') || '').includes('text/calendar'), 'calendar ICS endpoint works');
    const icsText = ics.buffer.toString('utf8');
    assert(icsText.includes('BEGIN:VCALENDAR') && icsText.includes('VEVENT'), 'ICS contains a calendar event');

    // Double-booking prevention (capacity 1): a second invited student cannot take the same slot.
    result = await multipartRequest('/api/applications', otherStudent, { opportunityId, message: 'Please consider me too', answers: '[]' });
    assert(result.response.status === 201, 'second student applies to the opportunity');
    const otherApplicationId = result.json.id;
    await request('PATCH', `/api/professor/applications/${otherApplicationId}/review`, professor, { status: 'shortlisted' });
    result = await request('POST', `/api/professor/applications/${otherApplicationId}/interview-invite`, professor, {});
    const otherInterviewId = result.json.interview.id;
    result = await request('GET', `/api/opportunities/${opportunityId}/interview-slots`, otherStudent);
    assert(!result.json.slots.some(s => s.id === String(slotId)), 'a fully booked slot is hidden from other students');
    result = await request('POST', `/api/student/interviews/${otherInterviewId}/schedule`, otherStudent, { slotId });
    assert(result.response.status === 409, 'double-booking is prevented when capacity is 1');

    // Professor sees the scheduled interview and can complete it with private feedback.
    result = await request('GET', '/api/professor/applications/grouped', professor);
    const groupedAfter = result.json.opportunities.find(o => o.id === String(opportunityId));
    assert(groupedAfter.stats.interviews_scheduled >= 1, 'professor sees scheduled interview count');

    result = await request('PATCH', `/api/professor/interviews/${interviewId}`, professor, { status: 'completed', professorFeedback: 'Excellent interview performance' });
    assert(result.response.status === 200 && result.json.interview.status === 'completed', 'professor marks interview completed with feedback');

    result = await request('PATCH', `/api/professor/interviews/${interviewId}`, otherProfessor, { status: 'cancelled' });
    assert(result.response.status === 403, 'non-owning professor cannot modify the interview');

    result = await request('GET', '/api/student/interviews', student);
    assert(!JSON.stringify(result.json).includes('Excellent interview performance'), 'student cannot see professor interview feedback');

    const guestInterviews = await rawJsonRequest('GET', '/api/student/interviews');
    assert(guestInterviews.response.status === 401, 'unauthenticated users cannot access interviews');

    result = await request('GET', '/api/notifications', student);
    assert(result.json.notifications.some(n => n.type === 'interview_invited'), 'student notified of interview invite');
    result = await request('GET', '/api/notifications', professor);
    assert(result.json.notifications.some(n => n.type === 'interview_scheduled'), 'professor notified when interview is scheduled');

    await request('DELETE', `/api/opportunities/${recTargetId}`, admin);
    await request('DELETE', '/api/admin/users/stillpending@example.com', admin);

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
