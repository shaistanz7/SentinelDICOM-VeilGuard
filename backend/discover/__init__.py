import pydicom
from typing import List
from backend.discover.metadata_scanner import scan_metadata, DiscoveredFinding
from backend.discover.pixel_scanner import scan_pixels

def discover_and_classify(ds: pydicom.Dataset) -> List[DiscoveredFinding]:
    """Stage 1: Discover & Classify all PHI in metadata and pixels."""
    metadata_findings = scan_metadata(ds)
    pixel_findings = scan_pixels(ds)
    return metadata_findings + pixel_findings

__all__ = ["discover_and_classify", "DiscoveredFinding", "scan_metadata", "scan_pixels"]
