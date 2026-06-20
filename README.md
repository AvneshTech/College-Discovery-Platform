<div align="center">

<img src="https://img.shields.io/badge/🎓-CollegeEdge-f59e0b?style=for-the-badge&labelColor=0a0f1e" alt="CollegeEdge" height="40"/>

# CollegeEdge

### Find Your Dream College — search, compare, predict & decide.

A full-stack college discovery platform for India. Search hundreds of colleges,
compare them side-by-side, predict your admissions chances from your exam rank,
save a shortlist, and ask the community — all in one fast, modern, responsive app.

<br/>

<!-- Tech badges -->
![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-18-20232a?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?style=flat-square&logo=express)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169e1?style=flat-square&logo=postgresql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-realtime-010101?style=flat-square&logo=socket.io)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)

<br/>

[**✨ Features**](#-features) · [**🖼 Screenshots**](#-screenshots) · [**🚀 Quick Start**](#-quick-start) · [**🧩 Architecture**](#-architecture) · [**📡 API**](#-api-reference) · [**🗺 Roadmap**](#-roadmap)

</div>

---

## 📖 Overview

**CollegeEdge** helps students make one of the biggest decisions of their lives.
Instead of juggling spreadsheets and a dozen browser tabs, students get a single
place to **discover**, **compare**, and **shortlist** colleges — backed by a
rank-based **predictor** and a **community Q&A**.

The codebase is intentionally production-shaped: a **modular, secured Express API**
(Repository → Service → Controller, RBAC, rotating refresh tokens, Zod validation,
Helmet/rate-limiting/XSS sanitization) and a **modern Next.js App Router frontend**
(Tailwind v4, dark mode, optimistic UI, smooth motion).

---

## ✨ Features

### For Students
- 🔍 **Smart search & filters** — search by name/city/course, filter by city, rating, and branch, with debounced queries and pagination.
- ⚖️ **Side-by-side compare** — pick 2–4 colleges and compare fees, packages, placement, NIRF rank, and ratings with charts.
- 🎯 **Rank predictor** — enter your exam (JEE Main / JEE Advanced / BITSAT / State CET), rank, category & preferences to get matched colleges via the recommendation engine.
- 🔖 **Save & shortlist** — one-tap save with optimistic hearts; manage your personal list.
- 💬 **Community Q&A** — ask questions and get answers in **real time** (Socket.io).
- ⭐ **Reviews & ratings** — read and post reviews; aggregate ratings are recomputed from real review data.
- 🌗 **Light / Dark mode** — system-aware, persisted, with zero flash on load.
- 👁 **Password show/hide** on login & register, and a fully **responsive** UI (mobile → desktop).

### For Admins
- 🛠 **Admin panel** (`/admin`) — overview dashboard plus management tabs.
- 👥 **User management** — promote/demote roles (RBAC) and deactivate accounts.
- 🏫 **College CRUD** — add, edit, and delete colleges from the UI.
- 🚩 **Moderation** — flag/hide discussions.

### Engineering
- 🔐 **Secure auth** — in-memory access token + **httpOnly refresh cookie** with **refresh-token rotation** and reuse detection.
- 🧱 **Modular backend** — clean separation of routes, controllers, services, repositories.
- 🛡 **Hardened API** — Helmet, CORS, rate limiting, HPP, request-body XSS sanitization, Zod schemas on every input.
- ⚡ **Resilient client** — single typed fetch helper that transparently refreshes expired tokens and retries.

---

## 🖼 Screenshots

> Replace the placeholders below with real screenshots (drop them in `docs/` and update the paths).

| Home / Discovery | College Compare | Admin Panel |
|:---:|:---:|:---:|
| ![Home](docs/home.png) | ![Compare](docs/compare.png) | ![Admin](docs/admin.png) |

| Predictor | Q&A Discussions | Dark Mode |
|:---:|:---:|:---:|
| ![Predictor](docs/predictor.png) | ![Discussions](docs/discussions.png) | ![Dark mode](docs/dark.png) |

---

## 🧰 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js (App Router), React, TypeScript, Tailwind CSS v4, Framer Motion, lucide-react, Recharts |
| **Backend** | Node.js, Express, Socket.io |
| **Database** | PostgreSQL via Prisma ORM |
| **Auth** | JWT access tokens (in-memory) + rotating httpOnly refresh cookies, bcrypt |
| **Validation & Security** | Zod, Helmet, express-rate-limit, HPP, custom XSS sanitizer, RBAC |
| **Tooling** | ESLint, Prisma Migrate, Prisma Studio |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm**
- **PostgreSQL** 14+ running locally (or a hosted connection string)

### 1. Backend
```bash
cd backend
cp .env.example .env          # set DATABASE_URL + JWT secrets — generate with: openssl rand -hex 32
npm install
npx prisma migrate dev        # create tables
npm run db:seed               # seeds admin@collegeedge.dev / Admin@123 + sample data
npm run dev                   # → http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev                    # → http://localhost:3000
```

### 3. Log in
Open **http://localhost:3000**, then sign in with the seeded admin to access the panel at **`/admin`**:

```
Email:    admin@collegeedge.dev
Password: Admin@123
```
> Any new account registers as a **STUDENT**. Promote it to **ADMIN** from the admin panel (or via Prisma Studio: `npx prisma studio`).

---

## ⚙️ Environment Variables

**`backend/.env`**
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for short-lived access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `CLIENT_ORIGIN` | Allowed CORS origin (e.g. `http://localhost:3000`) |
| `PORT` | API port (default `5000`) |

**`frontend/.env.local`**
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (e.g. `http://localhost:5000`) |

---

## 🧩 Architecture

```
collegeedge/
├── backend/
│   └── src/
│       ├── app.js                 # Express app: security middleware + routers
│       ├── server.js              # HTTP server + Socket.io bootstrap
│       ├── config/                # env, prisma client
│       ├── middleware/            # auth (JWT/RBAC), validate (Zod), security, sanitize, errors
│       ├── modules/
│       │   ├── auth/              # register / login / refresh / logout / me
│       │   ├── colleges/          # list, detail, compare, predictor, reviews, CRUD + recommendation engine
│       │   ├── discussions/       # Q&A + realtime answers + moderation
│       │   └── users/             # saved colleges, profile, dashboard, admin user mgmt
│       ├── realtime/socket.js     # Socket.io rooms (discussion:{id})
│       └── utils/                 # tokens, slugify
└── frontend/
    └── app/                       # Next.js App Router
        ├── layout.tsx             # Theme boot script + providers
        ├── page.tsx               # Home / discovery
        ├── admin/                 # 🛠 Admin panel (users · colleges · Q&A)
        ├── college/[id]/          # College detail + reviews
        ├── compare/ · predictor/ · discussions/ · saved/ · profile/
        ├── login/ · register/     # Auth (with password show/hide)
        ├── components/            # Navbar, CollegeCard, SmartImage, forms, charts, skeletons
        └── lib/                   # apiClient (token refresh), AuthProvider, ThemeProvider
```

### Request flow (backend)
```
Route → validate(Zod) → authMiddleware / requireRole(RBAC) → Controller → Service → Repository → Prisma
```

### Auth model
- **Access token** lives only in memory (immune to XSS token theft).
- **Refresh token** is an **httpOnly cookie**; the client silently calls `/api/auth/refresh` on load and on `401`.
- **Rotation + reuse detection**: every refresh rotates the token; replay of a revoked token revokes the whole session family.

---

## 📡 API Reference

Base URL: `http://localhost:5000`

### Auth
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/register` | — | Create account |
| `POST` | `/api/auth/login` | — | Log in (sets refresh cookie) |
| `POST` | `/api/auth/refresh` | cookie | Rotate tokens |
| `POST` | `/api/auth/logout` | cookie | Revoke session |
| `GET`  | `/api/auth/me` | ✅ | Current user |

### Colleges
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET`  | `/api/colleges` | — | List with search/filter/sort/pagination |
| `GET`  | `/api/colleges/:id` | — | College detail |
| `POST` | `/api/colleges/compare` | — | Compare 2–4 colleges |
| `POST` | `/api/colleges/predictor` | optional | Rank-based recommendations |
| `POST` | `/api/colleges/:id/reviews` | ✅ | Add/update your review |
| `POST` | `/api/colleges` | 🛡 Admin | Create college |
| `PUT`  | `/api/colleges/:id` | 🛡 Admin | Update college |
| `DELETE` | `/api/colleges/:id` | 🛡 Admin | Delete college |

### Discussions
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET`  | `/api/discussions` | — | List questions |
| `GET`  | `/api/discussions/:id` | — | Question + answers |
| `POST` | `/api/discussions` | ✅ | Ask a question |
| `POST` | `/api/discussions/:id/answers` | ✅ | Answer (broadcast via Socket.io) |
| `PATCH`| `/api/discussions/:id/flag` | 🛡 Admin | Flag/hide |

### Users
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET`  | `/api/users/me/saved` | ✅ | Saved colleges |
| `POST` / `DELETE` | `/api/users/me/saved/:collegeId` | ✅ | Save / un-save |
| `PUT`  | `/api/users/me` | ✅ | Update profile |
| `GET`  | `/api/users/me/dashboard` | ✅ | Activity stats |
| `GET`  | `/api/users` | 🛡 Admin | List users |
| `PATCH`| `/api/users/:id/role` | 🛡 Admin | Change role |
| `PATCH`| `/api/users/:id/deactivate` | 🛡 Admin | Deactivate account |

`✅` = authenticated · `🛡 Admin` = requires `ADMIN` role.

---

## 🔐 Security Highlights
- Passwords hashed with **bcrypt** (cost 12).
- **httpOnly + SameSite** refresh cookies; access tokens never touch `localStorage`.
- **Refresh-token rotation** with theft/reuse detection.
- **RBAC** enforced on the server (not just hidden in the UI).
- **Zod** validation on every route; **Helmet**, **rate limiting**, **HPP**, and **XSS sanitization** on all input.

---

## 🗺 Roadmap
- [ ] Real screenshots & a short demo GIF
- [ ] Typed, centralized API/data layer with React Query (caching, retries, optimistic mutations)
- [ ] Profile editing UI (branches, cities, budget) wired to `PUT /api/users/me`
- [ ] College detail dark-mode polish + reviews pagination
- [ ] E2E tests (Playwright) and API tests (Jest/Supertest)
- [ ] CI (lint + typecheck + tests) and Dockerized dev environment
- [ ] Deployment guide (Vercel + Railway/Render + managed Postgres)

---

## 🤝 Contributing
1. Fork the repo and create a feature branch: `git checkout -b feat/your-feature`
2. Commit with clear messages: `git commit -m "feat: add X"`
3. Run lint/typecheck before pushing.
4. Open a Pull Request describing the change and screenshots where relevant.

---

## 📄 License
Released under the **MIT License** — see [`LICENSE`](LICENSE).

---

<div align="center">

**Built with ❤️**

</div>
