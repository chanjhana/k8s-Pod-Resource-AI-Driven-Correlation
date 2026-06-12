# EdgeMind sensor-sim — single image, runs as pump1, pump2, or pump3 via env vars.
#
# Build (from sensor_sim/):   docker build -t edgemind/sensor-sim:latest .
# Run one pump:               docker run -e PUMP_ID=pump2 -e OPC_PORT=4841 \
#                                        -e HTTP_PORT=8081 -p 4841:4841 -p 8081:8081 \
#                                        edgemind/sensor-sim:latest
#
# asyncua requires Python >= 3.10; we use 3.11-slim for a small, current base.

FROM python:3.11-slim

# Faster, cleaner Python in containers.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install deps first for layer caching. (requirements.txt also lists test-only
# packages like pytest/httpx; harmless to include and keeps one source of truth.)
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy only the runtime modules — no tests, no __pycache__.
COPY pump_config.py fault_engine.py opc_server.py inject_server.py main.py ./

# Per-pump values are provided by docker-compose / k8s. Defaults = pump1.
ENV PUMP_ID=pump1 \
    OPC_PORT=4840 \
    HTTP_PORT=8080 \
    LOG_LEVEL=INFO

# OPC-UA server port + inject HTTP API port (documentation; compose maps them).
EXPOSE 4840 8080

# Liveness: the inject API /health endpoint. Single quotes inside the -c string
# avoid nested-quote escaping; HTTP_PORT is read from the environment at runtime.
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request, os; urllib.request.urlopen('http://127.0.0.1:' + os.environ['HTTP_PORT'] + '/health')" || exit 1

CMD ["python", "main.py"]
