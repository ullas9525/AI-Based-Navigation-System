# Chapter 4: Design and Implementation

## 4.1 System Architecture

The AI Based Navigation System follows a client-server architecture consisting of a React-based single-page application (SPA) frontend, a Flask-based REST API backend, an SQLite relational database, and an external AI vision service provided by Google Gemini 2.5 Flash. The architecture is designed to support an end-to-end workflow wherein building administrators upload architectural blueprints, the system automatically extracts a navigable graph of rooms and pathways via AI analysis, and visitors access interactive 3D indoor navigation through QR code scanning.

Communication between the frontend and backend occurs exclusively through HTTP REST endpoints. The frontend, served by a Vite development server on port 5173, makes asynchronous requests to the Flask backend on port 5000 using the Axios HTTP library. The backend processes these requests by interacting with the SQLite database, invoking AI services, or serving static uploaded files. The backend in turn communicates with the Google Gemini 2.5 Flash API over HTTPS for blueprint image analysis and validation. No direct communication exists between the frontend and the AI service; all AI interactions are mediated by the backend.

The system is composed of four primary layers. The presentation layer encompasses the React frontend with Three.js-based 3D rendering. The application layer comprises the Flask route handlers organized into blueprint modules. The service layer contains dedicated modules for image processing, pathfinding, geo-transformation, and QR code generation. The persistence layer is a file-based SQLite database storing buildings, nodes, edges, walls, and associated metadata.

**Figure 4.1 Overall System Architecture**
*Purpose: Illustrates communication flow between the React frontend, Flask backend, SQLite database, Gemini API, and end users. Boxes represent system components and arrows indicate HTTP request-response pathways.*

## 4.2 Frontend Design

The frontend is built using React 19 with Vite 7 as the build tool and development server. Styling is implemented using Tailwind CSS 4 with a custom theme defining primary colour, background variants, and font family (Space Grotesk). Client-side routing is handled by React Router DOM 7, which maps seven distinct URL paths to page components.

The application entry point is defined in `src/main.jsx`, which mounts the root `App` component within React StrictMode. The `App.jsx` file configures the router with the following route structure:

| Route Path | Component | Purpose |
|------------|-----------|---------|
| `/` | LandingPage | Marketing hero section with feature overview and navigation links |
| `/admin/login` | AdminLogin | Mock authentication form for administrative access |
| `/admin/dashboard` | AdminDashboard | Building overview dashboard with mock data cards |
| `/admin/blueprint` | BlueprintUpload | Multi-step blueprint upload and AI analysis interface |
| `/admin/qr` | QrCodeGeneration | QR code configuration, preview, and export interface |
| `/visitor/scan` | VisitorSelection | Quick destination browsing for visitor mode |
| `/visitor/navigate/:buildingId` | IndoorNavigation | Primary 3D navigation screen with map and controls |
| `*` | ErrorPage | 404 catch-all page |

Each page component is implemented as a functional React component using hooks for state management and side effects. The `IndoorNavigation` page is the most complex component, integrating Three.js 3D rendering, geolocation-based proximity checking, destination search overlay, and real-time route fetching.

The page components are organized into a `pages/` directory, while reusable UI elements reside in `components/ui/` and layout components in `components/layout/`. The `Sidebar` component provides a vertical navigation menu for admin pages with active route highlighting. The `Topbar` component provides a configurable header with title, description, search input, and action button.

**Figure 4.2 Frontend Page Routing Map**
*Purpose: Screenshot of the browser URL bar and rendered page for each route, demonstrating the React Router configuration and page transitions.*

### 4.2.1 Three.js 3D Visualization

The three-dimensional map rendering is implemented using the React Three Fiber library, a React reconciler for Three.js, alongside the Drei utility collection. The `Map3D` component procedurally generates the 3D scene based on database-stored coordinate data. Wall segments from the database are rendered as extruded box geometries with a height of 4 units and thickness of 0.5 units, positioned using a coordinate transformation that maps the internal 0–1000 pixel coordinate space to a −50 to +50 Three.js unit space. The Dijkstra-computed route path is rendered as a blue polyline using Drei's `Line` component. Navigation nodes are displayed as colour-coded sphere geometries: green for entrance nodes, purple for nodes with associated 360-degree media, and grey for standard nodes. Each node displays a floating HTML label using Drei's `Html` component. A floor plane with a raycaster-based pointer handler enables users to click and set custom start coordinates. The camera is initialized at a bird's-eye position of (0, 60, 40) with orbit controls for user interaction.

