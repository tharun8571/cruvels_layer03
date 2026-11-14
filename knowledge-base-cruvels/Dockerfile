FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    KB_DATA_ROOT=/app/data

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy project specification and install dependencies
COPY pyproject.toml /app/
COPY README.md /app/
RUN pip install --upgrade pip && pip install -e .

# Copy source code and scripts
COPY src/ /app/src/
COPY config/ /app/config/
COPY database/ /app/database/
COPY scripts/ /app/scripts/
COPY docs/ /app/docs/
COPY data/manifests/ /app/data/manifests/

# Expose API port
EXPOSE 8000

# Default command: run FastAPI application
CMD ["uvicorn", "kb_cruvels.main:app", "--host", "0.0.0.0", "--port", "8000"]
