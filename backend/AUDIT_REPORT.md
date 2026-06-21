# Backend Audit Report — College Discovery Platform

**Scope:** Full audit of the uploaded `backend.zip` against `schema.prisma`.
**Verdict up front:** the codebase was in much better shape than the brief implied — the
Controller → Service → Repository → Prisma layering is consistently followed, auth/refresh-rotation
is implemented correctly, and Zod validation is used throughout. The real problems were one
deploy-breaking bug and a set of genuine schema↔API gaps (features the schema supports that no
route ever exposed). This report lists exactly what was found and what was changed. Nothing
existing was removed; every fix is additive or corrects a defect.

---

## 1. Critical bug (would have broken production)

**`src/app.js` — `/api/uploads` was mounted *after* `notFoundHandler`/`errorHandler`.**
Express matches middleware top-to-bottom; once `notFoundHandler` runs, the request is already
answered with a 404. Every upload request — logo, banner, gallery, the original generic
`/api/uploads/image` — was silently dead on the deployed server. **Fixed**: moved the uploads
router up next to the other feature routers, before the 404/error handlers.

---

## 2. Schema ↔ API mismatches found and fixed

| Schema feature | Status before | What was added |
|---|---|---|
| `College.viewsCount` | Field existed, never incremented anywhere | `GET /api/colleges/:id` now records a `CollegeView` row and increments `viewsCount` in one transaction |
| `College.compareCount` | Field existed, never incremented | `POST /api/colleges/compare` now increments it for all compared colleges |
| `College.saveCount` | Field existed, never incremented/decremented | Save/unsave endpoints (`/api/users/me/saved/:collegeId`) now keep it in sync, idempotently (re-saving an already-saved college doesn't double-count) |
| `College` filters: `state`, `course`, `isFeatured`, `isVerified` | Schema/index existed, no query param | Added to `GET /api/colleges` query schema + repository `where` clause |
| Featured / Trending / Most-Viewed colleges | No endpoints | `GET /api/colleges/featured`, `/trending` (7-day `CollegeView` window), `/most-viewed` |
| `Discussion.tags` | Field existed, no input path | `POST /api/discussions` now accepts `tags[]` |
| `Discussion.viewsCount` | Field existed, never incremented | `GET /api/discussions/:id` increments it |
| Trending/popular discussions | No sort option | `GET /api/discussions?sortBy=trending` |
| `User.bio`, `avatarPublicId` | Fields existed, missing from update schema | Added to `updateProfileSchema` and the `/me` & `/profile` select clauses |
| `Upload` model (Cloudinary tracking) | Model existed, nothing ever wrote to it | New upload flows create an `Upload` row on every Cloudinary upload |
| `Notification` model + `NotificationType` enum + `emitNotification()` socket helper | All three existed; **zero routes, zero callers** | Built the full notifications module (below) and wired it into the discussion-reply flow |
| `ContactInquiry` model | Model existed, zero code | Built the full contact module (below) |
| `User.lastLoginAt` | Field existed, never written | `auth.service.login()` now updates it after a successful login |
| Admin dashboard metrics (users/colleges/reviews/discussions/views/saves totals) | Not implemented | New `GET /api/analytics/dashboard` (admin-only) |

---

## 3. New modules created

- **`src/modules/notifications/`** — repository, service (`notify()` helper other modules call —
  persists + emits over the user's Socket.io room), controller, routes:
  `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`.
  Wired into `discussions.routes.js` so replying to someone's discussion now creates+pushes a
  `REPLY` notification to the original author.
- **`src/modules/contact/`** — repository, service, controller, routes, Zod schema:
  `POST /api/contact` (public, rate-limited), `GET /api/contact` (admin), `PATCH /api/contact/:id/resolve` (admin).
- **`src/modules/analytics/`** — `GET /api/analytics/dashboard`, `/most-saved`, `/most-compared` (all admin-only).

## 4. Uploads module — rebuilt

The original module had exactly one endpoint (`POST /api/uploads/image`) that uploaded to
Cloudinary and returned the URL — it never touched the database, never deleted old images, and
had no concept of "this is a college's logo" vs "this is a gallery photo." Rebuilt as:

- `POST /api/uploads/logo`, `/banner` (admin, `multipart/form-data` with `collegeId`) — uploads,
  updates `College.logoUrl/logoPublicId` (or banner equivalents), and **deletes the previous
  Cloudinary asset** (upload-then-delete, so a failed upload never leaves the college imageless).
- `POST /api/uploads/gallery` (admin) — appends `{url, publicId, caption}` to the `gallery` JSON array.
- `DELETE /api/uploads/gallery/:collegeId/:publicId` (admin) — removes one gallery image and cleans up Cloudinary.
- `POST /api/uploads/avatar` (any authenticated user) — same replace-and-clean pattern for `User.avatarUrl/avatarPublicId`.
- `DELETE /api/uploads` (admin, `{publicId}` in body) — generic cleanup.
- The original `POST /api/uploads/image` is **unchanged** for backward compatibility.
- Every upload now also writes an `Upload` row (`publicId`, `url`, `folder`, `uploadedBy`).

---

## 5. API changes — one intentional breaking change

Everything above is additive. **One response shape changed:**

`GET /api/discussions` returned a bare `Discussion[]` array. Real pagination (page/limit, as the
brief explicitly asked for) cannot coexist with "always return every row," so it now returns
`{ discussions, total, page, totalPages }`. This is the only break in the entire audit — flagging
it explicitly rather than silently shipping it, per the "don't break existing APIs" rule. If the
frontend can't absorb this right now, the fix is a 5-minute change: have the frontend read
`response.discussions` instead of `response`, or I can add a `?legacy=true` flag that returns the
bare array if you'd rather defer the frontend change.

---

## 6. Code-quality findings (not changed, flagged for awareness)

- **The real `package.json` has now been swapped in** (you confirmed it after the first pass). I
  re-verified the whole app boots cleanly against the exact pinned versions — including the two
  that actually changed major versions from my reconstruction, **multer `^1.4.5-lts.1` → `^2.2.0`**
  and **helmet `^7` → `^8`** — both still expose the same API surface this codebase calls
  (`multer.memoryStorage()` + `.single()`, `helmet({contentSecurityPolicy, crossOriginResourcePolicy})`),
  so no code changes were needed for the version bump.
- **One real gap this surfaced:** `package.json` defines `"prisma": {"seed": "node prisma/seed.js"}`
  and an `npm run db:seed` script, but no `prisma/seed.js` exists anywhere in the uploaded backend.
  `npx prisma db seed` / `migrate dev` (which auto-runs the seed) will fail until this file exists.
  I didn't fabricate one since I don't know what reference data you want seeded (sample colleges?
  an admin user?) — happy to write it if you tell me what it should contain.
- `colleges.service.update()` and `.remove()` previously called `this.getById(id)` purely for the
  404 check — now that `getById` has a side effect (incrementing `viewsCount`), that would have
  silently inflated view counts on every admin edit/delete. Fixed by calling the repository
  directly for the existence check instead.
- `colleges.repository.recordView` and the save/unsave counters guard against negative values
  (`saveCount: { gt: 0 }` before decrementing) so count drift can never go below zero.
- The recommendation engine (`recommendation.engine.js`) is honestly documented in its own
  comments as a deterministic weighted-scoring model, not a trained ML model — worth knowing
  before you describe it as "AI-powered" in an interview.
- No automated tests exist in the repo. Given the size of this change set, I'd treat adding
  integration tests for the colleges and uploads modules as the next priority — happy to write
  them next.

## 7. Not implemented (needs product/infra decisions, not just code)

These were requested but require things outside this codebase (an email provider, a decision on
token format) so I didn't fake them in:

- **Email verification** — `User.emailVerified` exists and is read, but there's no email-sending
  integration anywhere in the project. Recommended shape: a `VerificationToken` table (or reuse
  the `RefreshToken` hashing pattern), a transactional email provider (Resend/SendGrid/SES), and
  `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`.
- **Forgot/reset password** — same dependency (needs an email provider). Recommended shape:
  `PasswordResetToken` table with hash + expiry (mirror `RefreshToken`), `POST /api/auth/forgot-password`,
  `POST /api/auth/reset-password`.
- **Deadline-reminder notifications** — the `Notification` infra is now built and ready
  (`notificationsService.notify()`), but firing them on a schedule needs a cron/queue (e.g. a
  Render Cron Job or `node-cron`) that scans `AdmissionDeadline` and calls `notify()`. I left this
  out because it requires picking a scheduling mechanism, which is an infra decision, not a code gap.

---

## 8. Migration requirements

No `schema.prisma` changes were needed — your schema already supports everything implemented
above. Run:

```bash
npx prisma generate
npx prisma migrate deploy   # or `migrate dev` locally if the schema has drifted from the DB
```

## 9. Production deployment checklist

- [ ] Verify the reconstructed `package.json` against your real dependency versions, then `npm install`.
- [ ] Set all vars in `.env.example` in Render's environment settings (especially `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` — generate fresh long random values, don't reuse dev secrets).
- [ ] Confirm `CLIENT_URL` matches your deployed frontend origin exactly (CORS + cookie `sameSite=none` depend on it).
- [ ] Run `npx prisma migrate deploy` against the Neon database before starting the server.
- [ ] Smoke-test `POST /api/uploads/logo` end-to-end now that the routing bug is fixed — this was previously silently broken in production.
- [ ] Confirm the frontend's discussions list call is updated for the new `{discussions, total, page, totalPages}` response shape (see §5).
- [ ] Point an uptime monitor at `GET /api/health`.

---

## 10. File-level summary

**Modified:** `app.js`, `colleges.{repository,service,controller,routes,schema}.js`,
`users.routes.js`, `users.schema.js`, `discussions.routes.js`, `uploads.{controller,service,routes}.js`,
`auth.{repository,service}.js`.

**New:** `modules/notifications/*`, `modules/contact/*`, `modules/analytics/routes.js`,
`package.json`, `.env.example`, `prisma/schema.prisma` (copied in for a self-contained deliverable).

**Unchanged:** `middleware/*`, `config/*`, `realtime/socket.js`, `utils/*`, `server.js`, `index.js`,
`recommendation.engine.js` — these were already correct.
