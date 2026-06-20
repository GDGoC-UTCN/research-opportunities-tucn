# UTCN Research Opportunities Portal

React/Vite/TypeScript frontend plus an Express + SQLite backend for UTCN research opportunities. Students browse and apply to professor-posted projects, professors manage their own opportunities and applicants, and admins approve professor accounts and manage platform data.

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

## PDF Upload Storage

New CV/transcript uploads use `multipart/form-data`. PDFs are validated on the backend and stored in object storage; SQLite stores only metadata and opaque storage keys.

Storage behavior:

- Production uses S3-compatible storage via `STORAGE_PROVIDER=s3`.
- Local Docker uses MinIO at `http://minio:9000`; the console is exposed at [http://localhost:9001](http://localhost:9001).
- Backend tests use `STORAGE_PROVIDER=local` with a temporary filesystem directory.
- Object keys are random and scoped by application ID, for example `applications/<applicationId>/<uuid>-cv.pdf`.
- S3/MinIO credentials are backend-only and never exposed to the frontend.
- Buckets must remain private; downloads go through backend authorization.

Legacy rows that still contain old base64 JSON in `cv_file` or `transcript_file` remain readable for backward compatibility. New uploads do not store base64 data in SQLite.

## Auth, Cookies, And CSRF

Login calls `POST /api/login` with email, password, and the selected role. The backend verifies the password, rejects role mismatches before issuing a cookie, rejects unapproved professors, signs a JWT with `JWT_SECRET`, and sets it in an `HttpOnly` cookie.

Cookie behavior:

- `httpOnly: true`
- `sameSite: "lax"` by default, or `"strict"` when `COOKIE_SAME_SITE=strict`
- `secure: true` when `NODE_ENV=production`
- default expiration: 7 days

Session restore calls `GET /api/me`. Logout calls `POST /api/logout` and clears the auth cookie.

CSRF behavior:

- `GET /api/csrf-token` issues a signed token in JSON and a readable same-site cookie.
- All `POST`, `PATCH`, and `DELETE` requests must send `X-CSRF-Token`.
- `GET`, `HEAD`, `OPTIONS`, and health checks do not require CSRF.
- The frontend `apiFetch` helper fetches and sends the token automatically.

## Backend Middleware

- `requireAuth`: verifies JWT from the auth cookie or `Authorization: Bearer ...`, then loads the current user from SQLite. Deleted users, changed roles, and changed approval status are respected immediately.
- `requireRole(...roles)`: rejects authenticated users with the wrong role.
- `requireApprovedProfessor`: requires a current approved professor account.
- `requireCsrf`: validates signed CSRF token for state-changing routes.

Passwords and password hashes are never returned by the API.

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
| `POST` | `/api/opportunities` | Approved professor only, CSRF required |
| `DELETE` | `/api/opportunities/:id` | Owner professor or admin, CSRF required; deletes dependent applications |
| `GET` | `/api/applications` | Authenticated; scoped by role |
| `POST` | `/api/applications` | Student only, CSRF required; uses `req.user.id` |
| `PATCH` | `/api/applications/:id` | Approved owner professor only, CSRF required |
| `GET` | `/api/applications/:id/files/cv` | Student owner, owner professor, or admin |
| `GET` | `/api/applications/:id/files/transcript` | Student owner, owner professor, or admin |
| `GET` | `/api/admin/users` | Admin only |
| `GET` | `/api/admin/pending` | Admin only |
| `POST` | `/api/admin/approve` | Admin only, CSRF required |
| `DELETE` | `/api/admin/users/:key` | Admin only, CSRF required; cascades dependent data |

Application listing is scoped server-side: students see only their own applications, professors see applications for their own opportunities, and admins see all applications.

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
CORS_ORIGIN=http://localhost:3000
AUTH_COOKIE_NAME=tucn_auth
CSRF_COOKIE_NAME=tucn_csrf
COOKIE_SAME_SITE=lax
JWT_EXPIRES_IN=7d
COOKIE_MAX_AGE_MS=604800000
CSRF_COOKIE_MAX_AGE_MS=7200000
BODY_LIMIT=16mb
MAX_UPLOAD_MB=5
STORAGE_PROVIDER=s3
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=tucn-research-uploads
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin123
S3_FORCE_PATH_STYLE=true
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
```

For production, set `NODE_ENV=production` behind HTTPS so cookies use `secure: true`.

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

## Docker

From the repository root:

```bash
cp .env.example .env
# edit JWT_SECRET and optionally CSRF_SECRET
docker compose build
docker compose up
```

Open [http://localhost:8080](http://localhost:8080). SQLite persists in the `tucn_api_data` Docker volume. Local Docker defaults to `NODE_ENV=development` so cookies work over plain HTTP; set `NODE_ENV=production` only when serving over HTTPS.

MinIO object data persists in the `tucn_minio_data` Docker volume. The `createbuckets` service creates the configured bucket idempotently and keeps it private.

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

Manual flow:

1. Admin logs in at `/admin`.
2. Student signs up or logs in.
3. Professor signs up and remains pending.
4. Admin approves the professor.
5. Professor logs in after approval and creates an opportunity.
6. Student applies to the opportunity.
7. Professor sees only own applications and accepts/rejects one.
8. A different professor cannot update that application.
9. Student cannot access admin endpoints or create opportunities.
10. Logout, then `/api/me` returns unauthenticated.

## Production Checklist

- Use unique high-entropy `JWT_SECRET` and `CSRF_SECRET`.
- Replace MinIO example credentials with real secret values.
- Keep the object storage bucket private.
- Back up both SQLite and object storage volumes before deployment changes.
- Serve only over HTTPS with `NODE_ENV=production`.
- Set `CORS_ORIGIN` to the exact frontend origin.
- Set `COOKIE_SAME_SITE=strict` if cross-site navigation requirements allow it.
- Rotate default seed passwords before exposure.
- Run database backups for the SQLite volume.
- Put a reverse proxy or platform-level rate limit in front of the API.
- Review `npm audit` regularly, especially the `sqlite3` transitive toolchain advisories.

## Known Limitations

- Legacy PDF uploads may still exist as base64 JSON in old SQLite rows; migrate those rows to object storage later if desired.
- SQLite is retained for now; the DB helper and route boundaries are kept simple so a later PostgreSQL migration is practical.
- There is no audit log yet for approvals, deletions, or auth events.
