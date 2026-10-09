import pytest
import copy
from pathlib import Path
from backend.config import SAMPLES_DIR
from backend.samples.sample_generator import generate_sample_cranial_ct
from backend.dicom_utils import read_dicom_safe
from backend.discover import discover_and_classify
from backend.transform import PolicyTransformEngine, load_policy
from backend.validate import IndependentValidator

def test_independent_validator_passes_on_clean():
    """Asserts independent validation passes 100% on properly de-identified scan."""
    test_path = SAMPLES_DIR / "test_cranial.dcm"
    generate_sample_cranial_ct(test_path)

    ds = read_dicom_safe(str(test_path))
    findings = discover_and_classify(ds)
    bboxes = [f.bbox for f in findings if f.bbox]

    policy = load_policy("strict_research")
    engine = PolicyTransformEngine(policy)
    transformed_ds, _ = engine.transform(ds, findings)

    validator = IndependentValidator()
    checklist, all_passed = validator.validate(ds, transformed_ds, bboxes)

    assert all_passed is True
    assert len(checklist) >= 7
    for check in checklist:
        assert check.passed is True

def test_independent_validator_catches_residual_phi():
    """Asserts independent validator fails if residual patient tag or corrupt dimensions remain."""
    test_path = SAMPLES_DIR / "test_cranial.dcm"
    generate_sample_cranial_ct(test_path)

    ds = read_dicom_safe(str(test_path))
    findings = discover_and_classify(ds)

    policy = load_policy("strict_research")
    engine = PolicyTransformEngine(policy)
    transformed_ds, _ = engine.transform(ds, findings)

    # Deliberately re-inject direct identifier
    corrupt_ds = copy.deepcopy(transformed_ds)
    corrupt_ds.PatientName = "DOE^JOHN^LEAKED"

    validator = IndependentValidator()
    checklist, all_passed = validator.validate(ds, corrupt_ds, [])

    assert all_passed is False
    failed_checks = [c for c in checklist if not c.passed]
    assert any("Direct Identifier" in c.check_name for c in failed_checks)
