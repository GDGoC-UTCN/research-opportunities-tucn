# UTCN Research Opportunities Portal 🎓

A modern, full-featured web platform connecting students and professors at the **Technical University of Cluj-Napoca (UTCN)**. Students can discover research projects, upload application documents, and track their applications. Professors manage listings, set document requirements, and review applicants. Admins oversee platform users and content.

🌐 **Live at: [https://ro.utcluj.ro/](https://ro.utcluj.ro/)**

---

## Table of Contents

- [Overview](#overview)
- [Live Demo & Test Accounts](#live-demo--test-accounts)
- [Current Features](#current-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Roadmap](#roadmap)
- [Security Notes](#security-notes)
- [Contributing](#contributing)

---

## Overview

The UTCN Research Opportunities Portal provides:

- **Students** — browse, filter, and apply for professor-posted research projects with optional CV/Transcript uploads; track application status and professor replies.
- **Professors** — create and manage research listings, set per-opportunity document requirements, review applicants, and send reply messages.
- **Admins** — approve professor accounts, manage all users (professors & students), and remove posts or accounts as needed.

---

## Live Demo & Test Accounts

The application is deployed and running at **[https://ro.utcluj.ro/](https://ro.utcluj.ro/)**.

> ⚠️ These are real test accounts on the live server — please do not delete content or change passwords.

| Role | Email | Password | Notes |
|---|---|---|---|
| 🧑‍🏫 Professor | `Adrian.Groza@cs.utcluj.ro` | `test` | Has existing posts and applicants |
| 🎓 Student | `Mozacu.Cl.Stefania@student.utcluj.ro` | `Stefi` | Has submitted applications |
| 🔐 Admin | `admin@utcn.edu` | `adminpass` | Navigate to [https://ro.utcluj.ro/admin](https://ro.utcluj.ro/admin) |

> **Admin access** is intentionally hidden from the main login page. Go to `/admin` directly.

---

## Current Features

### 🎓 Students
- **Browse & filter** research opportunities — search by keyword, filter by tags (AI, Robotics, NLP, etc.)
- **Detailed view** — full project abstract, requirements, stipend info, deadline, and duration
- **Apply** — cover letter + any custom application questions set by the professor
- **CV & file uploads** — attach a PDF CV and/or Transcript of Notes when required
- **My Applications** — track all submissions with live status (pending / accepted / rejected), professor reply messages, and links to uploaded files
- **Role-first login** — clean two-step flow: pick role → sign in or sign up

### 🧑‍🏫 Professors
- **Post opportunities** — full form with title, description, abstract, tags, duration, stipend, deadline, and custom questions
- **Require documents** — per-opportunity toggles to make CV and/or Transcript mandatory for applicants
- **Dashboard** — view all own listings; expand any to see the full applicant list with submitted answers
- **Review applications** — accept or reject applicants and send a personalised reply message
- **Download documents** — download applicant-uploaded CV and Transcript PDFs directly from the dashboard
- **Account approval flow** — new professor accounts require admin approval before they can post or log in

### 🔐 Admin
- **Approve professors** — review pending sign-up requests and approve them so they can access the platform
- **View all users** — separate sections for professors and students with account details
- **Delete accounts** — remove any professor or student account from the platform
- **Delete posts** — remove any opportunity posted on the platform
- **Hidden access** — admin panel is only accessible at `/admin`, not linked from the main UI

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + TypeScript 5.8 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 (UTCN colour tokens) |
| Animations | motion/react (Framer Motion) |
| Icons | Lucide React |
| Backend | Node.js / Express |
| Database | SQLite (via `sqlite3`, persisted on Docker volume) |
| Migrations | Knex + raw SQL fallback (`migrations/000_init_users.sql`) |
| Auth | bcryptjs password hashing, session state in React |
| Containerisation | Docker + docker-compose (nginx frontend, Node API, migrations service) |
| Reverse proxy | nginx (serves frontend, proxies `/api/` to backend) |

---

## Project Structure

```
research-opportunities-tucn/
├── tucn-research-opportunities/        # React/Vite frontend
│   ├── src/
│   │   ├── App.tsx                     # Root component, state, all handlers
│   │   ├── types.ts                    # TypeScript interfaces
│   │   ├── index.css                   # Global styles / Tailwind directives
│   │   └── components/
│   │       ├── common/                 # Header, Footer, LoginView, OpportunityList, OpportunityDetail
│   │       ├── student/                # ApplicationModal, StudentApplications
│   │       ├── teacher/                # CreateOpportunity, TeacherDashboard
│   │       └── admin/                  # AdminDashboard (users + posts management)
│   ├── nginx.conf                      # nginx config (SPA routing + /api proxy)
│   ├── Dockerfile                      # Multi-stage: Vite build → nginx:alpine
│   └── package.json
├── backend/
│   ├── index.js                        # Express server (auth + admin endpoints)
│   ├── migrate.js                      # Migration runner
│   ├── migrations/
│   │   └── 000_init_users.sql          # SQL schema (users table)
│   ├── seeds/
│   │   └── 01_admin_seed.js            # Seeds the default admin account
│   ├── Dockerfile                      # node:20-bullseye-slim + tini + sqlite3 CLI
│   └── .dockerignore
├── docker-compose.yml                  # Orchestrates frontend, api, migrations services
├── start.sh                            # One-command deploy script (build + up)
└── README.md                           # This file
```

---

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18 and npm ≥ 9

### Frontend only

```bash
cd tucn-research-opportunities
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Full stack (frontend + backend + database)

Requires [Docker](https://docs.docker.com/get-docker/) and Docker Compose.

```bash
# From repo root
./start.sh
```

Or manually:

```bash
docker compose build
docker compose up -d
```

The app will be available at [http://localhost:8080](http://localhost:8080).

### Backend API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/signup` | Register a new user (student or professor) |
| `POST` | `/api/login` | Authenticate and return user object |
| `GET` | `/api/admin/pending` | List professors awaiting approval |
| `POST` | `/api/admin/approve` | Approve a professor account |
| `GET` | `/api/admin/users` | List all users (professors + students) |
| `DELETE` | `/api/admin/users/:key` | Delete a user by ID or email |
| `GET` | `/api/health` | Health check |

### Available frontend scripts

```bash
npm run dev       # Dev server on port 3000
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # TypeScript type check (tsc --noEmit)
```

---

## Docker Deployment

The production stack is defined in `docker-compose.yml` and consists of three services:

| Service | Image | Role |
|---|---|---|
| `frontend` | `tucn-frontend:latest` | nginx serving the built React SPA + reverse proxy to API |
| `api` | `tucn-api:latest` | Node/Express backend, SQLite on named volume |
| `migrations` | `tucn-api:latest` | Runs SQL migrations at startup, then exits |

The SQLite database is stored on a named Docker volume (`tucn_api_data`) so data persists across container restarts and redeploys.

### One-command deploy

```bash
./start.sh
```

This script builds both images and starts all services. The app is served on port `8080`.

---

## Roadmap

The following features are planned for future development:

- 🔐 **Improved security** — move to proper server-side sessions or JWT tokens; harden the admin endpoint with stronger credentials and rate limiting
- 📅 **Interviews component** — professors can schedule interview slots; students can book a time; integrated calendar view
- 🖼️ **Photo & media uploads** — allow professors to add images or attachments to opportunity listings
- 💬 **In-app messaging / chat** — real-time or async chat between professors and student applicants
- 👤 **User profiles** — editable profiles for students (LinkedIn link, profile photo, primary CV) and professors (bio, research areas, lab page)
- 📝 **Professor feedback & recommendation letters** — structured feedback after project completion; option for professors to generate a recommendation letter for a student

---

## Security Notes

The current deployment is functional but has known limitations for a production system:

| # | Issue | Recommendation |
|---|---|---|
| 1 | **Plain session state** | Replace React state auth with short-lived JWTs or `HttpOnly` session cookies |
| 2 | **Admin credentials** | Change default `adminpass` before any public-facing use; add rate limiting on `/api/login` |
| 3 | **No HTTPS enforcement** | The live deployment sits behind a reverse proxy — ensure HSTS is set |
| 4 | **File uploads as base64** | Move to a dedicated object store (S3, Azure Blob, Supabase Storage) for production scale |
| 5 | **No CSRF protection** | Add CSRF tokens to all state-mutating API requests when using cookie sessions |
| 6 | **No Content-Security-Policy** | Add a strict CSP header to the nginx config |
| 7 | **No input validation on server** | Add server-side validation for all fields (email format, file type/size, field lengths) |
| 8 | **No audit logging** | Log auth events (logins, approvals, deletions) server-side for security monitoring |

---

## Contributing

1. Fork the repository and create your branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make changes and verify:
   ```bash
   cd tucn-research-opportunities
   npm run lint
   npm run build
   ```
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat(student): add calendar view for interview slots
   fix(admin): handle duplicate email on user delete
   ```
4. Open a Pull Request against the active branch on GitHub.

---

<div align="center">
  Built with ❤️ by the <strong>GDGoC UTCN</strong> team · <a href="https://utcluj.ro">utcluj.ro</a>
</div>
