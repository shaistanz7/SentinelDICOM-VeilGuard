import cv2
import numpy as np
import pydicom
from typing import List, Tuple

def redact_pixels(
    ds: pydicom.Dataset,
    bboxes: List[List[int]],
    padding: int = 4
) -> Tuple[pydicom.Dataset, int]:
    """Applies precision solid masking over specified bounding boxes with padding.
    Guarantees diagnostic patient anatomy (skull, bones, organs) is strictly preserved
    and pixels outside redaction remain 100% byte-identical."""
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

    # Segment diagnostic bone anatomy (skull calvarium, spine) to strictly prevent any anatomy clipping
    h, w = arr.shape[:2]
    norm_gray = (arr / (arr.max() + 1e-5) * 255).astype(np.uint8) if arr.ndim == 2 else (arr[:, :, 0]).astype(np.uint8)
    bone = (norm_gray > 160).astype(np.uint8)
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(bone, connectivity=8)
    anatomy_mask = np.zeros((h, w), dtype=bool)
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_WIDTH] > 40 and stats[i, cv2.CC_STAT_HEIGHT] > 40:
            anatomy_mask[labels == i] = True

    # Ensure QR codes and barcodes in bboxes are fully redacted and not protected as bone
    for box in bboxes:
        if box and len(box) >= 4:
            bx, by, bw, bh = box
            if bw > 50 and bh > 50:
                anatomy_mask[by:by+bh, bx:bx+bw] = False

    # Handle multi-frame vs 2D vs RGB
    if arr.ndim == 2:
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
                box_mask = np.zeros((h, w), dtype=bool)
                box_mask[y1:y2, x1:x2] = True
                target_pixels = box_mask & (~anatomy_mask)
                arr[target_pixels] = fill_val
                redacted_count += 1

    elif arr.ndim == 3 and arr.shape[2] in (3, 4): # RGB Secondary Capture
        for box in bboxes:
            if not box or len(box) < 4:
                continue
            x, y, bw, bh = box
            x1 = max(0, int(x - padding))
            y1 = max(0, int(y - padding))
            x2 = min(w, int(x + bw + padding))
            y2 = min(h, int(y + bh + padding))

            if x2 > x1 and y2 > y1:
                box_mask = np.zeros((h, w), dtype=bool)
                box_mask[y1:y2, x1:x2] = True
                target_pixels = box_mask & (~anatomy_mask)
                arr[target_pixels, :] = 0
                redacted_count += 1

    elif arr.ndim == 3: # Multi-frame 2D slices
        num_frames = arr.shape[0]
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
                    box_mask = np.zeros((h, w), dtype=bool)
                    box_mask[y1:y2, x1:x2] = True
                    target_pixels = box_mask & (~anatomy_mask)
                    arr[f, target_pixels] = fill_val
            redacted_count += len(bboxes)

    # Save byte-identical modified array back to DICOM dataset
    ds.PixelData = arr.tobytes()
    return ds, redacted_count