The 360-degree panorama viewer is implemented as a separate `PanoramaViewer` component supporting both equirectangular photographic images and video textures. Images are rendered using Three.js texture mapping on a large sphere geometry with the camera positioned at the sphere centre. Videos are loaded into an HTML video element with looping and muted playback, then mapped as a video texture onto the sphere interior.

## 4.3 Backend Design

The backend is implemented in Python using the Flask 3 web framework. The application is initialised through a factory pattern in `app.py`, which creates the Flask instance, configures the upload directory, initialises the SQLite database schema, and registers four API blueprint modules. Cross-origin resource sharing is enabled globally via the `flask-cors` extension.

### 4.3.1 API Endpoints

The backend exposes six endpoints organised into four blueprint modules:

| Method | Endpoint | Blueprint | Function |
|--------|----------|-----------|----------|
| POST | `/api/auth/login` | auth | Mock authentication accepting email and password |
| POST | `/api/blueprints/upload` | blueprints | Blueprint file upload, validation, AI analysis, and persistence |
| GET | `/api/blueprints/<id>` | blueprints | Retrieve building data including nodes and walls |
| GET | `/api/navigation/<id>/nodes` | navigation | Retrieve all nodes for a given building |
| POST | `/api/navigation/route` | navigation | Compute shortest path using Dijkstra algorithm |
| POST | `/api/media/node/<id>/<key>` | media | Upload 360-degree photo or video for a specific node |
| GET | `/health` | (root) | Health check endpoint |

Static file serving is handled by two Flask routes: `/uploads/<filename>` serves uploaded blueprint images and QR code PNGs, while `/uploads/media/<filename>` serves 360-degree media files.

### 4.3.2 Authentication Module

The authentication endpoint implements a mock login system. It accepts JSON containing an email and password field, compares these against hardcoded credentials (`admin@navsystem.com` / `admin`), and returns a mock JWT token on success. No real token validation, session management, or password hashing is implemented. The token is stored in the browser's localStorage but is never verified by the backend on subsequent requests.

### 4.3.3 Blueprint Management Module

The blueprint management module handles file upload, validation, AI analysis, data persistence, and QR code generation. On receiving a multipart upload request, the module performs file type validation against an allowed extension whitelist (PNG, JPG, JPEG). The uploaded file is saved to the configured upload directory with a secure filename.

The module extracts geographic coordinates from a Google Maps share link provided by the user. It resolves shortened URLs (goo.gl, maps.app.goo.gl) via HTTP HEAD requests and extracts latitude and longitude from the standard Google Maps `@lat,lon` URL pattern using regular expression matching.

Validation and analysis are delegated to the image processing service layer. The building record, extracted nodes, edges, and walls are persisted to the SQLite database within a single request-response cycle. The module identifies the entrance node from the AI results and generates a QR code encoding a navigation URL with the entrance as the start parameter.

### 4.3.4 Navigation Module

The navigation module provides two endpoints. The node listing endpoint queries all nodes for a given building from the database and returns them as a JSON array. The route calculation endpoint implements full Dijkstra-based shortest pathfinding with support for both predefined node keys and custom coordinate-based start and end points.

When custom coordinates are provided, the module performs line-of-sight analysis against all stored wall segments. A custom point is temporarily injected into the graph, and edges are created only to existing nodes where no wall intersection is detected. The intersection test uses an orientation-based line segment intersection algorithm implemented natively without external geometry libraries.

### 4.3.5 Media Module

The media module accepts file uploads for associating 360-degree photographs or videos with specific navigation nodes. It validates file extensions against an allowed set (PNG, JPG, JPEG, MP4, WEBM) and distinguishes between photo and video based on file extension. Uploaded files are saved to a media subdirectory with a naming convention that includes the building ID and node key. The database record for the corresponding node is updated with the media URL and type.

**Figure 4.3 API Request-Response Flow**
*Purpose: Sequence diagram showing the data flow for the blueprint upload process, from the admin's file selection through Gemini analysis to database persistence and QR generation.*

## 4.4 Blueprint Processing Module

The blueprint processing module is implemented in `backend/app/services/image_processor.py` and is the core AI integration component of the system. It provides three primary functions: blueprint validation, spatial graph extraction, and fallback mock data generation.

### 4.4.1 Blueprint Validation

