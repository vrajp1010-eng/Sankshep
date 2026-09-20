import sqlite3
from contextlib import contextmanager

DB_PATH = "history.db"

def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transformation_type TEXT,
                input_words INTEGER,
                output_words INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def log_transformation(transformation_type: str, input_words: int, output_words: int):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO history (transformation_type, input_words, output_words) VALUES (?, ?, ?)",
            (transformation_type, input_words, output_words),
        )

def get_recent_history(limit: int = 25):
    with get_conn() as conn:
        cur = conn.execute(
            "SELECT id, transformation_type, input_words, output_words, created_at FROM history ORDER BY id DESC LIMIT ?",
            (limit,),
        )
        rows = cur.fetchall()
        return [
            {
                "id": r[0],
                "transformation_type": r[1],
                "input_words": r[2],
                "output_words": r[3],
                "created_at": r[4],
            }
            for r in rows
        ]

def get_analytics_summary():
    with get_conn() as conn:
        cur = conn.execute("""
            SELECT 
                COUNT(*) as total_runs,
                COALESCE(SUM(input_words), 0) as total_in_words,
                COALESCE(SUM(output_words), 0) as total_out_words
            FROM history
        """)
        row = cur.fetchone()
        
        cur2 = conn.execute("""
            SELECT transformation_type, COUNT(*) as count 
            FROM history 
            GROUP BY transformation_type 
            ORDER BY count DESC 
            LIMIT 5
        """)
        top_types = [{"type": r[0], "count": r[1]} for r in cur2.fetchall()]
        
        return {
            "total_runs": row[0] if row else 0,
            "total_input_words": row[1] if row else 0,
            "total_output_words": row[2] if row else 0,
            "top_formats": top_types,
        }