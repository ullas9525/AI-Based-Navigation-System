from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import urllib.request
import re

from app.services.image_processor import process_blueprint
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
        # If it's a shortlink, resolve the redirect to get the full URL which contains the @lat,lon
        if "goo.gl" in link or "maps.app.goo.gl" in link:
            req = urllib.request.Request(link, method='HEAD')
            with urllib.request.urlopen(req, timeout=5) as response:
                link = response.geturl()
                
        # Google Maps format is usually .../@lat,lon,...
        match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', link)
        if match:
            return float(match.group(1)), float(match.group(2))
    except Exception as e:
        print(f"Error extracting coords from Map Link: {e}")
    return 0.0, 0.0

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
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Trigger mock AI processing
        nodes, edges = process_blueprint(filepath)
        
        # Insert into database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO buildings (name, blueprint_path, latitude, longitude) VALUES (?, ?, ?, ?)',
            (building_name, filepath, latitude, longitude)
        )
        building_id = cursor.lastrowid
        
        # Generate generic QR for the building
        qr_path = generate_qr(building_name, str(building_id))
        
        # Update QR path in DB
        cursor.execute('UPDATE buildings SET qr_path = ? WHERE id = ?', (qr_path, building_id))
        conn.commit()
        conn.close()
        
        return jsonify({
            "message": "Blueprint uploaded and analyzed successfully",
            "building": building_name,
            "building_id": building_id,
            "nodes_detected": len(nodes),
            "qr_code_url": f"/uploads/{os.path.basename(qr_path)}"
        }), 200

@blueprints_bp.route('/<int:building_id>', methods=['GET'])
def get_building(building_id):
    conn = get_db_connection()
    building = conn.execute('SELECT * FROM buildings WHERE id = ?', (building_id,)).fetchone()
    conn.close()
    
    if building is None:
        return jsonify({"error": "Building not found"}), 404
        
    return jsonify({
        "id": building["id"],
        "name": building["name"],
        "latitude": building["latitude"],
        "longitude": building["longitude"]
    }), 200
        
    return jsonify({"error": "File type not allowed"}), 400
