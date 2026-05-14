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

---

## [2026-05-10] — Georeferencing Persistence & Routing Refinement

### Requested:
- Persist computed Lat/Long coordinates directly in the database for each node.
- Update the QR URL parameters to `?startNode=entrance`.
- Adjust frontend and backend to use these persisted geographic coordinates instead of on-the-fly calculation.

### Implemented:

**1. Database Schema Evolution (`database.py`)**
- Added `latitude` and `longitude` to the `nodes` table schema.
- Added `ALTER TABLE` safe migration logic to handle existing databases.

**2. API Modifications (`blueprints.py`, `navigation.py`)**
- Pre-computed Coordinates on Upload: AI node pixel coordinates are now piped through `pixel_to_latlong` immediately, and global GPS coordinates are stored permanently in the DB.
- Streamlined Routing Endpoint: `calculate_route` now fetches the path sequence via Dijkstra and reads the associated `lat` and `lng` directly from the database row, skipping on-the-fly math.

**3. QR Code & Frontend Integration (`qr_generator.py`, `IndoorNavigation.jsx`)**
- Updated QR URL param from `?start=Entrance` to `?startNode=entrance`.
- Updated `IndoorNavigation.jsx` to parse the exact `startNode` parameter for seamless routing.

### Files Modified:
- `backend/app/database.py` [MODIFIED]
- `backend/app/api/blueprints.py` [MODIFIED]
- `backend/app/services/qr_generator.py` [MODIFIED]
- `backend/app/api/navigation.py` [MODIFIED]
- `frontend/src/pages/IndoorNavigation.jsx` [MODIFIED]

### Git Commit Message:
`refactor: persist node coordinates in db and streamline georeferencing flow`

---

## [2026-05-14] — Blueprint Alignment Validation & Prominent Search

### Requested:
- Implement blueprint alignment validation using an internal model to ensure uploaded blueprints align with Google Maps data.
- Redesign the destination input interface to use a prominent search prompt (similar to Google Maps) instead of automatically displaying a route.

### Implemented:

**1. Blueprint Alignment Validation (`image_processor.py`, `blueprints.py`)**
- Added `validate_blueprint` service utilizing Gemini 2.5 Flash to verify that the uploaded image is a valid architectural floor plan and plausibly aligns with the provided latitude/longitude coordinates.
- Integrated validation step into the `upload_blueprint` API endpoint. If validation fails, the system safely cleans up the file and returns a `400 Bad Request` with a specific misalignment error.

**2. Prominent Destination Search (`IndoorNavigation.jsx`)**
- Prevented automatic route calculation on map load by ensuring the destination state (`endLoc`) initializes as empty.
- Created a prominent, centered search overlay that blocks standard map interaction until a destination is selected.
- Updated the main top-bar destination selector to be hidden until the initial destination is picked from the prominent overlay, smoothly transitioning the UI from "search mode" to "navigation mode".

### Files Modified:
- `backend/app/services/image_processor.py` [MODIFIED]
- `backend/app/api/blueprints.py` [MODIFIED]
- `frontend/src/pages/IndoorNavigation.jsx` [MODIFIED]

### Frameworks & Libraries Used:
| Name | Type | Used In | Justification |
|---|---|---|---|
| Google Gemini 2.5 Flash | AI Model / API | Backend / AI | Used for multimodal validation to heuristically determine if an image constitutes a valid blueprint for a specific geographic context. Chosen for its zero-shot vision reasoning capabilities. |
| React Tailwind CSS | UI Framework | Frontend | Utilized for rapidly styling the new prominent search overlay and handling responsive transitions between search and map states. |

### Processing Details:
- **Blueprint Alignment Flow**: Client uploads image + coordinates -> Flask API saves image -> `validate_blueprint` calls Gemini Vision API -> Gemini returns JSON `{"is_valid": true/false}` -> API either proceeds to Graph Extraction or aborts and returns 400 error.
- **Search UI Flow**: Component Mounts -> If no destination, prominent overlay renders -> User selects node from dropdown -> State updates -> Overlay unmounts -> Topbar selector appears -> Route calculation triggered -> SVG path renders.

### Git Commit Message:
`feat: implement gemini blueprint alignment validation and prominent destination search overlay`
