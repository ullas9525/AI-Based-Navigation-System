<!-- generated-by: gsd-doc-writer -->
# API Reference

The AI Based Navigation System exposes a **Flask-based REST API** on `http://localhost:5000`. All endpoints return JSON responses. The API supports blueprint upload with AI analysis, Dijkstra-based pathfinding, 360° media attachment per navigation node, and mock authentication.

---

## Authentication

The API uses a **mock JWT-based authentication** mechanism.

### Login

Send credentials to obtain a token:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@navsystem.com", "password": "admin"}'
```

**Success response (200):**

```json
{
  "success": true,
  "token": "mock-jwt-token-7389",
  "user": {
    "name": "Admin User",
    "email": "admin@navsystem.com"
  }
}
```

**Failure response (401):**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

> **Note:** The authentication endpoint is mock-only. The returned `token` is not validated by downstream endpoints. This is a development stub intended for future integration with a proper auth provider.

---

## Endpoints Overview

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `GET` | `/health` | Health check | No |
| `POST` | `/api/auth/login` | Mock login | No |
| `POST` | `/api/blueprints/upload` | Upload floorplan blueprint, AI-analyze, persist to DB, generate QR | No |
| `GET` | `/api/blueprints/<building_id>` | Retrieve building details, nodes, and walls | No |
| `GET` | `/api/navigation/<building_id>/nodes` | List all navigation nodes for a building | No |
| `POST` | `/api/navigation/route` | Calculate shortest path between two points (Dijkstra + line-of-sight) | No |
| `POST` | `/api/media/node/<building_id>/<node_key>` | Upload 360° photo/video for a specific node | No |
| `GET` | `/uploads/<filename>` | Serve uploaded blueprint images | No |
| `GET` | `/uploads/media/<filename>` | Serve uploaded media files | No |

---

## Endpoint Details

### GET /health

Returns the service health status.

**Response (200):**

```json
{
  "status": "healthy",
  "service": "AI Navigation Backend"
}
```

---

### POST /api/blueprints/upload

Accepts a floorplan image, validates it (optionally via Gemini), extracts nodes/edges/walls using AI, persists everything to the SQLite database, and generates a QR code pointing to the visitor navigation interface.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Blueprint image (`png`, `jpg`, `jpeg`) |
| `buildingName` | String | No | Building name (default: `"Unknown Building"`) |
| `mapLink` | String | No | Google Maps URL (e.g. `https://maps.app.goo.gl/...`) for extracting GPS coordinates |

**Success response (200):**

