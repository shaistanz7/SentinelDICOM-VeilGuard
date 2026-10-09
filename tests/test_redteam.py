import pytest
import copy
from pathlib import Path
from backend.config import SAMPLES_DIR
from backend.samples.sample_generator import generate_sample_cranial_ct
from backend.dicom_utils import read_dicom_safe
from backend.discover import discover_and_classify
from backend.transform import PolicyTransformEngine, load_policy
from backend.redteam import AdversarialPrivacyTester

def test_redteam_low_risk_on_clean_scan():
    """Asserts that clean scan yields negligible adversarial risk score."""
    test_path = SAMPLES_DIR / "test_cranial.dcm"
    generate_sample_cranial_ct(test_path)

    ds = read_dicom_safe(str(test_path))
    findings = discover_and_classify(ds)

    policy = load_policy("strict_research")
    engine = PolicyTransformEngine(policy)
    transformed_ds, _ = engine.transform(ds, findings)

    tester = AdversarialPrivacyTester()
    results, risk_score = tester.test_reidentification(ds, transformed_ds, filename="safe_cranial.dcm")

    assert risk_score <= 15.0
    assert len(results) >= 5

def test_redteam_high_risk_on_leaked_target_tokens():
    """Asserts that Red Team detects leaked target tokens and escalates risk score."""
    test_path = SAMPLES_DIR / "test_cranial.dcm"
    generate_sample_cranial_ct(test_path)

    ds = read_dicom_safe(str(test_path))
    # Test adversarial tester against the original unredacted dataset
    tester = AdversarialPrivacyTester()
    results, risk_score = tester.test_reidentification(ds, ds, filename="doe_john_mrn100234.dcm")

    assert risk_score >= 40.0
    attacks_detected = [r for r in results if r.detected]
    assert len(attacks_detected) >= 2
    assert any("Target Identity" in r.attack_name for r in attacks_detected)
