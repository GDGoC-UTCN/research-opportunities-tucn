# AIRi@UTCN Research Opportunities

React/Vite/TypeScript frontend plus an Express + SQLite backend for AIRi@UTCN research opportunities. Anyone can browse public opportunities, authenticated students apply to professor-posted projects and ask questions before applying, professors manage their own opportunities and applicants and answer questions, and admins approve professor accounts and manage platform data. The app ships with informational pages (How It Works, For Professors, FAQs) and a monochrome, editorial AIRi@UTCN interface.

This is a production-oriented application backed by a real API, server-side RBAC/CSRF, SQLite persistence, and S3-compatible object storage — not a mock or `localStorage` demo.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Backend | Express, SQLite, bcryptjs |
| Object storage | S3-compatible storage, MinIO in local Docker |
| Auth | JWT in `HttpOnly` cookie, restored with `/api/me` |
| CSRF | Signed double-submit token from `/api/csrf-token` |
| Authorization | Server-side RBAC plus ownership checks |
| Deployment | Docker Compose, nginx frontend proxy, persistent SQLite volume |

The frontend never stores JWTs, passwords, password hashes, roles, approval flags, or user sessions in `localStorage`.

The main product identity is AIRi@UTCN Research Opportunities. The Technical University of Cluj-Napoca remains the institutional context.

## Public Browsing

The opportunities dashboard is public:

- `/` and `/opportunities` show the opportunity list without requiring an account.
- Each opportunity has a public dedicated URL at `/opportunities/:id`.
- Opportunity details are readable without signing in and can be opened directly or after browser refresh.
- Opportunity cards and detail pages include a Share action. It uses the Web Share API when available, otherwise it copies the dedicated opportunity link.
- Applying redirects unauthenticated users to sign in or sign up, then returns student users to the selected opportunity.
- `POST /api/applications` remains student-only and uses the authenticated `req.user.id`; client-sent student identity is ignored.
- Professor, admin, application-management, file-download, and create-opportunity flows remain protected by backend RBAC.

## Profile Customization

Authenticated users can manage a profile with:

- editable display name, department, and LinkedIn URL;
- protected profile avatar stored in object storage;
- protected default CV and transcript PDFs stored in object storage;
- saved profile documents that students can attach to applications without re-uploading;
- per-application PDF uploads that can optionally be saved back to the student's profile.

Profile storage uses the `user_profiles` table. SQLite stores only safe metadata and object keys. Object storage remains private, and downloads go through authenticated backend endpoints.

Saved opportunities use the `saved_opportunities` table. Students manage saved and submitted opportunities from the My Opportunities page, not the profile editor.

## My Opportunities

Students have a dedicated My Opportunities page with four exclusive sections:

- Saved: opportunities the student saved but has not applied to.
- Applied: submitted applications with `pending` status.
- Accepted: applications accepted by the professor.
- Rejected: applications rejected by the professor.

An opportunity appears in only one section at a time. Application status wins over saved state. When a student applies to a saved opportunity, the backend removes the saved row after the application is created, and the item moves from Saved to Applied. If a student tries to save an opportunity they already applied to, the save endpoint returns `alreadyApplied` status and the UI shows Applied, Accepted, or Rejected instead of Save.

## Student Questions & Professor Replies (Q&A)

Students can ask questions about an opportunity before applying, and the owning professor can reply. Data lives in the `opportunity_questions` table (`question_text`, `answer_text`, `status` open/answered, `is_public`, timestamps).

Behavior:

- **Students** see an "Ask a question before applying" form on each opportunity detail page. Questions are validated (non-empty, max 1000 characters) and created with the authenticated `req.user.id` — the client-sent identity is never trusted. New questions show as "Waiting for reply".
- **Professors** see a Questions panel on their dashboard listing questions for opportunities they own (open ones first), with a reply box. They can reply (max 2000 characters) and edit a reply later. Answers are validated and stamped with `answered_at`.
- **Students** see replies on the opportunity detail page for their own questions, marked "Answered" with the answer date.
- A best-effort in-app notification is created for the professor when a question is asked and for the student when it is answered.

Privacy model:

- Questions are **private by default** — visible only to the asking student, the owning professor, and admins.
- When asking, a student may tick *"Allow this question to be shown anonymously to other students if answered."* If checked and once answered, the Q&A appears publicly on the opportunity detail page **without the student's name**.
- Private questions are never exposed to other students or non-owning professors. Public answered questions are always anonymized for everyone except the asker, the owning professor, and admins.

