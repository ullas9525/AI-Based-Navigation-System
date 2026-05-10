# AI Based Navigation System — Technical Documentation

---

## 1. Project Overview

The **AI Based Indoor Navigation System** is a web platform that solves the problem of navigating complex indoor spaces (hospitals, universities, office buildings) where GPS is unavailable or unreliable.

A building administrator uploads an architectural blueprint image. Google Gemini Vision AI analyzes the image, extracts a navigation graph (rooms, hallways, stairs, elevators) with spatial coordinates, and stores it in a database. Visitors then scan a QR code at the building entrance, which opens the web app and provides real-time turn-by-turn directions from their entry point to any destination inside the building.

**Core Architecture:**

```
[Admin] ──Upload Blueprint──► [Flask API] ──► [Gemini Vision AI]
                                   │                  │
                             [SQLite DB] ◄── Nodes + Edges + Coords
                                   │
[Visitor QR Scan] ──────────► [React Frontend]
                                   │
                          [POST /api/navigation/route]
                                   │
                          [NetworkX Dijkstra] ──► [SVG Path on Blueprint]
```

---

## 2. Tools Used

| Category           | Tool / Technology                       |
|--------------------|-----------------------------------------|
| Programming Lang   | Python 3.x (Backend), JavaScript (Frontend) |
| Backend Framework  | Flask 3.x                               |
| Frontend Framework | React 18 + Vite                         |
| Database           | SQLite 3                                |
| AI / Vision        | Google Gemini 2.5 Flash (via `google-genai`) |
| Graph Engine       | NetworkX                                |
| QR Generator       | `qrcode` + `Pillow`                     |
| Server             | Flask Dev Server (Werkzeug)             |
| Version Control    | Git                                     |

---

## 3. Libraries & Dependencies

### Backend (Python — `requirements.txt`)

| Library             | Type      | Purpose                                                                 |
|---------------------|-----------|-------------------------------------------------------------------------|
| `Flask`             | Framework | REST API server — handles HTTP routes, file uploads, JSON responses     |
| `flask-cors`        | Library   | Enables Cross-Origin requests from the React frontend (port 5173→5000)  |
| `google-genai`      | Library   | Google Gemini 2.5 Flash SDK — sends blueprint images for AI analysis    |
| `networkx`          | Library   | Graph data structure + Dijkstra's algorithm for shortest-path routing   |
| `qrcode`            | Library   | Generates QR code PNG images for building entrances                     |
| `Pillow`            | Library   | Required by `qrcode` for PNG image rendering                            |
| `opencv-python`     | Library   | Image utilities (available for future CV-based node detection)          |
| `werkzeug`          | Library   | Secure filename handling for blueprint uploads                          |
| `python-dotenv`     | Library   | Loads `GEMINI_API_KEY` from `.env` file at runtime                      |
| `sqlite3`           | Stdlib    | Lightweight embedded database — no external server required             |
| `math`              | Stdlib    | Cosine-corrected Lat/Long degree conversion in `geo_transform.py`       |

### Frontend (JavaScript — `package.json`)

| Library             | Type      | Purpose                                                                 |
|---------------------|-----------|-------------------------------------------------------------------------|
| `React`             | Framework | Component-based UI library for building the navigation interface        |
| `react-router-dom`  | Library   | SPA routing — `/visitor/navigate/:buildingId`, `/admin/blueprint`, etc. |
| `axios`             | Library   | Promise-based HTTP client for all API calls (upload, route, nodes)      |
| `Vite`              | Tool      | Build tool and dev server — instant HMR during development              |

---

## 4. Frameworks & Libraries Justification

### Google Gemini 2.5 Flash (AI Blueprint Analysis)
- **Why chosen:** The only practical way to extract spatial room layout from arbitrary blueprint images without training a custom CV model. Gemini Vision understands architectural drawings natively.
- **Exact benefit:** Eliminates the need for OpenCV contour detection, custom ML training, or manual node placement. Outputs structured JSON with node labels, types, and spatial coordinates in a single API call.
- **Why not OpenCV alone:** OpenCV requires handcrafted feature engineering (Hough transforms, contour hierarchy) which breaks across different blueprint styles. No generalization without a large training dataset.
- **Why not GPT-4o / Claude:** Project already uses Google ecosystem (Gemini API key in `.env`). Gemini 2.5 Flash has competitive vision quality at lower latency.

### NetworkX (Graph Pathfinding)
- **Why chosen:** Purpose-built Python graph library with production-quality Dijkstra and A* implementations. Accepts weighted edges directly.
- **Exact benefit:** `nx.shortest_path(G, source, target, weight='weight')` returns the optimal path in O((V+E) log V) time. No custom algorithm needed.
- **Why not manual BFS/DFS:** BFS ignores edge weights (walking distance). Manual Dijkstra is error-prone and slower to implement correctly.

