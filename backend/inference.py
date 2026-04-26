"""
Model inference module.

Supports two loading strategies:
  1. ultralytics YOLO  — tried first (handles YOLOv8/v9/v10 .pt files)
  2. Raw PyTorch       — fallback for custom segmentation models

For strategy 2 the model is assumed to output a mask tensor of shape
(1, 1, H, W) or (1, H, W) with float values in [0, 1] (sigmoid applied
automatically when values fall outside that range).
"""

import logging
import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import cv2
import numpy as np
import torch

logger = logging.getLogger(__name__)

_default_model_path = Path(__file__).parent.parent / "only PolyDb.pt"
MODEL_PATH = Path(os.getenv("MODEL_PATH", str(_default_model_path)))

_model: Optional[Any] = None
_model_type: Optional[str] = None  # "yolo" | "torch"

# Overlay colour for segmentation masks (BGR green-teal)
MASK_COLOR = (0, 220, 150)
MASK_ALPHA = 0.45

# ImageNet normalisation used by most pretrained backbones
_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------

def load_model() -> Any:
    global _model, _model_type
    if _model is not None:
        return _model

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

    # Strategy 1: ultralytics YOLO
    try:
        from ultralytics import YOLO  # type: ignore
        _model = YOLO(str(MODEL_PATH))
        _model_type = "yolo"
        logger.info("Model loaded via ultralytics YOLO")
        return _model
    except Exception as exc:
        logger.warning("ultralytics YOLO load failed (%s) — trying torch.load", exc)

    # Strategy 2: raw PyTorch
    try:
        loaded = torch.load(str(MODEL_PATH), map_location="cpu", weights_only=False)
        # torch.load may return a dict (state-dict) or the model itself
        if isinstance(loaded, dict):
            raise RuntimeError(
                "PolyDb.pt appears to be a state-dict, not a full model. "
                "Instantiate your model class and load the state-dict manually."
            )
        if hasattr(loaded, "eval"):
            loaded.eval()
        _model = loaded
        _model_type = "torch"
        logger.info("Model loaded via torch.load")
        return _model
    except Exception as exc:
        logger.error("torch.load failed: %s", exc)
        raise RuntimeError(f"Cannot load model from {MODEL_PATH}: {exc}") from exc


# ---------------------------------------------------------------------------
# Pre / post processing helpers
# ---------------------------------------------------------------------------

def _preprocess(image_rgb: np.ndarray, target_size: Tuple[int, int] = (352, 352)) -> torch.Tensor:
    img = cv2.resize(image_rgb, target_size).astype(np.float32) / 255.0
    img = (img - _MEAN) / _STD
    tensor = torch.from_numpy(img.transpose(2, 0, 1)).unsqueeze(0)
    return tensor


def _postprocess_mask(output: Any, original_hw: Tuple[int, int]) -> np.ndarray:
    if isinstance(output, (list, tuple)):
        output = output[0]
    if isinstance(output, torch.Tensor):
        arr = output.detach().cpu().float()
    else:
        arr = torch.tensor(output).float()

    arr = arr.squeeze()  # remove batch + channel dims
    if arr.dim() == 0:
        arr = arr.unsqueeze(0).unsqueeze(0)
    if arr.dim() == 1:
        side = int(arr.numel() ** 0.5)
        arr = arr.view(side, side)

    mask = arr.numpy()

    # Apply sigmoid when logits are outside [0, 1]
    if mask.min() < 0.0 or mask.max() > 1.0:
        mask = 1.0 / (1.0 + np.exp(-mask))

    mask = cv2.resize(mask.astype(np.float32), (original_hw[1], original_hw[0]))
    return mask


def _draw_mask_overlay(bgr: np.ndarray, mask: np.ndarray, threshold: float = 0.5) -> np.ndarray:
    binary = (mask > threshold).astype(np.uint8)

    colored = np.zeros_like(bgr)
    colored[binary == 1] = MASK_COLOR

    result = cv2.addWeighted(bgr, 1.0 - MASK_ALPHA, colored, MASK_ALPHA, 0)

    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(result, contours, -1, MASK_COLOR, 2)

    return result


def _confidence_from_mask(mask: np.ndarray, threshold: float = 0.5) -> Tuple[int, float]:
    binary = mask > threshold
    count = 1 if binary.any() else 0
    conf = float(mask[binary].mean()) if binary.any() else 0.0
    return count, conf


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def process_image(input_path: str, output_path: str) -> Dict:
    """Run inference on a single image and write the annotated result."""
    model = load_model()
    t0 = time.time()

    bgr = cv2.imread(input_path)
    if bgr is None:
        raise ValueError(f"Cannot read image: {input_path}")
    h, w = bgr.shape[:2]

    detections_count = 0
    avg_confidence = 0.0

    if _model_type == "yolo":
        results = model(input_path, verbose=False)
        annotated = results[0].plot()
        cv2.imwrite(output_path, annotated)

        boxes = results[0].boxes
        masks = results[0].masks

        if masks is not None:
            detections_count = len(masks)
            if detections_count > 0:
                confs = boxes.conf.cpu().numpy() if boxes is not None else np.array([0.9])
                avg_confidence = float(confs.mean())
        elif boxes is not None:
            detections_count = len(boxes)
            if detections_count > 0:
                avg_confidence = float(boxes.conf.cpu().numpy().mean())

    else:  # raw PyTorch segmentation model
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        tensor = _preprocess(rgb)

        with torch.no_grad():
            output = model(tensor)

        mask = _postprocess_mask(output, (h, w))
        annotated = _draw_mask_overlay(bgr, mask)
        cv2.imwrite(output_path, annotated)

        detections_count, avg_confidence = _confidence_from_mask(mask)

    return {
        "detections_count": detections_count,
        "avg_confidence": round(avg_confidence, 4),
        "processing_time": round(time.time() - t0, 3),
    }


def process_video(input_path: str, output_path: str, progress_callback=None) -> Dict:
    """Run inference frame-by-frame on a video and write the annotated output."""
    model = load_model()
    t0 = time.time()

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {input_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    frame_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(output_path, fourcc, fps, (frame_w, frame_h))

    all_confs: list = []
    total_detections = 0
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        try:
            if _model_type == "yolo":
                results = model(frame, verbose=False)
                annotated = results[0].plot()

                boxes = results[0].boxes
                masks = results[0].masks
                if masks is not None and len(masks):
                    total_detections += len(masks)
                    all_confs.extend(boxes.conf.cpu().tolist() if boxes is not None else [0.9])
                elif boxes is not None and len(boxes):
                    total_detections += len(boxes)
                    all_confs.extend(boxes.conf.cpu().tolist())
            else:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                tensor = _preprocess(rgb, target_size=(352, 352))
                with torch.no_grad():
                    output = model(tensor)
                mask = _postprocess_mask(output, (frame_h, frame_w))
                annotated = _draw_mask_overlay(frame, mask)

                cnt, conf = _confidence_from_mask(mask)
                total_detections += cnt
                if cnt:
                    all_confs.append(conf)

        except Exception as exc:
            logger.warning("Frame %d inference error: %s", frame_idx, exc)
            annotated = frame

        out.write(annotated)
        frame_idx += 1

        if progress_callback and total_frames > 0:
            progress_callback(int(frame_idx / total_frames * 100))

    cap.release()
    out.release()

    avg_confidence = float(np.mean(all_confs)) if all_confs else 0.0

    return {
        "detections_count": total_detections,
        "avg_confidence": round(avg_confidence, 4),
        "processing_time": round(time.time() - t0, 3),
    }
