import pytest
from pathlib import Path
from backend.config import SAMPLES_DIR
from backend.samples.sample_generator import generate_sample_cranial_ct
from backend.dicom_utils import read_dicom_safe
from backend.discover import discover_and_classify
from backend.transform import PolicyTransformEngine, load_policy
from backend.reattack import ReAttackLab, ReAttackLabReport
from backend.pipeline import run_job_pipeline

def test_reattack_suite_clean_scan():
    """Asserts that properly transformed scan achieves 100% immunity across all 5 re-attack vectors."""
    test_path = SAMPLES_DIR / "test_reattack_cranial.dcm"
    generate_sample_cranial_ct(test_path)

    orig_ds = read_dicom_safe(str(test_path))
    findings = discover_and_classify(orig_ds)

    policy = load_policy("strict_research")
    engine = PolicyTransformEngine(policy)
    transformed_ds, _ = engine.transform(orig_ds, findings)

    bboxes = [f.bbox for f in findings if f.bbox]

    lab = ReAttackLab(auto_heal_enabled=True)
    report, healed_ds = lab.run_reattack_suite(
        original_ds=orig_ds,
        processed_ds=transformed_ds,
        redacted_bboxes=bboxes,
        job_id="test-job-reattack-1",
        filename="test_cranial.dcm"
    )

    assert isinstance(report, ReAttackLabReport)
    assert report.verdict in ("IMMUNE", "AUTO_HEALED")
    assert report.overall_immunity_pct >= 98.0
    assert len(report.vectors) == 5
    assert report.to_dict()["penetrated_count"] == 0

    vector_names = [v.vector_name for v in report.vectors]
    assert any("Optical Ghost" in name for name in vector_names)
    assert any("Reverse Metadata" in name for name in vector_names)
    assert any("QR & Barcode" in name for name in vector_names)
    assert any("Steganographic" in name for name in vector_names)
    assert any("Anatomical Byte-Invariance" in name for name in vector_names)

def test_reattack_detects_unredacted_tokens():
    """Asserts that ReAttackLab correctly identifies vulnerabilities if unredacted data is evaluated."""
    test_path = SAMPLES_DIR / "test_reattack_cranial.dcm"
    generate_sample_cranial_ct(test_path)

    ds = read_dicom_safe(str(test_path))
    lab = ReAttackLab(auto_heal_enabled=False)
    report, _ = lab.run_reattack_suite(
        original_ds=ds,
        processed_ds=ds, # Unredacted scan passed as processed!
        redacted_bboxes=[],
        job_id="test-job-reattack-fail",
        filename="doe_john_mrn100234.dcm"
    )

    assert report.verdict == "VULNERABILITY_FOUND"
    assert report.overall_immunity_pct < 90.0
    penetrated = [v for v in report.vectors if v.status == "PENETRATED"]
    assert len(penetrated) >= 1
    assert any("Reverse Metadata" in v.vector_name for v in penetrated)

def test_pipeline_records_reattack_results():
    """Asserts that run_job_pipeline automatically runs ReAttackLab and persists findings."""
    test_path = SAMPLES_DIR / "test_reattack_cranial.dcm"
    generate_sample_cranial_ct(test_path)

    result = run_job_pipeline(
        input_file=test_path,
        policy_name="strict_research",
        job_id="test-pipeline-reattack"
    )

    assert "reattack_score" in result
    assert "reattack_verdict" in result
    assert "reattack_report" in result
    assert result["reattack_score"] >= 98.0
    assert result["reattack_verdict"] in ("IMMUNE", "AUTO_HEALED")
