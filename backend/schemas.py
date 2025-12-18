from pydantic import BaseModel
from typing import List, Dict, Any

class PredictionInput(BaseModel):
    # A list of 48 timesteps, each having 8 features
    features: List[List[float]] 
    # Shape: (48, 8)
    
class PredictionOutput(BaseModel):
    predicted_energy: float
    predicted_ports_class: int
    predicted_ports_probs: List[float] # Probabilities for each class
    
class ExplainInput(BaseModel):
    features: List[List[float]]

class ExplainOutput(BaseModel):
    shap_values: List[List[List[float]]] # (Features, SeqLen, InputDim) ... complex shape, maybe flattened or simplified
    # SHAP for GRU is (OutputDim, SeqLen, FeatDim).
    # We might just return a summary or the full tensor.
    # Let's return a simplified structure: feature_importance per feature (summed over time?)
    # or just the raw values.
    feature_names: List[str]
    
class HealthResponse(BaseModel):
    status: str
    model_version: str
