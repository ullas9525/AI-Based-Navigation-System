from flask import Blueprint, jsonify

navigation_bp = Blueprint('navigation', __name__)

@navigation_bp.route('/<building_id>/nodes', methods=['GET'])
def get_nodes(building_id):
    # Mock data for rooms in a building
    nodes = [
        {"id": "entry", "label": "Main Entrance", "x": 100, "y": 700},
        {"id": "lobby", "label": "Lobby", "x": 100, "y": 600},
        {"id": "hall1", "label": "East Hallway", "x": 200, "y": 600},
        {"id": "office1", "label": "Room 101", "x": 200, "y": 500},
        {"id": "office2", "label": "Room 102", "x": 300, "y": 600}
    ]
    return jsonify({"building": building_id, "nodes": nodes}), 200

@navigation_bp.route('/route', methods=['POST'])
def calculate_route():
    from flask import request
    data = request.json
    start = data.get('start')
    end = data.get('end')
    
    # Mock routing for prototype
    mock_routes = {
        "entry-office1": [{"x": 100, "y": 700}, {"x": 100, "y": 600}, {"x": 200, "y": 600}, {"x": 200, "y": 500}],
        "entry-office2": [{"x": 100, "y": 700}, {"x": 100, "y": 600}, {"x": 200, "y": 600}, {"x": 300, "y": 600}]
    }
    
    key = f"{start}-{end}"
    if key in mock_routes:
        return jsonify({"success": True, "path": mock_routes[key]}), 200
        
    # Return a generic straight line for unknown paths
    return jsonify({"success": True, "path": [{"x": 100, "y": 700}, {"x": 400, "y": 400}]}), 200
