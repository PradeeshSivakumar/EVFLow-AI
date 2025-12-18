from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import sys

# Fix Import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.schemas import PredictionInput, PredictionOutput, ExplainInput, ExplainOutput, HealthResponse
from backend.service import ModelService

app = FastAPI(title="EV-Flow AI API", description="EV Charging Forecasting & Explainability")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = ModelService()

@app.on_event("startup")
async def startup_event():
    # Pre-load model
    try:
        service.load_model()
    except Exception as e:
        print(f"Warning: Model not loaded on startup: {e}")

@app.get("/health", response_model=HealthResponse)
def health_check():
    status = "active" if service.model else "loading"
    return {"status": status, "model_version": "v1.0"}

@app.post("/predict", response_model=PredictionOutput)
def predict(payload: PredictionInput):
    try:
        result = service.predict(payload.features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain", response_model=ExplainOutput)
def explain(payload: ExplainInput):
    try:
        result = service.get_explanation(payload.features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sample")
def get_sample():
    try:
        result = service.get_sample_data()
        return {"features": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
