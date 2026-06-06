# ColoRISK — AI Polyp Detection Platform

[🇷🇺 Русская версия](README.ru.md)

![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-deployed-0B0D0E?logo=railway&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?logo=vercel&logoColor=white)

> **ColoRISK** is a full-stack medical AI application that detects colon polyps in colonoscopy images, videos, and documents using a YOLO-based deep learning model. Built for clinical workflows with multi-language support, async processing, and a clean dark/light UI.

---

## Features

- 🖼️ **Image analysis** — JPEG, PNG, BMP, TIFF, WebP
- 🎬 **Video analysis** — MP4, MOV, AVI, MKV, WebM (frame-by-frame)
- 📄 **Document analysis** — ODT files with embedded colonoscopy images
- 🔐 **JWT authentication** — per-user analysis history and file isolation
- 🌍 **3-language UI** — English, Russian, Kazakh
- 🌗 **Dark / light theme** — persisted in localStorage
- ⚡ **Async processing** — non-blocking inference with live status polling
- 📥 **Download results** — annotated images/videos available for download

---

## Architecture

```
┌─────────────────────┐        ┌──────────────────────────┐
│   React Frontend    │  HTTPS │   FastAPI Backend         │
│   (Vercel)          │◄──────►│   (Railway / Docker)      │
│                     │        │                           │
│  • Auth pages       │        │  • JWT auth               │
│  • Dashboard        │        │  • File upload & storage  │
│  • Results viewer   │        │  • Background inference   │
│  • i18n EN/RU/KZ   │        │  • REST API               │
└─────────────────────┘        └──────────┬────────────────┘
                                           │
                                ┌──────────▼────────────────┐
                                │   YOLO / PyTorch Model     │
                                │   (only PolyDb.pt)         │
                                │   ultralytics + OpenCV     │
                                └────────────────────────────┘
```

**Storage**: SQLite (local dev) / PostgreSQL (production via Railway)

---

## Local Development

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **Model file**: `only PolyDb.pt` in the project root

### One-command startup

```bash
./start.sh
```

This script starts both backend and frontend in parallel. Press `Ctrl+C` to stop both.

### Manual setup

**Backend:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend** (new terminal):
```bash
cd frontend
npm install
npm run dev
```

### Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | ✅ | — | JWT signing secret (use a long random string) |
| `DATABASE_URL` | ❌ | SQLite | PostgreSQL URL (`postgresql://user:pass@host/db`) |
| `MODEL_PATH` | ❌ | `../only PolyDb.pt` | Absolute path to the `.pt` model file |
| `PORT` | ❌ | `8000` | HTTP server port |
| `CORS_ORIGINS` | ❌ | `*` | Comma-separated allowed origins |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ | Backend base URL (e.g. `https://your-app.railway.app`) |

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | No | Register with email & password → returns JWT |
| `POST` | `/auth/login` | No | Login (OAuth2 form body) → returns JWT |
| `GET` | `/auth/me` | Yes | Get current user info |

### Analyses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/analyses` | Yes | Upload file → starts background inference, returns Analysis object |
| `GET` | `/analyses` | Yes | List all analyses for current user (newest first) |
| `GET` | `/analyses/{id}` | Yes | Get single analysis by ID |
| `DELETE` | `/analyses/{id}` | Yes | Delete analysis and associated files |

### Files

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/files/uploads/{filename}` | No | Serve original uploaded file |
| `GET` | `/files/processed/{filename}` | No | Serve AI-annotated result |
| `GET` | `/files/download/{filename}` | No | Download processed file as attachment |

### Stats

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/stats` | Yes | Aggregated stats: total analyses, detections, avg confidence |

**Auth header:** `Authorization: Bearer <token>`

---

## Supported File Types

| Category | Extensions | Max Size |
|----------|-----------|----------|
| Images | `.jpg` `.jpeg` `.png` `.bmp` `.tiff` `.webp` | 500 MB |
| Videos | `.mp4` `.mov` `.avi` `.mkv` `.webm` | 500 MB |
| Documents | `.odt` (OpenDocument Text with embedded images) | 500 MB |

---

## Deployment

### Backend → Railway

1. Connect your GitHub repo to Railway
2. Railway will detect the `Dockerfile` automatically
3. Set the following environment variables in Railway dashboard:

```
SECRET_KEY=<your-long-random-secret>
DATABASE_URL=<auto-injected by Railway PostgreSQL plugin>
MODEL_PATH=/app/model.pt
```

The `Dockerfile` uses `ultralytics/ultralytics:latest-cpu` as base image — PyTorch, OpenCV, and ultralytics are pre-installed. Only lightweight web packages are installed on top.

**`railway.toml`** configures:
- Health check path: `/docs`
- Restart on failure (max 3 retries)

### Frontend → Vercel

1. Connect your GitHub repo to Vercel
2. Set build settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variable:
```
VITE_API_BASE_URL=https://your-app.railway.app
```

`vercel.json` handles SPA routing (all paths → `index.html`).

---

## Project Structure

```
polyp-detector/
├── backend/
│   ├── main.py             # FastAPI app, all endpoints, background tasks
│   ├── inference.py        # Model loading, image/video/document processing
│   ├── database.py         # SQLAlchemy models (User, Analysis)
│   ├── auth.py             # JWT creation & validation, password hashing
│   ├── run.py              # Uvicorn entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts       # Axios instance + auth interceptor
│   │   ├── contexts/           # Auth, Theme, Lang React contexts
│   │   ├── pages/              # Login, Register, Dashboard, Results
│   │   ├── components/         # Navbar, UploadZone, AnalysisCard, ColonIcon
│   │   └── i18n/translations.ts# EN / RU / KZ string constants
│   ├── tailwind.config.js
│   └── vite.config.ts
├── Dockerfile
├── railway.toml
├── start.sh                # Local dev launcher (backend + frontend)
└── only PolyDb.pt          # YOLO model weights
```

---

## Database Schema

### `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER | Primary key |
| `email` | VARCHAR | Unique, indexed |
| `hashed_password` | VARCHAR | bcrypt |
| `created_at` | DATETIME | UTC |

### `analyses`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER | Primary key |
| `user_id` | INTEGER | FK → users.id (cascade delete) |
| `filename` | VARCHAR | Original display name |
| `media_type` | VARCHAR | `image` \| `video` \| `document` |
| `original_filename` | VARCHAR | UUID-based stored name |
| `processed_filename` | VARCHAR | Annotated output filename |
| `status` | VARCHAR | `pending` → `processing` → `done` \| `failed` |
| `detections_count` | INTEGER | Number of polyps found |
| `avg_confidence` | FLOAT | Mean confidence score (0–1) |
| `processing_time` | FLOAT | Seconds elapsed |
| `error_message` | TEXT | Failure reason (nullable) |
| `created_at` | DATETIME | UTC |

---

## Inference Pipeline

The model loading uses a two-strategy fallback:

1. **ultralytics YOLO** (primary) — handles YOLOv8/v9/v10 `.pt` files
2. **Raw PyTorch** (fallback) — for custom segmentation models

For PyTorch models, inference outputs a mask tensor `(1, 1, H, W)` in `[0, 1]`. A sigmoid is automatically applied when values fall outside that range. Masks are thresholded at `0.5` and overlaid in green-teal (`#00DC96`) at 45% opacity with contour outlines.

---

## License

This project is developed for academic and medical research purposes.
