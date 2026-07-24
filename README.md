# AI Based Navigation System

An indoor navigation system that converts building blueprints into interactive 3D walkthroughs using AI-powered image analysis, Dijkstra pathfinding, and Three.js visualization.

**Live demo:** [https://ai-based-navigation-system.vercel.app](https://ai-based-navigation-system.vercel.app)

---

## Quick Start (Local Development)

### Prerequisites

- **Python 3.x** — for the backend API server
- **Node.js >= 18** — for the frontend development server

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python server.py
```

The Flask server starts on `http://localhost:5000`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts on `http://localhost:5173`.

### 3. Open in Browser

Navigate to `http://localhost:5173` to access the application.

---

## Deployed URLs

| Service | URL |
|---------|-----|
| Frontend | [https://ai-based-navigation-system.vercel.app](https://ai-based-navigation-system.vercel.app) |
| Backend API | [https://ai-based-navigation-system.onrender.com](https://ai-based-navigation-system.onrender.com) |
| Health Check | [https://ai-based-navigation-system.onrender.com/health](https://ai-based-navigation-system.onrender.com/health) |

---

## Features

- **AI Blueprint Analysis** — Upload a floorplan image and Gemini 2.5 Flash extracts rooms, walkways, walls, doors, and navigation nodes automatically.
- **3D Indoor Navigation** — Interactive three-dimensional map rendered with Three.js showing walls, paths, and real-time routing.
- **Shortest Path Routing** — NetworkX Dijkstra algorithm computes the optimal route between any two points, with line-of-sight intersection checks against walls.
- **Admin Dashboard** — Upload blueprints, manage buildings, and generate QR codes for visitor entry points.
- **Visitor Mode** — Scan a QR code to load a building's navigation map with a predefined start node.
- **360° Media** — Upload panoramic photos and videos associated with specific navigation nodes.
- **Geo-Fencing** — 2000m Haversine proximity check restricts navigation access to visitors within range of the building.

---

## Architecture

```
backend/                  # Flask REST API (Python)
├── server.py             # Entry point (dev)
├── wsgi.py               # Gunicorn entry point (production)
├── Procfile              # Render deployment config
├── requirements.txt      # Python dependencies
├── app/
│   ├── __init__.py       # App factory (create_app)
│   ├── database.py       # SQLite / PostgreSQL dual driver
│   ├── api/
│   │   ├── auth.py       # POST /api/auth/login (mock authentication)
│   │   ├── blueprints.py # Blueprint upload + Gemini analysis
│   │   ├── navigation.py # Node queries + Dijkstra routing
│   │   └── media.py      # 360° photo/video uploads
│   └── services/
│       ├── image_processor.py  # Gemini 2.5 Flash API integration
│       ├── pathfinding.py      # NetworkX shortest path
│       ├── geo_transform.py    # Pixel ↔ lat/lng conversion
│       └── qr_generator.py     # QR code generation

frontend/                 # React SPA (Vite)
├── package.json          # npm dependencies
├── vercel.json           # Vercel SPA rewrites
├── src/
│   ├── main.jsx          # Entry point
│   ├── App.jsx           # Router configuration
│   ├── pages/            # Route-level page components
│   └── components/
│       └── ui/           # Map3D.jsx, PanoramaViewer.jsx
```

---

## Frontend Routes

| Path | Component |
|------|-----------|
| `/` | Landing Page |
| `/admin/login` | Admin Login |
| `/admin/dashboard` | Admin Dashboard |
| `/admin/blueprint` | Blueprint Upload |
| `/admin/qr` | QR Code Generation |
| `/visitor/scan` | Visitor Selection |
| `/visitor/navigate/:buildingId` | Indoor Navigation (3D) |

---

## API Endpoints

All endpoints run on `https://ai-based-navigation-system.onrender.com` (or `http://localhost:5000` locally).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| POST | `/api/auth/login` | Mock authentication (`admin@navsystem.com` / `admin`) |
| POST | `/api/blueprints/upload` | Upload blueprint → Gemini analysis → DB + QR |
| GET | `/api/blueprints/<id>` | Get building data (nodes, walls, edges) |
| GET | `/api/navigation/<id>/nodes` | All nodes for a building |
| POST | `/api/navigation/route` | Dijkstra shortest path routing |
| POST | `/api/media/node/<id>/<key>` | Upload 360° media for a node |

---

## Usage Examples

### Upload a Blueprint

1. Navigate to `/admin/login` and sign in with credentials `admin@navsystem.com` / `admin`.
2. Go to **Blueprint Upload** and submit a PNG or JPEG floorplan image.
3. The system processes the image via Gemini 2.5 Flash and returns a building with extracted nodes, edges, and wall geometry.

### Navigate a Building

1. From the admin dashboard, generate a QR code for a building.
2. Scan the QR code as a visitor, or navigate directly to `/visitor/navigate/{buildingId}`.
3. Select a start and destination node to see the shortest path rendered in 3D.

### Request a Custom Route (API)

```bash
curl -X POST https://ai-based-navigation-system.onrender.com/api/navigation/route \
  -H "Content-Type: application/json" \
  -d '{
    "building_id": 1,
    "start": "entrance",
    "end": "room_101"
  }'
```

---

## Environment Variables

### Backend

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key (required for AI analysis) |
| `DATABASE_URL` | PostgreSQL connection string (optional, uses SQLite otherwise) |
| `CORS_ORIGINS` | Comma-separated allowed origins (e.g. `https://your-app.vercel.app`) |
| `FRONTEND_URL` | Frontend URL for QR code generation and CORS |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g. `https://your-app.onrender.com`) |

---

## CI/CD

[![CI](https://github.com/ullas9525/AI-Based-Navigation-System/actions/workflows/ci.yml/badge.svg)](https://github.com/ullas9525/AI-Based-Navigation-System/actions/workflows/ci.yml)

- **GitHub Actions** — Runs ruff (Python lint) + ESLint + Vite build on every push/PR
- **Render** — Auto-deploys backend from `main` branch
- **Vercel** — Auto-deploys frontend from `main` branch
- **UptimeRobot** — Pings `/health` every 5 minutes to prevent cold starts

---

## License

This project is private and not currently licensed for public distribution.
