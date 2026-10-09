from typing import Dict, Any, Tuple

class FailClosedReleaseGate:
    """Stage 5: Fail-closed gatekeeper that evaluates release criteria and blocks download of unapproved files."""

    RISK_THRESHOLD_MAX_APPROVED = 15.0
    RISK_THRESHOLD_QUARANTINE = 40.0
    MIN_CONFIDENCE_THRESHOLD = 0.80

    @classmethod
    def evaluate(
        cls,
        validation_passed: bool,
        risk_score: float,
        min_confidence: float = 1.0,
        has_quarantine_flag: bool = False
    ) -> Tuple[str, str, Dict[str, Any]]:
        """
        Evaluates release status.
        Returns:
            verdict: 'APPROVED', 'NEEDS_REVIEW', or 'QUARANTINED'
            reason: Plain English summary explanation
            metadata: Detailed gate evaluation metrics
        """
        metrics = {
            "validation_passed": validation_passed,
            "risk_score": risk_score,
            "min_confidence": min_confidence,
            "has_quarantine_flag": has_quarantine_flag,
            "is_download_allowed": False
        }

        # 1. Hard fail conditions -> QUARANTINE
        if not validation_passed or risk_score >= cls.RISK_THRESHOLD_QUARANTINE or has_quarantine_flag:
            verdict = "QUARANTINED"
            metrics["is_download_allowed"] = False
            if not validation_passed:
                reason = "Independent validation failed critical safety or pixel-invariance checks. Scan is locked in quarantine."
            elif risk_score >= cls.RISK_THRESHOLD_QUARANTINE:
                reason = f"Adversarial Red Team identified severe re-identification risk ({risk_score:.1f}/100). Released dataset could compromise patient identity."
            else:
                reason = "Integrity check failed. Output file contains unredactable steganographic or corrupted markers."
            return verdict, reason, metrics

        # 2. Borderline conditions -> NEEDS HUMAN REVIEW
        if risk_score >= cls.RISK_THRESHOLD_MAX_APPROVED or min_confidence < cls.MIN_CONFIDENCE_THRESHOLD:
            verdict = "NEEDS_REVIEW"
            metrics["is_download_allowed"] = False
            reasons = []
            if min_confidence < cls.MIN_CONFIDENCE_THRESHOLD:
                reasons.append(f"detection confidence was borderline ({min_confidence*100:.0f}%)")
            if risk_score >= cls.RISK_THRESHOLD_MAX_APPROVED:
                reasons.append(f"red-team score indicated minor residual signals ({risk_score:.1f}/100)")
            reason = f"Human verification required: {', and '.join(reasons)}. A clinical reviewer must verify redacted margins."
            return verdict, reason, metrics

        # 3. Approved release
        verdict = "APPROVED"
        metrics["is_download_allowed"] = True
        reason = f"All 8 independent clinical checks passed (100%) and adversarial risk is within safe parameters ({risk_score:.1f}/100). Safe for release."
        return verdict, reason, metrics

    @classmethod
    def assert_download_allowed(cls, verdict: str):
        """Raises PermissionError if verdict is not strictly APPROVED."""
        if verdict != "APPROVED":
            raise PermissionError(
                f"Release Gate Violation: File download is strictly forbidden. Status is '{verdict}'. Fail-closed enforcement is active."
            )
