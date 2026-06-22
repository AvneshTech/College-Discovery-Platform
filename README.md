<div align="center">

# 🎓 CollegeEdge

### Find Your Dream College — Search, Compare, Predict & Decide

A production-ready full-stack college discovery platform that helps students search, compare, evaluate, shortlist, and discuss colleges through an intuitive and data-driven experience.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?style=for-the-badge&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black?style=for-the-badge&logo=socket.io)

</div>

---

# 🌟 Overview

Choosing the right college is one of the most important decisions for students. Unfortunately, information is often scattered across multiple websites, making comparison and decision-making difficult.

**CollegeEdge** solves this problem by providing a centralized platform where students can:

- Discover colleges
- Compare institutions
- Predict admission chances
- Read authentic reviews
- Participate in community discussions
- Build personalized shortlists

The platform combines modern web technologies with a scalable architecture to deliver a seamless experience.

---

# 🌐 Live Demo

## Frontend

```txt
https://college-discovery-platform-bay.vercel.app/
```

## Backend

```txt
https://college-discovery-platform-b7gc.onrender.com/
```

## Database

```txt
postgresql://neondb_owner:**Password**@ep-sparkling-sun-aia9596g-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Repository

```txt
https://github.com/AvneshTech/College-Discovery-Platform
```

---

# 📸 Screenshots

## Home Page

![Home Page](screenshots/Home%20page.png)

## College Search & Filtering

![College Search & Filtering](screenshots/College%20Search%20&%20Filtering.png)

## College Comparison

![College Comparison](screenshots/College%20Comparison.png)

## Admission Predictor

![Admission Predictor](screenshots/Admission%20Predictor.png)

## College Details Page

![College Details](screenshots/College%20Details%20Page.png)

## Discussion Forum

![Discussion Forum](screenshots/Discussion%20Forum.png)

## User Dashboard

![User Dashboard](screenshots/User%20Dashboard.png)

## Admin Dashboard

![Admin Dashboard](screenshots/Admin%20Dashboard.png)

---

# 🎯 Problem Statement

Students often rely on multiple platforms to collect information about:

- College Rankings
- Placement Statistics
- Tuition Fees
- Admission Cutoffs
- Reviews
- Student Experiences

This process is time-consuming and fragmented.

CollegeEdge centralizes these resources into a single platform, enabling students to make informed decisions through data-driven insights and community engagement.

---

# ✨ Key Features

## 👨‍🎓 Student Features

### 🔍 Smart College Discovery

Search colleges using:

- College Name
- City
- State
- Branch
- Course
- Rating
- Fees

Features:

- Debounced Search
- Pagination
- Dynamic Filtering
- Sorting
- Responsive UI

---

### ⚖️ College Comparison

Compare multiple colleges side-by-side based on:

- Tuition Fees
- Placement Records
- NIRF Ranking
- Student Ratings
- Available Courses
- Campus Information

---

### 🎯 Admission Predictor

Estimate admission chances using:

- JEE Main Rank
- JEE Advanced Rank
- Category
- State Quota
- Preferred Branch

Provides personalized college recommendations.

---

### 🔖 College Shortlisting

Students can:

- Save Colleges
- Create Personalized Shortlists
- Manage Favorite Colleges
- Track Interested Institutions

---

### ⭐ Reviews & Ratings

Community-driven review system:

- Submit Reviews
- Rate Colleges
- View Average Ratings
- Read Student Experiences

---

### 💬 Real-Time Discussions

Built using Socket.io:

- Create Discussions
- Ask Questions
- Post Answers
- Receive Real-Time Updates

---

### 🌙 Dark Mode

Features:

- Persistent Theme Selection
- System Preference Detection
- Smooth Theme Switching
- Flash-Free Loading Experience

---

## 🛠 Admin Features

### 📊 Admin Dashboard

Manage:

- Users
- Colleges
- Reviews
- Discussions

---

### 👥 User Management

- View Users
- Change User Roles
- Promote Admins
- Deactivate Accounts

---

### 🏫 College Management

- Add Colleges
- Update Information
- Delete Colleges
- Manage Metadata

---

### 🛡 Discussion Moderation

- Flag Content
- Remove Spam
- Moderate Discussions
- Maintain Community Standards

---

# 🔴 Real-Time Capabilities

Powered by Socket.io

Features:

- Instant Discussion Updates
- Live Answers
- Real-Time Community Interaction

Architecture:

```txt
Client
   │
Socket.io
   │
Backend Server
   │
Broadcast Events
   │
Connected Clients
```

---

# 🔐 Authentication & Security

Implemented production-grade security practices.

## Authentication

### JWT-Based Authentication

- Access Tokens
- Refresh Tokens

### Refresh Token Rotation

- Token Rotation
- Reuse Detection
- Automatic Renewal

### Secure Cookies

- HTTP-Only Cookies
- Secure Cookies
- SameSite Protection

---

## Security Middleware

Implemented:

✅ Helmet

✅ CORS Protection

✅ HPP Protection

✅ Rate Limiting

✅ XSS Sanitization

✅ Request Validation

✅ Secure Headers

---

## RBAC (Role-Based Access Control)

Roles:

### STUDENT

Access to:

- Search Colleges
- Reviews
- Discussions
- Saved Colleges

### ADMIN

Access to:

- Dashboard
- User Management
- College Management
- Content Moderation

---

# ⚡ Performance Optimizations

Implemented:

- Server Components
- Route-Based Code Splitting
- Pagination
- Debounced Search
- Lazy Loading
- Optimized API Calls
- Metadata Generation
- Responsive Rendering

---

# 🏗 System Architecture

```txt
┌─────────────────────┐
│     Next.js App     │
│       Vercel        │
└──────────┬──────────┘
           │
           │ REST API
           ▼
