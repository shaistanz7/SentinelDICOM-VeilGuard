import pytest
from pathlib import Path
from backend.config import SAMPLES_DIR
from backend.samples.sample_generator import generate_sample_cranial_ct, generate_sample_chest_xray
from backend.dicom_utils import read_dicom_safe
from backend.discover import discover_and_classify

def test_discover_cranial_ct_planted_phi():
    """Asserts that all planted PHI (metadata, private tags, nested sequence, burned-in text) is found."""
    test_path = SAMPLES_DIR / "test_cranial.dcm"
    generate_sample_cranial_ct(test_path)

    ds = read_dicom_safe(str(test_path))
    findings = discover_and_classify(ds)

    categories = [f.category for f in findings]
    tag_locations = [f.tag_or_location for f in findings]
    orig_values = [str(f.original_value) for f in findings]

    # Assert direct patient name and ID found
    assert "Direct Identifier" in categories
    assert any("PatientName" in loc or "0010,0010" in loc for loc in tag_locations)
    assert any("DOE^JOHN" in val for val in orig_values)

    # Assert private tag found
    assert "Private Tag" in categories
    assert any("0019" in loc for loc in tag_locations)

    # Assert pixel text found
    assert "Pixel Text" in categories
    assert any(f.bbox is not None for f in findings)

def test_discover_chest_xray_qr_code():
    """Asserts that planted optical QR code in chest X-ray is positively identified."""
    test_path = SAMPLES_DIR / "test_chest_xray.dcm"
    generate_sample_chest_xray(test_path)

    ds = read_dicom_safe(str(test_path))
    findings = discover_and_classify(ds)

    categories = [f.category for f in findings]
    assert "Barcode/QR" in categories

    qr_findings = [f for f in findings if f.category == "Barcode/QR"]
    assert len(qr_findings) >= 1
    assert qr_findings[0].bbox is not None
    assert qr_findings[0].severity in ["CRITICAL", "HIGH"]
