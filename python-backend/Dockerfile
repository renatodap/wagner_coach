FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port (Railway will set PORT env var)
EXPOSE 8000

# Run the application - use shell form to expand $PORT variable
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}