import os
import json
import mimetypes
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

def process_blueprint(filepath):
    """
    Uses Gemini 2.5 Vision API to analyze floorplan images
    and output a topological node/edge graph with pixel coordinates.

    Returns:
        nodes (list): Each node has id, type, label, x (0-1000), y (0-1000)
        edges (list): Each edge has from, to, weight
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")

    if not api_key:
        print("\n[WARNING] GEMINI_API_KEY environment variable not set.")
        print("Falling back to mock pathfinding data.")
        return get_mock_data()

    print(f"Sending {filepath} to Gemini API for mapping analysis...")

    try:
        client = genai.Client(api_key=api_key)

        with open(filepath, "rb") as f:
            image_data = f.read()

        mime_type, _ = mimetypes.guess_type(filepath)
        if not mime_type:
            mime_type = "image/jpeg"

        prompt = """
        Analyze this building blueprint/floorplan.
        Your goal is to extract a logical navigation graph with precise spatial coordinates and the exact wall bounds.

        Strictly output valid JSON containing three lists:
        - 'nodes': addressable rooms, hallways, entrances, stairs, elevators
        - 'edges': walkable connections between nodes
        - 'walls': physical walls or boundaries separating rooms/hallways

        CRITICAL RULE FOR WALLS:
        - DO NOT create continuous blocks of walls over doors, windows, or clear gaps.
        - If there is a door or a gap in a wall, you MUST split the wall into two separate segments that stop at the edges of the gap.

        IMPORTANT for coordinates:
        - 'x' (or 'x1'/'x2') is the horizontal percentage position on the image (0 = far left, 100 = far right)
        - 'y' (or 'y1'/'y2') is the vertical percentage position on the image (0 = top, 100 = bottom)

        Use this exact schema:
        {
           "nodes": [
              {
                "id": "node_1",
                "type": "room|hallway|entrance|stairs|elevator",
                "label": "Human readable name (e.g. Lobby, Room 101)",
                "x": 50,
                "y": 80
              }
           ],
           "edges": [
              {"from": "node_1", "to": "node_2", "weight": 5.0}
           ],
           "walls": [
              {"x1": 10, "y1": 20, "x2": 90, "y2": 20}
           ]
        }

        Rules:
        - Keep nodes under 25 for a solid connected graph
        - Extract the main bounding walls and interior walls
        - x and y must be integers between 0 and 100
        """

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                prompt,
                types.Part.from_bytes(data=image_data, mime_type=mime_type)
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )

        data = json.loads(response.text)
        nodes_raw = data.get("nodes", [])
        edges_raw = data.get("edges", [])
        walls_raw = data.get("walls", [])

        # Scale x,y from 0-100 percentage to 0-1000 integer coordinate space
        for node in nodes_raw:
            node['x'] = int(float(node.get('x', 50)) * 10)
            node['y'] = int(float(node.get('y', 50)) * 10)
            
        for wall in walls_raw:
            wall['x1'] = int(float(wall.get('x1', 0)) * 10)
            wall['y1'] = int(float(wall.get('y1', 0)) * 10)
            wall['x2'] = int(float(wall.get('x2', 0)) * 10)
            wall['y2'] = int(float(wall.get('y2', 0)) * 10)

        print(f"Successfully generated navigation graph from Gemini! "
              f"({len(nodes_raw)} nodes, {len(edges_raw)} edges, {len(walls_raw)} walls)")
        return nodes_raw, edges_raw, walls_raw

    except Exception as e:
        print(f"Failed to parse AI response: {e}")
        return get_mock_data()


def get_mock_data():
    """
    Realistic mock data for testing without a Gemini API key.
    Coordinates are in 0-1000 scale. Represents a simple office floor plan.
    """
    mock_nodes = [
        {"id": "entrance", "type": "entrance", "label": "Entrance",       "x": 500, "y": 950},
        {"id": "lobby",    "type": "hallway",  "label": "Lobby",          "x": 500, "y": 800},
        {"id": "hallway_n","type": "hallway",  "label": "North Hallway",  "x": 500, "y": 600},
        {"id": "hallway_e","type": "hallway",  "label": "East Wing",      "x": 750, "y": 600},
        {"id": "hallway_w","type": "hallway",  "label": "West Wing",      "x": 250, "y": 600},
        {"id": "room_101", "type": "room",     "label": "Room 101",       "x": 150, "y": 500},
        {"id": "room_102", "type": "room",     "label": "Room 102",       "x": 350, "y": 500},
        {"id": "room_103", "type": "room",     "label": "Room 103",       "x": 650, "y": 500},
        {"id": "room_104", "type": "room",     "label": "Room 104",       "x": 850, "y": 500},
        {"id": "stairs",   "type": "stairs",   "label": "Staircase",      "x": 500, "y": 400},
        {"id": "elevator", "type": "elevator", "label": "Elevator",       "x": 400, "y": 400},
        {"id": "lab_a",    "type": "room",     "label": "Lab A",          "x": 200, "y": 250},
        {"id": "lab_b",    "type": "room",     "label": "Lab B",          "x": 700, "y": 250},
    ]
    mock_edges = [
        {"from": "entrance",  "to": "lobby",     "weight": 5.0},
        {"from": "lobby",     "to": "hallway_n", "weight": 8.0},
        {"from": "hallway_n", "to": "hallway_e", "weight": 10.0},
        {"from": "hallway_n", "to": "hallway_w", "weight": 10.0},
        {"from": "hallway_w", "to": "room_101",  "weight": 5.0},
        {"from": "hallway_w", "to": "room_102",  "weight": 4.0},
        {"from": "hallway_e", "to": "room_103",  "weight": 4.0},
        {"from": "hallway_e", "to": "room_104",  "weight": 5.0},
        {"from": "hallway_n", "to": "stairs",    "weight": 6.0},
        {"from": "hallway_n", "to": "elevator",  "weight": 5.0},
        {"from": "stairs",    "to": "lab_a",     "weight": 7.0},
        {"from": "stairs",    "to": "lab_b",     "weight": 7.0},
        {"from": "elevator",  "to": "lab_a",     "weight": 6.0},
        {"from": "elevator",  "to": "lab_b",     "weight": 8.0},
    ]
    return mock_nodes, mock_edges

def validate_blueprint(filepath, lat, lng):
    """
    Validates if the provided image is a valid architectural blueprint
    and aligns with the geographic context.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    
    if not api_key:
        print("\n[WARNING] GEMINI_API_KEY environment variable not set. Skipping validation.")
        return True, "Mock validation successful"

    try:
        client = genai.Client(api_key=api_key)

        with open(filepath, "rb") as f:
            image_data = f.read()

        mime_type, _ = mimetypes.guess_type(filepath)
        if not mime_type:
            mime_type = "image/jpeg"

        prompt = f"""
        Analyze this image. Is it a valid architectural floor plan or blueprint?
        Additionally, considering the GPS coordinates (Latitude: {lat}, Longitude: {lng}), 
        does this image plausibly represent an indoor structure suitable for these coordinates?
        
        Strictly output valid JSON with two fields:
        - 'is_valid': boolean (true if it's a valid blueprint, false otherwise)
        - 'reason': A short explanation string.
        
        Example:
        {{"is_valid": true, "reason": "The image is a valid floor plan showing rooms and corridors."}}
        """

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                prompt,
                types.Part.from_bytes(data=image_data, mime_type=mime_type)
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )

        data = json.loads(response.text)
        return data.get("is_valid", False), data.get("reason", "Failed to determine validity.")

    except Exception as e:
        print(f"Failed to validate blueprint due to API error: {e}. Bypassing validation.")
        return True, f"Validation bypassed due to API error: {e}"
