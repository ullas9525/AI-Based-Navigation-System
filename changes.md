# Changes Log

## [2026-05-07] - Initial Project Analysis & Problem Statement Setup

### Requested:
- Use the `/understand` workflow to align with the project goals.

### Implemented:
- Analyzed the existing codebase (Flask backend and React frontend).
- Created the initial `problemstatement.md` to define the project's core purpose and features as per Rule 5.
- Established the documentation structure required by the system rules.

### Files Modified:
- `problemstatement.md` [NEW]

### Git Commit Message:
`docs: initialize problem statement and project documentation`

---

## [2026-05-10] — Core Navigation Engine Completion

### Requested:
- Complete the full data pipeline: AI blueprint mapping with coordinates → DB persistence → real Dijkstra routing → live frontend rendering.

### Implemented:

**1. Database Schema Extension (`database.py`)**
- Added `edges` table with columns: `id`, `building_id`, `from_node`, `to_node`, `weight`
- Added `node_key` column to `nodes` table to store the AI-assigned node identifier separately from the DB primary key

**2. AI Spatial Mapping (`image_processor.py`)**
- Updated Gemini Vision prompt to extract `x` and `y` as percentage coordinates (0–100) on the blueprint image
- Backend scales these to 0–1000 integer coordinate space for storage
- Replaced minimal mock data with a 13-node, 14-edge realistic office floor plan for API-free testing

**3. Geo-Transform Utility (`geo_transform.py`) [NEW]**
- Created `pixel_to_latlong(x, y, lat, lng, scale_m)`: converts 0–1000 pixel coords to real Lat/Long
- Created inverse `latlong_to_pixel(lat, lng, bld_lat, bld_lng, scale_m)` for GPS overlay
- Algorithm: normalize → metric offset → degree offset using cosine-corrected longitude formula

**4. QR System (`qr_generator.py`)**
- Updated QR URL from `.../navigate/{id}` to `.../navigate/{id}?start=Entrance`
- Added `building_id` suffix to filename to prevent filename collisions across buildings

**5. Blueprint Upload API (`blueprints.py`)**
- Nodes from AI are now persisted to `nodes` table (was previously discarded)
- Edges from AI are now persisted to `edges` table (new)
- `GET /api/blueprints/<id>` now returns `blueprint_url` and full `nodes` list in one call
- Removed unreachable code (old `return jsonify(error)` at end of file)

**6. Navigation API (`navigation.py`)**
- `GET /<building_id>/nodes` — queries real nodes from SQLite instead of returning hardcoded mock data
- `POST /route` — full Dijkstra implementation:
  - Accepts `building_id`, `start`, `end` (by node_key or label, case-insensitive)
  - Fetches nodes + edges from SQLite
  - Calls `pathfinding.calculate_shortest_path()` (NetworkX, finally wired)
  - Enriches each path step with `(x, y, lat, lng, label, type)`
  - Returns `total_cost` in metres

**7. Frontend Navigation (`IndoorNavigation.jsx`)**
- Fetches real building data on mount: `name`, `blueprint_url`, `nodes` list
- Renders the actual blueprint image as the map background
- SVG overlay now uses `viewBox="0 0 1000 1000"` aligned to coordinate space
- Path drawn as `<polyline>` from dynamic API route coordinates
- Start dot and destination pin positioned at actual path endpoints
- Destination input replaced with `<select>` dropdown populated from DB nodes
- `?start=` URL param (from QR scan) pre-fills the start location

### Files Modified:
- `backend/app/database.py` [MODIFIED]
- `backend/app/services/image_processor.py` [MODIFIED]
- `backend/app/services/geo_transform.py` [NEW]
- `backend/app/services/qr_generator.py` [MODIFIED]
- `backend/app/api/blueprints.py` [MODIFIED]
- `backend/app/api/navigation.py` [MODIFIED]
- `frontend/src/pages/IndoorNavigation.jsx` [MODIFIED]

### Frameworks & Libraries Used:
| Name | Type | Used In | Justification |
|---|---|---|---|
| NetworkX | Library | Backend / AI | Dijkstra's algorithm for graph-based shortest path. Purpose-built for graph analysis. Chosen over manual BFS/DFS for reliability and weight support. |
| Google Gemini 2.5 Flash | AI Model / API | Backend / AI | Vision-capable LLM for blueprint interpretation and spatial node extraction. Used instead of classical CV (OpenCV) because it requires no training data or feature engineering. |
| math (stdlib) | Library | Backend | Geo-transformation calculations (cos, radians). No external dependency needed. |
| React useState / useEffect | Library | Frontend | Component-level state and lifecycle management for API data and route updates. |

### Git Commit Message:
`feat: complete core navigation engine — AI spatial mapping, Dijkstra routing, live blueprint SVG, QR deep-link`
