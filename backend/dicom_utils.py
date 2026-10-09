import io
import hashlib
import numpy as np
import pydicom
from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.uid import ExplicitVRLittleEndian
from PIL import Image
import cv2
from typing import Tuple, Optional, Dict, Any, List

def compute_file_hash(filepath: str) -> str:
    """Computes SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()

def read_dicom_safe(filepath: str) -> pydicom.Dataset:
    """Safely reads a DICOM file with error handling."""
    return pydicom.dcmread(filepath, force=True)

def dicom_to_png_bytes(ds: pydicom.Dataset, frame_index: int = 0) -> bytes:
    """Converts a DICOM dataset's pixel array into 8-bit PNG bytes with robust clinical contrast."""
    if not hasattr(ds, "pixel_array"):
        # Create a placeholder 512x512 black image if no pixel array
        img = Image.new("L", (512, 512), color=0)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    arr = ds.pixel_array
    if arr.ndim == 3 and arr.shape[0] > 1 and ds.get("NumberOfFrames", 1) > 1:
        # Multi-frame image: pick requested frame
        frame_index = min(frame_index, arr.shape[0] - 1)
        arr = arr[frame_index]
    elif arr.ndim == 3 and arr.shape[2] in (3, 4):
        # Color image (e.g. RGB Secondary Capture / Ultrasound)
        if arr.dtype != np.uint8:
            arr = ((arr - arr.min()) / (arr.max() - arr.min() + 1e-5) * 255).astype(np.uint8)
        img = Image.fromarray(arr)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    arr = arr.astype(np.float64)
    modality = str(getattr(ds, "Modality", "")).upper()
    wc = getattr(ds, "WindowCenter", None)
    ww = getattr(ds, "WindowWidth", None)

    if isinstance(wc, (pydicom.multival.MultiValue, list)):
        wc = float(wc[0])
    elif wc is not None:
        wc = float(wc)

    if isinstance(ww, (pydicom.multival.MultiValue, list)):
        ww = float(ww[0])
    elif ww is not None:
        ww = float(ww)

    rendered = None

    # 1. For CT with HU window center / window width
    if modality == "CT" and wc is not None and ww is not None and ww > 0:
        slope = float(getattr(ds, "RescaleSlope", 1.0))
        intercept = float(getattr(ds, "RescaleIntercept", 0.0))
        hu = arr * slope + intercept
        min_val = wc - (ww / 2.0)
        max_val = wc + (ww / 2.0)
        if hu.max() > min_val and hu.min() < max_val:
            clipped = np.clip(hu, min_val, max_val)
            rendered = ((clipped - min_val) / (max_val - min_val)) * 255.0

    # 2. If modality-specific window center / width is available without HU rescale (e.g. DX, MR)
    if rendered is None and wc is not None and ww is not None and ww > 0:
        min_val = wc - (ww / 2.0)
        max_val = wc + (ww / 2.0)
        if arr.max() > min_val and arr.min() < max_val:
            clipped = np.clip(arr, min_val, max_val)
            rendered = ((clipped - min_val) / (max_val - min_val)) * 255.0

    # 3. Robust percentile normalization for DX, US, MR, and any general scans
    if rendered is None or rendered.max() == rendered.min():
        p1 = np.percentile(arr, 1)
        p99 = np.percentile(arr, 99)
        if p99 > p1:
            rendered = np.clip((arr - p1) / (p99 - p1), 0.0, 1.0) * 255.0
        else:
            min_val = arr.min()
            max_val = arr.max()
            if max_val > min_val:
                rendered = ((arr - min_val) / (max_val - min_val)) * 255.0
            else:
                rendered = np.zeros_like(arr)

    # Invert if PhotometricInterpretation is MONOCHROME1 (minimum is white)
    if getattr(ds, "PhotometricInterpretation", "") == "MONOCHROME1":
        rendered = 255.0 - rendered

    arr_uint8 = np.clip(rendered, 0, 255).astype(np.uint8)
    img = Image.fromarray(arr_uint8)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def get_pixel_array_2d(ds: pydicom.Dataset) -> np.ndarray:
    """Returns 2D uint8 grayscale representation for CV/OCR operations."""
    if not hasattr(ds, "pixel_array"):
        return np.zeros((512, 512), dtype=np.uint8)
    
    arr = ds.pixel_array
    if arr.ndim == 3 and arr.shape[0] > 1 and ds.get("NumberOfFrames", 1) > 1:
        arr = arr[0]
    elif arr.ndim == 3 and arr.shape[2] in (3, 4):
        # RGB to grayscale
        return cv2.cvtColor(arr.astype(np.uint8), cv2.COLOR_RGB2GRAY)
        
    arr = arr.astype(np.float64)
    min_v = arr.min()
    max_v = arr.max()
    if max_v > min_v:
        arr = ((arr - min_v) / (max_v - min_v)) * 255.0
    else:
        arr = np.zeros_like(arr)
        
    if getattr(ds, "PhotometricInterpretation", "") == "MONOCHROME1":
        arr = 255.0 - arr
        
    return arr.astype(np.uint8)

def format_tag_repr(tag_elem) -> str:
    """Formats tag as '(GGGG,EEEE)' hex string."""
    return f"({tag_elem.tag.group:04X},{tag_elem.tag.element:04X})"