The `validate_blueprint` function sends the uploaded image to Google Gemini 2.5 Flash with a prompt asking whether the image constitutes a valid architectural floor plan and whether it plausibly aligns with the provided GPS coordinates. The AI is instructed to return a JSON response containing a boolean `is_valid` field and a textual `reason` field. If validation fails, the uploaded file is removed and the API returns a 400 Bad Request error. If the Gemini API call fails due to network errors or missing API key, validation is bypassed and the upload proceeds.

### 4.4.2 Graph Extraction

The `process_blueprint` function sends the blueprint image to Gemini 2.5 Flash with a structured prompt requesting extraction of three data categories: navigable nodes (rooms, hallways, entrances, stairs, elevators), walkable edges (connections between nodes with weight values), and physical wall boundaries. The AI is instructed to return valid JSON conforming to a specified schema.

The prompt instructs the AI to output coordinates as percentage values (0–100) representing position on the image. The backend scales these values by a factor of 10 to produce integer coordinates in the range 0–1000, which serves as the internal coordinate space for both database storage and 3D rendering.

### 4.4.3 Wall Gap Post-Processing

After Gemini returns wall data, a post-processing function `split_long_walls` automatically splits any wall segment exceeding 180 coordinate units in length into multiple shorter segments separated by 12-unit gaps. This compensates for the AI's tendency to draw continuous wall blocks across door openings, ensuring that navigation paths are not incorrectly blocked by undetected door gaps.

### 4.4.4 Mock Fallback

If the Gemini API key environment variable is not configured, or if the API call fails, the system falls back to a pre-defined mock dataset representing a 13-node, 14-edge office floor plan. This enables development and testing without requiring API access.

**Figure 4.4 Blueprint Analysis Pipeline**
*Purpose: Diagram showing the stages from raw uploaded image through Gemini AI processing to structured node, edge, and wall data.*

## 4.5 Database Design

The system uses SQLite as its embedded database engine, accessed through Python's standard `sqlite3` library with row factory configured for dictionary-style row access. The database file is stored at `backend/app/database.db`.

The schema consists of four tables: `buildings`, `nodes`, `edges`, and `walls`. The schema is initialised and migrated automatically on application startup through the `init_db` function, which uses `CREATE TABLE IF NOT EXISTS` statements and safe `ALTER TABLE` migration attempts with exception handling for column existence.

### 4.5.1 Buildings Table

The `buildings` table stores metadata for each uploaded blueprint:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-incrementing unique identifier |
| name | TEXT NOT NULL | Building name provided during upload |
| blueprint_path | TEXT NOT NULL | Absolute filesystem path to the uploaded image |
| qr_path | TEXT | Absolute filesystem path to the generated QR code image |
| latitude | REAL | Geographic latitude extracted from Google Maps link |
| longitude | REAL | Geographic longitude extracted from Google Maps link |

### 4.5.2 Nodes Table

The `nodes` table stores extracted spatial points representing navigable locations:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-incrementing unique identifier |
| building_id | INTEGER | Foreign key referencing buildings.id |
| node_key | TEXT | AI-assigned node identifier (e.g., "entrance", "room_101") |
| label | TEXT | Human-readable name (e.g., "Lobby", "Room 101") |
| x_coord | INTEGER | Horizontal coordinate in the 0–1000 range |
| y_coord | INTEGER | Vertical coordinate in the 0–1000 range |
| latitude | REAL | Computed geographic latitude via geo-transformation |
| longitude | REAL | Computed geographic longitude via geo-transformation |
| type | TEXT | Node classification: room, hallway, entrance, stairs, elevator |
| media_path | TEXT | URL path to associated 360-degree media |
| media_type | TEXT | Media type classification: photo or video |

### 4.5.3 Edges Table

The `edges` table stores walkable connections between nodes:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-incrementing unique identifier |
| building_id | INTEGER | Foreign key referencing buildings.id |
| from_node | TEXT | Source node key referencing nodes.node_key |
| to_node | TEXT | Destination node key referencing nodes.node_key |
| weight | REAL | Edge weight representing walking distance in metres |

### 4.5.4 Walls Table

The `walls` table stores physical wall segments for 3D rendering and line-of-sight calculations:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-incrementing unique identifier |
| building_id | INTEGER | Foreign key referencing buildings.id |
| x1, y1 | INTEGER | Start coordinate of wall segment in 0–1000 range |
| x2, y2 | INTEGER | End coordinate of wall segment in 0–1000 range |

**Figure 4.5 Database Entity-Relationship Diagram**
*Purpose: Diagram showing the four tables, their columns, primary keys, and foreign key relationships between buildings, nodes, edges, and walls.*

