import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from model import predict_units, get_best_discount, load_model, train_model

model_obj, le_obj = None, None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global model_obj, le_obj
    model_obj, le_obj = load_model()
    print("ML model loaded successfully")
    yield
    # Shutdown
    print("Shutting down ML service")

app = FastAPI(title="Discount Advisory ML Service", version="1.0.0", lifespan=lifespan)

# Render sets PORT automatically — never hardcode it
ALLOWED_ORIGINS = os.getenv(
    "ML_ALLOWED_ORIGINS",
    "http://localhost:5000,http://backend:5000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    product_id: str
    price: float
    discount: float
    category: str

class PredictResponse(BaseModel):
    product_id: str
    discount: float
    predicted_units_sold: float
    predicted_revenue: float

class AdviceRequest(BaseModel):
    product_id: str
    price: float
    category: str
    discount_range: Optional[List[float]] = None

class SimulationResult(BaseModel):
    discount: float
    predicted_units: float
    predicted_revenue: float

class AdviceResponse(BaseModel):
    product_id: str
    recommended_discount: float
    expected_sales: float
    expected_revenue: float
    simulations: List[SimulationResult]

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": model_obj is not None}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        units = predict_units(req.price, req.discount, req.category, model_obj, le_obj)
        revenue = round(req.price * (1 - req.discount / 100) * units, 2)
        return PredictResponse(
            product_id=req.product_id,
            discount=req.discount,
            predicted_units_sold=units,
            predicted_revenue=revenue
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/advise", response_model=AdviceResponse)
def advise(req: AdviceRequest):
    try:
        best, simulations = get_best_discount(req.price, req.category, req.discount_range)
        return AdviceResponse(
            product_id=req.product_id,
            recommended_discount=best["discount"],
            expected_sales=best["predicted_units"],
            expected_revenue=best["predicted_revenue"],
            simulations=[SimulationResult(**s) for s in simulations]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrain")
def retrain():
    global model_obj, le_obj
    try:
        model_obj, le_obj = train_model()
        return {"message": "Model retrained successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Only used locally — Render uses the startCommand in render.yaml
if __name__ == "__main__":
    # Use a less-common default port locally to avoid conflicts with other services.
    port = int(os.getenv("PORT", 5002))
    # Disable auto-reload by default to keep the process running cleanly.
    # Set UVICORN_RELOAD=true if you want reload behavior locally.
    reload_flag = os.getenv("UVICORN_RELOAD", "false").lower() in ["1", "true", "yes"]
    uvicorn.run("api:app", host="0.0.0.0", port=port, reload=reload_flag)
