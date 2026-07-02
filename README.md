# Criska Nexus — Engineering Portal

A full-stack project management and engineering productivity platform for tracking stories, bugs, daily logs, deployments, and team activity.

## Live URLs

- **Frontend:** https://devtrack-converge.vercel.app
- **Backend API:** https://devtrack-converge.onrender.com/api

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Material UI v5 |
| Backend | Spring Boot 3.2 + Java 21 + JPA/Hibernate |
| Database | PostgreSQL (Neon cloud) |
| Frontend Hosting | Vercel (auto-deploy from GitHub `main`) |
| Backend Hosting | Render free tier (Docker container) |

## Features

- **Dashboard** — story points, deployment stats, today's activity, active stories, open bugs
- **People** — developer profiles with roles, emails, team assignments, and Client/Internal project type
- **Teams** — team management with members and active sprint tracking
- **Stories** — sprint view with story number, status tracking, auto-fill started/completed dates
- **Daily Log** — work log per developer; restricted to current week (Mon–Sun)
- **Bugs & Issues** — severity and status tracking, auto-fill resolved date
- **Deployments** — upcoming (scheduled) and completed tabs; date restricted to today or future
- **Reports** — timesheet view with weekly breakdown and CSV export
- **Mobile responsive** — collapsible sidebar, stacking filter rows, responsive form fields

## Project Structure

```
criska-nexus/
├── frontend/          React + Vite app (deployed to Vercel)
│   ├── src/
│   │   ├── pages/     One file per page
│   │   ├── context/   AppContext (backend probe, heartbeat, auth)
│   │   ├── api/       API mapping functions (frontend ↔ backend)
│   │   ├── data/      Mock data (offline fallback)
│   │   └── layout/    MainLayout with responsive collapsible sidebar
│   └── index.html
└── backend/           Spring Boot app (deployed to Render via Docker)
    ├── src/main/java/com/criska/
    │   ├── controller/    REST controllers
    │   ├── entity/        JPA entities
    │   ├── repository/    Spring Data repositories
    │   └── config/        CORS config, DataInitializer
    ├── Dockerfile
    └── pom.xml
```

## Local Development

### Backend

Requires Java 21. Create `backend/src/main/resources/application-local.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://<your-neon-host>/neondb?sslmode=require
    username: <username>
    password: <password>
```

Run with local profile:
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend auto-detects backend availability on startup and falls back to mock data if offline.

## Environment Variables

### Render (backend)
| Variable | Description |
|---|---|
| `DB_URL` | Neon PostgreSQL JDBC URL |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `PORT` | Server port (set automatically by Render) |

### Vercel (frontend)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (e.g. `https://devtrack-converge.onrender.com`) |

## Backend Cold Start

Render free tier sleeps after 15 minutes of inactivity. The frontend automatically retries for up to 90 seconds on load and shows a "Server starting…" banner. A 10-minute heartbeat keeps the backend awake while a user is logged in.

To prevent cold starts, set up a free monitor at **uptimerobot.com** pointing to `https://devtrack-converge.onrender.com/api/teams` with a 5-minute interval.

## Authentication

Login with a username and password. Passwords can be reset via OTP sent to the registered email. Role-based access controls which actions each user can perform (e.g. only Managers can add/remove developers).
