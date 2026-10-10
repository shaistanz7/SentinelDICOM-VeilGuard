# ==========================================
# Multi-Stage Production Dockerfile
# Stage 1: Build React 19 Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Local-First Python Backend Server
# ==========================================
FROM python:3.11-slim

WORKDIR /app

# Install system runtime dependencies for OpenCV and Tesseract OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source, policies, and samples
COPY . .

# Copy compiled frontend dist from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose standard web port
EXPOSE 8000

ENV HOST=0.0.0.0
ENV PORT=8000
ENV SENTINEL_UID_SALT=sentinel_veilguard_secure_salt_2026

CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
