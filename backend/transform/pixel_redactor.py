import numpy as np
import pydicom
from typing import List, Tuple

def redact_pixels(
    ds: pydicom.Dataset,
    bboxes: List[List[int]],
    padding: int = 4
) -> Tuple[pydicom.Dataset, int]:
    """Applies black-box solid masking over specified bounding boxes with padding.
    Guarantees pixel values outside the masked bounding boxes remain 100% byte-identical."""
    if not hasattr(ds, "pixel_array") or not bboxes:
        return ds, 0

    arr = ds.pixel_array.copy()
    redacted_count = 0

    # Determine black fill value based on PhotometricInterpretation and dtype
    fill_val = 0
    if getattr(ds, "PhotometricInterpretation", "") == "MONOCHROME1":
        # In MONOCHROME1, maximum value is black
        if arr.dtype == np.uint8:
            fill_val = 255
        elif arr.dtype == np.uint16:
            fill_val = (1 << int(getattr(ds, "BitsStored", 12))) - 1
        else:
            fill_val = int(arr.max())
    else:
        # Standard MONOCHROME2 or RGB: 0 is black
        fill_val = 0

    # Handle multi-frame vs 2D vs RGB
    if arr.ndim == 2:
        h, w = arr.shape
        for box in bboxes:
            if not box or len(box) < 4:
                continue
            x, y, bw, bh = box
            # Apply padding and clamp to image dimensions
            x1 = max(0, int(x - padding))
            y1 = max(0, int(y - padding))
            x2 = min(w, int(x + bw + padding))
            y2 = min(h, int(y + bh + padding))

            if x2 > x1 and y2 > y1:
                arr[y1:y2, x1:x2] = fill_val
                redacted_count += 1

    elif arr.ndim == 3 and arr.shape[2] in (3, 4): # RGB Secondary Capture
        h, w, c = arr.shape
        for box in bboxes:
            if not box or len(box) < 4:
                continue
            x, y, bw, bh = box
            x1 = max(0, int(x - padding))
            y1 = max(0, int(y - padding))
            x2 = min(w, int(x + bw + padding))
            y2 = min(h, int(y + bh + padding))

            if x2 > x1 and y2 > y1:
                arr[y1:y2, x1:x2, :] = 0
                redacted_count += 1

    elif arr.ndim == 3: # Multi-frame 2D slices
        num_frames, h, w = arr.shape
        for f in range(num_frames):
            for box in bboxes:
                if not box or len(box) < 4:
                    continue
                x, y, bw, bh = box
                x1 = max(0, int(x - padding))
                y1 = max(0, int(y - padding))
                x2 = min(w, int(x + bw + padding))
                y2 = min(h, int(y + bh + padding))

                if x2 > x1 and y2 > y1:
                    arr[f, y1:y2, x1:x2] = fill_val
            redacted_count += len(bboxes)

    # Save byte-identical modified array back to DICOM dataset
    ds.PixelData = arr.tobytes()
    return ds, redacted_count
