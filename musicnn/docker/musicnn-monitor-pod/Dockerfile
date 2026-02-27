FROM python:3.11-slim

# Install system deps + kubectl + python deps
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl ca-certificates \
    && curl -LO https://dl.k8s.io/release/$(curl -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl \
    && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl \
    && rm kubectl \
    && pip install --no-cache-dir requests \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

CMD ["python"]
