# ultralytics/ultralytics:latest-cpu ships Python 3.11 + PyTorch (CPU) +
# ultralytics + opencv — no need to pip-install any of those here.
FROM ultralytics/ultralytics:latest-cpu

WORKDIR /app

# Only the lightweight web-framework packages
RUN pip install --no-cache-dir \
        "fastapi>=0.109.0" \
        "uvicorn>=0.27.0" \
        "sqlalchemy>=2.0.0" \
        "python-jose[cryptography]>=3.3.0" \
        "passlib[bcrypt]==1.7.4" \
        "bcrypt==3.2.2" \
        "python-multipart>=0.0.9" \
        "pillow>=10.0.0" \
        "aiofiles>=23.0.0" \
        "python-dotenv>=1.0.0" \
        "psycopg2-binary>=2.9.0" \
        "email-validator>=2.0.0"

COPY backend/ ./

COPY ["only PolyDb.pt", "model.pt"]

ENV MODEL_PATH=/app/model.pt

RUN mkdir -p /app/uploads /app/processed

EXPOSE 8000

CMD ["python", "run.py"]
