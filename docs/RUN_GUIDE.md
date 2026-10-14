# Complete Execution & Deployment Guide
## Smart Internship Allocation Engine (SIH25033)

This guide provides step-by-step instructions on **how to run**, **where to run**, **how to configure**, and **how to verify** the entire system.

---

## 1. Where Can You Run This?

| Environment | Purpose | Database | Recommended For |
| :--- | :--- | :--- | :--- |
| **Local (Zero-DB / In-Memory)** | Fast judging demos, quick evaluation, offline presentations | `mongomock` (RAM) | Hackathon presentations, quick testing without installing MongoDB |
| **Local (MongoDB / Atlas)** | Development with persistent data across restarts | Local MongoDB or MongoDB Atlas | Local feature development, profile & application testing |
| **Cloud Production** | Public web access, live judge testing | MongoDB Atlas (Free M0) + Render (Backend) + Vercel (Frontend) | Live prototype submission, external evaluation |

---

## 2. Prerequisites

Ensure your system has the following installed:

- **Node.js**: `v20+` (or `v18+`) — verify with `node -v`
- **npm**: `v10+` — verify with `npm -v`
- **Python**: `3.11+` / `3.12+` / `3.14` — verify with `python --version`
- **Git** (recommended)

---

## 3. How to Run Locally (Step-by-Step)

The project consists of two distinct services that run concurrently:
1. **Backend** (FastAPI running on `http://127.0.0.1:8000`)
2. **Frontend** (React + Vite running on `http://127.0.0.1:5173`)

### Step 3.1: Backend Setup & Execution

Open **Terminal 1** (PowerShell or Bash) in the project root:

```powershell
# Navigate to the project backend
cd e:\smart-internship2\backend

# 1. Create a Python virtual environment (if not already created)
python -m venv .venv

# 2. Activate the virtual environment
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# (If PowerShell blocks script execution, run: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)
# On Linux/macOS:
# source .venv/bin/activate

# 3. Install required Python packages
pip install -r requirements.txt

# 4. Check or create your .env configuration
# (Copy from .env.example if .env does not exist yet)
copy .env.example .env
```

#### Backend Environment Variables (`backend/.env`):
For zero-database offline demo mode:
```ini
APP_NAME=Smart Internship Allocation Engine
APP_ENV=development
SECRET_KEY=dev-only-change-before-production-use
USE_MEMORY_DB=true
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DEMO_ADMIN_EMAIL=admin@example.com
DEMO_ADMIN_PASSWORD=Admin@12345
ENABLE_SEMANTIC_MATCHING=false
```
*(To use a real database, set `USE_MEMORY_DB=false` and provide your MongoDB Atlas connection string in `MONGODB_URI`.)*

#### 5. Start the Backend API:
```powershell
uvicorn app.main:app --reload --port 8000
```
> **Auto-Seeding**: The backend automatically seeds 22 realistic students, 8 internships, and 3 organizations on the first run if the database is empty.

---

### Step 3.2: Frontend Setup & Execution

Open **Terminal 2** in the project root:

```powershell
# Navigate to the frontend directory
cd e:\smart-internship2\frontend

# 1. Install frontend dependencies
npm install

# 2. Check or create .env
# Ensure frontend/.env contains:
# VITE_API_URL=http://127.0.0.1:8000

# 3. Start the Vite development server
npm run dev
```

---

## 4. How to Verify Everything is Running

Open your browser and test the following endpoints:

| Purpose | URL | Expected Response |
| :--- | :--- | :--- |
| **Web Application** | `http://127.0.0.1:5173` | Interactive Portal (Landing page, Student/Admin/Org login) |
| **Interactive API Docs (Swagger)** | `http://127.0.0.1:8000/docs` | FastAPI Swagger UI with all REST endpoints |
| **Backend Health Check** | `http://127.0.0.1:8000/api/health` | `{"status": "ok", "database": {"reachable": true, ...}}` |

