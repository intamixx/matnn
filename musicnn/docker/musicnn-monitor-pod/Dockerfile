FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    kubernetes \
    requests

WORKDIR /app
COPY monitor.py /app/monitor.py

RUN useradd -m appuser
USER appuser

ENV PYTHONUNBUFFERED=1
CMD ["python", "/app/monitor.py"]
