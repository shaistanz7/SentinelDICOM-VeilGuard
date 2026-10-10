import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / ".env")
except Exception:
    pass

BACKEND_DIR = BASE_DIR / "backend"
STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
PROCESSED_DIR = STORAGE_DIR / "processed"
QUARANTINE_DIR = STORAGE_DIR / "quarantine"
REPORTS_DIR = STORAGE_DIR / "reports"
SAMPLES_DIR = BASE_DIR / "samples"
POLICIES_DIR = BASE_DIR / "policies"
DB_PATH = STORAGE_DIR / "sentinel.db"

# Create directories
for directory in [UPLOAD_DIR, PROCESSED_DIR, QUARANTINE_DIR, REPORTS_DIR, SAMPLES_DIR, POLICIES_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Secret key for consistent UID pseudonymization
UID_SALT = os.environ.get("SENTINEL_UID_SALT", "sentinel_veilguard_secure_salt_2026")
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", 8000))

# NVIDIA AI OCR / Nemotron Configuration
NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "")
NVIDIA_OCR_MODEL = os.environ.get("NVIDIA_OCR_MODEL", "meta/llama-3.2-11b-vision-instruct")
NVIDIA_BASE_URL = os.environ.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
