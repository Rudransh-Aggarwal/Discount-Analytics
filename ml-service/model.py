import csv
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import os

MODEL_PATH = "trained_model.pkl"
ENCODER_PATH = "category_encoder.pkl"


def _read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return [row for row in reader]


def _safe_float(val, default=0.0):
    try:
        return float(val)
    except Exception:
        return default


def _safe_int(val, default=0):
    try:
        return int(float(val))
    except Exception:
        return default


def train_model(data_path="sales_data.csv"):
    try:
        print("Starting model training...")
        sales = _read_csv(data_path)
        print(f"Loaded {len(sales)} sales records")

        products_path = data_path.replace("sales_data.csv", "products.csv")
        products = _read_csv(products_path)
        print(f"Loaded {len(products)} products")

        # Build product->category map
        product_category = {p.get("product_id", ""): p.get("category", "Unknown") for p in products}

        # Build dataset rows
        rows = []
        for row in sales:
            pid = row.get("product_id", "")
            category = product_category.get(pid, "Unknown") or "Unknown"
            price = _safe_float(row.get("price", 0))
            discount = _safe_float(row.get("discount", 0))
            units = _safe_float(row.get("units_sold", 0))
            rows.append({
                "price": price,
                "discount": discount,
                "category": category,
                "units_sold": units,
            })

        # Label encode category
        categories = sorted({r["category"] for r in rows})
        cat_to_int = {c: i for i, c in enumerate(categories)}
        X = []
        y = []
        for r in rows:
            X.append([r["price"], r["discount"], cat_to_int.get(r["category"], 0)])
            y.append(r["units_sold"])

        X = np.array(X, dtype=float)
        y = np.array(y, dtype=float)

        print(f"Training data shape: {X.shape}")
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        print(f"Model trained successfully. MAE: {mae:.2f}")

        joblib.dump(model, MODEL_PATH)
        joblib.dump(cat_to_int, ENCODER_PATH)
        print(f"Model saved to {MODEL_PATH}")
        return model, cat_to_int

    except Exception as e:
        print(f"Error training model: {e}")
        raise


def load_model():
    try:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODER_PATH):
            print("Model files not found, training new model...")
            return train_model()

        print("Loading existing model...")
        model = joblib.load(MODEL_PATH)
        le = joblib.load(ENCODER_PATH)
        print("Model loaded successfully")
        return model, le

    except Exception as e:
        print(f"Error loading model: {e}")
        print("Attempting to retrain model...")
        return train_model()


def predict_units(price: float, discount: float, category: str, model=None, le=None):
    if model is None or le is None:
        model, le = load_model()

    cat_enc = le.get(category, 0)
    X = np.array([[price, discount, cat_enc]], dtype=float)
    prediction = model.predict(X)[0]
    return max(0, round(float(prediction), 2))


def predict_units(price: float, discount: float, category: str, model=None, le=None):
    if model is None or le is None:
        model, le = load_model()

    try:
        cat_enc = le.transform([category])[0]
    except ValueError:
        cat_enc = 0  # fallback for unknown category

    X = np.array([[price, discount, cat_enc]])
    prediction = model.predict(X)[0]
    return max(0, round(float(prediction), 2))


def get_best_discount(price: float, category: str, discount_range=None):
    if discount_range is None:
        discount_range = [0, 5, 10, 15, 20, 25, 30]

    model, le = load_model()
    results = []

    for disc in discount_range:
        units = predict_units(price, disc, category, model, le)
        effective_price = price * (1 - disc / 100)
        revenue = effective_price * units
        results.append({
            "discount": disc,
            "predicted_units": units,
            "predicted_revenue": round(revenue, 2)
        })

    best = max(results, key=lambda x: x["predicted_revenue"])
    return best, results


if __name__ == "__main__":
    train_model()
