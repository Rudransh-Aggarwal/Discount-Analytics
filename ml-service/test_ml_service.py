#!/usr/bin/env python3
"""
Test script to verify ML service components work correctly
"""
import sys
import os

def test_imports():
    """Test that all required packages can be imported"""
    try:
        import pandas as pd
        import numpy as np
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.preprocessing import LabelEncoder
        import joblib
        from fastapi import FastAPI
        from pydantic import BaseModel
        print("✓ All imports successful")
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False

def test_data_loading():
    """Test that CSV files can be loaded"""
    try:
        import pandas as pd
        sales_df = pd.read_csv('sales_data.csv')
        products_df = pd.read_csv('products.csv')
        print(f"✓ Sales data: {len(sales_df)} rows")
        print(f"✓ Products data: {len(products_df)} rows")
        return True
    except Exception as e:
        print(f"✗ Data loading error: {e}")
        return False

def test_model_training():
    """Test that model can be trained"""
    try:
        from model import train_model
        model, le = train_model()
        print("✓ Model training successful")
        return True
    except Exception as e:
        print(f"✗ Model training error: {e}")
        return False

def test_model_loading():
    """Test that model can be loaded"""
    try:
        from model import load_model
        model, le = load_model()
        print("✓ Model loading successful")
        return True
    except Exception as e:
        print(f"✗ Model loading error: {e}")
        return False

def test_prediction():
    """Test that predictions work"""
    try:
        from model import predict_units
        result = predict_units(100.0, 10.0, "Electronics")
        print(f"✓ Prediction test successful: {result}")
        return True
    except Exception as e:
        print(f"✗ Prediction error: {e}")
        return False

if __name__ == "__main__":
    print("Testing ML Service Components...")
    print("=" * 40)

    tests = [
        ("Package Imports", test_imports),
        ("Data Loading", test_data_loading),
        ("Model Training", test_model_training),
        ("Model Loading", test_model_loading),
        ("Predictions", test_prediction),
    ]

    passed = 0
    total = len(tests)

    for name, test_func in tests:
        print(f"\nTesting {name}:")
        if test_func():
            passed += 1
        else:
            print(f"Failed: {name}")

    print("\n" + "=" * 40)
    print(f"Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! ML service should work on Render.")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Check the errors above.")
        sys.exit(1)