# CollegeEdge API v2 — Architecture

This replaces the original single-file `index.js` with a layered, modular
backend. Drop this folder in place of your old `backend/`, copy `prisma/schema.prisma`
over your old one, run migrations, and you have a working RBAC + secure API
that your existing frontend can be migrated to incrementally (see the main
audit doc for the migration order).

## Folder structure

```
src/
  config/        env loading + validation, Prisma singleton
  middleware/    security (helmet/cors/rate-limit), auth/RBAC, validation, sanitize, errors
  modules/
    auth/        register, login, refresh-token rotation, logout
    colleges/    CRUD, search/filter/pagination, comparison, recommendation engine
    users/       profile, saved colleges, admin user management
    discussions/ forum + real-time replies + moderation
  realtime/      Socket.io handlers (notifications, live discussion rooms)
  utils/         token signing, slugify
  app.js         Express app (middleware + route wiring) — no listen() here
  server.js      HTTP server + Socket.io + listen()
prisma/
  schema.prisma  upgraded schema (RBAC, reviews, deadlines, scholarships, cutoffs)
```

Each module follows **Controller → Service → Repository**:
- **Repository**: the only layer that imports Prisma. Pure data access.
- **Service**: business logic, orchestration, throws `ApiError` for known failures.
- **Controller**: thin HTTP layer — parses `req`, calls service, shapes `res`.
- **Routes**: wires `validate(schema)` + `authMiddleware` + `requireRole()` + controller.

This is what "Clean Architecture" / "Repository Pattern" means in practice —
when an interviewer asks "how is your backend structured," you point at this.

## Why refresh tokens are cookies, not localStorage

Access tokens (15 min) are returned in the JSON body and kept in memory/React
state on the frontend — never localStorage, so they can't be stolen via XSS.
Refresh tokens (30 days) are set as an `httpOnly`, `secure`, `sameSite=lax`
cookie scoped to `/api/auth` — JavaScript can never read it. On 401 with
`code: "TOKEN_EXPIRED"`, the frontend calls `/api/auth/refresh` (cookie sent
automatically) to get a new access token silently.

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL + two JWT secrets
npx prisma migrate dev --name init
npm run dev
```

## What's intentionally left for you to extend

- `modules/users/users.routes.js` — admin "Manage Users" list is there; wire it to an admin dashboard table in the frontend.
- `prisma/seed.js` — not included; seed colleges + a CutoffRecord per (college, exam, branch, category, year) so the predictor has data to score against.
- Image upload (Cloudinary/S3) for `logoUrl`/`bannerUrl`/`gallery` — add a `modules/uploads` module with `multer` + your storage provider's SDK.
- Email notifications — add a `modules/notifications/email.service.js` using Resend/Nodemailer, call it from the deadline-reminder cron and from `discussions.routes.js` on new replies.
