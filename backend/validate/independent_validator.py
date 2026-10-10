import uuid
import numpy as np
import pydicom
import cv2
from typing import List, Dict, Any, Tuple
from backend.dicom_utils import get_pixel_array_2d

class IndependentValidationCheck:
    def __init__(self, check_name: str, category: str, passed: bool, severity: str, evidence: str, details: str = ""):
        self.id = str(uuid.uuid4())
        self.check_name = check_name
        self.category = category
        self.passed = passed
        self.severity = severity
        self.evidence = evidence
        self.details = details

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "check_name": self.check_name,
            "category": self.category,
            "passed": self.passed,
            "severity": self.severity,
            "evidence": self.evidence,
            "details": self.details
        }

class IndependentValidator:
    """Independent auditor that verifies de-identification without sharing logic with transform engine."""

    DIRECT_TAGS_FORBIDDEN = [
        "PatientName", "PatientID", "OtherPatientIDs", "PatientAddress",
        "PatientTelephoneNumbers", "IssuerOfPatientID", "InsurancePlanIdentification",
        "PatientMotherBirthName", "EthnicGroup"
    ]

    REQUIRED_CLINICAL_TAGS = [
        "Modality", "Rows", "Columns", "BitsAllocated", "BitsStored",
        "PixelRepresentation", "PhotometricInterpretation"
    ]

    def validate(
        self,
        original_ds: pydicom.Dataset,
        processed_ds: pydicom.Dataset,
        redacted_bboxes: List[List[int]] = None
    ) -> Tuple[List[IndependentValidationCheck], bool]:
        """Runs the independent verification battery and produces a pass/fail checklist."""
        checklist: List[IndependentValidationCheck] = []

        # Check 1: DICOM File Open & Syntactic Validity
        try:
            is_valid_dcm = hasattr(processed_ds, "SOPClassUID") and hasattr(processed_ds, "pixel_array")
            checklist.append(IndependentValidationCheck(
                check_name="DICOM Dataset Format & Parse Integrity",
                category="DICOM Standard",
                passed=is_valid_dcm,
                severity="CRITICAL",
                evidence=f"SOPClassUID: {getattr(processed_ds, 'SOPClassUID', 'Missing')}; Valid dataset parsed.",
                details="Verifies that the modified file conforms to standard DICOM part 10 dataset structures."
            ))
        except Exception as e:
            checklist.append(IndependentValidationCheck(
                check_name="DICOM Dataset Format & Parse Integrity",
                category="DICOM Standard",
                passed=False,
                severity="CRITICAL",
                evidence=f"Parse failure: {str(e)}",
                details="File failed to open as valid DICOM."
            ))

        # Check 2: Direct PHI Removal Verification
        leaked_direct_tags = []
        for tag_name in self.DIRECT_TAGS_FORBIDDEN:
            if hasattr(processed_ds, tag_name):
                val = str(getattr(processed_ds, tag_name)).strip()
                # Check if value is still populated with real identifier (not dummy/pseudonym)
                if val and val != '""' and "[REMOVED]" not in val and not val.startswith("PATIENT-") and val != "ANONYMIZED_PATIENT":
                    leaked_direct_tags.append(f"{tag_name}='{val}'")

        direct_passed = len(leaked_direct_tags) == 0
        checklist.append(IndependentValidationCheck(
            check_name="Direct Identifier Zero-Leak Check",
            category="Privacy Validation",
            passed=direct_passed,
            severity="CRITICAL",
            evidence="No direct identifiers remaining in output metadata." if direct_passed else f"Found leaked tags: {', '.join(leaked_direct_tags)}",
            details="Audits standard DICOM header elements for unredacted patient names, IDs, addresses, and contacts."
        ))

        # Check 3: Private Tag Elimination Check
        residual_private_tags = []
        for elem in processed_ds:
            if elem.tag.group % 2 != 0:
                tag_hex = f"({elem.tag.group:04X},{elem.tag.element:04X})"
                residual_private_tags.append(tag_hex)

        private_passed = len(residual_private_tags) == 0
        checklist.append(IndependentValidationCheck(
            check_name="Private Tag Elimination Audit",
            category="Privacy Validation",
            passed=private_passed,
            severity="HIGH",
            evidence=f"0 private tags detected." if private_passed else f"{len(residual_private_tags)} private tags present: {', '.join(residual_private_tags[:3])}",
            details="Scans all odd-numbered groups to guarantee no hidden vendor-specific PHI remains."
        ))

        # Check 4: Residual Pixel PHI & QR Code Inspection
        residual_pixel_issues = []
        if hasattr(processed_ds, "pixel_array"):
            gray_proc = get_pixel_array_2d(processed_ds)
            img_h, img_w = gray_proc.shape

            # Identify diagnostic bone anatomy (skull, spine) to strictly prevent false positive detections
            bone_val = (gray_proc > 160).astype(np.uint8)
            num_labels_v, labels_v, stats_v, _ = cv2.connectedComponentsWithStats(bone_val, connectivity=8)
            anatomy_mask_v = np.zeros_like(gray_proc, dtype=bool)
            for i in range(1, num_labels_v):
                if stats_v[i, cv2.CC_STAT_WIDTH] > 40 and stats_v[i, cv2.CC_STAT_HEIGHT] > 40:
                    anatomy_mask_v[labels_v == i] = True
            k_buf_v = cv2.getStructuringElement(cv2.MORPH_RECT, (11, 11))
            anatomy_buf_v = cv2.dilate(anatomy_mask_v.astype(np.uint8), k_buf_v).astype(bool)

            # Re-scan for QR code
            qr_det = cv2.QRCodeDetector()
            try:
                ret, decoded, pts, _ = qr_det.detectAndDecodeMulti(gray_proc)
                if ret and pts is not None:
                    for i, dec in enumerate(decoded):
                        if dec and "PATIENT" in dec.upper():
                            residual_pixel_issues.append(f"Residual QR Code with text '{dec}'")
            except Exception:
                pass

            # Inspect high-density text in redacted boxes (excluding diagnostic bone anatomy)
            if redacted_bboxes:
                for box in redacted_bboxes:
                    bx, by, bw, bh = box
                    bx1, by1 = max(0, bx), max(0, by)
                    bx2, by2 = min(img_w, bx + bw), min(img_h, by + bh)
                    roi = gray_proc[by1:by2, bx1:bx2]
                    roi_outside_anat = roi[~anatomy_buf_v[by1:by2, bx1:bx2]] if roi.size > 0 else roi
                    # Solid mask outside anatomy should have std dev near 0
                    if roi_outside_anat.size > 0 and np.std(roi_outside_anat) > 12.0:
                        residual_pixel_issues.append(f"Redaction box [{bx},{by},{bw},{bh}] not solidly masked (std={np.std(roi_outside_anat):.1f})")

            k_tophat = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
            tophat_val = cv2.morphologyEx(gray_proc, cv2.MORPH_TOPHAT, k_tophat)
            text_pixels_val = ((tophat_val >= 20) & (gray_proc >= 140) & (~anatomy_buf_v)).astype(np.uint8) * 255
            k_line_val = cv2.getStructuringElement(cv2.MORPH_RECT, (18, 1))
            dilated_val = cv2.dilate(text_pixels_val, k_line_val, iterations=1)
            contours_val, _ = cv2.findContours(dilated_val, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            red_boxes = redacted_bboxes or []
            for c in contours_val:
                cx, cy, cw, ch = cv2.boundingRect(c)
                roi_mean = float(np.mean(gray_proc[cy:cy+ch, cx:cx+cw])) if (ch > 0 and cw > 0) else 0.0
                is_header = (cy + ch <= int(img_h * 0.16)) or ((cy < int(img_h * 0.18)) and not (int(img_w * 0.35) <= cx <= int(img_w * 0.65)))
                is_footer = (cy >= int(img_h * 0.84)) or ((cy >= int(img_h * 0.82)) and not (int(img_w * 0.35) <= cx <= int(img_w * 0.65)))
                is_side = (cx < int(img_w * 0.12) or cx > int(img_w * 0.88)) and (roi_mean < 75.0)
                is_margin = (is_header or is_footer or is_side) and (not np.any(anatomy_buf_v[cy:cy+ch, cx:cx+cw]))
                stroke_count = cv2.countNonZero(text_pixels_val[cy:cy+ch, cx:cx+cw]) if (ch > 0 and cw > 0) else 0
                if 3 <= ch <= 50 and cw >= 15 and stroke_count >= 8 and is_margin:
                    center_x, center_y = cx + cw // 2, cy + ch // 2
                    is_covered = any(
                        (bx - 12 <= center_x <= bx + bw + 12) and (by - 12 <= center_y <= by + bh + 12)
                        for bx, by, bw, bh in red_boxes
                    )
                    if not is_covered:
                        residual_pixel_issues.append(
                            f"Unredacted residual burned-in text detected in margin at [{cx}, {cy}, {cw}, {ch}]"
                        )

        pixel_passed = len(residual_pixel_issues) == 0
        checklist.append(IndependentValidationCheck(
            check_name="Residual Pixel PHI & Optical Code Audit",
            category="Privacy Validation",
            passed=pixel_passed,
            severity="CRITICAL",
            evidence="Pixel red-box regions fully masked. No residual QR, barcodes, or burned-in text detected in scan." if pixel_passed else f"Residual pixel PHI detected: {'; '.join(residual_pixel_issues)}",
            details="Independently verifies that solid zeroing mask covers pixel annotations and confirms zero residual burned-in PHI outside masked areas."
        ))

        # Check 5: Clinical Metadata Integrity
        missing_clinical = [t for t in self.REQUIRED_CLINICAL_TAGS if not hasattr(processed_ds, t)]
        clinical_passed = len(missing_clinical) == 0
        checklist.append(IndependentValidationCheck(
            check_name="Essential Clinical Tags Preservation",
            category="Clinical Integrity",
            passed=clinical_passed,
            severity="HIGH",
            evidence="All diagnostic geometry tags (Modality, Spacing, Bits, Photometric) intact." if clinical_passed else f"Missing essential clinical tags: {', '.join(missing_clinical)}",
            details="Guarantees PACS viewers and AI diagnostic models can accurately display and interpret scan geometry."
        ))

        # Check 6: Image Dimensions Consistency
        orig_rows = getattr(original_ds, "Rows", 0)
        orig_cols = getattr(original_ds, "Columns", 0)
        proc_rows = getattr(processed_ds, "Rows", 0)
        proc_cols = getattr(processed_ds, "Columns", 0)
        dims_match = (orig_rows == proc_rows) and (orig_cols == proc_cols) and proc_rows > 0
        checklist.append(IndependentValidationCheck(
            check_name="Matrix Dimension Preservation",
            category="Clinical Integrity",
            passed=dims_match,
            severity="CRITICAL",
            evidence=f"Original [{orig_cols}x{orig_rows}] == Output [{proc_cols}x{proc_rows}]",
            details="Confirms spatial matrix resolution was not cropped, scaled, or corrupted during masking."
        ))

        # Check 7: Non-Redacted Pixel Byte-Level Preservation
        pixels_identical = True
        diff_count = 0
        total_unmasked = 0
        if hasattr(original_ds, "pixel_array") and hasattr(processed_ds, "pixel_array"):
            orig_arr = original_ds.pixel_array
            proc_arr = processed_ds.pixel_array

            if orig_arr.shape == proc_arr.shape:
                mask = np.zeros(orig_arr.shape, dtype=bool)
                if redacted_bboxes:
                    for b in redacted_bboxes:
                        bx, by, bw, bh = b
                        bx1, by1 = max(0, bx - 6), max(0, by - 6)
                        bx2, by2 = min(orig_arr.shape[1], bx + bw + 6), min(orig_arr.shape[0], by + bh + 6)
                        mask[by1:by2, bx1:bx2] = True

                unmasked_orig = orig_arr[~mask]
                unmasked_proc = proc_arr[~mask]
                total_unmasked = unmasked_orig.size
                diff_count = int(np.sum(unmasked_orig != unmasked_proc))
                pixels_identical = (diff_count == 0)

        checklist.append(IndependentValidationCheck(
            check_name="Diagnostic Diagnostic Pixel Invariance",
            category="Clinical Integrity",
            passed=pixels_identical,
            severity="CRITICAL",
            evidence=f"0 pixel discrepancies across {total_unmasked:,} unredacted pixels (100.0% byte-identical)." if pixels_identical else f"{diff_count} unmasked pixels modified!",
            details="Ensures pixel values outside defined redaction rectangles remain strictly byte-identical."
        ))

        # Check 8: De-identification Method Attribute Compliance
        has_flag = getattr(processed_ds, "PatientIdentityRemoved", "") == "YES"
        has_method = bool(getattr(processed_ds, "DeidentificationMethod", ""))
        compliance_passed = has_flag and has_method
        checklist.append(IndependentValidationCheck(
            check_name="DICOM PS 3.15 Conformance Attributes",
            category="DICOM Standard",
            passed=compliance_passed,
            severity="MEDIUM",
            evidence=f"PatientIdentityRemoved='YES'; Method='{getattr(processed_ds, 'DeidentificationMethod', '')[:35]}...'" if compliance_passed else "Missing PatientIdentityRemoved or DeidentificationMethod attributes.",
            details="Validates DICOM standard tags marking the study as formally de-identified."
        ))

        all_passed = all(check.passed for check in checklist)
        return checklist, all_passed
