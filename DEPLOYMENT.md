# TaskFlow Deployment & Supabase Setup Guide

This guide explains how to connect your **Supabase** PostgreSQL database and deploy the **TaskFlow** full-stack application (Express CRUD Backend + React Vite Frontend) to production platforms (Render, Railway, Docker, or Vercel).

---

## 1. Supabase Database Setup

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign in or create an account.
2. Click **New Project** and configure your project name (e.g. `taskflow-db`) and database password.
3. Choose the region closest to your users.

### Step 2: Run the Database Schema SQL
1. In your Supabase Dashboard, open the **SQL Editor** from the left navigation menu.
2. Click **New Query**.
3. Open the file [`supabase/schema.sql`](supabase/schema.sql) in this repository and copy its entire contents.
4. Paste the SQL script into the query editor and click **Run**.
5. This creates:
   - `projects` table with initial projects seeded
   - `team_members` table with initial team members seeded
   - `tasks` table with subtasks, comments, priority, and status
   - Performance indexes on `status`, `project_id`, `assignee_id`, and `due_date`
   - Row Level Security (RLS) policies allowing public workspace access

### Step 3: Get your API Credentials
1. In your Supabase Dashboard, navigate to **Project Settings** (gear icon) -> **API**.
2. Copy:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **anon / public key** (`SUPABASE_ANON_KEY`)
   - **service_role secret key** (`SUPABASE_SERVICE_ROLE_KEY`, optional for backend administration)

---

## 2. Local Environment Configuration

Add the Supabase credentials to your `.env` file:

```env
PORT=5000
NODE_ENV=development

# Supabase Credentials
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Client Configuration
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

> **Note**: If Supabase credentials are empty or omitted, TaskFlow automatically runs in **local in-memory fallback mode** with seed data so you can test immediately without any downtime.

---

## 3. Local Development

Run the backend and frontend:

```bash
# Terminal 1: Start Express CRUD Backend API (runs on port 5000)
npm run dev:server

# Terminal 2: Start Vite Frontend (runs on port 3000, proxies /api to port 5000)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 4. Production Build & Local Test

```bash
# 1. Build frontend (into /dist) and server (into /dist-server)
npm run build

# 2. Start unified production server
npm start
```
The server serves both the REST API endpoints under `/api/*` and the static React SPA at `http://localhost:5000`.

---

## 5. Deployment Options

### Option A: Deploy to Render (Recommended for Full-Stack)
TaskFlow includes a ready-to-use [`render.yaml`](render.yaml) blueprint:
1. Push your repository to GitHub or GitLab.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Blueprint**.
3. Select your repository. Render automatically reads `render.yaml`.
4. Under Environment Variables, input:
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key
5. Click **Apply**. Render will build and deploy your app.

### Option B: Deploy with Docker
You can deploy TaskFlow to any Docker-compatible platform (AWS ECS, Google Cloud Run, Railway, DigitalOcean, Fly.io):

```bash
# Build the Docker image
docker build -t taskflow:latest .

# Run the container
docker run -p 5000:5000 \
  -e SUPABASE_URL="https://your-project-id.supabase.co" \
  -e SUPABASE_ANON_KEY="your-anon-public-key" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  taskflow:latest
```

### Option C: Deploy to Railway
1. Go to [Railway](https://railway.app) -> **New Project** -> **Deploy from GitHub repo**.
2. Select the TaskFlow repository.
3. In **Variables**, add:
   - `PORT=5000`
   - `SUPABASE_URL=...`
   - `SUPABASE_ANON_KEY=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`
4. Railway will automatically detect the `package.json` build and start commands.

---

## 6. CRUD API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & Supabase connection status |
| `GET` | `/api/supabase/status` | Test Supabase database connection |
| `POST` | `/api/supabase/seed` | Seed initial projects, team, and tasks |
| `GET` | `/api/tasks` | List tasks (supports `?projectId=...` and `?search=...`) |
| `GET` | `/api/tasks/:id` | Get details of a single task |
| `POST` | `/api/tasks` | Create a new task |
| `PUT` | `/api/tasks/:id` | Update an existing task |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `POST` | `/api/tasks/bulk-status` | Update status for multiple tasks |
| `POST` | `/api/tasks/bulk-delete` | Delete multiple tasks |
| `GET` | `/api/projects` | Get all projects |
| `GET` | `/api/team` | Get team members |
