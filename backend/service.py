import torch
import numpy as np
import pandas as pd
import pickle
import os
import sys

# Add project root to sys path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ml.model import EVFlowGRU
from ml.explainability import EVFlowExplainer

MODEL_PATH = r'e:\EVFlow AI\ml\model.pth'
SCALER_PATH = r'e:\EVFlow AI\data\processed\scaler.pkl'
ENCODER_PATH = r'e:\EVFlow AI\data\processed\encoders.pkl'
METADATA_PATH = r'e:\EVFlow AI\ml\metadata.json'

class ModelService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelService, cls).__new__(cls)
            cls._instance.model = None
            cls._instance.scaler = None
            cls._instance.explainer = None
            cls._instance.metadata = None
        return cls._instance
        
    def load_model(self):
        if self.model is not None:
            return

        print("Loading model artifacts...")
        
        # Load Metadata (to know dims)
        import json
        with open(METADATA_PATH, 'r') as f:
            self.metadata = json.load(f)
            
        input_dim = self.metadata['input_dim']
        hidden_dim = self.metadata['hidden_dim']
        num_layers = self.metadata['num_layers']
        num_classes = self.metadata['num_classes']
        
        # Load Model
        self.model = EVFlowGRU(input_dim, hidden_dim, num_layers, num_classes)
        self.model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
        self.model.eval()
        
        # Load Scaler
        with open(SCALER_PATH, 'rb') as f:
            self.scaler = pickle.load(f)
            
        print("Model loaded successfully.")
        
    def preprocess_input(self, features_list):
        # features_list: List[List[float]] (48 steps, 8 features)
        # API expects features in the same order as training?
        # We assume the user sends SCALED data or RAW data?
        # Usually API takes RAW data. 
        # But for sliding window, the client (dashboard) might have the raw history.
        # The scaler expects specific columns.
        # Let's assume the Dashboard sends RAW data, and we scale it.
        # Columns: 'Available Ports', 'Energy (kWh)', 'Energy_Roll_3', 'Energy_Roll_6', 'Hour', 'DayOfWeek', 'Month' ...
        # Wait, scaler was fit on specific columns in `process_data.py`. 
        # `cols_to_scale = ['Available Ports', 'Energy (kWh)', 'Energy_Roll_3', 'Energy_Roll_6', 'Hour', 'DayOfWeek', 'Month']`
        # IsWeekend and Station_ID_Encoded were NOT scaled (or discrete).
        # We need to apply scaler only to relevant columns.
        # This is complex to replicate exactly without the dataframe structure.
        # SIMPLIFICATION: The Frontend will "mock" the sequence using the `processed_data.csv` (which is already scaled).
        # OR: The Frontend sends pre-scaled data. 
        # For this prototype, let's assume the Input IS already compatible (scaled).
        # Why? Because creating a robust "Raw -> Feature Eng -> Scale" pipeline for inference 
        # requires moving `process_data.py` logic into a reusable class (`preprocessor.py`).
        # Given time constraints, I will assume INPUT IS PRE-SCALED (i.e. drawn from processed_data.csv by the UI).
        
        return torch.tensor([features_list], dtype=torch.float32)

    def predict(self, features):
        if not self.model:
            self.load_model()
            
        x_tensor = self.preprocess_input(features)
        
        with torch.no_grad():
            e_pred, p_logits = self.model(x_tensor)
            
        # Energy
        energy = e_pred.item()
        
        # Ports
        p_probs = torch.softmax(p_logits, dim=1).squeeze().tolist()
        p_class = torch.argmax(p_logits, dim=1).item()
        
        return {
            "predicted_energy": energy,
            "predicted_ports_class": p_class,
            "predicted_ports_probs": p_probs
        }
        
    def get_explanation(self, features):
        if not self.model:
            self.load_model()
            
        # Lazily init explainer using a small background batch (zeros?)
        # Ideally we use training data samples.
        if self.explainer is None:
            # Create a dummy background (e.g., zeros or mean)
            # Dims: (10, 48, 8)
            background = torch.zeros((10, 48, self.metadata['input_dim']))
            self.explainer = EVFlowExplainer(self.model, background)
            
        x_tensor = self.preprocess_input(features)
        shap_vals = self.explainer.explain(x_tensor)
        
        # Convert to list
        # energy_shap: (1, 48, 8)
        return {
            "shap_values": shap_vals['energy_shap'][0].tolist(), # Just one sample
            "feature_names": [
                'Available Ports', 'Energy', 'Hour', 'DayOfWeek', 'Month', 
                'IsWeekend', 'Energy_Roll_3', 'Energy_Roll_6'
            ]
        }

    def get_sample_data(self):
        # Load data if not loaded (we need dataframe for this)
        # For simplicity, load the csv again or cache it? process_data.py saved it.
        # Ideally we stick to the 48-window logic.
        # Let's load the csv, pick a random start index, and return 48 rows.
        
        df = pd.read_csv(r'e:\EVFlow AI\data\processed\processed_data.csv')
        
        # Features columns expected by model
        # 'Available Ports', 'Energy (kWh)', 'Hour', 'DayOfWeek', 'Month', 'IsWeekend', 'Energy_Roll_3', 'Energy_Roll_6'
        feats = ['Available Ports', 'Energy (kWh)', 'Hour', 'DayOfWeek', 'Month', 'IsWeekend', 'Energy_Roll_3', 'Energy_Roll_6']
        
        max_idx = len(df) - 48
        if max_idx < 0:
            return []
            
        import random
        start_idx = random.randint(0, max_idx)
        
        # Extract 48 rows
        subset = df.iloc[start_idx : start_idx+48][feats]
        return subset.values.tolist()
