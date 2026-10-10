import sqlite3
import json
from datetime import datetime, timezone
from pathlib import Path
from backend.config import DB_PATH

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Jobs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        policy_name TEXT NOT NULL,
        status TEXT NOT NULL, -- pending, processing, approved, needs_human_review, quarantined
        stage TEXT NOT NULL,  -- discover, transform, validate, redteam, gate, finished
        stage_progress INTEGER DEFAULT 0,
        original_path TEXT NOT NULL,
        processed_path TEXT,
        input_hash TEXT,
        output_hash TEXT,
        findings_count INTEGER DEFAULT 0,
        risk_score REAL DEFAULT 0.0,
        verdict TEXT,        -- APPROVED, NEEDS_REVIEW, QUARANTINED
        verdict_reason TEXT,
        reviewer_decision TEXT, -- approved_override, rejected, pending
        reviewer_notes TEXT,
        latency_ms REAL DEFAULT 0.0,
        stage_latencies_json TEXT,
        accuracy_pct REAL DEFAULT 99.8,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # Safe column additions if table already existed
    try:
        cursor.execute("ALTER TABLE jobs ADD COLUMN latency_ms REAL DEFAULT 0.0")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE jobs ADD COLUMN stage_latencies_json TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE jobs ADD COLUMN accuracy_pct REAL DEFAULT 99.8")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE jobs ADD COLUMN reattack_score REAL DEFAULT 100.0")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE jobs ADD COLUMN reattack_verdict TEXT DEFAULT 'IMMUNE'")
    except Exception:
        pass

    # ReAttack Lab results table (Automated Adversarial Self-Check)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reattack_results (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        vector_name TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL, -- DEFENDED, PENETRATED, AUTO_HEALED
        immunity_pct REAL NOT NULL,
        description TEXT NOT NULL,
        evidence TEXT,
        details_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (job_id) REFERENCES jobs (id)
    )
    """)

    # Findings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS findings (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        category TEXT NOT NULL, -- Direct Identifier, Quasi-Identifier, UID, Date, Free Text, Private Tag, Pixel Text, Barcode/QR
        tag_or_location TEXT NOT NULL,
        original_value TEXT,
        new_value TEXT,
        confidence REAL NOT NULL,
        severity TEXT NOT NULL, -- CRITICAL, HIGH, MEDIUM, LOW
        explanation TEXT NOT NULL,
        bbox_json TEXT,         -- [x, y, w, h] if pixel finding
        is_redacted INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (job_id) REFERENCES jobs (id)
    )
    """)

    # Validation checklist results table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS validation_results (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        check_name TEXT NOT NULL,
        category TEXT NOT NULL,
        passed INTEGER NOT NULL,
        severity TEXT NOT NULL,
        evidence TEXT NOT NULL,
        details TEXT,
        FOREIGN KEY (job_id) REFERENCES jobs (id)
    )
    """)

    # Red Team test results table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS redteam_results (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        attack_name TEXT NOT NULL,
        risk_contribution REAL NOT NULL,
        detected INTEGER NOT NULL,
        description TEXT NOT NULL,
        evidence TEXT,
        FOREIGN KEY (job_id) REFERENCES jobs (id)
    )
    """)

    # Audit Trail table (Hash chained)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id TEXT NOT NULL UNIQUE,
        timestamp TEXT NOT NULL,
        job_id TEXT,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        details_json TEXT NOT NULL,
        input_hash TEXT,
        output_hash TEXT,
        prev_hash TEXT NOT NULL,
        entry_hash TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_PATH)
