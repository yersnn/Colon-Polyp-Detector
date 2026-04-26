FROM python:3.11-slim

# System libs required by OpenCV headless
RUN apt-get update && apt-get install -y --no-install-recommends \
        libglib2.0-0 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer-cached unless requirements change)
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# JSON array syntax is required when the path contains spaces
COPY ["only PolyDb.pt", "model.pt"]

ENV MODEL_PATH=/app/model.pt

# Persistent dirs (mount a Railway volume if you want uploads to survive redeploys)
RUN mkdir -p /app/uploads /app/processed

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
