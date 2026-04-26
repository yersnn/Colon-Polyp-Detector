import logging
import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

import inference as inf
from auth import create_access_token, get_current_user, hash_password, verify_password
from database import Analysis, User, get_db, init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Polyp Detector API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).parent / "uploads"
PROCESSED_DIR = Path(__file__).parent / "processed"
UPLOAD_DIR.mkdir(exist_ok=True)
PROCESSED_DIR.mkdir(exist_ok=True)

ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
ALLOWED_VIDEO_EXTS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
MAX_FILE_BYTES = 500 * 1024 * 1024  # 500 MB


@app.on_event("startup")
def startup():
    init_db()
    logger.info("Database initialised")


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str

    model_config = {"from_attributes": True}


class AnalysisOut(BaseModel):
    id: int
    filename: str
    media_type: str
    status: str
    detections_count: int
    avg_confidence: float
    processing_time: float
    error_message: Optional[str]
    original_url: Optional[str]
    processed_url: Optional[str]
    processed_filename: Optional[str]
    created_at: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _analysis_to_out(a: Analysis, request_base: str = "") -> AnalysisOut:
    base = request_base.rstrip("/")
    return AnalysisOut(
        id=a.id,
        filename=a.filename,
        media_type=a.media_type,
        status=a.status,
        detections_count=a.detections_count,
        avg_confidence=a.avg_confidence,
        processing_time=a.processing_time,
        error_message=a.error_message,
        original_url=f"{base}/files/uploads/{a.original_filename}" if a.original_filename else None,
        processed_url=f"{base}/files/processed/{a.processed_filename}" if a.processed_filename else None,
        processed_filename=a.processed_filename,
        created_at=a.created_at.isoformat(),
    )


def _run_analysis(analysis_id: int):
    """Background task: run inference and update DB record."""
    from database import SessionLocal

    db = SessionLocal()
    try:
        record = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not record:
            return

        record.status = "processing"
        db.commit()

        input_path = str(UPLOAD_DIR / record.original_filename)
        stem = Path(record.original_filename).stem
        suffix = ".jpg" if record.media_type == "image" else ".mp4"
        out_name = f"processed_{stem}{suffix}"
        output_path = str(PROCESSED_DIR / out_name)

        try:
            if record.media_type == "image":
                result = inf.process_image(input_path, output_path)
            else:
                result = inf.process_video(input_path, output_path)

            record.processed_filename = out_name
            record.status = "done"
            record.detections_count = result["detections_count"]
            record.avg_confidence = result["avg_confidence"]
            record.processing_time = result["processing_time"]
        except Exception as exc:
            logger.exception("Inference failed for analysis %d", analysis_id)
            record.status = "failed"
            record.error_message = str(exc)

        db.commit()
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@app.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user = User(email=body.email, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(access_token=create_access_token(user.id))


@app.post("/auth/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return TokenResponse(access_token=create_access_token(user.id))


@app.get("/auth/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ---------------------------------------------------------------------------
# Analysis routes
# ---------------------------------------------------------------------------

@app.post("/analyses", response_model=AnalysisOut, status_code=status.HTTP_201_CREATED)
async def create_analysis(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.size and file.size > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 500 MB)")

    ext = Path(file.filename or "").suffix.lower()
    if ext in ALLOWED_IMAGE_EXTS:
        media_type = "image"
    elif ext in ALLOWED_VIDEO_EXTS:
        media_type = "video"
    else:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ext}'. "
                   f"Images: {ALLOWED_IMAGE_EXTS} | Videos: {ALLOWED_VIDEO_EXTS}",
        )

    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / unique_name

    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    record = Analysis(
        user_id=current_user.id,
        filename=file.filename or unique_name,
        media_type=media_type,
        original_filename=unique_name,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    background_tasks.add_task(_run_analysis, record.id)

    return _analysis_to_out(record)


@app.get("/analyses", response_model=List[AnalysisOut])
def list_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .all()
    )
    return [_analysis_to_out(r) for r in records]


@app.get("/analyses/{analysis_id}", response_model=AnalysisOut)
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(Analysis).filter(
        Analysis.id == analysis_id, Analysis.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return _analysis_to_out(record)


@app.delete("/analyses/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(Analysis).filter(
        Analysis.id == analysis_id, Analysis.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")

    for fname in [record.original_filename, record.processed_filename]:
        if fname:
            for d in [UPLOAD_DIR, PROCESSED_DIR]:
                p = d / fname
                if p.exists():
                    p.unlink()

    db.delete(record)
    db.commit()


# ---------------------------------------------------------------------------
# File serving
# ---------------------------------------------------------------------------

@app.get("/files/uploads/{filename}")
def serve_upload(filename: str, current_user: User = Depends(get_current_user)):
    path = UPLOAD_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)


@app.get("/files/processed/{filename}")
def serve_processed(filename: str, current_user: User = Depends(get_current_user)):
    path = PROCESSED_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)


@app.get("/files/download/{filename}")
def download_processed(filename: str, current_user: User = Depends(get_current_user)):
    path = PROCESSED_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, filename=filename, media_type="application/octet-stream")


# ---------------------------------------------------------------------------
# Stats route
# ---------------------------------------------------------------------------

@app.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    analyses = db.query(Analysis).filter(Analysis.user_id == current_user.id).all()
    done = [a for a in analyses if a.status == "done"]
    return {
        "total_analyses": len(analyses),
        "completed": len(done),
        "total_detections": sum(a.detections_count for a in done),
        "avg_confidence": round(
            sum(a.avg_confidence for a in done) / len(done) if done else 0.0, 4
        ),
    }
