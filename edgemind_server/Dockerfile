FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

WORKDIR /app

COPY edgemind_server/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY edgemind_server/ edgemind_server/

ENV REDIS_URL=redis://redis-svc.monitoring.svc.cluster.local:6379 \
    PROMETHEUS_URL=http://prometheus-operated.monitoring.svc.cluster.local:9090 \
    OLLAMA_URL=http://localhost:11434 \
    OLLAMA_MODEL=qwen3:8b \
    HOST=0.0.0.0 \
    PORT=8080 \
    LOG_LEVEL=INFO

EXPOSE 8080

CMD ["python", "-m", "edgemind_server.main"]
