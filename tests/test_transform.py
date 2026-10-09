import pytest
import numpy as np
from pathlib import Path
from backend.config import SAMPLES_DIR
from backend.samples.sample_generator import generate_sample_cranial_ct
from backend.dicom_utils import read_dicom_safe
from backend.discover import discover_and_classify
from backend.transform import PolicyTransformEngine, load_policy, ConsistentUIDRemapper

def test_transform_metadata_and_consistent_uid():
    """Asserts policy transform strips direct identifiers, remaps UIDs consistently, and retains clinical tags."""
    test_path = SAMPLES_DIR / "test_cranial.dcm"
    generate_sample_cranial_ct(test_path)

    ds = read_dicom_safe(str(test_path))
    findings = discover_and_classify(ds)

    policy = load_policy("strict_research")
    engine = PolicyTransformEngine(policy)
    transformed_ds, changes = engine.transform(ds, findings)

    # 1. Direct identifiers removed
    assert not hasattr(transformed_ds, "PatientName") or transformed_ds.PatientName == ""
    assert not hasattr(transformed_ds, "PatientID") or transformed_ds.PatientID == ""

    # 2. Private tags removed
    odd_groups = [elem.tag.group for elem in transformed_ds if elem.tag.group % 2 != 0]
    assert len(odd_groups) == 0

    # 3. Clinical essential tags preserved
    assert hasattr(transformed_ds, "Modality")
    assert transformed_ds.Modality == "CT"
    assert hasattr(transformed_ds, "Rows")
    assert hasattr(transformed_ds, "Columns")

    # 4. Consistent UID remapping test
    orig_uid = str(ds.StudyInstanceUID)
    new_uid_1 = str(transformed_ds.StudyInstanceUID)
    assert new_uid_1.startswith("2.25.")

    remapper = ConsistentUIDRemapper(salt="test_salt")
    mapped_a = remapper.remap("1.2.840.10008.5.1.4.1.1.2.999")
    mapped_b = remapper.remap("1.2.840.10008.5.1.4.1.1.2.999")
    assert mapped_a == mapped_b, "UID remapping must be deterministic and consistent across dataset"

def test_transform_pixel_redaction_and_byte_invariance():
    """Asserts solid black-box masking and byte-invariance outside redacted regions."""
    test_path = SAMPLES_DIR / "test_cranial.dcm"
    generate_sample_cranial_ct(test_path)

    ds = read_dicom_safe(str(test_path))
    findings = discover_and_classify(ds)
    pixel_bboxes = [f.bbox for f in findings if f.bbox]
    assert len(pixel_bboxes) > 0

    orig_pixels = ds.pixel_array.copy()

    policy = load_policy("strict_research")
    engine = PolicyTransformEngine(policy)
    transformed_ds, _ = engine.transform(ds, findings)

    new_pixels = transformed_ds.pixel_array

    # Build mask of redaction regions (with 4px padding)
    h, w = orig_pixels.shape
    mask = np.zeros((h, w), dtype=bool)
    for bx, by, bw, bh in pixel_bboxes:
        bx1, by1 = max(0, bx - 4), max(0, by - 4)
        bx2, by2 = min(w, bx + bw + 4), min(h, by + bh + 4)
        mask[by1:by2, bx1:bx2] = True

    # Assert pixels INSIDE masked region are zeroed
    assert np.all(new_pixels[mask] == 0)

    # Assert pixels OUTSIDE masked region are 100% byte-identical
    assert np.array_equal(orig_pixels[~mask], new_pixels[~mask]), "Pixels outside redaction must be strictly byte-identical"
