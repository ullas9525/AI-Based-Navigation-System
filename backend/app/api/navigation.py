from flask import Blueprint, request, jsonify
from app.database import get_db_connection
from app.services.pathfinding import calculate_shortest_path
from app.services.geo_transform import pixel_to_latlong

navigation_bp = Blueprint('navigation', __name__)


# ---------------------------------------------------------------------------
# GET /api/navigation/<building_id>/nodes
# Returns all persisted nodes for a building from the SQLite DB.
# ---------------------------------------------------------------------------
@navigation_bp.route('/<int:building_id>/nodes', methods=['GET'])
def get_nodes(building_id):
    conn = get_db_connection()
    rows = conn.execute(
        'SELECT node_key, label, x_coord, y_coord, type FROM nodes WHERE building_id = ?',
        (building_id,)
    ).fetchall()
    conn.close()

    nodes = [
        {
            "id":    row["node_key"],
            "label": row["label"],
            "x":     row["x_coord"],
            "y":     row["y_coord"],
            "type":  row["type"]
        }
        for row in rows
    ]

    return jsonify({"building_id": building_id, "nodes": nodes}), 200


# ---------------------------------------------------------------------------
# POST /api/navigation/route
# Body: { "building_id": 1, "start": "entrance", "end": "room_101" }
#
# Flow:
#   1. Load nodes + edges from DB for the given building_id
#   2. Build node lookup map  {node_key -> node_dict}
#   3. Resolve start/end: accepts node_key OR label (case-insensitive)
#   4. Call NetworkX Dijkstra via pathfinding.calculate_shortest_path()
#   5. For each node in path, retrieve (x, y) + convert to Lat/Long
#   6. Return ordered coordinate list + total_cost
# ---------------------------------------------------------------------------
@navigation_bp.route('/route', methods=['POST'])
def calculate_route():
    data = request.get_json(force=True)

    building_id = data.get('building_id')
    start_input  = data.get('start', '').strip()
    end_input    = data.get('end', '').strip()

    if not building_id:
        return jsonify({"error": "building_id is required"}), 400
    if not start_input or not end_input:
        return jsonify({"error": "start and end are required"}), 400

    conn = get_db_connection()

    # Fetch building for Lat/Long geo-transform
    building = conn.execute(
        'SELECT latitude, longitude FROM buildings WHERE id = ?', (building_id,)
    ).fetchone()

    # Fetch nodes
    node_rows = conn.execute(
        'SELECT node_key, label, x_coord, y_coord, type FROM nodes WHERE building_id = ?',
        (building_id,)
    ).fetchall()

    # Fetch edges
    edge_rows = conn.execute(
        'SELECT from_node, to_node, weight FROM edges WHERE building_id = ?',
        (building_id,)
    ).fetchall()

    conn.close()

    if not node_rows:
        return jsonify({"error": "No nodes found for this building. Upload a blueprint first."}), 404

    # Build lookup: node_key -> dict, and label_lower -> node_key
    node_map     = {}   # node_key  -> full node dict
    label_to_key = {}   # lowercase label -> node_key

    nodes_for_graph = []
    edges_for_graph = []

    for row in node_rows:
        n = {
            "id":    row["node_key"],
            "label": row["label"],
            "x":     row["x_coord"],
            "y":     row["y_coord"],
            "type":  row["type"]
        }
        node_map[row["node_key"]] = n
        label_to_key[row["label"].lower()] = row["node_key"]
        nodes_for_graph.append(n)

    for row in edge_rows:
        edges_for_graph.append({
            "from":   row["from_node"],
            "to":     row["to_node"],
            "weight": row["weight"]
        })

    # Resolve start/end: try exact node_key first, then label match
    def resolve_node(user_input):
        if user_input in node_map:
            return user_input
        return label_to_key.get(user_input.lower())

    start_key = resolve_node(start_input)
    end_key   = resolve_node(end_input)

    if not start_key:
        return jsonify({"error": f"Start node '{start_input}' not found"}), 404
    if not end_key:
        return jsonify({"error": f"End node '{end_input}' not found"}), 404

    # Run Dijkstra via the existing pathfinding service
    path_keys = calculate_shortest_path(
        nodes_for_graph, edges_for_graph, start_key, end_key
    )

    if not path_keys:
        return jsonify({"success": False, "error": "No path found between these nodes"}), 200

    # Build enriched coordinate list for the frontend
    bld_lat = building["latitude"]  if building else None
    bld_lng = building["longitude"] if building else None

    path_coords = []
    for key in path_keys:
        node = node_map[key]
        lat, lng = pixel_to_latlong(node["x"], node["y"], bld_lat, bld_lng)
        path_coords.append({
            "node_id": key,
            "label":   node["label"],
            "type":    node["type"],
            "x":       node["x"],
            "y":       node["y"],
            "lat":     lat,
            "lng":     lng
        })

    # Compute total edge cost for the path
    edge_weight_map = {}
    for e in edges_for_graph:
        edge_weight_map[(e["from"], e["to"])] = e["weight"]
        edge_weight_map[(e["to"], e["from"])] = e["weight"]   # undirected

    total_cost = 0.0
    for i in range(len(path_keys) - 1):
        total_cost += edge_weight_map.get((path_keys[i], path_keys[i + 1]), 1.0)

    return jsonify({
        "success":    True,
        "path":       path_coords,
        "total_cost": round(total_cost, 2)
    }), 200
