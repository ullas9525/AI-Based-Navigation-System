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
    and output a topological node/edge graph.
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
        Your goal is to extract a logical navigation graph.
        
        Strictly output valid JSON containing two lists: 'nodes' (which represent addressable rooms, hallways, entrances, stairs, elevators) and 'edges' (which represent walkable connections between these nodes). 
        
        Use this exact schema:
        {
           "nodes": [
              {"id": "node_1", "type": "room|hallway|entrance|stairs|elevator", "label": "Human readable name (e.g. Lobby, Room 101)"}
           ],
           "edges": [
              {"from": "node_1", "to": "node_2", "weight": approximate_distance_in_meters}
           ]
        }
        
        Make sure nodes are logically connected based on doors and open hallways visible in the blueprint. Keep the number of nodes under 30 to form a solid connected graph.
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
        print("Successfully generated navigation graph from Gemini!")
        return data.get("nodes", []), data.get("edges", [])
        
    except Exception as e:
        print(f"Failed to parse AI response: {e}")
        return get_mock_data()

def get_mock_data():
    mock_nodes = [{"id": "mock_1", "type": "room", "label": "Mock Room"}]
    mock_edges = []
    return mock_nodes, mock_edges