### Flask (Backend)
- **Why chosen:** Lightweight Python WSGI framework. Integrates directly with the Python AI/ML ecosystem (Gemini SDK, NetworkX, OpenCV).
- **Why not Node.js/Express:** Gemini SDK, NetworkX, and Pillow are Python-native. Using Node.js would require a Python subprocess bridge for all AI calls.
- **Why not FastAPI:** Flask is sufficient for the synchronous request pattern here. FastAPI's async advantage would only apply at high concurrency.

### React + Vite (Frontend)
- **Why chosen:** Vite's HMR provides sub-second refresh during development. React's component model isolates the SVG path overlay, floor switcher, and node selector cleanly.
- **Why not Next.js:** No SSR required — this is a pure SPA. Next.js overhead is unnecessary for a single-page navigation tool.

### SQLite (Database)
- **Why chosen:** Zero-configuration embedded database. Stores buildings, nodes, and edges without a separate server process.
- **Why not PostgreSQL/MySQL:** Overkill for a single-building prototype. SQLite's file-based storage fits perfectly with the local deployment model.

---

## 5. Processing Details

### 5.1 Blueprint Upload Flow (Step-by-Step)

```
[1] POST /api/blueprints/upload
     │ file (PNG/JPG), buildingName, mapLink
     ▼
[2] extract_coords_from_maps_link(mapLink)
     │ Regex: @lat,lon from Google Maps URL
     │ Resolves goo.gl shortlinks via HTTP HEAD request
     ▼
[3] process_blueprint(filepath) → image_processor.py
     │ Reads image bytes
     │ Sends to Gemini 2.5 Flash with structured prompt:
     │   → Returns JSON: {nodes: [{id, type, label, x%, y%}], edges: [{from, to, weight}]}
     │ Scales x,y from 0–100% to 0–1000 integer coordinate space
     ▼
[4] SQLite INSERT
     │ buildings(name, blueprint_path, latitude, longitude)
     │ nodes(building_id, node_key, label, x_coord, y_coord, type)  × N nodes
     │ edges(building_id, from_node, to_node, weight)               × M edges
     ▼
[5] generate_qr(building_name, building_id) → qr_generator.py
     │ URL: http://localhost:5173/visitor/navigate/{id}?start=Entrance
     │ Saves PNG to /uploads/qr_{name}_{id}.png
     ▼
[6] Response JSON: {building_id, nodes_detected, edges_detected, blueprint_url, qr_code_url}
```

### 5.2 Route Calculation Flow (Step-by-Step)

```
[1] POST /api/navigation/route
     │ {building_id, start: "entrance", end: "room_101"}
     ▼
[2] SQLite SELECT
     │ nodes WHERE building_id = ?  → node_map {node_key → {x,y,label,type}}
     │ edges WHERE building_id = ?  → edges list [{from, to, weight}]
     │ buildings WHERE id = ?       → {latitude, longitude}
     ▼
[3] Resolve start/end node
     │ Tries exact node_key match first
     │ Falls back to case-insensitive label match
     ▼
[4] calculate_shortest_path() → pathfinding.py
     │ nx.Graph() built from nodes + edges
     │ nx.shortest_path(G, source=start_key, target=end_key, weight='weight')
     │ Returns ordered list of node_keys: ["entrance","lobby","hallway_n","room_101"]
     ▼
[5] Enrich path with coordinates → geo_transform.py
     │ For each node_key in path:
     │   (lat, lng) = pixel_to_latlong(x, y, bld_lat, bld_lng, scale=100m)
     │   Algorithm:
     │     x_frac = x / 1000.0
     │     offset_x_m = x_frac × scale_meters
     │     Δlng = offset_x_m / (111320 × cos(bld_lat_rad))
     │     Δlat = offset_y_m / 111320
     ▼
[6] Response JSON:
     {
       success: true,
       path: [{node_id, label, type, x, y, lat, lng}, ...],
       total_cost: 23.0   ← sum of edge weights in metres
     }
```

### 5.3 Frontend Rendering Flow

```
[1] Visitor scans QR → opens /visitor/navigate/1?start=Entrance
[2] useEffect on mount → GET /api/blueprints/1
     │ Sets: buildingName, blueprintUrl, nodes[] (for dropdown)
     │ Pre-fills: startLoc = "Entrance" (from ?start= URL param)
[3] Geofence check
     │ navigator.geolocation.getCurrentPosition()
     │ Haversine distance from user GPS to building GPS
     │ If > 2000m → show error screen
[4] User selects destination from <select> dropdown
[5] fetchRoute() → POST /api/navigation/route
     │ Returns path[] with (x,y) in 0–1000 coordinate space
[6] SVG renders with viewBox="0 0 1000 1000" over blueprint image
     │ <polyline points="500,950 500,800 500,600 150,500"> → path line
     │ <circle cx=500 cy=950> → pulsing start dot
     │ <g transform="translate(138,468)"> → red destination pin
```

---

## 6. Functionality Breakdown

