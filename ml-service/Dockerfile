# Build the ML service in a consistent environment (Python 3.11)
FROM python:3.11-slim

# Ensure basic build tools are available (for any packages that need compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN python -m pip install --upgrade pip

# Set workdir and install dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Pre-load model to avoid slow first-request startup
RUN python -c "from model import load_model; load_model(); print('Model ready')"

# Expose port, Render will provide $PORT at runtime
EXPOSE 8000

# Start the service
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "$PORT"]