## PDF Upload Storage

New CV/transcript uploads use `multipart/form-data`. PDFs are validated on the backend and stored in object storage; SQLite stores only metadata and opaque storage keys.

Storage behavior:

- Production uses S3-compatible storage via `STORAGE_PROVIDER=s3`.
- Local Docker uses MinIO at `http://minio:9000`; the console is exposed at [http://localhost:9001](http://localhost:9001).
- Backend tests use `STORAGE_PROVIDER=local` with a temporary filesystem directory.
- Object keys are random and scoped by application ID, for example `applications/<applicationId>/<uuid>-cv.pdf`.
- Profile object keys are scoped by user ID, for example `profiles/<userId>/cv/<uuid>.pdf`.
- S3/MinIO credentials are backend-only and never exposed to the frontend.
- Buckets must remain private; downloads go through backend authorization.

Legacy rows that still contain old base64 JSON in `cv_file` or `transcript_file` remain readable for backward compatibility. New uploads do not store base64 data in SQLite.

## Auth, Cookies, And CSRF

Login calls `POST /api/login` with email, password, and the selected role. The backend verifies the password, rejects role mismatches before issuing a cookie, rejects unapproved professors, signs a JWT with `JWT_SECRET`, and sets it in an `HttpOnly` cookie.

Cookie behavior:

- `httpOnly: true`
- `sameSite: "lax"` by default; set `COOKIE_SAME_SITE=strict` or `COOKIE_SAME_SITE=none` only when needed
- `secure` is controlled by `COOKIE_SECURE`; use `false` for HTTP/IP testing and `true` behind HTTPS
- optional `COOKIE_DOMAIN` can scope cookies for a parent domain; leave it empty for host-only cookies
- default expiration: 7 days

Session restore calls `GET /api/me`. Logout calls `POST /api/logout` and clears the auth cookie.

CSRF behavior:

- `GET /api/csrf-token` issues a signed token in JSON and a readable same-site cookie.
- All `POST`, `PATCH`, and `DELETE` requests must send `X-CSRF-Token`.
- `GET`, `HEAD`, `OPTIONS`, and health checks do not require CSRF.
- The frontend `apiFetch` helper fetches and sends the token automatically.
- Login, signup, and logout use the same CSRF flow as other state-changing requests.

Credentialed CORS uses an allowlist from `CORS_ORIGIN`. Multiple origins are comma-separated. Requests proxied through the frontend Nginx `/api` path are also allowed when `Origin` matches the forwarded public host. Unknown cross-site origins are rejected; requests with no `Origin` header are allowed for server-to-server checks.

## Backend Middleware

- `requireAuth`: verifies JWT from the auth cookie or `Authorization: Bearer ...`, then loads the current user from SQLite. Deleted users, changed roles, and changed approval status are respected immediately.
- `requireRole(...roles)`: rejects authenticated users with the wrong role.
- `requireApprovedProfessor`: requires a current approved professor account.
- `requireCsrf`: validates signed CSRF token for state-changing routes.

Passwords and password hashes are never returned by the API.

## Backend Architecture

- **Express API** (`backend/index.js`) mounts feature routers under both `/` and `/api`, with `helmet`, credentialed CORS, `cookie-parser`, JSON/body limits, and the CSRF guard.
- **Routes** (`backend/routes/`): `auth` (signup/login/logout/me), `admin` (approvals, user management), `opportunities` (public listing/detail, create/edit/delete), `applications` (apply, status updates, protected file downloads), `profile` (profile, avatar, documents, saved opportunities, my-opportunities), `notifications`, and `questions` (Q&A).
- **Persistence** (`backend/db.js`): SQLite accessed through small promisified `run`/`get`/`all` helpers. `initDb()` creates every table with `CREATE TABLE IF NOT EXISTS` on boot and runs **idempotent runtime schema repair** (`ensureApplicationFileColumns`, `ensureUserProfileColumns`, `ensureOpportunityColumns`, `ensureOpportunityQuestionColumns`) that `ALTER TABLE ... ADD COLUMN` only when a column is missing. Schema changes are additive and never reset or drop data.
- **Storage service** (`backend/services/storage.js`): an S3-compatible client for production/MinIO plus a local-filesystem provider used by tests; both expose the same put/get/delete interface and keep credentials backend-only.
- **Validation** (`backend/utils/validation.js`): pure validators (`validateSignup`, `validateLogin`, `validateOpportunity`, `validateApplication`, `validateStatusUpdate`, `validateQuestion`, `validateQuestionAnswer`) plus `asString`/`cleanUser` helpers.
- **SQL migrations** (`backend/migrations/`) mirror the runtime schema for the Docker migrations service; the API itself bootstraps via `initDb()`.

## Frontend Architecture

React 19 + Vite + TypeScript + Tailwind CSS, with a lightweight history-based router in `src/App.tsx` (no router library). `src/api.ts` provides `apiFetch`, which attaches the CSRF token automatically and retries once on token expiry. The UI uses a monochrome, editorial AIRi@UTCN design system.

Pages and key components:

| Route | View / component |
|---|---|
| `/`, `/opportunities` | Browse (`OpportunityList`, `OpportunityCard`) |
| `/opportunities/:id` | Opportunity Detail (`OpportunityDetail`) with the Q&A panel (`OpportunityQA`) |
| `/applications` | My Opportunities (`StudentApplications`) |
| `/profile` | My Profile (`ProfilePage`) |
| professor dashboard | `TeacherDashboard` + `ProfessorQuestions` + `CreateOpportunity`/`EditOpportunity` |
| `/admin` | Admin Dashboard (`AdminDashboard`) |
| `/how-it-works` | How It Works (`info/HowItWorks`) |
| `/for-professors` | For Professors (`info/ForProfessors`) |
| `/faqs` | FAQs (`info/Faqs`) |
| `/login` | Login / signup (`LoginView`); `?role=professor&signup=1` preselects professor signup |

Shared chrome: `Header` (role-aware navigation + notifications), `Footer` (Quick Links to the informational pages). Informational pages are public and refresh-safe via the nginx SPA fallback.

## Endpoint Access

| Method | Path | Access |
|---|---|---|
| `GET` | `/api/health` | Public |
| `GET` | `/api/csrf-token` | Public |
| `POST` | `/api/signup` | Public, student/professor only, CSRF required |
| `POST` | `/api/login` | Public, CSRF required |
| `POST` | `/api/logout` | CSRF required |
| `GET` | `/api/me` | Authenticated |
| `GET` | `/api/opportunities` | Public |
| `GET` | `/api/opportunities/:id` | Public safe opportunity detail |
| `POST` | `/api/opportunities` | Approved professor only, CSRF required |
| `DELETE` | `/api/opportunities/:id` | Owner professor or admin, CSRF required; deletes dependent applications |
| `GET` | `/api/applications` | Authenticated; scoped by role |
| `POST` | `/api/applications` | Student only, CSRF required; uses `req.user.id` |
| `PATCH` | `/api/applications/:id` | Approved owner professor only, CSRF required |
| `GET` | `/api/applications/:id/files/cv` | Student owner, owner professor, or admin |
| `GET` | `/api/applications/:id/files/transcript` | Student owner, owner professor, or admin |
| `GET` | `/api/profile` | Authenticated current user |
| `PATCH` | `/api/profile` | Authenticated current user, CSRF required |
| `POST` | `/api/profile/avatar` | Authenticated current user, CSRF required |
| `GET` | `/api/profile/avatar` | Authenticated current user |
| `POST` | `/api/profile/documents` | Authenticated current user, CSRF required |
| `GET` | `/api/profile/documents/cv` | Authenticated current user |
| `GET` | `/api/profile/documents/transcript` | Authenticated current user |
| `DELETE` | `/api/profile/documents/cv` | Authenticated current user, CSRF required |
| `DELETE` | `/api/profile/documents/transcript` | Authenticated current user, CSRF required |
| `GET` | `/api/profile/my-opportunities` | Student only; returns saved/applied/accepted/rejected |
| `GET` | `/api/profile/saved-opportunities` | Authenticated current user |
| `POST` | `/api/profile/saved-opportunities/:opportunityId` | Authenticated current user, CSRF required |
| `DELETE` | `/api/profile/saved-opportunities/:opportunityId` | Authenticated current user, CSRF required |
| `GET` | `/api/opportunities/:id/questions` | Public sees answered public Q&A (anonymized); asker sees own; owning professor/admin see all |
| `POST` | `/api/opportunities/:id/questions` | Student only, CSRF required; uses `req.user.id` |
| `GET` | `/api/professor/questions` | Approved professor; questions for own opportunities, optional `?status=open\|answered` |
| `PATCH` | `/api/opportunity-questions/:questionId/answer` | Owning approved professor only, CSRF required |
| `GET` | `/api/notifications` | Authenticated current user |
| `PATCH` | `/api/notifications/:id/read` | Authenticated owner, CSRF required |
| `PATCH` | `/api/notifications/read-all` | Authenticated current user, CSRF required |
| `GET` | `/api/admin/users` | Admin only |
| `GET` | `/api/admin/pending` | Admin only |
| `POST` | `/api/admin/approve` | Admin only, CSRF required |
| `DELETE` | `/api/admin/users/:key` | Admin only, CSRF required; cascades dependent data |

Application listing is scoped server-side: students see only their own applications, professors see applications for their own opportunities, and admins see all applications. Q&A visibility is enforced server-side: private questions are never returned to other students or non-owning professors.

## Opportunity Links And Saved Opportunities

Manual checks:

1. Open `/` or `/opportunities` without logging in and confirm the public list loads.
2. Open `/opportunities/<id>` directly in a fresh browser session and confirm the detail page loads without authentication.
3. Use Share from a card or detail page and confirm the copied/shared URL opens the same public detail page.
4. Click Save while logged out and confirm the app redirects to login; after successful login, the opportunity is saved.
5. Log in as a student, save an opportunity, open My Opportunities, and confirm it appears under Saved.
6. Apply to the saved opportunity and confirm it moves from Saved to Applied.
7. Confirm accepted and rejected professor decisions move applications to their respective sections.
8. Confirm already-applied opportunities show Applied, Accepted, or Rejected instead of Save.
9. Confirm professors and admins can browse/share, but application submission remains student-only.

## Environment Variables

Copy the examples and set real values:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Key variables:

```env
NODE_ENV=development
PORT=4000
DB_PATH=./backend/data.sqlite
JWT_SECRET=replace-with-at-least-32-random-characters
CSRF_SECRET=replace-with-at-least-32-random-characters
CORS_ORIGIN=https://ro.utcluj.ro,http://ro.utcluj.ro,http://10.20.7.149:8080,http://10.20.7.149,http://localhost:8080,http://localhost:3000
AUTH_COOKIE_NAME=tucn_auth
CSRF_COOKIE_NAME=tucn_csrf
COOKIE_SAME_SITE=lax
COOKIE_SECURE=false
COOKIE_DOMAIN=
JWT_EXPIRES_IN=7d
COOKIE_MAX_AGE_MS=604800000
CSRF_COOKIE_MAX_AGE_MS=7200000
BODY_LIMIT=16mb
MAX_UPLOAD_MB=5
PROFILE_IMAGE_MAX_MB=2
STORAGE_PROVIDER=s3
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=tucn-research-uploads
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin123
S3_FORCE_PATH_STYLE=true
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
# Only used when STORAGE_PROVIDER=local (backend smoke tests / local fallback)
LOCAL_STORAGE_DIR=./backend/.local-storage
ADMIN_EMAIL=AIRI@campus.utcluj.ro
ADMIN_INITIAL_PASSWORD=replace-with-a-strong-initial-admin-password
ADMIN_NAME=AIRi Admin
RESET_ADMIN_PASSWORD=false
```

For HTTP/IP VM testing, use `COOKIE_SECURE=false` and `COOKIE_SAME_SITE=lax`. For HTTPS production, use `COOKIE_SECURE=true` and keep `COOKIE_SAME_SITE=lax` or `strict` unless a cross-site embedding requirement exists.

Admin seeding is idempotent. The primary admin email is normalized case-insensitively from `ADMIN_EMAIL` and defaults to `AIRI@campus.utcluj.ro`. Existing admin passwords are not reset unless `RESET_ADMIN_PASSWORD=true` and `ADMIN_INITIAL_PASSWORD` is provided.

## Local Development

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run seed-admin
npm start
```

Frontend:

```bash
cd tucn-research-opportunities
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin login is available at `/admin`.

### Public Browse data

Public Browse only ever shows real opportunities returned by `GET /api/opportunities`, and the backend only returns opportunities whose author is an **approved professor**. Posts from pending/unapproved professors and orphaned rows are hidden, and an empty database renders a clean empty state — never bundled mock data.

Bundled demo opportunities are opt-in for local demos only. Copy `tucn-research-opportunities/.env.example` to `.env` and set `VITE_DEMO_MODE=true` to show them when the API is empty or unreachable. Production builds must leave `VITE_DEMO_MODE=false` (the default).

To audit existing data, run the diagnostic (it reports which opportunities are hidden and can optionally relink unambiguous name matches without deleting anything):

```bash
cd backend
npm run check-authors            # report only
node scripts/check-opportunity-authors.js --repair   # relink by author name
```

## Docker

From the repository root:

```bash
cp .env.example .env
# edit JWT_SECRET, CSRF_SECRET, and ADMIN_INITIAL_PASSWORD
docker compose build
docker compose up
```

Open [http://localhost:8080](http://localhost:8080). SQLite persists in the `tucn_api_data` Docker volume. Local Docker defaults to `NODE_ENV=development` so cookies work over plain HTTP; set `NODE_ENV=production` only when serving over HTTPS.

MinIO object data persists in the `tucn_minio_data` Docker volume. The `createbuckets` service creates the configured bucket idempotently and keeps it private.

For the VM deployment, `.env` should include at least:

```env
JWT_SECRET=replace-with-at-least-32-random-characters
CSRF_SECRET=replace-with-at-least-32-random-characters
ADMIN_EMAIL=AIRI@campus.utcluj.ro
ADMIN_INITIAL_PASSWORD=replace-with-a-strong-initial-admin-password
CORS_ORIGIN=https://ro.utcluj.ro,http://ro.utcluj.ro,http://10.20.7.149:8080,http://10.20.7.149,http://localhost:8080,http://localhost:3000
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=
```

Switch `COOKIE_SECURE=true` when serving the app through HTTPS. Never commit `.env`.

### Docker operations

```bash
# Validate the compose file (env interpolation, service graph)
docker compose config

# Build and start in the background
docker compose build
docker compose up -d --remove-orphans

# Follow logs
docker compose logs -f
docker compose logs -f api

# Health and session checks (through the nginx frontend proxy)
curl -i http://localhost:8080/api/health      # -> { "ok": true }
curl -i http://localhost:8080/api/me          # -> 401 when unauthenticated

# Stop without destroying data
docker compose down
```

> **Do not run `docker compose down -v`.** The `-v` flag deletes the `tucn_api_data` (SQLite) and `tucn_minio_data` (object storage) volumes and permanently destroys all data.

Volume backups (run before any upgrade or risky change):

```bash
# Back up the SQLite volume
docker run --rm -v tucn_api_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/tucn_api_data-$(date +%F).tar.gz -C /data .

# Back up the MinIO object-storage volume
docker run --rm -v tucn_minio_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/tucn_minio_data-$(date +%F).tar.gz -C /data .
```

MinIO runs as the `minio` service with its console at [http://localhost:9001](http://localhost:9001); the `createbuckets` service creates the configured bucket idempotently and keeps it private. The SQLite schema is created/repaired automatically when the `api` service boots (`initDb()`), so existing data is preserved across restarts and image upgrades.

## Verification

```bash
cd backend
npm install
npm run smoke

cd ../tucn-research-opportunities
npm run lint
npm run build

cd ..
JWT_SECRET=replace-with-at-least-32-random-characters docker compose config
JWT_SECRET=replace-with-at-least-32-random-characters docker compose build
```

Credentialed CORS and CSRF checks:

```bash
curl -i -X OPTIONS http://localhost:8080/api/login \
  -H "Origin: http://10.20.7.149:8080" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,X-CSRF-Token"
```

Expected headers include:

```text
Access-Control-Allow-Origin: http://10.20.7.149:8080
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: Content-Type,X-CSRF-Token,Authorization
```

```bash
curl -i -c /tmp/airi-cookies.txt http://localhost:8080/api/csrf-token
csrf=$(node -e "const fs=require('fs'); const line=fs.readFileSync('/tmp/airi-cookies.txt','utf8').split('\n').find(l=>l.includes('tucn_csrf')); console.log(line.split(/\\s+/).pop())")
curl -i -b /tmp/airi-cookies.txt -c /tmp/airi-cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $csrf" \
  -d '{"email":"AIRI@campus.utcluj.ro","password":"<admin-password>","role":"admin"}' \
  http://localhost:8080/api/login
curl -i -b /tmp/airi-cookies.txt http://localhost:8080/api/me
```

Manual flow:

1. Unauthenticated visitor opens `/` and browses opportunities.
2. Unauthenticated visitor opens an opportunity detail and clicks Apply, then is redirected to sign in.
3. Student signs up or logs in and applies to the selected opportunity.
4. Student opens My Profile, adds LinkedIn URL, uploads avatar, CV, and transcript.
5. Student applies using saved profile CV/transcript or uploads per-application documents.
6. Admin logs in at `/admin` with `AIRI@campus.utcluj.ro`.
7. Professor signs up and remains pending.
8. Admin approves the professor.
9. Professor logs in after approval and creates an opportunity.
10. Professor sees only own applications and accepts/rejects one.
11. A different professor cannot update that application.
12. Student cannot access admin endpoints or create opportunities.
13. Student opens an opportunity detail, asks a question (optionally ticking "show anonymously if answered"), and sees it as "Waiting for reply".
14. Owning professor opens the dashboard Questions panel, replies, and the student sees the answer on the opportunity detail page.
15. Confirm a public answered question appears (anonymized) to a logged-out visitor, while private questions stay hidden from other students.
16. Logout, then `/api/me` returns unauthenticated while public browsing still works.

## Production Checklist

- Use unique high-entropy `JWT_SECRET` and `CSRF_SECRET`.
- Replace MinIO example credentials with real secret values.
- Set `ADMIN_EMAIL=AIRI@campus.utcluj.ro` and a one-time strong `ADMIN_INITIAL_PASSWORD`; remove or rotate it after seeding according to your deployment process.
- Keep the object storage bucket private.
- Back up both SQLite and object storage volumes before deployment changes.
- Serve only over HTTPS with `NODE_ENV=production`.
- Set `CORS_ORIGIN` to the exact allowed frontend origin list, comma-separated when multiple deployment/test origins are needed.
- Set `COOKIE_SAME_SITE=strict` if cross-site navigation requirements allow it.
- Rotate default seed passwords before exposure.
- Run database backups for the SQLite volume.
- Put a reverse proxy or platform-level rate limit in front of the API.
- Review `npm audit` regularly, especially the `sqlite3` transitive toolchain advisories.

## Troubleshooting

- **CORS or login errors in the browser.** The request `Origin` must be in `CORS_ORIGIN` (comma-separated) or match the forwarded public host of the nginx proxy. Add your exact scheme/host/port and restart the API.
- **Logged in but the session does not stick over HTTP.** A `secure` cookie is dropped on plain HTTP. Use `COOKIE_SECURE=false` and `COOKIE_SAME_SITE=lax` for HTTP/IP testing; use `COOKIE_SECURE=true` only behind HTTPS.
- **API exits on boot with a `JWT_SECRET` error.** `JWT_SECRET` must be set and at least 32 characters. Set it in `.env` (and your shell when running `docker compose config`).
- **`SQLITE_ERROR: no such column ... updated_at` (or similar) on an old database.** Restart the API — `initDb()` runs additive runtime schema repair on boot. Schema changes never drop data; no manual migration is needed.
- **`SQLITE_ERROR: no such table: users` from admin seeding.** Use the Node seeder (`npm run seed-admin`), which is `DB_PATH`-aware, creates the `users` table if missing, and is idempotent. The legacy Knex seed path was removed.
- **Port 8080 already allocated.** Another process (or a previous stack) holds the port. Stop it, or change the published port in `docker-compose.yml` (`"8080:80"`).
- **MinIO/bucket problems (uploads or downloads fail).** Confirm the `minio` and `createbuckets` services are healthy, that `S3_BUCKET` matches across services, and that `S3_ENDPOINT`/credentials are correct. The console at [http://localhost:9001](http://localhost:9001) helps verify the bucket exists and is private.
- **Browse shows an empty state.** That is expected when there are no opportunities from approved professors. Run `npm run check-authors` in `backend/` to report opportunities whose author is not an approved professor. Set `VITE_DEMO_MODE=true` only for local demos.

## Known Limitations

- Legacy PDF uploads may still exist as base64 JSON in old SQLite rows; migrate those rows to object storage later if desired.
- SQLite is retained for now; the DB helper and route boundaries are kept simple so a later PostgreSQL migration is practical.
- There is no audit log yet for approvals, deletions, or auth events.
- Profile avatar access is authenticated and current-user scoped; public profile/avatar discovery is intentionally not implemented yet.
- Q&A has no dedicated admin moderation endpoint; admins see questions through the per-opportunity endpoint, and there is no aggregate "My Questions" page for students (students see replies on each opportunity detail page).
- In-app notifications are best-effort and minimal (no email/digest delivery); a failed notification insert never blocks the underlying action.
