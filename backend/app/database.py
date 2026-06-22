import sqlite3
import os

DATABASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

def get_db_connection():
    """
    Simple SQLite connection wrapper.
    Returns a Row-based connection context.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS buildings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            blueprint_path TEXT NOT NULL,
            qr_path TEXT,
            latitude REAL,
            longitude REAL
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS nodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            building_id INTEGER,
            node_key TEXT,
            label TEXT,
            x_coord INTEGER,
            y_coord INTEGER,
            latitude REAL,
            longitude REAL,
            type TEXT,
            media_path TEXT,
            media_type TEXT,
            FOREIGN KEY(building_id) REFERENCES buildings(id)
        )
    ''')
    
    # Safely migrate existing databases
    try:
        conn.execute('ALTER TABLE nodes ADD COLUMN latitude REAL')
        conn.execute('ALTER TABLE nodes ADD COLUMN longitude REAL')
    except sqlite3.OperationalError:
        pass # Columns already exist

    try:
        conn.execute('ALTER TABLE nodes ADD COLUMN media_path TEXT')
        conn.execute('ALTER TABLE nodes ADD COLUMN media_type TEXT')
    except sqlite3.OperationalError:
        pass # Columns already exist
        
    conn.execute('''
        CREATE TABLE IF NOT EXISTS edges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            building_id INTEGER,
            from_node TEXT,
            to_node TEXT,
            weight REAL DEFAULT 1.0,
            FOREIGN KEY(building_id) REFERENCES buildings(id)
        )
    ''')

    conn.execute('''
        CREATE TABLE IF NOT EXISTS walls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            building_id INTEGER,
            x1 INTEGER,
            y1 INTEGER,
            x2 INTEGER,
            y2 INTEGER,
            FOREIGN KEY(building_id) REFERENCES buildings(id)
        )
    ''')
    conn.commit()
    conn.close()
