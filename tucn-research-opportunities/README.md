# UTCN Research Opportunities Portal 🎓

A modern, full-featured web application connecting students and professors at the **Technical University of Cluj-Napoca (UTCN)**. The platform centralises research project listings, applications, document uploads, and account management under a clean, accessible UI.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Accounts & Credentials](#demo-accounts--credentials)
- [Authentication & Admin Access](#authentication--admin-access)
- [PDF Upload — CV & Transcripts](#pdf-upload--cv--transcripts)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Security Notes](#security-notes)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The UTCN Research Opportunities Portal allows:

- **Students** to browse, filter, and apply for professor-posted research projects with optional CV/Transcript uploads.
- **Professors** to create and manage research listings, set document requirements, and review/accept/reject applicants.
- **Admins** to approve professor sign-up requests before they can post opportunities.

All data is currently held in-memory and persisted to `localStorage` for demo purposes. See [Security Notes](#security-notes) for guidance on productionising the backend.

---

## Features

### 🎓 Student
| Feature | Details |
|---|---|
| Browse opportunities | Paginated, searchable, filterable list of research projects |
| Filter by tags | Multi-tag filter (AI, Robotics, NLP, etc.) |
| Opportunity detail | Full abstract, requirements, stipend, deadline, duration |
| Apply to project | Cover letter + custom application fields set by the professor |
| Upload documents | Attach a PDF CV and/or Transcript of Notes (per professor's settings) |
| My applications | View all submitted applications with status, professor replies, and uploaded files |
| Role-first login | Clean two-step flow: select role → sign in or sign up |

### 🧑‍🏫 Professor
| Feature | Details |
|---|---|
| Create opportunity | Full form: title, description, abstract, tags, duration, stipend, deadline, custom fields |
| Require documents | Per-opportunity toggles to make CV and/or Transcript mandatory |
| Professor dashboard | View own listings, expand to see all applicants and their details |
| Review applications | Accept or reject applicants, send a personal reply message |
| Download documents | Download applicant-uploaded CV and Transcript PDFs |

### 🔐 Admin
| Feature | Details |
|---|---|
| Admin sign-in | Accessed at `/admin` (hidden from the main UI) |
| Approve professors | Review pending professor sign-up requests and approve them |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 19](https://react.dev/) |
| Build tool | [Vite 6](https://vitejs.dev/) |
| Language | [TypeScript 5.8](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) (custom UTCN theme tokens) |
| Animations | [motion/react (Framer Motion)](https://motion.dev/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Password hashing | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| Persistence | Browser `localStorage` (demo) |

---

## Project Structure

```
tucn-research-opportunities/
├── public/                       # Static assets (favicon, og image)
├── src/
│   ├── App.tsx                   # Root component, state, routing logic
│   ├── main.tsx                  # React DOM entry point
│   ├── index.css                 # Global styles / Tailwind directives
│   ├── types.ts                  # All TypeScript interfaces, mock data & seeded users
│   ├── assets/                   # Images, SVGs
│   └── components/
│       ├── common/
│       │   ├── Header.tsx        # Navigation bar
│       │   ├── Footer.tsx        # Site footer
│       │   ├── LoginView.tsx     # Role-first two-step sign in / sign up
│       │   ├── Logo.tsx          # UTCN logo component
│       │   ├── OpportunityList.tsx   # Paginated listing with search & filters
│       │   └── OpportunityDetail.tsx # Full opportunity view + apply button
│       ├── student/
│       │   ├── ApplicationModal.tsx  # Application form + PDF upload (CV/Transcript)
│       │   └── StudentApplications.tsx # My Applications page
│       ├── teacher/
│       │   ├── CreateOpportunity.tsx # New opportunity form
│       │   └── TeacherDashboard.tsx  # Professor's postings + applicant management
│       └── admin/
│           └── AdminDashboard.tsx    # Approve pending professor accounts
├── tailwind.config.js            # Tailwind theme (UTCN colours, fonts)
├── vite.config.ts                # Vite configuration
├── tsconfig*.json                # TypeScript configs
└── package.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- npm ≥ 9

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/GDGoC-UTCN/research-opportunities-tucn.git
cd research-opportunities-tucn/tucn-research-opportunities

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Accounts & Credentials

> **These are demo-only credentials for local development and testing.**
> Passwords are stored as bcrypt hashes in `src/types.ts` — the plaintext passwords below are never committed to source.

| Role | Name | Email | Password |
|---|---|---|---|
| 🔐 Admin | UTCN Admin | `admin@utcn.edu` | `adminpass` |
| 🎓 Student | Alexandru Pop | `alex.pop@student.utcn` | `studentpass` |
| 🎓 Student | Maria Ionescu | `maria.ionescu@student.utcn` | `studentpass2` |
| 🧑‍🏫 Professor | Dr. Andrew Julian | `andrew.julian@utcn` | `profpass` |

> **Admin access:** Navigate to [http://localhost:3000/admin](http://localhost:3000/admin). The admin button is intentionally hidden from the main login screen.

---

## Authentication & Admin Access

The app uses a **role-first two-step login flow**:

1. The landing page shows two large buttons — **Continue as Student** and **Continue as Professor**.
2. Clicking either reveals a compact panel with **Sign in** (email + password) and **Sign up** (name, email, password, optional department).
3. **Admin sign-in** is available only at the `/admin` path.

### Signup rules
- **Students** — approved immediately; redirected to the opportunity list after signup.
- **Professors** — marked `approved: false` on signup. An admin must approve the account before the professor can post or log in.
- New user credentials (email + bcrypt-hashed password) are persisted to `localStorage`.

### Password security
All passwords are hashed client-side with **bcryptjs** (cost factor 10) before storing. The seeded demo accounts also store only bcrypt hashes in source — no plaintext passwords are committed to the repository.

> ⚠️ **Client-side password hashing is a demo improvement, not production security.** See [Security Notes](#security-notes) for a production path.

---

## PDF Upload — CV & Transcripts

Professors can optionally require a **CV** and/or **Transcript of Notes** when creating an opportunity (toggled in the Create Opportunity form).

When applying:
- If a document is required, the student must upload a PDF (max 5 MB) before submitting.
- Files are converted to base64 data URLs and stored in-memory / `localStorage`.
- Professors can download the files from their dashboard applicant view.
- Students can see their uploaded files in the My Applications page.

---

## Available Scripts

```bash
npm run dev       # Start development server on port 3000 (accessible on all network interfaces)
npm run build     # Compile TypeScript and bundle for production (output: dist/)
npm run preview   # Serve the production build locally
npm run lint      # Run TypeScript compiler check (tsc --noEmit), reports type errors
npm run clean     # Remove the dist/ folder
```

---

## Deployment

### Static hosting (Vercel, Netlify, GitHub Pages)

The app is a static SPA. After running `npm run build` the `dist/` folder can be deployed to any static host.

#### Vercel (recommended)

```bash
npm install -g vercel
vercel --prod
```

Set the **output directory** to `dist` and the **build command** to `npm run build`.

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

Add a `_redirects` file in `public/` to support client-side routing:

```
/*  /index.html  200
```

#### Docker (optional)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## Environment Variables

Currently the project does not require any environment variables for the demo. When you wire a real backend, create a `.env` file at the project root:

```env
# Backend API base URL (used when connecting to a real auth/data API)
VITE_API_URL=https://your-api.example.com

# Optional: disable demo seed data in production
VITE_DEMO_MODE=false
```

> Vite exposes only variables prefixed with `VITE_` to the browser bundle.
> Never put secret keys, database passwords, or JWT secrets in a `VITE_*` variable — they are visible in the built bundle.

---

## Security Notes

This application is currently a **frontend-only demo**. The following items **must** be addressed before deploying to production with real users:

| # | Issue | Recommendation |
|---|---|---|
| 1 | **No backend auth** | Implement a server-side auth system (e.g., Node/Express + JWT, NextAuth, Supabase Auth, Firebase Auth). Move all credential handling server-side. |
| 2 | **Passwords in localStorage** | Never store passwords (even hashed) in the browser. Use server-issued tokens (short-lived JWTs or session cookies with `HttpOnly; Secure; SameSite=Strict` flags). |
| 3 | **No HTTPS enforcement** | Configure your host/CDN to redirect HTTP → HTTPS and add an HSTS header. |
| 4 | **No CSRF protection** | Add CSRF tokens to all state-mutating API requests when using cookie-based sessions. |
| 5 | **No Content-Security-Policy** | Add a strict CSP header to prevent XSS. |
| 6 | **File uploads stored as base64** | Use a dedicated object store (S3, Azure Blob Storage, Supabase Storage). Never store large binary payloads in localStorage. |
| 7 | **Input validation** | Add server-side validation for all inputs — email format, password strength, file type/size enforcement, field length limits. |
| 8 | **No rate limiting** | Add rate limiting on login endpoints (e.g., via an API Gateway or express-rate-limit). |
| 9 | **Demo seed data in source** | Move demo user seeds behind a `VITE_DEMO_MODE=true` guard or a separate seed script run only locally. |
| 10 | **No audit logging** | Log authentication events (login success/failure, account approvals) server-side for security monitoring. |

---

## Contributing

1. Fork the repository and create your branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes and run the linter:
   ```bash
   npm run lint
   npm run build
   ```
3. Commit with a descriptive message following [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat(student): add pagination to My Applications view
   fix(auth): handle expired localStorage token gracefully
   ```
4. Open a Pull Request against `main` (or the active branch) on GitHub.

### Code style
- TypeScript strict mode enabled — avoid `any` where possible.
- Components are functional React with hooks only — no class components.
- Tailwind utility classes used for all styling; avoid inline `style` props.

---

## License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">
  Built with ❤️ by the <strong>GDGoC UTCN</strong> team · <a href="https://utcluj.ro">utcluj.ro</a>
</div>
## 🔐 Mock Authentication Flow

This project currently uses a simulated state-based authentication system:
- Click **"Login as Student"** to view the application through the eyes of an applicant.
- Click **"Login as Professor"** to unlock the "Create Opportunity" form and the Professor Dashboard.
- You can switch between accounts at any time by clicking **"Log Out"** in the top right corner.

*Note: All data including users, projects, and applications are currently stored in memory (mock data) and will reset upon a page refresh.*

## 🎨 UI/UX Design
The platform uses the official **UTCN Blue (`#0066b3`)** alongside modern soft shadows, rounded corners, and smooth Framer Motion transitions to ensure an accessible and premium experience.
