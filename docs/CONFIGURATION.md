<!-- generated-by: gsd-doc-writer -->
# Configuration

This document describes all configuration options for the AI Based Navigation System. The project consists of a **Flask backend** (Python) and a **React frontend** (Vite).

---

## Environment Variables

<!-- VERIFY: The GEMINI_API_KEY value shown is an example only. A real key must be obtained from Google AI Studio. -->

### Backend

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Optional | *(empty)* | Google Gemini API key for blueprint image analysis. Without it, `process_blueprint()` and `validate_blueprint()` silently fall back to hardcoded mock data (13 nodes, 14 edges). Obtain from [Google AI Studio](https://aistudio.google.com/). |

### Frontend

The frontend does **not** use any environment variables. All service URLs are hardcoded (see [Hardcoded Defaults](#hardcoded-defaults)).

---

## Config File Format

The project uses **no configuration files** (JSON, YAML, TOML). The backend uses a single `.env` file for secrets, and all other configuration is set programmatically in Python source files.

### `.env` file (Backend)

Located at `backend/.env`. Example contents:

```
GEMINI_API_KEY=your-google-gemini-api-key-here
```

The `.env` file is loaded automatically by `python-dotenv` in `app/services/image_processor.py` via the `load_dotenv()` call. It is excluded from version control (listed in `backend/.gitignore`).

### Frontend configuration

The frontend is configured solely by React component code in `src/pages/`. No `.env`, `.env.development`, or `.env.production` files are used.

---

## Required vs Optional Settings

### Required on startup

There are **no hard required settings** that cause the backend to fail on startup. If `GEMINI_API_KEY` is not set:

- `process_blueprint()` prints a warning and returns mock data.
- `validate_blueprint()` prints a warning and returns `(True, "Mock validation successful")`.

The Flask application starts and serves all routes regardless.

### Optional with defaults

| Setting | Default | Set in |
|---|---|---|
| `GEMINI_API_KEY` | `""` (empty string) | `backend/app/services/image_processor.py` (lines 19, 160) |
| `UPLOAD_FOLDER` | `backend/uploads/` | `backend/app.py` (line 15) |
| Blueprint scale (geo transform) | `100` meters | `backend/app/services/geo_transform.py` (default parameter, line 5) |
| SQLite database path | `backend/app/database.db` | `backend/app/database.py` (line 4) |
| CORS origin | All origins (`*`) | `backend/app.py` (line 12: `CORS(app)` without arguments) |
| Flask debug mode | `True` | `backend/app.py` (line 45: `app.run(debug=True)`) |
| Flask port | `5000` | `backend/app.py` (line 45: `port=5000`) |

---

## Hardcoded Defaults

Several configuration values are hardcoded in the frontend source code rather than configured via environment variables.

| Value | Location | Purpose |
|---|---|---|
| `http://localhost:5000` | `frontend/src/pages/IndoorNavigation.jsx` (line 9) | Backend API base URL for building data and route calculations |
| `http://localhost:5000` | `frontend/src/pages/AdminLogin.jsx` (line 20) | Backend auth endpoint (`POST /api/auth/login`) |
| `http://localhost:5000` | `frontend/src/pages/BlueprintUpload.jsx` (lines 41, 191, 224, 229) | Blueprint upload, media upload, and asset URLs |
| `http://localhost:5000` | `frontend/src/pages/QrCodeGeneration.jsx` (line 21) | QR generation API and fallback navigation URL |
| `http://localhost:5000` | `frontend/src/components/ui/PanoramaViewer.jsx` (lines 14, 34) | Media asset loading (360° photos/videos) |
| `http://localhost:5173` | `frontend/src/pages/QrCodeGeneration.jsx` (lines 12, 35) | Default visitor navigation URL for QR codes |
| `http://localhost:5173` | `backend/app/services/qr_generator.py` (line 12) | QR code destination URL template |
| `http://localhost:5173` | `backend/app/api/blueprints.py` (line 142) | QR destination URL returned in upload response |
| `mock-jwt-token-7389` | `backend/app/api/auth.py` (line 15) | Hardcoded JWT token returned by mock login |

<!-- VERIFY: All localhost URLs above assume local development. In production, these must be replaced with the actual deployment domain and protocol. -->

---

## SQLite Database

The system uses a **single SQLite database file** at `backend/app/database.db` (gitignored, created automatically on first run).

### Schema

| Table | Description |
|---|---|
| `buildings` | Stores building metadata (name, blueprint path, QR path, latitude, longitude) |
| `nodes` | Navigation graph nodes with pixel coordinates, geo coordinates, type, and optional media |
| `edges` | Weighted connections between nodes for pathfinding |
| `walls` | Physical wall segments for 3D rendering and line-of-sight checks |

The database is initialized automatically when the Flask app starts via `init_db()` in `backend/app/database.py`.

### Migration notes

- The `nodes` table has been migrated to add `latitude`, `longitude`, `media_path`, and `media_type` columns.
- Migration uses `ALTER TABLE ... ADD COLUMN` wrapped in try/except — safe to run on existing databases.

---

## Coordinate System

| Property | Value |
|---|---|
| Blueprint coordinate range | 0–1000 (integers) for both x and y |
| Gemini API output | 0–100 (percentage), scaled ×10 to 0–1000 |
| 3D rendering (Three.js) | Converted to -50..50 via `(coord - 500) / 10` |
| Geo transform default scale | 100 meters (configurable via `blueprint_scale_meters` parameter) |
| Geo-fence radius | 2000 meters (Haversine check on visitor load; disabled if building has no lat/lng) |

---

## Upload Directories

| Directory | Purpose | Created by |
|---|---|---|
| `backend/uploads/` | Blueprint images and QR codes | `app.py` line 16 (`os.makedirs`) |
| `backend/uploads/media/` | 360° photos and videos per node | `media.py` line 30 (`os.makedirs`) |

Both directories are excluded from version control (`backend/.gitignore` contains `uploads/`).

---

## Frontend Build Configuration

| Setting | Value | Location |
|---|---|---|
| Build tool | Vite 7 | `frontend/vite.config.js` |
| Framework | React 19 | `frontend/package.json` |
| Styling | Tailwind CSS 4 (Vite plugin) | `frontend/vite.config.js` |
| 3D rendering | Three.js + @react-three/fiber | `frontend/package.json` |
| Dev server port | 5173 (Vite default) | Vite default, not overridden |
| Linter | ESLint 9 (flat config) | `frontend/eslint.config.js` |

---

## Backend Dependencies

Required Python packages (from `backend/requirements.txt`):

```txt
Flask>=3.0.0
flask-cors>=4.0.0
networkx>=3.2.1
opencv-python>=4.9.0
qrcode>=7.4.2
Pillow>=10.2.0
werkzeug>=3.0.1
google-genai>=0.5.0
python-dotenv>=1.0.1
```

Install with: `pip install -r requirements.txt`

---

## Per-Environment Overrides

The project does **not** use environment-specific configuration files (`.env.development`, `.env.production`, `.env.test`). There are no `NODE_ENV` or `FLASK_ENV` conditionals in the codebase.

### Changing environments

To configure for a different environment (e.g., production):

1. **Backend:** Edit `backend/.env` to set the production `GEMINI_API_KEY`.
2. **Frontend:** Replace all hardcoded `http://localhost:5000` references with the production API URL in:
   - `frontend/src/pages/IndoorNavigation.jsx`
   - `frontend/src/pages/AdminLogin.jsx`
   - `frontend/src/pages/BlueprintUpload.jsx`
   - `frontend/src/pages/QrCodeGeneration.jsx`
   - `frontend/src/components/ui/PanoramaViewer.jsx`
3. **QR codes:** Update the hardcoded URL template in:
   - `backend/app/services/qr_generator.py` (line 12)
   - `backend/app/api/blueprints.py` (line 142)
4. **CORS:** If the frontend is served from a different origin, wrap `CORS(app)` with an explicit `origins=` parameter in `backend/app.py`.
5. **Flask debug mode:** Set `debug=False` in `backend/app.py` line 45 for production.

<!-- VERIFY: Production domain names, API hostnames, and CORS origins cannot be determined from the repository and must be configured by the deployment team. -->
