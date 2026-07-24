import networkx as nx

def calculate_shortest_path(nodes, edges, start_id, end_id):
    """
    Uses NetworkX to build a graph from nodes and edges,
    and applies Dijkstra's algorithm to find the shortest path.
    """
    G = nx.Graph()

    # Add nodes
    for node in nodes:
        G.add_node(node['id'], **node)

    # Add weighted edges (walkable paths)
    for edge in edges:
        G.add_edge(edge['from'], edge['to'], weight=edge.get('weight', 1.0))

    try:
        # A* or Dijkstra execution
        path = nx.shortest_path(G, source=start_id, target=end_id, weight='weight')
        print(f"Found path: {path}")
        return path
    except nx.NetworkXNoPath:
        print(f"No path between {start_id} and {end_id}")
        return []
    except nx.NodeNotFound as e:
        print(f"Node not in graph: {e}")
        return []
