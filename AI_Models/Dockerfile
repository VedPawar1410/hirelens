# HireLens AI service: JD generation, resume extraction, ATS scoring, interview emails.
FROM python:3.12-slim-bookworm

# WeasyPrint (JD PDFs) needs Pango/HarfBuzz from the OS; pip cannot install them.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0 fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HUB_OFFLINE=1

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render injects PORT; locally it defaults to 8000.
EXPOSE 8000
CMD ["sh", "-c", "exec uvicorn api_server:app --host 0.0.0.0 --port ${PORT:-8000}"]
