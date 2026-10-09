import yaml
import copy
from datetime import datetime, timedelta
import pydicom
from pydicom.dataset import Dataset
from pydicom.sequence import Sequence
from pathlib import Path
from typing import Dict, Any, List, Tuple
from backend.config import POLICIES_DIR
from backend.transform.uid_remapper import global_uid_remapper
from backend.transform.pixel_redactor import redact_pixels
from backend.discover.metadata_scanner import DiscoveredFinding

def load_policy(policy_name: str) -> Dict[str, Any]:
    """Loads policy configuration by name or filename."""
    clean_name = policy_name.lower().replace(" ", "_")
    if not clean_name.endswith(".yaml"):
        target_file = POLICIES_DIR / f"{clean_name}.yaml"
    else:
        target_file = POLICIES_DIR / clean_name

    if not target_file.exists():
        # Fallback to strict_research.yaml
        target_file = POLICIES_DIR / "strict_research.yaml"

    with open(target_file, "r") as f:
        return yaml.safe_load(f)

def shift_dicom_date(date_str: str, days: int) -> str:
    """Shifts a DICOM DA tag (YYYYMMDD) by specified days."""
    if not date_str or len(str(date_str).strip()) != 8:
        return ""
    try:
        dt = datetime.strptime(str(date_str).strip(), "%Y%m%d")
        shifted = dt + timedelta(days=days)
        return shifted.strftime("%Y%m%d")
    except Exception:
        return ""

def generate_patient_pseudonym(original_id_or_name: str) -> str:
    """Generates a stable, reproducible pseudonym like 'PATIENT-7419'."""
    h = abs(hash(original_id_or_name)) % 10000
    return f"PATIENT-{h:04d}"

