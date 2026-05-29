# College Discovery Platform

A full-stack college discovery web application with:
- **Frontend** deployed on **Vercel**
- **Backend** deployed on **Render**
- **Database** hosted on **Neon PostgreSQL**

## Live Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Neon

## Tech Stack

- **Frontend:** Next.js, React, TypeScript
- **Backend:** Node.js, Express
- **Database:** PostgreSQL on Neon
- **ORM:** Prisma
- **Deployment:** Vercel + Render + Neon

## Project Structure

```text
college-discovery-platform/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── package.json
│   └── .env
├── frontend/
│   ├── app/
│   ├── components/
│   ├── utils/
│   ├── package.json
│   └── .env.local
└── README.md
```

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your_secret_key
NODE_ENV=production
```

### Frontend (`frontend/.env.local` or Vercel Environment Variables)
```env
NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
```

## Deployment Guide

### 1. Deploy Database on Neon
1. Create a new Neon project.
2. Copy the PostgreSQL connection string.
3. Add the connection string to `DATABASE_URL` in the backend environment variables.
4. Run Prisma to create tables:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### 2. Deploy Backend on Render
1. Push the project to GitHub.
2. Create a **New Web Service** on Render.
3. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `npm start`
4. Add environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`
5. Deploy the service.

### 3. Deploy Frontend on Vercel
1. Import the repository into Vercel.
2. Set the frontend environment variable:
   - `NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com`
3. Redeploy the frontend.

## Local Development

### Backend
```bash
cd backend
npm install
npx prisma generate
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Connection Notes

The frontend should call the backend using the base URL from:

```ts
process.env.NEXT_PUBLIC_API_URL
```

Example:
```ts
fetch(`${API_BASE}/api/login`)
fetch(`${API_BASE}/api/register`)
fetch(`${API_BASE}/colleges?page=1`)
```

## Common Issues

### 404 or HTML response instead of JSON
This usually means the frontend is calling the Vercel domain instead of the Render backend. Make sure `NEXT_PUBLIC_API_URL` is set correctly.

### Prisma connection errors
Check that:
- `NOw you see all the vercel` is copied correctly from Neon
- `sslmode=require` is included
- the backend has been redeployed after updating environment variables

### Empty college list
This usually means the database has no rows yet. Add seed data or insert records through your app or Prisma.

## Useful Commands

```bash
npx prisma generate
npx prisma db push
npm install
npm start
```

## License

This project is for educational use.
