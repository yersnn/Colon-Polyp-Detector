FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        libglib2.0-0 libgomp1 libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── heavy ML deps in isolated layers so Docker can cache them ──────────────
# torch CPU (~500 MB) — only re-downloaded when this line changes
RUN pip install --no-cache-dir \
        torch torchvision \
        --extra-index-url https://download.pytorch.org/whl/cpu

# ultralytics — installed after torch so it reuses torch already present
RUN pip install --no-cache-dir ultralytics

# ── lightweight app requirements ───────────────────────────────────────────
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# ── application code ───────────────────────────────────────────────────────
COPY backend/ ./

COPY ["only PolyDb.pt", "model.pt"]

ENV MODEL_PATH=/app/model.pt

RUN mkdir -p /app/uploads /app/processed

EXPOSE 8000

# run.py reads PORT from the environment — no shell needed
CMD ["python", "run.py"]
