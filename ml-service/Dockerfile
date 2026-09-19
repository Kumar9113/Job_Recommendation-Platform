FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 6100

# gunicorn: a production WSGI server. Flask's own app.run() is dev-only
# (single-threaded, no real concurrency) -- gunicorn handles multiple
# requests properly. 2 workers is a reasonable default for a small service.
CMD ["gunicorn", "--bind", "0.0.0.0:6100", "--workers", "2", "--timeout", "60", "app:app"]
