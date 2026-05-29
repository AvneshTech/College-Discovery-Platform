# College Discovery Platform — Frontend

This repository contains the Next.js frontend for the College Discovery Platform.

## Project Overview

The app helps students explore and compare colleges with filters, college detail pages, saved colleges, comparisons, authentication, and more.

### Key features

- Search and filter colleges by name, city, rating, and course type
- Compare 2–3 colleges side by side
- View detailed college pages with overview, courses, placements, and reviews
- Save favorite colleges after login
- Authentication pages: Login and Register
- Additional sections for discussions, predictor, profile, and saved colleges

## Folder structure

- `app/` — Next.js app routes and pages
- `app/components/` — UI components like `Navbar`, `CollegeCard`, and `AddCollegeForm`
- `app/utils/` — app helpers for API base URL and auth management
- `public/` — static assets
- `styles/` — global styling via Tailwind CSS and app CSS

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the backend URL

The frontend uses `NEXT_PUBLIC_API_URL` to connect to the backend API.

Create a `.env` file in `frontned/` if needed:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

If not set, the app defaults to `http://localhost:5000`.

### 3. Run the app

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Backend

This frontend is built to work with the backend in `../backend`.

From the backend folder, run:

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start development server
- `npm run build` — build production app
- `npm run start` — run production build
- `npm run lint` — lint the project

## Notes

- Authentication data is stored in `localStorage` using `token` and `user` keys.
- The API base URL is defined in `app/utils/api.ts`.
- The frontend is built with Next.js 16, React 19, Tailwind CSS 4, and TypeScript.

## Development Tips

- Update homepage behavior in `app/page.tsx`
- Modify the college detail page in `app/college/[id]/page.tsx`
- Use `app/compare/page.tsx` for comparison logic
- Add new API integrations in `app/utils/api.ts`

---

If you want, I can also add a `backend/README.md` describing the server setup and Prisma configuration.