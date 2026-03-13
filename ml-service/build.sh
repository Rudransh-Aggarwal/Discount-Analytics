#!/usr/bin/env bash
set -e

echo "Installing Python dependencies..."
pip install --upgrade pip

# Install packages with better error handling
pip install -r requirements.txt

echo "Installing additional dependencies if needed..."
pip install --upgrade setuptools wheel

echo "Loading/verifying ML model..."
python -c "from model import load_model; load_model(); print('Model ready')"

echo "Build completed successfully"