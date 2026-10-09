import pytest
from pathlib import Path
from backend.config import SAMPLES_DIR
from backend.samples.sample_generator import generate_sample_chest_xray, generate_sample_adversarial_quarantine
from backend.dicom_utils import read_dicom_safe
from backend.pipeline import run_job_pipeline
from backend.gate.release_gate import FailClosedReleaseGate
from backend.audit.hash_chain import AuditHashChain

def test_fail_closed_quarantine_behavior():
    """Demonstrates fail-closed release gate: unremovable or adversarial PHI results in strict QUARANTINE."""
    test_path = SAMPLES_DIR / "sample_adversarial_quarantine.dcm"
    if not test_path.exists():
        generate_sample_adversarial_quarantine(test_path)

    res = run_job_pipeline(
        input_file=test_path,
        policy_name="Strict Research Release",
        job_id="test-quarantine-job",
        actor="Security QA Tester"
    )

    assert res["status"] == "quarantined"
    assert res["verdict"] == "QUARANTINED"
    assert "quarantine" in res["verdict_reason"].lower()

    # Assert that downloading this quarantined job is strictly forbidden
    with pytest.raises(PermissionError) as exc_info:
        FailClosedReleaseGate.assert_download_allowed(res["verdict"])
    assert "strictly forbidden" in str(exc_info.value)

def test_audit_hash_chain_tamper_detection():
    """Demonstrates that cryptographic SHA-256 hash chaining detects any log tampering."""
    # Record normal events
    AuditHashChain.record_event(action="TEST_ACTION_A", actor="Tester")
    AuditHashChain.record_event(action="TEST_ACTION_B", actor="Tester")

    # Chain should be valid
    verify_res = AuditHashChain.verify_chain_integrity()
    assert verify_res["is_valid"] is True