---

## 5. Pre-Seeded Demo Accounts for Testing

| Role | Email | Password | Description / Test Scenario |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `admin@example.com` | `Admin@12345` | Runs matching & allocation engine, reviews waitlists, tests "What-If" simulations, views DB analytics |
| **Student (Cyber Profile)** | `aarav@example.com` | `Student@12345` | High compatibility with Cybersecurity Analyst Intern; tests resume review & preferences |
| **Student (AI / ML Profile)** | `diya@example.com` | `Student@12345` | High CGPA, AI/ML specialization; tests eligibility filters |
| **Organization Coordinator** | `org-nic@example.com` | `Org@12345` | Nirbhaya Cyber Works coordinator; posts & manages internships |

### Database Reset & Manual Seeding
To wipe and restore default demo data at any time:
```powershell
cd e:\smart-internship2
.\backend\.venv\Scripts\python.exe scripts\seed_database.py
```

---

## 6. Where and How to Deploy in Cloud (Production)

To deploy for external judges or public demonstrations, use this standard zero-cost stack:

```
[ Frontend: Vercel ]  ---> HTTPS API Calls --->  [ Backend: Render / Railway ]  --->  [ Database: MongoDB Atlas ]
```

### 6.1 Database: MongoDB Atlas (Free M0 Cluster)
1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free **M0 Sandbox** cluster.
3. In **Database Access**, create a user (e.g. `siae_user`) with a strong password.
4. In **Network Access**, add `0.0.0.0/0` (allow all during hackathon/demo).
5. Copy the connection string: `mongodb+srv://siae_user:<password>@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority`.

### 6.2 Backend: Render.com (or Railway)
1. Create a new **Web Service** pointing to your Git repository.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/api/health`
3. Add Environment Variables:
   - `APP_ENV`: `production`
   - `USE_MEMORY_DB`: `false`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection string>`
   - `MONGODB_DB_NAME`: `smart_internship`
   - `SECRET_KEY`: `<Generate a random 32+ character string>`
   - `CORS_ORIGINS`: `https://<your-vercel-frontend>.vercel.app`
   - `ENABLE_SEMANTIC_MATCHING`: `false`

### 6.3 Frontend: Vercel
1. In Vercel, import your Git repository.
2. Configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://<your-backend-app>.onrender.com`
4. Deploy. The `frontend/vercel.json` file is already included for SPA client-side routing rewrites.

---

## 7. How to Run Automated Tests

To ensure everything is working correctly before demonstrating:

### Backend Test Suite (Pytest)
```powershell
cd e:\smart-internship2\backend
.\.venv\Scripts\Activate.ps1
pytest
```
*Expected: 26 passed test cases (covers authentication, RBAC, Gale-Shapley allocation, eligibility filters, and matching algorithm).*

### Frontend Test Suite (Vitest)
```powershell
cd e:\smart-internship2\frontend
npm test
```
*Expected: All component and integration tests pass.*

---

## 8. Common Troubleshooting & Gotchas

1. **PowerShell Script Execution Policy Error**:
   - Error: `running scripts is disabled on this system`
   - Fix: Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in your PowerShell window before activating the `.venv`.
2. **Data Disappears After Backend Restarts**:
   - Cause: `USE_MEMORY_DB=true` uses an in-memory `mongomock` instance that resets when the process exits.
   - Fix: For persistent data, configure a MongoDB Atlas or local MongoDB instance in `backend/.env` with `USE_MEMORY_DB=false`.
3. **Email Validation Errors (`value is not a valid email address`)**:
   - The system uses strict email validation via Pydantic `EmailStr`. Always use standard domains like `@example.com` or `@gmail.com` (do not use reserved domains like `.local` for logins/registrations).
4. **CORS Origin Blocked in Browser**:
   - Ensure the port you run the frontend on (e.g. `http://localhost:5173`) is listed in `CORS_ORIGINS` in `backend/.env`.