```json
{
  "message": "Blueprint uploaded and analyzed successfully",
  "building": "Main Office",
  "building_id": 1,
  "nodes_detected": 13,
  "edges_detected": 14,
  "walls_detected": 8,
  "blueprint_url": "/uploads/floorplan.png",
  "qr_code_url": "/uploads/qr_main_office_1.png",
  "qr_destination_url": "http://localhost:5173/visitor/navigate/1?startNode=entrance",
  "nodes": [
    {
      "id": "entrance",
      "type": "entrance",
      "label": "Entrance",
      "x": 500,
      "y": 950
    }
  ]
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | No file provided |
| `400` | File type not allowed (must be `png`, `jpg`, `jpeg`) |
| `400` | Blueprint validation failed (GPS mismatch) |

> **Gemini AI integration:** If `GEMINI_API_KEY` is not set, the endpoint falls back to a hardcoded mock dataset (13 nodes, 14 edges, no walls). See [CONFIGURATION.md](CONFIGURATION.md) for environment variable details.

---

### GET /api/blueprints/<building_id>

Retrieves a building's metadata, navigation nodes, and wall geometry for the 3D map renderer.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `building_id` | Integer | Building ID from the database |

**Success response (200):**

```json
{
  "id": 1,
  "name": "Main Office",
  "latitude": 12.9715987,
  "longitude": 77.5945627,
  "blueprint_url": "/uploads/floorplan.png",
  "nodes": [
    {
      "id": "entrance",
      "label": "Entrance",
      "x": 500,
      "y": 950,
      "type": "entrance",
      "media_path": null,
      "media_type": null
    }
  ],
  "walls": [
    {
      "x1": 100,
      "y1": 200,
      "x2": 900,
      "y2": 200
    }
  ]
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404` | Building not found |

---

### GET /api/navigation/<building_id>/nodes

Returns all persisted navigation nodes for a building, including geographic coordinates.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `building_id` | Integer | Building ID from the database |

**Success response (200):**

```json
{
  "building_id": 1,
  "nodes": [
    {
      "id": "entrance",
      "label": "Entrance",
      "x": 500,
      "y": 950,
      "lat": 12.9716937,
      "lng": 77.5946584,
      "type": "entrance",
      "media_path": null,
      "media_type": null
    }
  ]
}
```

---

### POST /api/navigation/route

Calculates the shortest path between two points using **NetworkX Dijkstra** with **line-of-sight** detection. Supports both named nodes (by `node_key` or `label`) and custom coordinates.

**Request body (named nodes):**

```json
{
  "building_id": 1,
  "start": "entrance",
  "end": "room_101"
}
```

**Request body (custom coordinates — visitor's current location):**

```json
{
  "building_id": 1,
  "start": { "x": 450, "y": 300 },
  "end": "room_101"
}
```

**Request body (both custom):**

```json
{
  "building_id": 1,
  "start": { "x": 450, "y": 300 },
  "end": { "x": 800, "y": 200 }
}
```

**Success response (200):**

```json
{
  "success": true,
  "path": [
    {
      "node_id": "entrance",
      "label": "Entrance",
      "type": "entrance",
      "x": 500,
      "y": 950,
      "lat": 12.9716937,
      "lng": 77.5946584,
      "media_path": null,
      "media_type": null
    }
  ],
  "total_cost": 18.5
}
```

**No-path response (200):**

```json
{
  "success": false,
  "error": "No path found between these locations"
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | `building_id`, `start`, or `end` missing |
| `404` | Start or end node not found / building has no nodes |

**How it works:**

1. Loads all nodes, edges, and walls from the SQLite database for the given `building_id`.
2. Resolves `start` and `end` — accepts a `node_key` (e.g., `"entrance"`), a `label` (case-insensitive), or a `{x, y}` object for custom coordinates.
3. If custom coordinates are provided, performs line-of-sight checks against all walls to find which nodes are reachable from that point.
4. Injects line-of-sight edges into the graph, then runs NetworkX Dijkstra.
5. Returns the ordered path with node metadata and total cost.

---

### POST /api/media/node/<building_id>/<node_key>

Uploads a 360° photo or video and associates it with a specific navigation node.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `building_id` | Integer | Building ID |
| `node_key` | String | Node key (e.g., `"entrance"`, `"room_101"`) |

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Image or video file (`png`, `jpg`, `jpeg`, `mp4`, `webm`) |

**Success response (200):**

```json
{
  "message": "Media uploaded successfully",
  "media_path": "/uploads/media/building_1_node_entrance.png",
  "media_type": "photo"
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | No file provided |
| `400` | Invalid file type (allowed: `png`, `jpg`, `jpeg`, `mp4`, `webm`) |
| `404` | Node not found for this building |

---

### Static File Serving

#### GET /uploads/<filename>

Serves uploaded blueprint images from the `backend/uploads/` directory.

#### GET /uploads/media/<filename>

Serves uploaded media files from the `backend/uploads/media/` directory.

---

## Request / Response Format

### Common Patterns

- All requests and responses use **JSON** except file upload endpoints which use `multipart/form-data`.
- The base URL for local development is `http://localhost:5000`.
- Coordinate system: `x` and `y` are integers in the `0–1000` range (SVG viewBox `0 0 1000 1000`).
- Geographic coordinates: `lat`/`lng` are floats with 7 decimal places of precision.

### Standard Response Envelope

**Success:**

```json
{
  "success": true,
  "...": "..."
}
```

**Error:**

```json
{
  "error": "Description of what went wrong"
}
```

> **Note:** Some endpoints use `"success"` boolean while others omit it — check individual endpoint documentation.

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| `200` | Success — request completed as expected |
| `400` | Bad Request — invalid input, missing file, unsupported file type, or validation failure |
| `401` | Unauthorized — invalid login credentials |
| `404` | Not Found — building, node, or resource does not exist |

There is **no centralized error handler**. Each endpoint returns its own error structure. Errors are always JSON objects with either an `error` key (string) or a `success: false` + `message`/`error` key.

---

## Rate Limits

No rate limiting is configured. All endpoints are currently unrestricted.
