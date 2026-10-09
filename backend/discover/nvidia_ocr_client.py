import os
import io
import json
import base64
import logging
import urllib.request
import urllib.error
import cv2
import numpy as np
from typing import List, Dict, Any, Optional
from PIL import Image

from backend.config import NVIDIA_API_KEY, NVIDIA_OCR_MODEL, NVIDIA_BASE_URL

logger = logging.getLogger("sentinel.nvidia_ocr")

class NvidiaOCRClient:
    """NVIDIA NIM / Nemotron AI OCR Client for clinical DICOM burned-in text extraction.
    Provides cloud AI optical recognition with strict offline fallback."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        self.api_key = api_key or NVIDIA_API_KEY
        self.model = model or NVIDIA_OCR_MODEL
        self.base_url = (base_url or NVIDIA_BASE_URL).rstrip("/")
        self.endpoint = f"{self.base_url}/chat/completions"

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip().startswith("nvapi-"))

    def check_connection(self) -> Dict[str, Any]:
        """Validates connection and credentials against NVIDIA NIM API."""
        if not self.is_configured:
            return {
                "configured": False,
                "connected": False,
                "message": "NVIDIA_API_KEY not set or invalid format (must start with nvapi-)."
            }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Accept": "application/json"
            }
            req = urllib.request.Request(f"{self.base_url}/models", headers=headers)
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    return {
                        "configured": True,
                        "connected": True,
                        "model": self.model,
                        "endpoint": self.endpoint,
                        "message": "Successfully connected to NVIDIA Cloud NIM API."
                    }
        except Exception as e:
            return {
                "configured": True,
                "connected": False,
                "model": self.model,
                "error": str(e),
                "message": f"Connection check failed: {e}"
            }
        return {"configured": True, "connected": False, "message": "Unknown connection state"}

    def extract_burned_in_text(self, image_np: np.ndarray, timeout_sec: int = 10) -> List[str]:
        """Sends medical scan image crop to NVIDIA AI OCR model and returns parsed text lines.
        Gracefully returns an empty list on timeout or error to allow local fallback."""
        if not self.is_configured or image_np is None or image_np.size == 0:
            return []

        try:
            # Ensure valid 8-bit image for PIL
            if image_np.dtype != np.uint8:
                norm = cv2.normalize(image_np, None, 0, 255, cv2.NORM_MINMAX)
                img_8u = norm.astype(np.uint8)
            else:
                img_8u = image_np

            pil_img = Image.fromarray(img_8u)
            buf = io.BytesIO()
            pil_img.save(buf, format="PNG")
            b64_img = base64.b64encode(buf.getvalue()).decode("utf-8")

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }

            prompt = (
                "You are an expert clinical DICOM PHI de-identification auditor. "
                "Carefully transcribe all burned-in patient text lines, names, dates of birth, "
                "MRN / Patient IDs, and hospital annotations visible in this image. "
                "Return each distinct text line on its own row without conversational preamble."
            )

            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_img}"}}
                        ]
                    }
                ],
                "max_tokens": 256,
                "temperature": 0.0
            }

            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers
            )

            with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    content = data["choices"][0]["message"]["content"]
                    
                    # Parse distinct text lines
                    lines = []
                    for raw_line in content.splitlines():
                        cleaned = raw_line.strip()
                        # Remove leading bullet points, asterisks, numbering
                        cleaned = cleaned.lstrip("*-•1234567890.) ").strip()
                        if len(cleaned) > 2 and not cleaned.lower().startswith("here is") and not cleaned.lower().startswith("the text"):
                            lines.append(cleaned)
                    return lines

        except urllib.error.HTTPError as he:
            logger.warning("NVIDIA OCR API returned HTTP error: %s (falling back to local morphology)", he)
        except urllib.error.URLError as ue:
            logger.info("NVIDIA OCR network offline: %s (falling back to sovereign local morphology)", ue)
        except Exception as e:
            logger.warning("NVIDIA OCR extraction failed: %s (falling back to sovereign local morphology)", e)

        return []

# Singleton instance
nvidia_ocr_client = NvidiaOCRClient()
