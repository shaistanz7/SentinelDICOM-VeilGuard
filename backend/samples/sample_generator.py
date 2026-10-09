import os
import math
import numpy as np
import cv2
import pydicom
from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.sequence import Sequence
from pydicom.uid import ExplicitVRLittleEndian, generate_uid
from pathlib import Path
from backend.config import SAMPLES_DIR

def create_base_dicom(
    rows: int = 512,
    cols: int = 512,
    modality: str = "CT",
    patient_name: str = "DOE^JOHN",
    patient_id: str = "MRN-100234",
    birth_date: str = "19780412",
    study_desc: str = "CT Brain w/o Contrast Routine",
    study_date: str = "20260315",
    study_time: str = "094520"
) -> Dataset:
    """Creates a base DICOM dataset with standard file meta and header attributes."""
    file_meta = FileMetaDataset()
    file_meta.MediaStorageSOPClassUID = "1.2.840.10008.5.1.4.1.1.2" if modality == "CT" else "1.2.840.10008.5.1.4.1.1.1"
    file_meta.MediaStorageSOPInstanceUID = generate_uid()
    file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
    file_meta.ImplementationClassUID = "1.2.826.0.1.3680043.9.7133.1.1"

    ds = Dataset()
    ds.file_meta = file_meta
    ds.is_little_endian = True
    ds.is_implicit_VR = False

    # Identification tags
    ds.SOPClassUID = file_meta.MediaStorageSOPClassUID
    ds.SOPInstanceUID = file_meta.MediaStorageSOPInstanceUID
    ds.StudyInstanceUID = generate_uid()
    ds.SeriesInstanceUID = generate_uid()
    ds.Modality = modality
    ds.Manufacturer = "Sentinel Medical Instruments"
    ds.InstitutionName = "St. Jude Metropolitan Medical Center"
    ds.InstitutionAddress = "742 Evergreen Terrace, Medical District"
    ds.ReferringPhysicianName = "DR^HOUSE^GREGORY"
    ds.PerformingPhysicianName = "DR^CUDDY^LISA"
    ds.StudyDescription = study_desc
    ds.SeriesDescription = f"{modality} Axial High Res 2.5mm"
    ds.StudyDate = study_date
    ds.SeriesDate = study_date
    ds.AcquisitionDate = study_date
    ds.StudyTime = study_time
    ds.SeriesTime = study_time
    ds.AccessionNumber = "ACC-9988221"

    # Patient tags
    ds.PatientName = patient_name
    ds.PatientID = patient_id
    ds.PatientBirthDate = birth_date
    ds.PatientSex = "M"
    ds.PatientAge = "048Y"
    ds.PatientWeight = "78.5"
    ds.PatientComments = "Patient reports mild trauma; follow-up scheduled next Tuesday."

    # Image presentation tags
    ds.Rows = rows
    ds.Columns = cols
    ds.BitsAllocated = 16
    ds.BitsStored = 12
    ds.HighBit = 11
    ds.PixelRepresentation = 0
    ds.SamplesPerPixel = 1
    ds.PhotometricInterpretation = "MONOCHROME2"
    ds.PixelSpacing = [0.488, 0.488]
    ds.SliceThickness = 2.5
    if modality == "CT":
        ds.WindowCenter = 40.0
        ds.WindowWidth = 80.0
        ds.RescaleIntercept = -1024.0
        ds.RescaleSlope = 1.0
    elif modality == "US":
        ds.WindowCenter = 100.0
        ds.WindowWidth = 200.0
        ds.RescaleIntercept = 0.0
        ds.RescaleSlope = 1.0
    else:  # DX, MR
        ds.WindowCenter = 500.0
        ds.WindowWidth = 1000.0
        ds.RescaleIntercept = 0.0
        ds.RescaleSlope = 1.0

    return ds

