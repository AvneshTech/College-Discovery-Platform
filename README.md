# 🎓 College Discovery Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-black)

**A modern full-stack platform for discovering, comparing, and exploring colleges.**

</div>

---

## 🚀 Live Architecture

```text
┌─────────────────┐
│  Frontend       │
│  Next.js        │
│  Vercel         │
└────────┬────────┘
         │ HTTPS API Calls
         ▼
┌─────────────────┐
│  Backend        │
│  Node.js        │
│  Express.js     │
│  Render         │
└────────┬────────┘
         │ Prisma ORM
         ▼
┌─────────────────┐
│  Database       │
│  PostgreSQL     │
│  Neon           │
└─────────────────┘
```

## ✨ Features

- 🔍 Search and discover colleges
- 📊 Compare colleges side-by-side
- 🤖 College prediction module
- 👤 User Authentication (JWT)
- 💾 PostgreSQL database integration
- 📱 Responsive UI
- ☁️ Production-ready deployment

---

## 🛠 Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- CSS

### Backend
- Node.js
- Express.js
- Prisma ORM
- JWT Authentication

### Database
- PostgreSQL
- Neon Database

### Deployment
- Vercel (Frontend)
- Render (Backend)
- Neon (Database)

---

## 📂 Project Structure

```bash
College-Discovery-Platform
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── services/
│   ├── utils/
│   └── public/
│
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── config/
│   └── package.json
│
└── README.md
```

---

## ⚙️ Environment Variables

### Backend

```env
DATABASE_URL=postgresql://username:password@host/neondb?sslmode=require
JWT_SECRET=your_secret_key
NODE_ENV=production
```

### Frontend

```env
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
```

---

## 🚀 Deployment Guide

### 1️⃣ Database Deployment (Neon)

```bash
Create Project
↓
Copy Connection String
↓
Add DATABASE_URL
↓
npx prisma generate
↓
npx prisma db push
```

---

### 2️⃣ Backend Deployment (Render)

**Root Directory**
```text
backend
```

**Build Command**
```bash
npm install && npx prisma generate
```

**Start Command**
```bash
npm start
```

**Environment Variables**
```env
DATABASE_URL=...
JWT_SECRET=...
NODE_ENV=production
```

---

### 3️⃣ Frontend Deployment (Vercel)

```env
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
```

Redeploy after adding the variable.

---

## 💻 Local Development

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

---

## 📡 API Usage

```ts
fetch(`${API_BASE}/api/login`)
fetch(`${API_BASE}/api/register`)
fetch(`${API_BASE}/colleges`)
```

---

## 🔧 Common Issues

### 404 Errors

Verify:

```env
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
```

### Prisma Errors

```bash
npx prisma generate
npx prisma db push
```

### Empty Data

Insert records into Neon database or seed initial data.

---

## 👨‍💻 Developer

**AvneshTech**

Built with ❤️ using Next.js, Node.js, Prisma, Neon, Render, and Vercel.

---

## 📜 License

MIT License
