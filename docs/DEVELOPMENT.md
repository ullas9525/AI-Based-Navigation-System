<!-- generated-by: gsd-doc-writer -->
# Development — AI Based Navigation System

This document covers local development setup, build commands, code style, and contribution workflow for contributors to the AI Based Navigation System.

---

## Local Setup

### Prerequisites

- **Python 3.x** — for the Flask backend API server
- **Node.js >= 18** — for the Vite frontend dev server
- **npm** — for frontend dependency management

### Fork & Clone

```bash
git clone <repository-url>
cd "AI Based Navigation System"
```

### 1. Backend Setup

```bash
cd backend

# Create and activate a virtual environment (recommended)
python -m venv venv
.\venv\Scripts\Activate   # Windows
# source venv/bin/activate  # macOS / Linux

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env and set your Gemini API key (or leave empty for mock data)
```

The backend `.env` file should contain:

```
GEMINI_API_KEY=your-google-gemini-api-key-here
```

If no API key is set, both `process_blueprint()` and `validate_blueprint()` print a warning before falling back: `process_blueprint()` returns hardcoded mock data (13 nodes, 14 edges) while `validate_blueprint()` returns `(True, "Mock validation successful")`.

### 2. Frontend Setup

```bash
cd frontend
npm install
```

### 3. Start Development Servers

Run both servers in separate terminals:

**Terminal 1 — Backend:**

```bash
cd backend
python app.py
```

The Flask server starts on `http://localhost:5000` with debug mode enabled (auto-reloads on file changes).

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

The Vite dev server starts on `http://localhost:5173` with Hot Module Replacement (HMR) enabled.

---

## Build Commands

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Build the frontend for production (outputs to `frontend/dist/`) |
| `npm run preview` | Locally preview the production build |
| `npm run lint` | Run ESLint across all frontend source files |

### Backend

The backend does not have a build step. It runs directly from source using `python app.py`. There are no `pyproject.toml`, `setup.py`, or `setup.cfg` files — the project uses a flat `requirements.txt` for dependency management.

---

## Code Style

### Frontend (ESLint)

- **Tool:** ESLint 9 with flat config (`eslint.config.js`)
- **Plugins:** `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`
- **Base config:** `@eslint/js` recommended rules
- **Run:** `npm run lint` from the `frontend/` directory
- **CI enforcement:** No CI pipeline detected — linting is manual only
- **Key rule:** `no-unused-vars` is set to error (with `varsIgnorePattern: '^[A-Z_]'`)

The ESLint config targets `**/*.{js,jsx}` files, runs on the browser globals preset, and ignores the `dist/` directory.

### Backend (Python)

The backend has **no configured linter, formatter, or type checker**. There is no `.pylintrc`, `pyproject.toml`, `setup.cfg`, or flake8 config. Consider adding `ruff` or `pylint` for Python code quality enforcement.

### Editor

No `.editorconfig` file is present in the repository. There are no project-wide editor settings.

---

## Git Workflow

### Default Branch

The default (and only) branch is `main`.

### Branch Conventions

No branch naming convention has been documented. The repository currently uses a single `main` branch with no feature, fix, or release branches. When adding new features or fixes, a consistent naming pattern such as `feat/`, `fix/`, or `chore/` prefixes is recommended.

### Commit Messages

No commit message convention is documented. Consider following [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `chore:`) for consistency.

---

## Pull Request Process

The repository does **not** have a PULL_REQUEST_TEMPLATE.md or CONTRIBUTING.md file. When submitting a pull request, follow these general guidelines:

1. **Create a feature branch** from `main` with a descriptive name (e.g., `feat/add-floor-switching`).
2. **Make focused commits** — each commit should represent a single logical change.
3. **Run linting** — execute `npm run lint` in the frontend directory to ensure no ESLint errors are introduced.
4. **Test the full workflow** — verify that uploading a blueprint, generating a QR code, and navigating a building all work correctly.
5. **Keep PRs small** — a single PR should address one feature or bug fix.
6. **Describe changes clearly** — include a summary of what was changed and why in the PR description.
7. **No CI checks** — there is currently no automated CI pipeline. PRs are reviewed manually.

---

## Known Development Notes

### Coordinate System

The system uses a unified coordinate pipeline:

| Stage | Range | Location |
|---|---|---|
| Gemini AI output | 0–100 (%) | `backend/app/services/image_processor.py` |
| Database storage | 0–1000 (integer) | `backend/app/database.py` |
| Three.js rendering | -50 to +50 | `frontend/src/components/ui/Map3D.jsx` (`(coord - 500) / 10`) |

### Gemini API Fallback

Without a valid `GEMINI_API_KEY` in `backend/.env`, the blueprint analysis silently falls back to mock data. Check the backend console output for warnings when running without an API key.

### Database

- SQLite database at `backend/app/database.db` (gitignored, auto-created on first run)
- Schema includes `buildings`, `nodes`, `edges`, and `walls` tables
- Schema migrations use `ALTER TABLE ... ADD COLUMN` wrapped in try/except blocks for safe upgrades

### Static Files

- Uploaded blueprints and QR codes: `backend/uploads/` (served at `/uploads/<filename>`)
- 360° media assets: `backend/uploads/media/` (served at `/uploads/media/<filename>`)
- Both directories are gitignored

### No Test Suite

The project currently has **no test suite** for either the backend or frontend. There are no test runners configured (`jest`, `pytest`, `vitest`, etc.) and no test directories.

---

## Next Steps

- See [ARCHITECTURE.md](ARCHITECTURE.md) for system design and data flow details
- See [CONFIGURATION.md](CONFIGURATION.md) for all configuration options and hardcoded defaults
- See [README.md](../README.md) for quick start and usage examples
