import sqlite3
import datetime

DB_NAME = 'weather_history.db'

def init_db():
    """Initialize the database and create the history table if it doesn't exist."""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            district TEXT NOT NULL,
            temperature REAL,
            condition TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def add_search(district, temperature, condition):
    """Add a new search record to the history."""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('INSERT INTO history (district, temperature, condition) VALUES (?, ?, ?)',
              (district, temperature, condition))
    conn.commit()
    conn.close()

def get_history():
    """Retrieve the last 10 search history records."""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('SELECT district, temperature, condition, timestamp FROM history ORDER BY timestamp DESC LIMIT 10')
    rows = c.fetchall()
    conn.close()
    return [{'district': r[0], 'temperature': r[1], 'condition': r[2], 'timestamp': r[3]} for r in rows]

if __name__ == '__main__':
    init_db()