def generate_sample_cranial_ct(output_path: Path) -> Path:
    """Generates synthetic cranial CT slice with burned-in text, private tags, and nested sequences."""
    rows, cols = 512, 512
    ds = create_base_dicom(
        rows=rows,
        cols=cols,
        modality="CT",
        patient_name="DOE^JOHN^A",
        patient_id="MRN-100234-CT",
        birth_date="19780412",
        study_desc="Brain CT Trauma Scan"
    )

    # 1. Private tag with confidential data (group 0x0019 is odd -> private tag)
    ds.add_new((0x0019, 0x0010), "LO", "SENTINEL_PRIVATE_GROUP")
    ds.add_new((0x0019, 0x1010), "LT", "Internal Hospital Patient VIP Status: High-Profile Politician; ID: 994-01")

    # 2. Nested Sequence containing PHI
    seq = Sequence()
    item1 = Dataset()
    item1.RequestedProcedureID = "PROC-8812"
    item1.RequestedProcedureDescription = "STAT Head CT for John Doe (1978-04-12)"
    item1.ReasonForTheRequestedProcedure = "Patient John Doe fell from ladder"
    seq.append(item1)
    ds.RequestAttributesSequence = seq

    # 3. Realistic Brain Slice Pixel Array
    # Background air = -1000 HU -> stored value = 24 (-1000 - (-1024))
    img = np.full((rows, cols), 24, dtype=np.uint16)
    center = (cols // 2, rows // 2)

    # Skull outer ellipse (bone ~ +1000 HU -> stored value 2024)
    cv2.ellipse(img, center, (170, 210), 0, 0, 360, 2024, -1)
    # Brain tissue inside skull (~ +35 HU -> stored value 1059)
    cv2.ellipse(img, center, (150, 190), 0, 0, 360, 1059, -1)
    # Ventricles (~ +5 HU -> stored value 1029)
    cv2.ellipse(img, (center[0] - 25, center[1] - 20), (12, 35), -15, 0, 360, 1029, -1)
    cv2.ellipse(img, (center[0] + 25, center[1] - 20), (12, 35), 15, 0, 360, 1029, -1)
    # Sulci wrinkles
    for r in range(120, 145, 6):
        cv2.ellipse(img, center, (r, int(r * 1.2)), 0, 0, 360, 1045, 2)

    # 4. Burned-in Text in top-left quadrant (simulating burned-in PHI on display)
    # Text in high intensity (stored value ~1800)
    text_overlay = np.zeros((rows, cols), dtype=np.uint8)
    cv2.putText(text_overlay, "DOE, JOHN A.", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.65, 255, 2)
    cv2.putText(text_overlay, "DOB: 1978-04-12  ID: MRN-100234-CT", (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.55, 255, 1)
    cv2.putText(text_overlay, "ST JUDE METRO HOSPITAL 2026-03-15", (20, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.45, 255, 1)

    img[text_overlay > 0] = 1850
    ds.PixelData = img.tobytes()

    pydicom.dcmwrite(str(output_path), ds, write_like_original=False)
    return output_path

def generate_sample_chest_xray(output_path: Path) -> Path:
    """Generates synthetic Chest Radiograph (DX) with burned-in text and a scannable QR code."""
    rows, cols = 512, 512
    ds = create_base_dicom(
        rows=rows,
        cols=cols,
        modality="DX",
        patient_name="SMITH^ELEANOR^V",
        patient_id="XR-44102-B",
        birth_date="19850920",
        study_desc="Chest Radiograph 2 Views"
    )

    # Private Tag
    ds.add_new((0x0029, 0x0010), "LO", "VENDOR_CALIBRATION_TAG")
    ds.add_new((0x0029, 0x1020), "ST", "Private Patient Insurance: BlueCross PPO #99238411; Policyholder: Eleanor Smith")

    # Image: Chest X-ray anatomy
    img = np.full((rows, cols), 500, dtype=np.uint16)
    # Lung fields (darker, lower absorption)
    cv2.ellipse(img, (180, 260), (75, 140), 10, 0, 360, 120, -1)
    cv2.ellipse(img, (332, 260), (75, 140), -10, 0, 360, 120, -1)
    # Mediastinum / Heart shadow (brighter)
    cv2.ellipse(img, (260, 310), (60, 85), -20, 0, 360, 750, -1)
    # Spine and ribs
    for y in range(160, 420, 30):
        cv2.line(img, (120, y), (390, y + 15), 350, 6)

    # Burned-in Patient Header Text
    text_overlay = np.zeros((rows, cols), dtype=np.uint8)
    cv2.putText(text_overlay, "SMITH, ELEANOR V.", (25, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.65, 255, 2)
    cv2.putText(text_overlay, "MRN: XR-44102-B  DOB: 1985-09-20", (25, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.55, 255, 1)
    img[text_overlay > 0] = 950

    # Plant a Real Standard QR Code in bottom-right corner!
    qr_content = "PATIENT: ELEANOR SMITH | DOB: 1985-09-20 | SSN: 987-65-4321 | MRN: XR-44102-B"
    try:
        import qrcode
        qr = qrcode.QRCode(version=1, box_size=3, border=2)
        qr.add_data(qr_content)
        qr.make(fit=True)
        qr_pil = qr.make_image(fill_color="black", back_color="white")
        qr_np = np.array(qr_pil.convert("L"))
        q_h, q_w = qr_np.shape
        qx, qy = cols - q_w - 20, rows - q_h - 20
        # Map white to high value (950), black to dark value (50)
        img[qy:qy+q_h, qx:qx+q_w] = np.where(qr_np < 128, 50, 950)
    except Exception:
        # Fallback manual pattern
        qr_size = 90
        qr_img = np.zeros((qr_size, qr_size), dtype=np.uint8)
        qr_img[2:qr_size-2, 2:qr_size-2] = 255
        for fx, fy in [(10, 10), (qr_size - 30, 10), (10, qr_size - 30)]:
            qr_img[fy:fy+20, fx:fx+20] = 0
            qr_img[fy+3:fy+17, fx+3:fx+17] = 255
            qr_img[fy+6:fy+14, fx+6:fx+14] = 0
        qx, qy = cols - 110, rows - 110
        img[qy:qy+qr_size, qx:qx+qr_size] = np.where(qr_img > 128, 980, 50)

    ds.PixelData = img.tobytes()
    pydicom.dcmwrite(str(output_path), ds, write_like_original=False)
    return output_path

def generate_sample_ultrasound_borderline(output_path: Path) -> Path:
    """Generates an Ultrasound scan with subtle, low-contrast burned-in text.
    Designed to produce confidence ~0.74, deliberately triggering the 'NEEDS HUMAN REVIEW' workflow."""
    rows, cols = 512, 512
    ds = create_base_dicom(
        rows=rows,
        cols=cols,
        modality="US",
        patient_name="WILLIAMS^ROBERT^M",
        patient_id="US-77192",
        birth_date="19650311",
        study_desc="Echocardiogram Transthoracic Complete"
    )
    ds.PhotometricInterpretation = "MONOCHROME2"

    # Ultrasound pie-slice fan field
    img = np.full((rows, cols), 15, dtype=np.uint16)
    mask = np.zeros((rows, cols), dtype=np.uint8)
    cv2.ellipse(mask, (256, 60), (220, 360), 0, 45, 135, 255, -1)

    # Speckle noise
    np.random.seed(123)
    speckle = (np.random.rayleigh(scale=35, size=(rows, cols))).astype(np.uint16)
    img = np.where(mask > 0, speckle + 30, img)

    # Heart chambers
    cv2.ellipse(img, (230, 280), (45, 60), -20, 0, 360, 20, -1)
    cv2.ellipse(img, (285, 290), (35, 50), 20, 0, 360, 20, -1)

    # Low-contrast, subtle burned-in operator watermark in top right
    # Low contrast simulates tricky sonographer notes that need human reviewer validation
    text_overlay = np.zeros((rows, cols), dtype=np.uint8)
    cv2.putText(text_overlay, "WILLIAMS R. / TECH: KD", (280, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.42, 255, 1)
    cv2.putText(text_overlay, "ID: US-77192 HOSP-STJ", (280, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.38, 255, 1)

    img[text_overlay > 0] = 75  # Barely above background speckle

    ds.PixelData = img.tobytes()
    pydicom.dcmwrite(str(output_path), ds, write_like_original=False)
    return output_path

def generate_sample_adversarial_quarantine(output_path: Path) -> Path:
    """Generates an adversarial sample with persistent unredactable hidden PHI
    that deliberately FAILS independent validation / red-team test to prove fail-closed behavior."""
    rows, cols = 512, 512
    ds = create_base_dicom(
        rows=rows,
        cols=cols,
        modality="MR",
        patient_name="CLASSIFIED^SUBJECT^ALPHA",
        patient_id="ATTACK-PHI-9999",
        birth_date="19420815",
        study_desc="Adversarial Penetration Test Scan"
    )

    # Plant a corrupted tag and intentional unredacted private tag simulating tamper
    ds.add_new((0x0099, 0x1001), "LO", "EXPLOIT_PAYLOAD:LEAKED_SSN=000-11-2222_DOE")
    ds.add_new((0x0033, 0x1005), "ST", "PATIENT_NAME_EMBEDDED_CORRUPTED_LEAK_SECRET_42")

    # Image with hidden high-frequency barcode embedded deep in pixels
    img = np.full((rows, cols), 200, dtype=np.uint16)
    cv2.circle(img, (256, 256), 180, 800, -1)
    cv2.circle(img, (256, 256), 120, 400, -1)

    # Plant a secret barcode at center that tests red team detection
    for bx in range(200, 310, 4):
        cv2.line(img, (bx, 240), (bx, 275), 999, 2)

    ds.PixelData = img.tobytes()
    pydicom.dcmwrite(str(output_path), ds, write_like_original=False)
    return output_path

def generate_all_samples():
    """Generates all 4 synthetic test datasets into the samples directory."""
    s1 = generate_sample_cranial_ct(SAMPLES_DIR / "sample_cranial_ct.dcm")
    s2 = generate_sample_chest_xray(SAMPLES_DIR / "sample_chest_xray.dcm")
    s3 = generate_sample_ultrasound_borderline(SAMPLES_DIR / "sample_ultrasound_borderline.dcm")
    s4 = generate_sample_adversarial_quarantine(SAMPLES_DIR / "sample_adversarial_quarantine.dcm")
    return {
        "cranial_ct": str(s1),
        "chest_xray": str(s2),
        "ultrasound_borderline": str(s3),
        "adversarial_quarantine": str(s4)
    }

if __name__ == "__main__":
    generated = generate_all_samples()
    for name, path in generated.items():
        print(f"Generated {name}: {path}")
