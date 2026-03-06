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
            label TEXT,
            x_coord INTEGER,
            y_coord INTEGER,
            type TEXT,
            FOREIGN KEY(building_id) REFERENCES buildings(id)
        )
    ''')
    conn.commit()
    conn.close()