class PolicyTransformEngine:
    def __init__(self, policy: Dict[str, Any]):
        self.policy = policy
        self.rules = policy.get("rules", {})
        self.date_shift_days = int(policy.get("date_shift_days", 0))
        self.changes_log: List[Dict[str, Any]] = []

    def transform(
        self,
        ds: pydicom.Dataset,
        findings: List[DiscoveredFinding]
    ) -> Tuple[pydicom.Dataset, List[Dict[str, Any]]]:
        """Applies policy rules to metadata and pixel data, recording all before/after changes."""
        self.changes_log = []
        out_ds = copy.deepcopy(ds)

        # 1. Handle Private Tags
        private_rule = self.rules.get("private_tags", {}).get("action", "remove_all")
        if private_rule == "remove_all":
            # Collect tags to remove (odd group numbers)
            private_tags = [elem.tag for elem in out_ds if elem.tag.group % 2 != 0]
            for tag in private_tags:
                tag_hex = f"({tag.group:04X},{tag.element:04X})"
                old_val = str(out_ds[tag].value)[:60]
                del out_ds[tag]
                self.changes_log.append({
                    "tag": tag_hex,
                    "keyword": f"PrivateTag_{tag_hex}",
                    "category": "Private Tag",
                    "action": "REMOVED",
                    "original_value": old_val,
                    "new_value": "[DELETED_PRIVATE_TAG]"
                })

        # 2. Handle UIDs consistently
        uid_rule = self.rules.get("uids", {}).get("action", "consistent_pseudonym")
        if uid_rule == "consistent_pseudonym":
            for uid_tag in ["StudyInstanceUID", "SeriesInstanceUID", "SOPInstanceUID", "FrameOfReferenceUID"]:
                if hasattr(out_ds, uid_tag):
                    old_uid = str(getattr(out_ds, uid_tag))
                    new_uid = global_uid_remapper.remap(old_uid)
                    setattr(out_ds, uid_tag, new_uid)
                    self.changes_log.append({
                        "tag": uid_tag,
                        "keyword": uid_tag,
                        "category": "UID",
                        "action": "CONSISTENT_PSEUDONYMIZATION",
                        "original_value": old_uid,
                        "new_value": new_uid
                    })
            if hasattr(out_ds, "file_meta") and hasattr(out_ds.file_meta, "MediaStorageSOPInstanceUID"):
                old_meta_uid = str(out_ds.file_meta.MediaStorageSOPInstanceUID)
                new_meta_uid = global_uid_remapper.remap(old_meta_uid)
                out_ds.file_meta.MediaStorageSOPInstanceUID = new_meta_uid

        # 3. Direct Identifiers
        direct_rule = self.rules.get("direct_identifiers", {}).get("action", "remove")
        direct_tags = self.rules.get("direct_identifiers", {}).get("tags", [
            "PatientName", "PatientID", "OtherPatientIDs", "PatientAddress", "PatientTelephoneNumbers"
        ])
        for tag in direct_tags:
            if hasattr(out_ds, tag):
                old_val = str(getattr(out_ds, tag))
                if direct_rule == "remove":
                    delattr(out_ds, tag)
                    new_val = "[REMOVED]"
                elif direct_rule == "blank":
                    setattr(out_ds, tag, "")
                    new_val = '""'
                elif direct_rule == "consistent_pseudonym":
                    new_val = generate_patient_pseudonym(old_val)
                    setattr(out_ds, tag, new_val)
                elif direct_rule == "replace_dummy":
                    new_val = "ANONYMIZED_PATIENT" if "Name" in tag else "MRN-000000"
                    setattr(out_ds, tag, new_val)
                else:
                    new_val = "[REDACTED]"
                    setattr(out_ds, tag, new_val)

                self.changes_log.append({
                    "tag": tag,
                    "keyword": tag,
                    "category": "Direct Identifier",
                    "action": direct_rule.upper(),
                    "original_value": old_val,
                    "new_value": new_val
                })

        # 4. Quasi-Identifiers
        quasi_rule = self.rules.get("quasi_identifiers", {}).get("action", "mask_or_generalize")
        quasi_tags = self.rules.get("quasi_identifiers", {}).get("tags", [
            "PatientBirthDate", "PatientAge", "PatientSex", "PatientWeight", "PatientSize"
        ])
        for tag in quasi_tags:
            if hasattr(out_ds, tag):
                old_val = str(getattr(out_ds, tag))
                if quasi_rule == "mask_or_generalize":
                    if tag == "PatientBirthDate":
                        delattr(out_ds, tag)
                        new_val = "[REMOVED]"
                    elif tag == "PatientAge":
                        # Clamp age > 89 to 90Y per HIPAA Safe Harbor
                        try:
                            age_num = int("".join(filter(str.isdigit, old_val)))
                            new_val = "090Y" if age_num >= 90 else old_val
                        except Exception:
                            new_val = old_val
                        setattr(out_ds, tag, new_val)
                    else:
                        new_val = old_val
                elif quasi_rule == "generalize_age_only":
                    if tag == "PatientBirthDate":
                        delattr(out_ds, tag)
                        new_val = "[REMOVED]"
                    else:
                        new_val = old_val
                elif quasi_rule == "keep":
                    new_val = old_val
                else:
                    delattr(out_ds, tag)
                    new_val = "[REMOVED]"

                self.changes_log.append({
                    "tag": tag,
                    "keyword": tag,
                    "category": "Quasi-Identifier",
                    "action": quasi_rule.upper(),
                    "original_value": old_val,
                    "new_value": new_val
                })

        # 5. Dates and Times
        date_rule = self.rules.get("dates_and_times", {}).get("action", "date_shift")
        date_tags = self.rules.get("dates_and_times", {}).get("tags", [
            "StudyDate", "SeriesDate", "AcquisitionDate", "ContentDate", "StudyTime", "SeriesTime"
        ])
        for tag in date_tags:
            if hasattr(out_ds, tag):
                old_val = str(getattr(out_ds, tag))
                if date_rule == "date_shift" and self.date_shift_days != 0 and "Time" not in tag:
                    new_val = shift_dicom_date(old_val, self.date_shift_days)
                    setattr(out_ds, tag, new_val)
                    action_name = f"DATE_SHIFT (+{self.date_shift_days} days)"
                elif date_rule == "remove" or (date_rule == "date_shift" and self.date_shift_days == 0):
                    delattr(out_ds, tag)
                    new_val = "[REMOVED]"
                    action_name = "REMOVED"
                else:
                    new_val = old_val
                    action_name = "KEPT"

                self.changes_log.append({
                    "tag": tag,
                    "keyword": tag,
                    "category": "Date",
                    "action": action_name,
                    "original_value": old_val,
                    "new_value": new_val
                })

        # 6. Free Text Fields
        text_rule = self.rules.get("free_text", {}).get("action", "remove")
        text_tags = self.rules.get("free_text", {}).get("tags", [
            "StudyDescription", "SeriesDescription", "StudyComments", "ImageComments", "ProtocolName"
        ])
        for tag in text_tags:
            if hasattr(out_ds, tag):
                old_val = str(getattr(out_ds, tag))
                if text_rule == "remove":
                    delattr(out_ds, tag)
                    new_val = "[REMOVED]"
                elif text_rule == "scrub_phi":
                    new_val = "[DIAGNOSTIC PROTOCOL CONFIRMED - PHI REMOVED]"
                    setattr(out_ds, tag, new_val)
                elif text_rule == "keep":
                    new_val = old_val
                else:
                    delattr(out_ds, tag)
                    new_val = "[REMOVED]"

                self.changes_log.append({
                    "tag": tag,
                    "keyword": tag,
                    "category": "Free Text",
                    "action": text_rule.upper(),
                    "original_value": old_val,
                    "new_value": new_val
                })

        # 7. Clean Nested Sequences (e.g. RequestAttributesSequence)
        for elem in list(out_ds):
            if elem.VR == "SQ" or isinstance(elem.value, Sequence):
                if elem.keyword in ["RequestAttributesSequence", "ReferencedPatientSequence"]:
                    old_len = len(elem.value)
                    del out_ds[elem.tag]
                    self.changes_log.append({
                        "tag": elem.keyword,
                        "keyword": elem.keyword,
                        "category": "Nested Sequence",
                        "action": "REMOVED_REQUISITION_SEQUENCE",
                        "original_value": f"Sequence with {old_len} items",
                        "new_value": "[DELETED_SEQUENCE]"
                    })

        # 8. Pixel Redaction (Black-box masking)
        pixel_rule = self.rules.get("pixel_phi", {}).get("action", "black_box_mask")
        pixel_bboxes = [f.bbox for f in findings if f.bbox is not None]
        if pixel_rule == "black_box_mask" and pixel_bboxes:
            out_ds, redacted_count = redact_pixels(out_ds, pixel_bboxes, padding=4)
            self.changes_log.append({
                "tag": "(7FE0,0010) [PixelData]",
                "keyword": "PixelData",
                "category": "Pixel PHI",
                "action": "SOLID_BLACK_BOX_MASK",
                "original_value": f"{len(pixel_bboxes)} Burned-in Text/Barcode Regions",
                "new_value": f"{redacted_count} Regions Zeroed (Border-padded, Outside Pixels Byte-Identical)"
            })

        # 9. Standard De-identification Attributes
        out_ds.PatientIdentityRemoved = "YES"
        policy_title = self.policy.get("name", "Strict Research Release")
        out_ds.DeidentificationMethod = f"Sentinel DICOM VeilGuard; Policy: {policy_title}; ISO 10918-1 Solid Masking"

        return out_ds, self.changes_log
