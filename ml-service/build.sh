#!/usr/bin/env bash
set -e
pip install --upgrade pip
pip install --only-binary=:all: numpy==1.23.5 pandas==1.5.3 scikit-learn==1.2.2 joblib==1.2.0
pip install fastapi==0.111.0 uvicorn==0.29.0 "pydantic==2.7.1"