## 4.6 QR Code Generation Module

The QR code generation module is implemented in `backend/app/services/qr_generator.py` using the `qrcode` Python library with Pillow for image output. QR code generation occurs automatically as part of the blueprint upload workflow, triggered after successful AI analysis and database persistence.

The module constructs a navigation URL following the pattern `http://localhost:5173/visitor/navigate/{building_id}?startNode={start_node_key}`, where the start node key corresponds to the building's entrance node. This URL is encoded into a QR code image using the `qrcode.QRCode` class with L-level error correction and a box size of 10 pixels. The generated image is saved to the uploads directory with a filename pattern of `qr_{building_name}_{building_id}.png`.

The generated QR code URL and destination navigation link are included in the upload API response, enabling the frontend to display both the QR image and a clickable text link to the end user.

**Figure 4.6 QR Code Generation Workflow**
*Purpose: Flowchart showing the QR generation process from entrance node identification through URL construction, image encoding, and file persistence.*

## 4.7 Navigation and Pathfinding Module

The pathfinding module is implemented in `backend/app/services/pathfinding.py` using the NetworkX graph analysis library. The module constructs an undirected weighted graph from the nodes and edges stored in the database, then applies Dijkstra's shortest path algorithm to compute the optimal route between two locations.

### 4.7.1 Graph Construction

Nodes from the database are added to a NetworkX `Graph` object with their identifier as the node key and all node attributes preserved. Edges are added with their stored weight values representing walking distances in metres.

### 4.7.2 Dijkstra Shortest Path

The `calculate_shortest_path` function accepts a list of node dictionaries, a list of edge dictionaries, a source node key, and a destination node key. It invokes `nx.shortest_path` with the weight parameter set to `'weight'`, which causes NetworkX to execute Dijkstra's algorithm. The function returns an ordered list of node keys representing the shortest path. If no path exists, it returns an empty list gracefully.

### 4.7.3 Line-of-Sight Custom Routing

The route calculation endpoint in the navigation module extends the basic pathfinding with support for arbitrary coordinate-based start and end points. When a user clicks on the 3D map, the frontend sends the click coordinates as a JSON object with `x` and `y` properties. The backend creates a virtual node for the custom point and evaluates line-of-sight connections to every existing node in the graph.

The line-of-sight check uses an orientation-based line segment intersection algorithm. For each potential edge between the custom point and an existing node, the algorithm checks whether any wall segment intersects the connecting line. If an intersection is detected, the edge is excluded from the graph. Only collision-free edges are added, with weight calculated as the Euclidean distance between the two points. The augmented graph is then processed through the standard Dijkstra algorithm.

### 4.7.4 Destination Resolution

The system accepts destination input in multiple forms: direct node keys (e.g., `"entrance"`), human-readable labels (case-insensitive), and coordinate objects for custom points. The resolution logic first checks for an exact node key match, then falls back to label matching, and finally handles coordinate objects as custom destinations.

**Figure 4.7 Pathfinding Algorithm Flow**
*Purpose: Diagram showing the route calculation process from destination selection through graph construction, line-of-sight checking, Dijkstra execution, and coordinate enrichment.*

## 4.8 User Interaction Workflow

### 4.8.1 Administrator Workflow

The administrator accesses the system by navigating to the admin login page at `/admin/login` and authenticating using the credentials `admin@navsystem.com` / `admin`. Upon successful login, the administrator is redirected to the dashboard page displaying an overview of managed buildings. From the dashboard, the administrator can navigate to the blueprint upload page.

On the blueprint upload page, the administrator provides a building name, a Google Maps share link for geographic positioning, and selects a blueprint image file for upload. The system validates the image, analyses it via Gemini AI, persists the extracted data to the database, generates a QR code, and returns the results. The administrator can then optionally attach 360-degree media to individual extracted nodes.

### 4.8.2 Visitor Workflow

The visitor accesses the navigation system by scanning a QR code placed at the building entrance, which opens the navigation page at `/visitor/navigate/{buildingId}?startNode={nodeKey}`. The page loads building data from the backend including the building name, coordinates, blueprint image URL, nodes, and wall segments.

A geo-fence check is performed if the building has stored GPS coordinates: the browser's geolocation API measures the visitor's distance from the building using the Haversine formula. If the distance exceeds 2000 metres, a warning message is displayed and navigation is blocked.

The visitor is presented with a prominent destination search overlay containing a dropdown of all available nodes. No route is calculated until the visitor explicitly selects a destination. After selection, the route request is sent to the backend, and the returned path is rendered as a 3D polyline on the map.

