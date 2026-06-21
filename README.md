<div align="center">

# 🎓 CollegeEdge

### Find Your Dream College — Search, Compare, Predict & Decide

A full-stack college discovery platform built for students to discover, compare, shortlist, and evaluate colleges using intelligent search, admission prediction, reviews, discussions, and real-time interactions.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?style=for-the-badge&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black?style=for-the-badge&logo=socket.io)

</div>

---

# 🌐 Live Deployment

### Frontend (Vercel)

```txt
https://college-discovery-platform-bay.vercel.app
```

### Backend (Render)

```txt
https://college-discovery-platform-b7gc.onrender.com
```

### Database

```txt
Neon PostgreSQL
```

### Repository

```txt
https://github.com/AvneshTech/College-Discovery-Platform
```

---

# 📖 Overview

CollegeEdge helps students make informed college decisions by providing:

- Smart college discovery
- Advanced filtering
- College comparison
- Admission prediction
- Reviews & ratings
- Community discussions
- Saved colleges
- Admin management system

Instead of searching across multiple websites, students get a single platform to compare and evaluate colleges.

---

# ✨ Features

## 👨‍🎓 Student Features

### 🔍 Smart Search & Filters

Search colleges by:

- Name
- City
- State
- Branch
- Rating
- Fees

Includes:

- Debounced search
- Pagination
- Sorting

---

### ⚖️ College Comparison

Compare multiple colleges side-by-side:

- Fees
- Placements
- NIRF Rank
- Ratings
- Courses

---

### 🎯 Admission Predictor

Predict admission chances using:

- JEE Main Rank
- JEE Advanced Rank
- Category
- State Quota
- Branch Preferences

---

### 🔖 Save Colleges

Students can:

- Save colleges
- Create shortlist
- Manage favorites

---

### ⭐ Reviews & Ratings

Students can:

- Submit reviews
- Rate colleges
- View aggregated ratings

---

### 💬 Real-Time Discussions

Built using Socket.io:

- Ask questions
- Reply instantly
- Real-time updates

---

### 🌙 Dark Mode

- System-aware
- Persistent theme
- Zero flash loading

---

## 🛠 Admin Features

### Admin Dashboard

Manage:

- Users
- Colleges
- Reviews
- Discussions

---

### User Management

- Change roles
- Promote admins
- Deactivate accounts

---

### College Management

- Add colleges
- Edit colleges
- Delete colleges

---

### Discussion Moderation

- Flag content
- Hide discussions
- Manage community

---

# 🔐 Authentication & Security

Implemented production-grade authentication:

### JWT Authentication

- Access Token
- Refresh Token

### Refresh Token Rotation

- HTTP Only Cookies
- Secure Cookies
- Token Reuse Detection

### Security Middleware

- Helmet
- CORS
- HPP
- Rate Limiting
- XSS Sanitization

### RBAC

Role-Based Access Control:

- STUDENT
- ADMIN

---

# 🧰 Tech Stack

## Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide Icons

---

## Backend

- Node.js
- Express.js
- Socket.io

---

## Database

- PostgreSQL
- Prisma ORM
- Neon Database

---

## Authentication

- JWT
- Refresh Token Rotation
- HTTP Only Cookies

---

## Deployment

### Frontend

```txt
Vercel
```

### Backend

```txt
Render
```

### Database

```txt
Neon PostgreSQL
```

### Images

```txt
Cloudinary (Upcoming)
```

---

# 🏗 Architecture

```txt
Next.js Frontend (Vercel)
           │
           ▼
Express Backend (Render)
           │
           ▼
Prisma ORM
           │
           ▼
Neon PostgreSQL
           │
           ▼
Cloudinary
```

---

# 🔄 Request Flow

```txt
Client
  │
  ▼
Route
  │
  ▼
Validation (Zod)
  │
  ▼
Authentication
  │
  ▼
Controller
  │
  ▼
Service
  │
  ▼
Repository
  │
  ▼
Prisma
  │
  ▼
PostgreSQL
```

---

# 🚀 Deployment Process

## Database

Hosted on:

```txt
Neon PostgreSQL
```

### Features

- Managed PostgreSQL
- Branching
- SSL Connections
- Automatic Scaling

---

## Backend

Hosted on:

```txt
Render
```

### Environment Variables

```env
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLIENT_URL=
NODE_ENV=production
```

---

## Frontend

Hosted on:

```txt
Vercel
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=
```

---

# 📡 API Modules

## Auth

```txt
/api/auth/register
/api/auth/login
/api/auth/logout
/api/auth/refresh
/api/auth/me
```

---

## Colleges

```txt
/api/colleges
/api/colleges/:id
/api/colleges/compare
/api/colleges/predictor
```

---

## Reviews

```txt
/api/colleges/:id/reviews
```

---

## Discussions

```txt
/api/discussions
/api/discussions/:id
/api/discussions/:id/answers
```

---

## Users

```txt
/api/users
/api/users/me
/api/users/me/saved
```

---

# 📈 Future Improvements

## 1. Cloudinary Integration

Add:

- College Logos
- College Banners
- Gallery Uploads

---

## 2. AI Recommendation Engine

Recommend colleges using:

- Rank
- Budget
- Branch
- Category
- Location

Using:

- OpenAI
- Gemini

---

## 3. Analytics Dashboard

Add charts for:

- User Growth
- Most Viewed Colleges
- Review Trends
- Discussion Activity

---

## 4. Email Notifications

Using:

- Nodemailer
- Cron Jobs

Examples:

- Saved College Updates
- Admission Alerts

---

## 5. SEO Optimization

Implement:

- Metadata API
- Open Graph
- Twitter Cards
- JSON-LD

---

## 6. CI/CD Pipeline

GitHub Actions:

- Lint
- Build
- Prisma Validation
- Automated Deployments

---

## 7. Docker Support

Add:

- Dockerfile
- Docker Compose

---

## 8. PWA Support

Features:

- Install App
- Offline Support
- Push Notifications

---

## 9. College Comparison Charts

Add:

- Radar Charts
- Placement Trends
- Fee Comparison

---

## 10. Custom Domain

Suggested:

```txt
collegeedge.in
```

or

```txt
collegeedge.tech
```

---

# 💼 Resume Highlights

### CollegeEdge – College Discovery & Comparison Platform

- Developed a full-stack college discovery platform using Next.js, Express.js, Prisma ORM, PostgreSQL, and Socket.io.
- Implemented advanced search, filtering, admission prediction, college comparison, reviews, and discussions.
- Designed secure authentication using JWT access tokens and rotating HTTP-only refresh tokens.
- Built real-time communication features using Socket.io.
- Implemented RBAC, request validation, rate limiting, and production-grade security middleware.
- Deployed frontend on Vercel, backend on Render, and database on Neon PostgreSQL.

---

# 📄 License

MIT License

---

<div align="center">

Built with ❤️ by Avnesh

</div>