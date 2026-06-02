from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import urllib.request
import re

from app.services.image_processor import process_blueprint, validate_blueprint
from app.services.qr_generator import generate_qr
from app.database import get_db_connection

blueprints_bp = Blueprint('blueprints', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_coords_from_maps_link(link):
    if not link:
        return 0.0, 0.0
    try:
        # Resolve Google Maps short-links to their full URL
        if "goo.gl" in link or "maps.app.goo.gl" in link:
            req = urllib.request.Request(link, method='HEAD')
            with urllib.request.urlopen(req, timeout=5) as response:
                link = response.geturl()

        # Google Maps full URL contains: .../@lat,lon,...
        match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', link)
        if match:
            return float(match.group(1)), float(match.group(2))
    except Exception as e:
        print(f"Error extracting coords from Map Link: {e}")
    return 0.0, 0.0


# ---------------------------------------------------------------------------
# POST /api/blueprints/upload
# ---------------------------------------------------------------------------
@blueprints_bp.route('/upload', methods=['POST'])
def upload_blueprint():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    building_name = request.form.get('buildingName', 'Unknown Building')
    map_link = request.form.get('mapLink', '')

    latitude, longitude = extract_coords_from_maps_link(map_link)

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    is_valid, reason = validate_blueprint(filepath, latitude, longitude)
    if not is_valid:
        os.remove(filepath)
        return jsonify({"error": f"Blueprint does not align with Google Maps data. Reason: {reason}"}), 400

    # AI-powered blueprint analysis: returns nodes with (x,y) and edges
    nodes, edges = process_blueprint(filepath)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Insert building record
    cursor.execute(
        'INSERT INTO buildings (name, blueprint_path, latitude, longitude) VALUES (?, ?, ?, ?)',
        (building_name, filepath, latitude, longitude)
    )
    building_id = cursor.lastrowid

    # --- Persist NODES ---
    from app.services.geo_transform import pixel_to_latlong
    for node in nodes:
        node_x = int(node.get('x', 500))
        node_y = int(node.get('y', 500))
        node_lat, node_lng = pixel_to_latlong(node_x, node_y, latitude, longitude)
        
        cursor.execute(
            '''INSERT INTO nodes (building_id, node_key, label, x_coord, y_coord, latitude, longitude, type)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                building_id,
                node.get('id', ''),
                node.get('label', ''),
                node_x,
                node_y,
                node_lat,
                node_lng,
                node.get('type', 'room')
            )
        )

    # --- Persist EDGES ---
    for edge in edges:
        cursor.execute(
            '''INSERT INTO edges (building_id, from_node, to_node, weight)
               VALUES (?, ?, ?, ?)''',
            (
                building_id,
                edge.get('from', ''),
                edge.get('to', ''),
                float(edge.get('weight', 1.0))
            )
        )

    # Generate QR with dynamic startNode param
    entrance_node = next((n for n in nodes if n.get('type') == 'entrance'), nodes[0] if nodes else None)
    start_node_key = entrance_node.get('id', 'entrance') if entrance_node else 'entrance'

    qr_path = generate_qr(building_name, str(building_id), start_node_key)
    cursor.execute('UPDATE buildings SET qr_path = ? WHERE id = ?', (qr_path, building_id))

    conn.commit()
    conn.close()

    blueprint_url = f"/uploads/{os.path.basename(filepath)}"
    qr_destination_url = f"http://localhost:5173/visitor/navigate/{building_id}?startNode={start_node_key}"

    return jsonify({
        "message":            "Blueprint uploaded and analyzed successfully",
        "building":           building_name,
        "building_id":        building_id,
        "nodes_detected":     len(nodes),
        "edges_detected":     len(edges),
        "blueprint_url":      blueprint_url,
        "qr_code_url":        f"/uploads/{os.path.basename(qr_path)}",
        "qr_destination_url": qr_destination_url
    }), 200


# ---------------------------------------------------------------------------
# GET /api/blueprints/<building_id>
# ---------------------------------------------------------------------------
@blueprints_bp.route('/<int:building_id>', methods=['GET'])
def get_building(building_id):
    conn = get_db_connection()
    building = conn.execute(
        'SELECT * FROM buildings WHERE id = ?', (building_id,)
    ).fetchone()

    if building is None:
        conn.close()
        return jsonify({"error": "Building not found"}), 404

    # Fetch nodes for the frontend node-selector dropdown
    nodes_rows = conn.execute(
        'SELECT node_key, label, x_coord, y_coord, type FROM nodes WHERE building_id = ?',
        (building_id,)
    ).fetchall()
    conn.close()

    blueprint_filename = (
        os.path.basename(building["blueprint_path"])
        if building["blueprint_path"] else None
    )
    blueprint_url = f"/uploads/{blueprint_filename}" if blueprint_filename else None

    nodes = [
        {
            "id":    row["node_key"],
            "label": row["label"],
            "x":     row["x_coord"],
            "y":     row["y_coord"],
            "type":  row["type"]
        }
        for row in nodes_rows
    ]

    return jsonify({
        "id":            building["id"],
        "name":          building["name"],
        "latitude":      building["latitude"],
        "longitude":     building["longitude"],
        "blueprint_url": blueprint_url,
        "nodes":         nodes
    }), 200
