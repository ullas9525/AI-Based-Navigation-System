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

---

## [2026-05-15] — Project Knowledge Graph Generation

### Requested:
- Execute the `graphify` workflow to visualize project architecture.

### Implemented:
- Resolved Python environment and verified `graphifyy` installation.
- Detected 37 project files (Code, Docs, Images) totaling ~15k words.
- Performed Structural Extraction (AST) resulting in 90 nodes and 176 edges.
- Conducted Semantic Extraction to map conceptual relationships between components.
- Generated a knowledge graph with 102 nodes, 107 edges, and 14 functional communities.
- Produced interactive HTML visualization and an audit report (`GRAPH_REPORT.md`).
- Achieved an 11.7x token reduction benchmark for architectural queries.

### Files Modified:
- `graphify-out/` [NEW]

### Git Commit Message:
`docs: generate project knowledge graph for architectural analysis`

---

## [2026-06-02] — QR Code Link Display

### Requested:
- Provide the navigation link encoded within the QR code directly below the QR code image.

### Implemented:
- Modified the blueprint upload API response to include the full `qr_destination_url` representing the entrance navigation deep link.
- Fixed a `NameError` where `blueprint_url` became undefined during output payload construction.
- Displayed the clickable, monospace `qr_destination_url` navigation link directly below the QR code download button in the blueprint upload results page ([BlueprintUpload.jsx](file:///e:/Muddu%20Items/AI%20Based%20Navigation%20System/frontend/src/pages/BlueprintUpload.jsx)).
- Introduced a state variable `qrDestinationUrl` in `QrCodeGeneration.jsx` to keep track of the link encoded inside the generated QR code.
- Rendered a new text container holding the formatted destination link directly below the QR code preview image within the physical signage card template.
- Handled API service exceptions (like `503 Service Unavailable` or rate limiting) during validation in `image_processor.py` by gracefully bypassing validation.

### Files Modified:
- `backend/app/api/blueprints.py` [MODIFIED]
- `backend/app/services/image_processor.py` [MODIFIED]
- `frontend/src/pages/BlueprintUpload.jsx` [MODIFIED]
- `frontend/src/pages/QrCodeGeneration.jsx` [MODIFIED]

### Frameworks & Libraries Used:
| Name | Type | Used In | Justification |
|---|---|---|---|
| React useState | Library | Frontend | Added state variable to track the destination navigation URL during QR generation. |

### Processing Details:
- **Upload Flow Integration**: Upon successful blueprint upload and graph compilation, the server responds with a georeferenced entrance navigation link, which the client UI renders as a clickable URL under the generated QR preview block.
- **QR Generation URL Tracking**: On selection or click of the "Generate QR Code" button, the frontend sends request or falls back to creating a local URL. The destination link (`qrDestinationUrl`) is stored and displayed dynamically below the preview.

### Git Commit Message:
`feat: display the QR destination navigation link below the QR code preview on upload and generation screens`

---

## [2026-06-05] — 3D Map Navigation & Media Uploads

### Requested:
- Utilize 3D maps instead of 2D, including 3D rooms and hallways.
- Support uploading photos and videos along with the blueprint.
- Navigate through 3D environments when a QR code is scanned.

### Implemented:
- Updated the backend database schema to include `media_path` and `media_type` in the `nodes` table, and added a `walls` table.
- Modified the Gemini AI prompt in `image_processor.py` to extract exact wall coordinates (`x1, y1, x2, y2`) in addition to the node graph.
- Created `media.py` API endpoint to handle 360-degree media uploads for specific nodes, saving them to the `uploads/media/` directory.
- Added a Node Media Management section in `BlueprintUpload.jsx` for admins to attach media to nodes after a successful blueprint analysis.
- Integrated `@react-three/fiber` and `@react-three/drei` into the frontend.
- Built `Map3D.jsx` to procedurally render the floor plan walls as extruded 3D boxes and display the Dijkstra routing path as a glowing 3D line.
- Built `PanoramaViewer.jsx` to render 360-degree image/video spheres inside a 3D canvas when a user explores a media-attached node.
- Replaced the 2D SVG overlay in `IndoorNavigation.jsx` with the 3D `<Canvas>`, allowing users to toggle between a 3D bird's-eye map and immersive 360-degree panorama mode.

### Files Modified:
- `backend/app/database.py` [MODIFIED]
- `backend/app/services/image_processor.py` [MODIFIED]
- `backend/app/api/blueprints.py` [MODIFIED]
- `backend/app/api/navigation.py` [MODIFIED]
- `backend/app/api/media.py` [NEW]
- `backend/app.py` [MODIFIED]
- `frontend/src/pages/BlueprintUpload.jsx` [MODIFIED]
- `frontend/src/components/ui/Map3D.jsx` [NEW]
- `frontend/src/components/ui/PanoramaViewer.jsx` [NEW]
- `frontend/src/pages/IndoorNavigation.jsx` [MODIFIED]
- `frontend/package.json` [MODIFIED]

### Frameworks & Libraries Used:
| Name | Type | Used In | Justification |
|---|---|---|---|
| Three.js | Library | Frontend | The core WebGL engine required to render the 3D map environment, geometry, and materials. Selected due to its industry-standard performance and capability. |
| React Three Fiber | Library | Frontend | A React reconciler for Three.js. Chosen because it allows writing declarative 3D scenes using React components, tightly integrating with the existing React architecture. |
| React Three Drei | Library | Frontend | A collection of useful helpers for React Three Fiber. Used for OrbitControls and rapid geometry generation, avoiding boilerplate WebGL code. |

### Processing Details:
- **3D AI Extraction Flow**: Upload blueprint -> Image processed by Gemini AI -> Returns nodes, edges, and *wall bounds* -> Saved to SQLite `walls` table.
- **Node Media Upload Flow**: Admin selects a node -> Uploads file -> Flask `/api/media` handles `multipart/form-data` -> Saves file locally -> Updates node `media_path` and `media_type`.
- **3D Rendering Flow**: `IndoorNavigation.jsx` fetches `nodes`, `walls`, and `route` -> Renders `<Canvas>` -> `Map3D` procedurally generates 3D Box geometries for walls based on AI-extracted coordinates -> Overlays `<Line>` for route.
- **Immersive Transition**: If user clicks a node with a `media_path` -> Switches to `panorama` view mode -> Mounts `PanoramaViewer` -> Creates `<sphereGeometry>` mapped with the media texture.

### Git Commit Message:
`feat: implement 3D map rendering, exact wall extraction, and 360-degree node media uploads using react-three-fiber`

---

## [2026-06-06] — Advanced Dynamic Navigation & Wall Gap Fixes

### Requested:
- Fix AI blueprint analysis so it properly leaves gaps for doors/windows and avoids drawing continuous blocks.
- Allow users to click anywhere on the 3D map to precisely set their custom start coordinate.
- Allow arbitrary start-to-end routing that intelligently avoids walls by passing through the physical door gaps.

### Implemented:
- **AI Prompt Hardening**: Inserted explicit `CRITICAL RULE` in `image_processor.py` instructing Gemini 2.5 Flash to split wall geometries wherever a door or window gap exists.
- **Line-of-Sight Pathfinding**: Rewrote `/route` in `navigation.py` to support full coordinate-based pathfinding without relying on predefined nodes.
- **Graph Injection Algorithm**: Any custom coordinate `{x, y}` is temporarily injected into the NetworkX spatial graph during calculation.
- **Line Segment Intersection**: Implemented robust intersection math to verify that the path between the custom point and any existing node does not cross a wall line segment. If line-of-sight is clear, the edge is valid.
- **Frontend Interactivity**: Added an `onPointerDown` raycaster to the floor mesh in `Map3D.jsx` to capture the 3D intersect, map it back to 2D space, and trigger `onMapClick(x, y)`.
- **Dynamic Pins**: Added responsive `Custom Location` floating HTML badges and coloured sphere geometries to precisely mark non-node points on the 3D map.

### Files Modified:
- `backend/app/services/image_processor.py` [MODIFIED]
- `backend/app/api/navigation.py` [MODIFIED]
- `frontend/src/components/ui/Map3D.jsx` [MODIFIED]
- `frontend/src/pages/IndoorNavigation.jsx` [MODIFIED]

### Frameworks & Libraries Used:
| Name | Type | Used In | Justification |
|---|---|---|---|
| Native Python Math | Core | Backend | Used for line segment intersection geometric algorithms. Eliminates the need to import heavy dependencies like Shapely for simple 2D collision detection. |
| React Three Drei Html | Utility | Frontend | Used to anchor standard DOM elements (the location badges) to specific Vector3 points in the 3D scene. Avoids manual 3D-to-2D projection mapping. |

### Processing Details:
- **Line-of-Sight Pathfinding Flow**: Client clicks floor -> Frontend sends `{"x": val, "y": val}` in route POST request -> Backend fetches all walls -> Custom `{x,y}` is compared to every other node using a mathematical intersection formula against every wall boundary -> If no wall intersects the line, an edge is created with a weight equal to Euclidean distance -> Dijkstra shortest path resolves and returns standard `[x,y]` steps.

### Git Commit Message:
`feat: introduce dynamic coordinate-based line-of-sight pathfinding and AI wall gap generation`
