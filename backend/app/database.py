import os
import sqlite3

DATABASE_URL = os.environ.get('DATABASE_URL', '')

def _get_sqlite_conn():
    db_path = os.environ.get('SQLITE_PATH',
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db'))
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn, 'sqlite'

def _get_pg_conn():
    import psycopg2
    import psycopg2.extras
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    return conn, 'postgres'

class DbConnection:
    def __init__(self):
        if DATABASE_URL:
            self._conn, self._vendor = _get_pg_conn()
        else:
            self._conn, self._vendor = _get_sqlite_conn()
        self._cursor = None

    def _fix_params(self, sql, params):
        if self._vendor == 'sqlite':
            return sql.replace('%s', '?'), params
        return sql, params

    def execute(self, sql, params=None):
        sql, params = self._fix_params(sql, params)
        self._cursor = self._conn.cursor()
        self._cursor.execute(sql, params or ())
        return self

    def executemany(self, sql, seq):
        sql, _ = self._fix_params(sql, None)
        self._cursor = self._conn.cursor()
        self._cursor.executemany(sql, seq)
        return self

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    @property
    def lastrowid(self):
        if self._vendor == 'sqlite':
            return self._cursor.lastrowid
        return self._cursor.fetchone()[0]

    def commit(self):
        self._conn.commit()

    def close(self):
        if self._cursor:
            self._cursor.close()
        self._conn.close()


def get_db_connection():
    return DbConnection()


def init_db():
    if DATABASE_URL:
        _init_db_pg()
    else:
        _init_db_sqlite()


def _init_db_sqlite():
    conn = sqlite3.connect(
        os.environ.get('SQLITE_PATH',
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')))
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS buildings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            blueprint_path TEXT NOT NULL,
            qr_path TEXT,
            latitude REAL,
            longitude REAL
        );
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
        );
        CREATE TABLE IF NOT EXISTS edges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            building_id INTEGER,
            from_node TEXT,
            to_node TEXT,
            weight REAL DEFAULT 1.0,
            FOREIGN KEY(building_id) REFERENCES buildings(id)
        );
        CREATE TABLE IF NOT EXISTS walls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            building_id INTEGER,
            x1 INTEGER,
            y1 INTEGER,
            x2 INTEGER,
            y2 INTEGER,
            FOREIGN KEY(building_id) REFERENCES buildings(id)
        );
    ''')
    try:
        conn.execute('ALTER TABLE nodes ADD COLUMN latitude REAL')
        conn.execute('ALTER TABLE nodes ADD COLUMN longitude REAL')
    except Exception:
        pass
    try:
        conn.execute('ALTER TABLE nodes ADD COLUMN media_path TEXT')
        conn.execute('ALTER TABLE nodes ADD COLUMN media_type TEXT')
    except Exception:
        pass
    conn.commit()
    conn.close()


def _init_db_pg():
    import psycopg2
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS buildings (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            blueprint_path TEXT NOT NULL,
            qr_path TEXT,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS nodes (
            id SERIAL PRIMARY KEY,
            building_id INTEGER REFERENCES buildings(id),
            node_key TEXT,
            label TEXT,
            x_coord INTEGER,
            y_coord INTEGER,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            type TEXT,
            media_path TEXT,
            media_type TEXT
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS edges (
            id SERIAL PRIMARY KEY,
            building_id INTEGER REFERENCES buildings(id),
            from_node TEXT,
            to_node TEXT,
            weight DOUBLE PRECISION DEFAULT 1.0
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS walls (
            id SERIAL PRIMARY KEY,
            building_id INTEGER REFERENCES buildings(id),
            x1 INTEGER,
            y1 INTEGER,
            x2 INTEGER,
            y2 INTEGER
        )
    ''')
    conn.commit()
    cur.close()
    conn.close()
