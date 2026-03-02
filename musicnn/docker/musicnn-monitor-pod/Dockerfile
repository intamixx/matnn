FROM python:3.11-slim

# ---------- System deps ----------
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ---------- Python deps ----------
RUN pip install --no-cache-dir \
    kubernetes \
    requests

# ---------- App ----------
WORKDIR /app
COPY monitor.py /app/monitor.py

# ---------- Security ----------
RUN useradd -m appuser
USER appuser

# ---------- Runtime ----------
CMD ["python", "/app/monitor.py"]