┌─────────────────────┐
│   Express Server    │
│       Render        │
└──────────┬──────────┘
           │
           │ Prisma ORM
           ▼
┌─────────────────────┐
│ Neon PostgreSQL DB  │
└─────────────────────┘

      Socket.io
           ▲
           │
   Real-Time Features
```

---

# 🔄 Request Lifecycle

```txt
Client Request
       │
       ▼
Route Handler
       │
       ▼
Validation Layer
       │
       ▼
Authentication
       │
       ▼
Controller Layer
       │
       ▼
Service Layer
       │
       ▼
Repository Layer
       │
       ▼
Prisma ORM
       │
       ▼
PostgreSQL Database
```

---

# 🗄 Database Design

Core Entities:

```txt
users
colleges
reviews
ratings
saved_colleges
discussions
answers
refresh_tokens
```

Relationships:

```txt
User
 ├── Reviews
 ├── Saved Colleges
 └── Discussions

College
 ├── Reviews
 ├── Ratings
 └── Comparisons

Discussion
 ├── Answers
 └── User
```

---

# 🧰 Tech Stack

## Frontend

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide React

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
- HTTP-Only Cookies

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

### Media Storage

```txt
Cloudinary (Planned)
```

---

# 📡 REST API Modules

## Authentication

| Method | Endpoint | Description |
|----------|----------|-------------|
| POST | /api/auth/register | Register User |
| POST | /api/auth/login | Login User |
| POST | /api/auth/logout | Logout User |
| POST | /api/auth/refresh | Refresh Token |
| GET | /api/auth/me | Current User |

---

## Colleges

| Method | Endpoint | Description |
|----------|----------|-------------|
| GET | /api/colleges | Get Colleges |
| GET | /api/colleges/:id | College Details |
| GET | /api/colleges/compare | Compare Colleges |
| POST | /api/colleges/predictor | Admission Prediction |

---

## Reviews

| Method | Endpoint | Description |
|----------|----------|-------------|
| GET | /api/colleges/:id/reviews | Get Reviews |
| POST | /api/colleges/:id/reviews | Add Review |

---

## Discussions

| Method | Endpoint | Description |
|----------|----------|-------------|
| GET | /api/discussions | Get Discussions |
| POST | /api/discussions | Create Discussion |
| GET | /api/discussions/:id | Discussion Details |
| POST | /api/discussions/:id/answers | Add Answer |

---

## Users

| Method | Endpoint | Description |
|----------|----------|-------------|
| GET | /api/users/me | Current User |
| GET | /api/users/me/saved | Saved Colleges |
| GET | /api/users | Admin User List |

---

# 🧠 Engineering Challenges Solved

## Secure Authentication

Implemented rotating refresh tokens with reuse detection to improve session security and reduce token abuse risks.

---

## Efficient Search System

Built optimized filtering with pagination and debounced search to improve responsiveness and reduce server load.

---

## Real-Time Communication

Integrated Socket.io to provide instant updates within discussion threads.

---

## Scalable Backend Architecture

Structured backend using:

```txt
Controller
    ↓
Service
    ↓
Repository
    ↓
Prisma
    ↓
Database
```

This separation improves maintainability and scalability.

---

# 🚀 Local Setup

## Clone Repository

```bash
git clone YOUR_REPOSITORY_URL
cd College-Discovery-Platform
```

---

## Install Dependencies

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd backend
npm install
```

---

## Environment Variables

### Backend

```env
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLIENT_URL=
NODE_ENV=development
```

### Frontend

```env
NEXT_PUBLIC_API_URL=
```

---

## Run Development Servers

### Backend

```bash
npm run dev
```

### Frontend

```bash
npm run dev
```

---

# 📈 Future Enhancements

## AI Recommendation Engine

Recommend colleges using:

- Rank
- Budget
- Branch
- Location
- Category

Technologies:

- OpenAI
- Gemini

---

## Cloudinary Integration

Add:

- College Logos
- Banners
- Image Galleries

---

## Email Notifications

Using:

- Nodemailer
- Scheduled Jobs

Examples:

- Admission Alerts
- Saved College Updates

---

## Analytics Dashboard

Add:

- User Growth Metrics
- Most Viewed Colleges
- Review Analytics
- Discussion Activity

---

## SEO Improvements

Implement:

- Open Graph
- Twitter Cards
- JSON-LD
- Advanced Metadata

---

## CI/CD Pipeline

Using:

- GitHub Actions
- Automated Testing
- Deployment Automation

---

## Docker Support

Add:

- Dockerfile
- Docker Compose
- Production Containers

---

## PWA Support

Features:

- Offline Access
- Installable App
- Push Notifications

---

# 💼 Resume Highlights

### CollegeEdge | Full Stack Web Application

**Tech Stack:** Next.js, TypeScript, Express.js, PostgreSQL, Prisma ORM, Socket.io, JWT, Neon, Render, Vercel

- Developed a production-ready college discovery platform enabling search, comparison, admission prediction, reviews, and community discussions.
- Built scalable REST APIs using Express.js, Prisma ORM, and PostgreSQL following a layered architecture.
- Implemented JWT authentication with rotating refresh tokens and secure HTTP-only cookies.
- Developed real-time discussion functionality using Socket.io.
- Optimized application performance using pagination, debounced search, and server-side rendering.
- Deployed a distributed architecture using Vercel, Render, and Neon PostgreSQL.

---

# 🤝 Contributing

Contributions are welcome.

Steps:

1. Fork Repository
2. Create Feature Branch
3. Commit Changes
4. Push Branch
5. Open Pull Request

---

# 📄 License

MIT License

---

<div align="center">

### ⭐ If you like this project, consider giving it a star!

Built with ❤️ by **Avnesh Kumar**

</div>