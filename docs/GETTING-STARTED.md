<!-- generated-by: gsd-doc-writer -->
# Getting Started

This guide walks you through setting up the AI Based Navigation System for the first time — from cloning the repository to seeing a working application.

## Prerequisites

Before you begin, ensure the following are installed on your machine:

| Dependency | Version | Purpose |
|------------|---------|---------|
| **Python** | >= 3.9 | Backend API server (Flask) |
| **Node.js** | >= 18 | Frontend development server (Vite) |
| **npm** | >= 9 (ships with Node.js 18+) | Frontend package manager |
| **Git** | Any recent version | Clone the repository |

The backend dependencies are listed in `backend/requirements.txt`. The frontend requires no global tools beyond Node.js and npm.

> **Note:** The backend can optionally use a **Google Gemini API key** (Gemini 2.5 Flash) for AI-powered blueprint analysis. Without it, the system falls back to mock data (13 nodes, 14 edges) — the application still runs and is fully navigable.

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AI-Based-Navigation-System
```

Replace `<repository-url>` with the actual remote URL. If you have already cloned the repository, skip to step 2.

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

This installs Flask, NetworkX, OpenCV, Pillow, the Google Generative AI SDK, and other dependencies.

### 3. Configure Environment (Optional)

If you want AI-powered blueprint analysis, create or edit `backend/.env` with your Gemini API key:

```bash
# backend/.env
GEMINI_API_KEY=your_gemini_api_key_here
```

Without this key, blueprint uploads use mock data — the application still works for navigation demos.

### 4. Frontend Setup

Open a second terminal and run:

```bash
cd frontend
npm install
```

This installs React 19, Three.js, Tailwind CSS v4, and all other frontend dependencies.

## First Run

Start both servers in separate terminals:

**Terminal 1 — Backend:**

```bash
cd backend
python app.py
```

The Flask server starts on `http://localhost:5000`. Verify it is running by visiting [http://localhost:5000/health](http://localhost:5000/health) — you should see:

```json
{"status": "healthy", "service": "AI Navigation Backend"}
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

The Vite development server starts on `http://localhost:5173`.

**Open your browser** and navigate to [http://localhost:5173](http://localhost:5173). You will see the Landing Page.

## Common Setup Issues

### Port already in use

**Symptom:** The backend or frontend fails to start with an `EADDRINUSE` or "port already in use" error.

**Solution:** Check if another process is using port 5000 (backend) or 5173 (frontend):

```bash
# Check what is using port 5000 (Windows)
netstat -ano | findstr :5000

# Check what is using port 5000 (macOS/Linux)
lsof -i :5000
```

Kill the blocking process or change the port in `backend/app.py` (line 44) for the backend, or in `frontend/vite.config.js` for the frontend. The frontend Vite server will automatically try the next available port (e.g., 5174) if 5173 is taken.

### Gemini API key missing

**Symptom:** Blueprint uploads process successfully but always return mock data (never real AI analysis).

**Solution:** Ensure `backend/.env` exists with a valid `GEMINI_API_KEY`. The key must be a valid Google Gemini API key. After adding or updating the key, restart the Flask server.

### Python or Node.js version mismatch

**Symptom:** `pip install` fails with dependency errors, or `npm install` reports engine incompatibility.

**Solution:** Verify your versions:

```bash
python --version   # Must be >= 3.9
node --version     # Must be >= 18
npm --version      # Must be >= 9
```

Use a version manager like `pyenv` (Python) or `nvm`/`fnm` (Node.js) to switch to a compatible version.

### SQLite database conflicts

**Symptom:** Backend crashes on startup with `OperationalError` related to duplicate columns.

**Solution:** Delete the existing SQLite database and let the application recreate it on the next startup:

```bash
rm backend/app/database.db
```

The database is auto-created by `app.database.init_db()` when the Flask app starts.

## Next Steps

Now that the application is running:

- **Explore the architecture** — Read [ARCHITECTURE.md](ARCHITECTURE.md) for a system overview and component relationships.
- **Review configuration** — Read [CONFIGURATION.md](CONFIGURATION.md) for all environment variables and settings.
- **Start developing** — See [AGENTS.md](../AGENTS.md) for project conventions, API endpoints, and codebase structure.
- **Upload a blueprint** — Log in at `/admin/login` (default credentials: `admin@navsystem.com` / `admin`) and navigate to the Blueprint Upload page.
