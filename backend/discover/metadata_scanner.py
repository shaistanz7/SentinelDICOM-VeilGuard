import re
import uuid
import pydicom
from pydicom.dataset import Dataset
from pydicom.sequence import Sequence
from typing import List, Dict, Any

# Standard categorization lists
DIRECT_IDENTIFIERS = {
    "PatientName", "PatientID", "OtherPatientIDs", "OtherPatientIDsSequence",
    "PatientAddress", "PatientTelephoneNumbers", "PatientMotherBirthName",
    "InsurancePlanIdentification", "IssuerOfPatientID", "MedicalRecordLocator",
    "PatientSocialSecurityNumber", "EthnicGroup", "AccessionNumber"
}

QUASI_IDENTIFIERS = {
    "PatientBirthDate", "PatientAge", "PatientSex", "PatientWeight", "PatientSize",
    "PatientBirthTime", "Occupation", "MilitaryRank"
}

DATE_TAGS = {
    "StudyDate", "SeriesDate", "AcquisitionDate", "ContentDate", "OverlayDate", "CurveDate",
    "StudyTime", "SeriesTime", "AcquisitionTime", "ContentTime"
}

UID_TAGS = {
    "StudyInstanceUID", "SeriesInstanceUID", "SOPInstanceUID", "FrameOfReferenceUID",
    "MediaStorageSOPInstanceUID", "ReferencedSOPInstanceUID", "StorageMediaFileSetUID"
}

FREE_TEXT_TAGS = {
    "StudyDescription", "SeriesDescription", "StudyComments", "ImageComments",
    "ProtocolName", "AdmittingDiagnosesDescription", "PatientComments",
    "RequestedProcedureDescription", "ReasonForTheRequestedProcedure",
    "InterpretationDiagnosisDescription", "AdditionalPatientHistory"
}

INSTITUTION_TAGS = {
    "InstitutionName", "InstitutionAddress", "InstitutionalDepartmentName",
    "ReferringPhysicianName", "PerformingPhysicianName", "PhysiciansOfRecord",
    "NameOfPhysiciansReadingStudy", "OperatorsName"
}

class DiscoveredFinding:
    def __init__(
        self,
        category: str,
        tag_or_location: str,
        original_value: str,
        confidence: float,
        severity: str,
        explanation: str,
        bbox: List[int] = None
    ):
        self.id = str(uuid.uuid4())
        self.category = category
        self.tag_or_location = tag_or_location
        self.original_value = str(original_value) if original_value is not None else ""
        self.confidence = confidence
        self.severity = severity
        self.explanation = explanation
        self.bbox = bbox

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "category": self.category,
            "tag_or_location": self.tag_or_location,
            "original_value": self.original_value,
            "confidence": self.confidence,
            "severity": self.severity,
            "explanation": self.explanation,
            "bbox": self.bbox
        }

def scan_metadata(ds: pydicom.Dataset, parent_path: str = "") -> List[DiscoveredFinding]:
    """Recursively scans a DICOM dataset for PHI in standard tags, private tags, sequences, UIDs, and free text."""
    findings: List[DiscoveredFinding] = []

    for elem in ds:
        tag_hex = f"({elem.tag.group:04X},{elem.tag.element:04X})"
        keyword = elem.keyword or f"Tag_{tag_hex}"
        full_path = f"{parent_path}.{keyword}" if parent_path else keyword

        # 1. Private Tags (Odd group number: 0x0009, 0x0011, 0x0019, 0x0029, etc.)
        if elem.tag.group % 2 != 0:
            val_str = str(elem.value)[:200]
            findings.append(DiscoveredFinding(
                category="Private Tag",
                tag_or_location=f"{tag_hex} [{full_path}]",
                original_value=val_str,
                confidence=0.99,
                severity="CRITICAL" if any(w in val_str.lower() for w in ["patient", "vip", "ssn", "mrn", "id", "insurance"]) else "HIGH",
                explanation=f"Private vendor tag {tag_hex} detected. Odd-numbered groups frequently store unstandardized, proprietary patient data."
            ))
            continue

        # 2. Nested Sequences (Recursive Traversal)
        if elem.VR == "SQ" or isinstance(elem.value, Sequence):
            for i, seq_item in enumerate(elem.value):
                if isinstance(seq_item, Dataset):
                    nested_findings = scan_metadata(seq_item, parent_path=f"{full_path}[{i}]")
                    findings.extend(nested_findings)
            continue

        # Convert value to readable string
        val_str = str(elem.value)[:300] if elem.value is not None else ""
        if not val_str or val_str.strip() == "":
            continue

        # 3. Direct Identifiers
        if keyword in DIRECT_IDENTIFIERS:
            findings.append(DiscoveredFinding(
                category="Direct Identifier",
                tag_or_location=f"{tag_hex} [{keyword}]",
                original_value=val_str,
                confidence=1.0,
                severity="CRITICAL",
                explanation=f"Direct HIPAA identifier '{keyword}'. Positively identifies individual patient."
            ))
        # 4. Quasi-Identifiers
        elif keyword in QUASI_IDENTIFIERS:
            findings.append(DiscoveredFinding(
                category="Quasi-Identifier",
                tag_or_location=f"{tag_hex} [{keyword}]",
                original_value=val_str,
                confidence=0.95,
                severity="HIGH",
                explanation=f"Quasi-identifier '{keyword}'. Can enable re-identification when combined with external demographic registries."
            ))
        # 5. Dates and Times
        elif keyword in DATE_TAGS:
            findings.append(DiscoveredFinding(
                category="Date",
                tag_or_location=f"{tag_hex} [{keyword}]",
                original_value=val_str,
                confidence=0.98,
                severity="MEDIUM",
                explanation=f"Temporal anchor '{keyword}'. Must be shifted or removed to prevent timeline correlation attacks."
            ))
        # 6. Institution & Physician Info
        elif keyword in INSTITUTION_TAGS:
            findings.append(DiscoveredFinding(
                category="Direct Identifier",
                tag_or_location=f"{tag_hex} [{keyword}]",
                original_value=val_str,
                confidence=0.95,
                severity="HIGH",
                explanation=f"Healthcare institution or physician attribution '{keyword}'."
            ))
        # 7. UIDs
        elif keyword in UID_TAGS or "UID" in keyword:
            findings.append(DiscoveredFinding(
                category="UID",
                tag_or_location=f"{tag_hex} [{keyword}]",
                original_value=val_str,
                confidence=0.99,
                severity="MEDIUM",
                explanation=f"Unique Identifier '{keyword}'. Tracks study/series linkage across hospital PACS nodes."
            ))
        # 8. Free Text with Heuristic PHI Detection
        elif keyword in FREE_TEXT_TAGS:
            contains_dates = bool(re.search(r'\b\d{4}[-/.]\d{2}[-/.]\d{2}\b', val_str))
            contains_mrn = bool(re.search(r'\b(mrn|id|patient|ssn|dob)\b', val_str, re.IGNORECASE))
            contains_names = bool(re.search(r'\b(john|doe|jane|smith|williams|house)\b', val_str, re.IGNORECASE))
            
            sev = "HIGH" if (contains_dates or contains_mrn or contains_names) else "LOW"
            conf = 0.95 if (contains_dates or contains_mrn or contains_names) else 0.90

            findings.append(DiscoveredFinding(
                category="Free Text",
                tag_or_location=f"{tag_hex} [{keyword}]",
                original_value=val_str,
                confidence=conf,
                severity=sev,
                explanation=f"Unstructured narrative text in '{keyword}'. Scanned for embedded clinical mentions."
            ))

    return findings