### Admin Module
- **Blueprint Upload** (`/admin/blueprint`): Admin uploads PNG/JPG blueprint + Google Maps link. Triggers Gemini AI analysis, stores graph in DB, generates QR code.
- **QR Management** (`/admin/qr`): Admin views and downloads QR code PNGs for physical placement at building entrances.
- **Dashboard** (`/admin/dashboard`): Overview of registered buildings and their stats.

### Navigation Module
- **Node Discovery** (`GET /api/navigation/<id>/nodes`): Returns all persisted nodes for a building from SQLite.
- **Route Engine** (`POST /api/navigation/route`): Accepts start + end node identifiers, runs Dijkstra, returns enriched coordinate path.

### Visitor Module
- **QR Scan Entry**: Scanning the QR opens `/visitor/navigate/:buildingId?start=Entrance`, pre-filling start location.
- **Live Navigation** (`IndoorNavigation.jsx`): Displays blueprint image, renders SVG path overlay, shows step-by-step instructions from route API.

### Geo-Transform Module (`geo_transform.py`)
- **`pixel_to_latlong`**: Converts blueprint pixel (0–1000) to real Lat/Long. Used to enrich route response for future GPS overlay.
- **`latlong_to_pixel`**: Inverse transform. Available for future use (e.g., plotting live GPS dot on blueprint).

---

## 7. Database Schema

### `buildings`
| Column         | Type    | Description                              |
|----------------|---------|------------------------------------------|
| id             | INTEGER | Primary key (auto-increment)             |
| name           | TEXT    | Building name                            |
| blueprint_path | TEXT    | Absolute server path to uploaded image   |
| qr_path        | TEXT    | Absolute path to generated QR PNG        |
| latitude       | REAL    | Building anchor latitude (top-left)      |
| longitude      | REAL    | Building anchor longitude (top-left)     |

### `nodes`
| Column      | Type    | Description                                     |
|-------------|---------|-------------------------------------------------|
| id          | INTEGER | Primary key                                     |
| building_id | INTEGER | Foreign key → buildings.id                      |
| node_key    | TEXT    | AI-assigned identifier (e.g. "room_101")        |
| label       | TEXT    | Human-readable name (e.g. "Room 101")           |
| x_coord     | INTEGER | Horizontal position 0–1000                      |
| y_coord     | INTEGER | Vertical position 0–1000                        |
| latitude    | REAL    | Computed real-world global latitude             |
| longitude   | REAL    | Computed real-world global longitude            |
| type        | TEXT    | room / hallway / entrance / stairs / elevator   |

### `edges`
| Column      | Type    | Description                             |
|-------------|---------|-----------------------------------------|
| id          | INTEGER | Primary key                             |
| building_id | INTEGER | Foreign key → buildings.id              |
| from_node   | TEXT    | Source node_key                         |
| to_node     | TEXT    | Destination node_key                    |
| weight      | REAL    | Approximate walking distance in metres  |

---

## 8. How to Run the System

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Add your Gemini API key to .env:
#   GEMINI_API_KEY=your_key_here
python app.py
# Runs on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### First Use
1. Log in at `/admin/login`
2. Upload a building blueprint at `/admin/blueprint` with a Google Maps link
3. Download the generated QR from `/admin/qr`
4. Place the QR at the building entrance
5. Visitors scan QR → navigate to any room

---

## 9. API Reference

### `POST /api/blueprints/upload`
Uploads blueprint, triggers AI analysis, persists graph, generates QR.

**Form Data:** `file` (image), `buildingName` (string), `mapLink` (Google Maps URL)

**Response:**
```json
{
  "building_id": 1,
  "nodes_detected": 13,
  "edges_detected": 14,
  "blueprint_url": "/uploads/floorplan.png",
  "qr_code_url": "/uploads/qr_main_hall_1.png"
}
```

### `GET /api/blueprints/<building_id>`
Returns building metadata + full node list for frontend.

**Response:**
```json
{
  "id": 1, "name": "Main Hall",
  "latitude": 12.9716, "longitude": 77.5946,
  "blueprint_url": "/uploads/floorplan.png",
  "nodes": [{"id": "entrance", "label": "Entrance", "x": 500, "y": 950, "type": "entrance"}]
}
```

### `GET /api/navigation/<building_id>/nodes`
Returns all nodes for a building from SQLite.

### `POST /api/navigation/route`
Runs Dijkstra and returns enriched path.

**Body:**
```json
{"building_id": 1, "start": "entrance", "end": "room_101"}
```

**Response:**
```json
{
  "success": true,
  "total_cost": 28.0,
  "path": [
    {"node_id": "entrance", "label": "Entrance", "x": 500, "y": 950, "lat": 12.9716, "lng": 77.5946},
    {"node_id": "lobby",    "label": "Lobby",    "x": 500, "y": 800, "lat": 12.9717, "lng": 77.5946},
    {"node_id": "room_101", "label": "Room 101", "x": 150, "y": 500, "lat": 12.9720, "lng": 77.5943}
  ]
}
```