The 3D view supports two mutually exclusive interaction modes controlled by buttons at the bottom right: Location mode, which allows clicking on the map to set a custom start position, and 3D mode, which enables free rotation of the three-dimensional scene for visual exploration. If any node along the path has associated 360-degree media, the visitor can click the node to switch to immersive panorama viewing mode.

**Figure 4.8 Visitor Navigation Journey**
*Purpose: Step-by-step screenshot sequence showing the visitor experience from QR code scanning through destination selection, route display, and 3D map interaction.*

## 4.9 Security and Validation

The system implements several validation and security measures at the application level.

File upload validation is performed at two stages. The file extension is checked against an allowed whitelist (`png`, `jpg`, `jpeg`) in the blueprint upload endpoint, and a broader set (`png`, `jpg`, `jpeg`, `mp4`, `webm`) in the media upload endpoint. The `secure_filename` function from the Werkzeug library sanitises filenames to prevent path traversal attacks.

Blueprint validation is performed by the Gemini AI validation service, which assesses whether the uploaded image is a genuine architectural floor plan and whether it plausibly corresponds to the provided GPS coordinates. If validation fails explicitly, the uploaded file is removed and an error response is returned.

The Gemini API key is stored in a `.env` file loaded via `python-dotenv`, preventing the key from being hardcoded in source files. The `.env` file is excluded from version control through the backend `.gitignore` configuration.

API safeguards include required field validation in all POST endpoints with appropriate 400 Bad Request responses for missing fields. Node existence is verified before media upload. Building existence is verified before data retrieval.

CORS is configured to allow all origins, which is permissive but acceptable for development. No authentication middleware is implemented for admin routes; the login endpoint returns a mock token that is stored client-side but never validated server-side.

## 4.10 Testing and Verification

The project does not include a formal test suite. No unit tests, integration tests, or end-to-end tests are present in the codebase. Type checking and static analysis tooling are also absent.

Verification of functionality was performed through manual testing during development as documented in the project's `changes.md` file. Each development phase included manual verification steps:

- Verification of blueprint upload and AI analysis by uploading sample floor plan images and inspecting the returned node, edge, and wall counts
- Verification of pathfinding by requesting routes between known nodes and confirming the path sequence
- Verification of 3D rendering by observing wall geometry, node positions, and route lines on the Three.js canvas
- Verification of QR code generation by scanning generated QR codes and confirming navigation URL correctness
- Verification of geo-fencing by testing location proximity checks
- Verification of wall gap post-processing by comparing 3D wall visualisation before and after the splitting algorithm

The frontend includes an ESLint configuration for code linting via the `npm run lint` command, but no automated test runner is configured.

**Figure 4.9 Manual Testing Verification**
*Purpose: Screenshot showing the 3D map rendering with wall segments, route path, and node markers after successful blueprint analysis.*

## 4.11 Implementation Summary

The AI Based Navigation System has been implemented as a fully functional indoor navigation platform with the following completed modules:

- **Frontend Application**: A React 19 SPA with seven pages, Tailwind CSS 4 styling, and client-side routing, providing both administrative and visitor interfaces
- **3D Visualisation**: A Three.js-based rendering engine powered by React Three Fiber that procedurally generates wall geometry, route paths, and interactive node markers from database coordinates
- **REST API**: A Flask 3 backend exposing six endpoints across four blueprint modules, handling file upload, authentication, navigation, and media management
- **AI Blueprint Analysis**: Integration with Google Gemini 2.5 Flash for automatic extraction of navigation nodes, walkable edges, and wall boundaries from uploaded floor plan images, with post-processing to ensure proper door gap placement
- **Pathfinding Engine**: NetworkX-based Dijkstra shortest path algorithm with line-of-sight custom routing, enabling navigation between both predefined nodes and arbitrary map coordinates
- **Database Persistence**: SQLite schema with four related tables for storing buildings, nodes, edges, and walls with geographic coordinate support
- **QR Code Generation**: Automated QR code creation during blueprint upload encoding building-specific navigation URLs
- **360-Degree Media Support**: Photo and video upload capability associated with individual navigation nodes for immersive panorama viewing

The implementation achieves the project objectives of automating indoor map creation through AI, providing interactive 3D navigation for visitors, and enabling building administrators to manage navigation data through a web-based interface. The modular architecture facilitates future extension, including multi-floor support, real authentication, and mobile deployment.
