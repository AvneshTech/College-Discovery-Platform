# College Discovery Platform — Backend

This repository contains the Express backend for the College Discovery Platform.

## Overview

The backend provides:

- user registration and login with JWT authentication
- college listing with filters, pagination, and search
- college creation for admin-style additions
- college comparison support
- saved college management per user
- predictor endpoint for college recommendations by exam rank
- discussion threads with answers
- profile lookup

## Tech stack

- Node.js + Express
- Prisma ORM
- PostgreSQL
- bcryptjs for password hashing
- jsonwebtoken for JWT auth
- cors for cross-origin requests
- dotenv for environment variables

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

Create a `.env` file in `backend/` with the following values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET=your_jwt_secret
PORT=5000
```

- `DATABASE_URL` must point to your PostgreSQL database
- `JWT_SECRET` is used to sign and verify auth tokens
- `PORT` defaults to `5000` if not provided

### 3. Initialize Prisma

```bash
npm run db:generate
npm run db:studio
```

To push the Prisma schema to the database:

```bash
npm run db:push
```

## Database schema

The Prisma schema is defined in `prisma/schema.prisma` and includes:

- `User` — registered users with saved colleges, discussions, and answers
- `College` — college metadata, including rating, fees, courses, and packages
- `SavedCollege` — junction table linking users with saved colleges
- `Discussion` — discussion threads authored by users
- `Answer` — answers to discussions authored by users

## API routes

### Auth

- `POST /api/register` — register a new user
- `POST /api/login` — user login and JWT token issuance

### Colleges

- `GET /api/colleges` — list colleges with optional filters:
  - `page`, `limit`, `search`, `city`, `minRating`, `courseType`
- `POST /api/colleges` — add a new college
- `POST /api/colleges/compare` — compare 2–3 colleges by ids
- `GET /api/colleges/:id` — fetch details for a single college

### Saved colleges

- `GET /api/saved` — fetch saved colleges for the authenticated user
- `POST /api/saved/:collegeId` — save a college for the authenticated user
- `DELETE /api/saved/:collegeId` — remove a saved college

### Predictor

- `POST /api/predictor` — returns recommended colleges based on exam and rank

### Discussions

- `GET /api/discussions` — list all discussions
- `GET /api/discussions/:id` — get a discussion with answers
- `POST /api/discussions` — create a discussion (authenticated)
- `POST /api/discussions/:id/answers` — post an answer to a discussion (authenticated)

### Profile

- `GET /api/profile` — get the current authenticated user profile

## Running the server

```bash
npm run dev
```

The server listens on `http://localhost:5000` by default.

## Frontend integration

This backend is intended to work with the frontend in `../frontned`.

The frontend expects the API base URL to be available via `NEXT_PUBLIC_API_URL`.

## Notes

- JWT authentication is enforced via `Authorization: Bearer <token>` headers for protected routes.
- Passwords are hashed with bcrypt before storage.
- The `authMiddleware` verifies tokens and attaches `req.user`.
- The default root route `GET /` returns a simple health check.
