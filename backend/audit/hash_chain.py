import sqlite3
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple, List
from backend.database import get_db

GENESIS_HASH = "0" * 64

class AuditHashChain:
    """Tamper-evident, hash-chained append-only audit trail."""

    @staticmethod
    def calculate_entry_hash(
        prev_hash: str,
        timestamp: str,
        actor: str,
        action: str,
        job_id: str,
        input_hash: str,
        output_hash: str,
        details_json: str
    ) -> str:
        payload = f"{prev_hash}:{timestamp}:{actor}:{action}:{job_id or ''}:{input_hash or ''}:{output_hash or ''}:{details_json}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @classmethod
    def record_event(
        cls,
        action: str,
        actor: str = "System Automated Pipeline",
        job_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        input_hash: Optional[str] = None,
        output_hash: Optional[str] = None
    ) -> Dict[str, Any]:
        """Appends a new hash-chained entry to the audit log."""
        conn = get_db()
        cursor = conn.cursor()

        # Find the latest hash in the chain
        cursor.execute("SELECT entry_hash FROM audit_log ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        prev_hash = row["entry_hash"] if row else GENESIS_HASH

        entry_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()
        details_json = json.dumps(details or {}, sort_keys=True)

        entry_hash = cls.calculate_entry_hash(
            prev_hash=prev_hash,
            timestamp=timestamp,
            actor=actor,
            action=action,
            job_id=job_id or "",
            input_hash=input_hash or "",
            output_hash=output_hash or "",
            details_json=details_json
        )

        cursor.execute("""
            INSERT INTO audit_log (
                entry_id, timestamp, job_id, actor, action, details_json,
                input_hash, output_hash, prev_hash, entry_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            entry_id, timestamp, job_id, actor, action, details_json,
            input_hash, output_hash, prev_hash, entry_hash
        ))

        conn.commit()
        conn.close()

        return {
            "entry_id": entry_id,
            "timestamp": timestamp,
            "actor": actor,
            "action": action,
            "job_id": job_id,
            "prev_hash": prev_hash,
            "entry_hash": entry_hash
        }

    @classmethod
    def verify_chain_integrity(cls) -> Dict[str, Any]:
        """Recalculates cryptographic SHA-256 chain from genesis to head, detecting any tamper."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_log ORDER BY id ASC")
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return {
                "is_valid": True,
                "total_entries": 0,
                "first_hash": None,
                "latest_hash": None,
                "message": "Audit chain initialized. No entries logged yet."
            }

        expected_prev_hash = GENESIS_HASH
        for idx, row in enumerate(rows):
            # Check previous hash pointer
            if row["prev_hash"] != expected_prev_hash:
                return {
                    "is_valid": False,
                    "total_entries": len(rows),
                    "first_hash": rows[0]["entry_hash"],
                    "latest_hash": rows[-1]["entry_hash"],
                    "broken_entry_id": row["entry_id"],
                    "message": f"Tampering detected at entry #{row['id']} (ID: {row['entry_id']}). Previous hash mismatch: expected {expected_prev_hash[:12]}..., found {row['prev_hash'][:12]}..."
                }

            # Recalculate entry hash
            recomputed = cls.calculate_entry_hash(
                prev_hash=row["prev_hash"],
                timestamp=row["timestamp"],
                actor=row["actor"],
                action=row["action"],
                job_id=row["job_id"],
                input_hash=row["input_hash"],
                output_hash=row["output_hash"],
                details_json=row["details_json"]
            )

            if recomputed != row["entry_hash"]:
                return {
                    "is_valid": False,
                    "total_entries": len(rows),
                    "first_hash": rows[0]["entry_hash"],
                    "latest_hash": rows[-1]["entry_hash"],
                    "broken_entry_id": row["entry_id"],
                    "message": f"Tampering detected at entry #{row['id']} (ID: {row['entry_id']}). Payload data has been altered! Hash recalculation failed."
                }

            expected_prev_hash = row["entry_hash"]

        return {
            "is_valid": True,
            "total_entries": len(rows),
            "first_hash": rows[0]["entry_hash"],
            "latest_hash": rows[-1]["entry_hash"],
            "message": f"All {len(rows)} audit trail events cryptographically verified. Zero tampering detected."
        }

    @classmethod
    def get_entries(cls, limit: int = 100) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_log ORDER BY id DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()

        result = []
        for r in rows:
            result.append({
                "id": r["id"],
                "entry_id": r["entry_id"],
                "timestamp": r["timestamp"],
                "job_id": r["job_id"],
                "actor": r["actor"],
                "action": r["action"],
                "details": json.loads(r["details_json"]),
                "input_hash": r["input_hash"],
                "output_hash": r["output_hash"],
                "prev_hash": r["prev_hash"],
                "entry_hash": r["entry_hash"]
            })
        return result
