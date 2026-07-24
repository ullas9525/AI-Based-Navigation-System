from flask import Blueprint, request, jsonify
from app.database import get_db_connection
from app.services.pathfinding import calculate_shortest_path

navigation_bp = Blueprint('navigation', __name__)


# ---------------------------------------------------------------------------
# GET /api/navigation/<building_id>/nodes
# Returns all persisted nodes for a building from the SQLite DB.
# ---------------------------------------------------------------------------
@navigation_bp.route('/<int:building_id>/nodes', methods=['GET'])
def get_nodes(building_id):
    conn = get_db_connection()
    rows = conn.execute(
        'SELECT node_key, label, x_coord, y_coord, latitude, longitude, type, media_path, media_type FROM nodes WHERE building_id = %s',
        (building_id,)
    ).fetchall()
    conn.close()

    nodes = [
        {
            "id":    row["node_key"],
            "label": row["label"],
            "x":     row["x_coord"],
            "y":     row["y_coord"],
            "lat":        row["latitude"],
            "lng":        row["longitude"],
            "type":       row["type"],
            "media_path": row["media_path"],
            "media_type": row["media_type"]
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
#   5. For each node in path, retrieve (x, y, lat, lng)
#   6. Return ordered coordinate list + total_cost
# ---------------------------------------------------------------------------
def do_intersect(p1, q1, p2, q2):
    def orientation(p, q, r):
        val = (float(q['y']) - float(p['y'])) * (float(r['x']) - float(q['x'])) - (float(q['x']) - float(p['x'])) * (float(r['y']) - float(q['y']))
        if val > 0:
            return 1
        if val < 0:
            return 2
        return 0

    def on_segment(p, q, r):
        if (q['x'] <= max(p['x'], r['x']) and q['x'] >= min(p['x'], r['x']) and
            q['y'] <= max(p['y'], r['y']) and q['y'] >= min(p['y'], r['y'])):
            return True
        return False

    o1 = orientation(p1, q1, p2)
    o2 = orientation(p1, q1, q2)
    o3 = orientation(p2, q2, p1)
    o4 = orientation(p2, q2, q1)

    if o1 != o2 and o3 != o4:
        return True
    if o1 == 0 and on_segment(p1, p2, q1):
        return True
    if o2 == 0 and on_segment(p1, q2, q1):
        return True
    if o3 == 0 and on_segment(p2, p1, q2):
        return True
    if o4 == 0 and on_segment(p2, q1, q2):
        return True
    return False

def has_line_of_sight(p1, p2, walls):
    for w in walls:
        w_p1 = {'x': w['x1'], 'y': w['y1']}
        w_p2 = {'x': w['x2'], 'y': w['y2']}
        if do_intersect(p1, p2, w_p1, w_p2):
            return False
    return True

@navigation_bp.route('/route', methods=['POST'])
def calculate_route():
    data = request.get_json(force=True)

    building_id = data.get('building_id')
    start_input  = data.get('start')
    end_input    = data.get('end')

    if not building_id:
        return jsonify({"error": "building_id is required"}), 400
    if start_input is None or end_input is None:
        return jsonify({"error": "start and end are required"}), 400

    conn = get_db_connection()

    node_rows = conn.execute(
        'SELECT node_key, label, x_coord, y_coord, latitude, longitude, type, media_path, media_type FROM nodes WHERE building_id = %s',
        (building_id,)
    ).fetchall()

    edge_rows = conn.execute(
        'SELECT from_node, to_node, weight FROM edges WHERE building_id = %s',
        (building_id,)
    ).fetchall()

    wall_rows = conn.execute(
        'SELECT x1, y1, x2, y2 FROM walls WHERE building_id = %s',
        (building_id,)
    ).fetchall()

    conn.close()

    if not node_rows:
        return jsonify({"error": "No nodes found for this building. Upload a blueprint first."}), 404

    walls = [{"x1": r["x1"], "y1": r["y1"], "x2": r["x2"], "y2": r["y2"]} for r in wall_rows]

    node_map = {}
    label_to_key = {}
    nodes_for_graph = []
    edges_for_graph = []

    for row in node_rows:
        n = {
            "id":    row["node_key"],
            "label": row["label"],
            "x":     row["x_coord"],
            "y":     row["y_coord"],
            "lat":        row["latitude"],
            "lng":        row["longitude"],
            "type":       row["type"],
            "media_path": row["media_path"],
            "media_type": row["media_type"]
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

    def resolve_node(user_input):
        if isinstance(user_input, dict):
            return None
        if user_input in node_map:
            return user_input
        return label_to_key.get(user_input.lower())

    start_key = "custom_start" if isinstance(start_input, dict) else resolve_node(start_input)
    end_key = "custom_end" if isinstance(end_input, dict) else resolve_node(end_input)

    if not start_key:
        return jsonify({"error": f"Start node '{start_input}' not found"}), 404
    if not end_key:
        return jsonify({"error": f"End node '{end_input}' not found"}), 404

    # Inject custom start
    if isinstance(start_input, dict):
        start_node = {
            "id": start_key, "label": "Current Location", "type": "custom",
            "x": start_input['x'], "y": start_input['y'], "lat": None, "lng": None,
            "media_path": None, "media_type": None
        }
        node_map[start_key] = start_node
        for n in nodes_for_graph:
            if has_line_of_sight(start_node, n, walls):
                dist = ((start_node['x'] - n['x'])**2 + (start_node['y'] - n['y'])**2)**0.5
                edges_for_graph.append({"from": start_key, "to": n['id'], "weight": dist})
        nodes_for_graph.append(start_node)

    # Inject custom end
    if isinstance(end_input, dict):
        end_node = {
            "id": end_key, "label": "Destination", "type": "custom",
            "x": end_input['x'], "y": end_input['y'], "lat": None, "lng": None,
            "media_path": None, "media_type": None
        }
        node_map[end_key] = end_node
        for n in nodes_for_graph: # This includes the custom start node if it was added!
            if n['id'] != end_key and has_line_of_sight(end_node, n, walls):
                dist = ((end_node['x'] - n['x'])**2 + (end_node['y'] - n['y'])**2)**0.5
                edges_for_graph.append({"from": end_key, "to": n['id'], "weight": dist})
        nodes_for_graph.append(end_node)

    path_keys = calculate_shortest_path(nodes_for_graph, edges_for_graph, start_key, end_key)

    if not path_keys:
        return jsonify({"success": False, "error": "No path found between these locations"}), 200

    path_coords = []
    for key in path_keys:
        node = node_map[key]
        path_coords.append({
            "node_id": key, "label": node["label"], "type": node["type"],
            "x": node["x"], "y": node["y"], "lat": node["lat"], "lng": node["lng"],
            "media_path": node["media_path"], "media_type": node["media_type"]
        })

    edge_weight_map = {}
    for e in edges_for_graph:
        edge_weight_map[(e["from"], e["to"])] = e["weight"]
        edge_weight_map[(e["to"], e["from"])] = e["weight"]

    total_cost = sum(edge_weight_map.get((path_keys[i], path_keys[i + 1]), 1.0) for i in range(len(path_keys) - 1))

    return jsonify({
        "success": True,
        "path": path_coords,
        "total_cost": round(total_cost, 2)
    }), 200
