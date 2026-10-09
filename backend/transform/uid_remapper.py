import hmac
import hashlib
from typing import Dict
from backend.config import UID_SALT

class ConsistentUIDRemapper:
    """Consistently remaps DICOM UIDs using HMAC-SHA256 rooted in standard DICOM prefix 2.25."""
    def __init__(self, salt: str = UID_SALT):
        self.salt = salt.encode("utf-8")
        self.mapping_cache: Dict[str, str] = {}

    def remap(self, original_uid: str) -> str:
        if not original_uid or not original_uid.strip():
            return original_uid
        original_uid = str(original_uid).strip()
        if original_uid in self.mapping_cache:
            return self.mapping_cache[original_uid]

        # Calculate HMAC-SHA256
        h = hmac.new(self.salt, original_uid.encode("utf-8"), hashlib.sha256).hexdigest()
        # Convert first 15 bytes to large integer (approx 36 decimal digits)
        num_repr = int(h[:30], 16)
        # DICOM prefix 2.25 + integer, maximum length must be <= 64 chars
        new_uid = f"2.25.{num_repr}"
        if len(new_uid) > 64:
            new_uid = new_uid[:64]

        self.mapping_cache[original_uid] = new_uid
        return new_uid

    def get_cache(self) -> Dict[str, str]:
        return dict(self.mapping_cache)

# Global shared instance per session
global_uid_remapper = ConsistentUIDRemapper()
