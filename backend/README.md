<div align="center">

<img src="https://img.shields.io/badge/⚙️-CollegeEdge_API-0a0f1e?style=for-the-badge&labelColor=f59e0b" alt="CollegeEdge API" height="40"/>

# CollegeEdge — Backend API

### A layered, secure, production-shaped Express + Prisma API.

RBAC, rotating refresh tokens, Zod validation, hardened middleware, and real-time
discussions — organized as **Controller → Service → Repository** so it stays clean
as it grows.

<br/>

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?style=flat-square&logo=express)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169e1?style=flat-square&logo=postgresql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-realtime-010101?style=flat-square&logo=socket.io)
![JWT](https://img.shields.io/badge/JWT-rotating_refresh-000000?style=flat-square&logo=jsonwebtokens)
![Zod](https://img.shields.io/badge/Zod-validation-3068b7?style=flat-square)

<br/>

[**🚀 Setup**](#-setup) · [**🧩 Architecture**](#-architecture) · [**🔐 Auth Model**](#-auth-model) · [**🛡 Security**](#-security) · [**📡 API**](#-api-reference) · [**🧪 Scripts**](#-scripts)

</div>

---

## 📖 Overview

This is the API behind **CollegeEdge** — college discovery, comparison, a
rank-based predictor, saved shortlists, reviews, and a real-time Q&A forum.

It replaces the original single-file `index.js` with a **modular, layered
backend**. The wiring lives in `app.js` (Express app, no `listen()`) and
`server.js` (HTTP server + Socket.io + `listen()`), so the app is easy to test
and the transport is decoupled from the business logic.

> Every module follows **Controller → Service → Repository**, and the only layer
> that imports Prisma is the **Repository**.

---

## 🧰 Tech Stack

| Concern | Technology |
|---|---|
| Runtime / Framework | Node.js, Express |
| Database / ORM | PostgreSQL, Prisma |
| Real-time | Socket.io (`discussion:{id}` rooms) |
| Auth | JWT access tokens + rotating httpOnly refresh cookies, bcryptjs |
| Validation | Zod (per-route schemas via `validate` middleware) |
| Security | Helmet, CORS, express-rate-limit, HPP, custom XSS sanitizer, RBAC |

---

## 🧩 Architecture

```
src/
├── app.js                      # Express app: security middleware + route wiring (no listen)
├── server.js                   # HTTP server + Socket.io bootstrap + listen()
├── index.js                    # legacy monolith entry (superseded by app.js/server.js)
│
├── config/
│   ├── env.js                  # env loading + validation, derived flags (isProd, TTLs)
│   └── prisma.js               # Prisma client singleton
│
├── middleware/
│   ├── auth.js                 # authMiddleware, optionalAuth, requireRole (RBAC)
│   ├── validate.js             # Zod schema validator (body/params/query)
│   ├── security.js             # helmet, cors, global + auth rate limiters, hpp
│   ├── sanitize.js             # strips XSS payloads from every string in req.body
│   └── errorHandler.js         # asyncHandler, ApiError, notFound + central error handler
│
├── modules/
│   ├── auth/                   # register · login · refresh (rotation) · logout · me
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.repository.js
│   │   └── auth.schema.js
│   ├── colleges/               # list/filter/sort/paginate · detail · compare · predictor · reviews · CRUD
│   │   ├── colleges.routes.js
│   │   ├── colleges.controller.js
│   │   ├── colleges.service.js
│   │   ├── colleges.repository.js
│   │   ├── colleges.schema.js
│   │   └── recommendation.engine.js   # rank-based scoring for the predictor
│   ├── discussions/            # Q&A + real-time answers + admin moderation
│   │   └── discussions.routes.js
│   └── users/                  # saved colleges · profile · dashboard · admin user mgmt
│       ├── users.routes.js
│       └── users.schema.js
│
├── realtime/
│   └── socket.js               # Socket.io handlers, live discussion rooms
│
└── utils/
    ├── tokens.js               # sign/verify access & refresh, hashing, cookie options
    └── slugify.js              # unique slug generation for colleges
```

### Layer responsibilities

| Layer | Responsibility |
|---|---|
| **Routes** | Wire `validate(schema)` → `authMiddleware` / `requireRole()` → controller |
| **Controller** | Thin HTTP layer — parse `req`, call service, shape `res` |
| **Service** | Business logic & orchestration; throws `ApiError` for known failures |
| **Repository** | The **only** layer that imports Prisma — pure data access |

### Request flow
```
Request → Helmet/CORS/RateLimit/HPP/Sanitize
        → validate(Zod)
        → authMiddleware / requireRole(RBAC)
        → Controller → Service → Repository → Prisma → PostgreSQL
        → central errorHandler (ApiError → JSON)
```

---

## 🔐 Auth Model

**Access tokens** (short-lived) are returned in the JSON body and kept **in
memory** on the client — never in `localStorage`, so they can't be stolen via XSS.

**Refresh tokens** (long-lived) are set as an **`httpOnly`, `secure`,
`sameSite`** cookie scoped to `/api/auth` — JavaScript can never read it.

```
login        → access token (JSON)  +  refresh cookie (httpOnly)
401 expired  → POST /api/auth/refresh  (cookie sent automatically)
refresh      → ROTATES the refresh token, returns a fresh access token
reuse/replay → revoked-token reuse ⇒ entire token family revoked (theft signal)
logout       → refresh token revoked + cookie cleared
```

Refresh tokens are stored **hashed** with metadata (userAgent, ip, expiry) so a
leaked DB row can't be replayed as a usable token.

---

## 🛡 Security

- **bcryptjs** password hashing (cost 12).
- **Helmet** secure headers + **CORS** locked to the client origin.
- **Rate limiting** — a global limiter plus a stricter `authLimiter` on auth routes.
- **HPP** (HTTP Parameter Pollution) protection.
- **XSS sanitization** — every string in `req.body` is cleaned before it reaches a handler.
- **Zod** validation on body/params/query for every route.
- **RBAC** enforced on the server via `requireRole("ADMIN")` — not just hidden in the UI.
- `trust proxy` enabled for correct `req.ip` and secure cookies behind a proxy/PaaS.

---

## 📡 API Reference

Base URL: `http://localhost:5000` · Health check: `GET /api/health`

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/register` | — | Create account (rate-limited, Zod-validated) |
| `POST` | `/login` | — | Log in; sets refresh cookie |
| `POST` | `/refresh` | cookie | Rotate tokens, return new access token |
| `POST` | `/logout` | cookie | Revoke refresh token + clear cookie |
| `GET`  | `/me` | ✅ | Current user profile |

### Colleges — `/api/colleges`
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET`  | `/` | — | List with `search`, `city`, `minRating`, `maxFees`, `branch`, `sortBy`, pagination |
| `GET`  | `/:id` | — | College detail |
| `POST` | `/compare` | — | Compare 2–4 colleges by id |
| `POST` | `/predictor` | optional | Rank-based recommendations (logged-in runs are persisted) |
| `POST` | `/:id/reviews` | ✅ | Add/update your review (rating re-aggregated) |
| `POST` | `/` | 🛡 Admin | Create college |
| `PUT`  | `/:id` | 🛡 Admin | Update college |
| `DELETE` | `/:id` | 🛡 Admin | Delete college |

### Discussions — `/api/discussions`
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET`  | `/` | — | List questions (excludes `FLAGGED`) |
| `GET`  | `/:id` | — | Question + answers |
| `POST` | `/` | ✅ | Ask a question |
| `POST` | `/:id/answers` | ✅ | Answer — broadcast to `discussion:{id}` via Socket.io |
| `PATCH`| `/:id/flag` | 🛡 Admin | Flag/hide a discussion |

### Users — `/api/users`
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET`  | `/me/saved` | ✅ | Saved colleges |
| `POST` / `DELETE` | `/me/saved/:collegeId` | ✅ | Save / un-save |
| `PUT`  | `/me` | ✅ | Update profile (name, avatar, preferences, budget) |
| `GET`  | `/me/dashboard` | ✅ | Activity stats (saved, predictor runs, Q&A) |
| `GET`  | `/` | 🛡 Admin | List all users |
| `PATCH`| `/:id/role` | 🛡 Admin | Change role (`STUDENT` ⇄ `ADMIN`) |
| `PATCH`| `/:id/deactivate` | 🛡 Admin | Deactivate account (can't self-deactivate) |

`✅` = authenticated · `🛡 Admin` = requires `ADMIN` role · `cookie` = uses the refresh cookie.

---

## 🚀 Setup

### Prerequisites
- **Node.js** 18+ and **npm**
- **PostgreSQL** 14+ (local or hosted)

```bash
cd backend
npm install

# Configure environment
cp .env.example .env            # fill DATABASE_URL + two JWT secrets
#   generate secrets with:  openssl rand -hex 32

# Database
npx prisma migrate dev --name init
npm run db:seed                 # seeds admin@collegeedge.dev / Admin@123 + sample data

# Run
npm run dev                     # → http://localhost:5000
```

### Environment variables
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for short-lived access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `CLIENT_ORIGIN` | Allowed CORS origin (e.g. `http://localhost:3000`) |
| `PORT` | API port (default `5000`) |

---

## 🧪 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the API in watch mode |
| `npm start` | Start the API (production) |
| `npm run db:seed` | Seed the database |
| `npx prisma migrate dev` | Create/apply migrations |
| `npx prisma studio` | Browse/edit data in the Prisma GUI |

---

## 🗺 Extending the API

- **Seed data** — add `CutoffRecord` rows per (college, exam, branch, category, year) so the predictor has real data to score against.
- **Uploads** — add a `modules/uploads` module (`multer` + Cloudinary/S3) for `logoUrl` / `bannerUrl` / gallery images.
- **Notifications** — add `modules/notifications/email.service.js` (Resend/Nodemailer); call it on new discussion replies and deadline reminders.
- **Testing** — add Jest + Supertest covering the auth flow (rotation/reuse) and RBAC guards.
- **Observability** — structured logging (pino) + a `/metrics` endpoint.

---

<div align="center">

<sub>Part of the <b>CollegeEdge</b> project — see the root <a href="../README.md">README</a> for the full picture.</sub>

</div>
