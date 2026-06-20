# CollegeEdge

Full-stack college discovery platform. See **`PROJECT_AUDIT.md`** for the full
audit, what was fixed, and the prioritized roadmap.

## Quick start

### Backend
```bash
cd backend
cp .env.example .env          # fill DATABASE_URL + JWT secrets (openssl rand -hex 32)
npm install
npx prisma migrate dev        # create tables
npm run db:seed               # admin@collegeedge.dev / Admin@123 + sample data
npm run dev                   # http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev                    # http://localhost:3000
```

## Architecture
- **Backend**: Express, Prisma/PostgreSQL, modular Repository→Service→Controller,
  RBAC, rotating refresh tokens, Zod, Helmet/rate-limit/XSS, Socket.io.
  Entry: `src/server.js` (HTTP + sockets) → `src/app.js` (Express).
- **Frontend**: Next.js (App Router), Tailwind v4, Framer Motion, Recharts.
  Auth: in-memory access token + httpOnly refresh cookie (`lib/apiClient.ts`,
  `lib/AuthProvider.tsx`).
