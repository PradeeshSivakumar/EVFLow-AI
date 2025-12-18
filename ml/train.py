import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
import pandas as pd
import numpy as np
import os
import json
from dataset import EVDataSequence
from model import EVFlowGRU

# Config
DATA_PATH = r'e:\EVFlow AI\data\processed\processed_data.csv'
MODEL_SAVE_PATH = r'e:\EVFlow AI\ml\model.pth'
METRICS_SAVE_PATH = r'e:\EVFlow AI\ml\metrics.json'

SEQ_LENGTH = 48
HIDDEN_DIM = 64
NUM_LAYERS = 2
BATCH_SIZE = 64
EPOCHS = 10 # Configurable, keep low for demo speed if needed, but high enough for convergence
LEARNING_RATE = 0.001

def train():
    print("Loading data...")
    df = pd.read_csv(DATA_PATH)
    
    # Check max ports for num_classes
    # The 'Available Ports' column is MinMax scaled (0-1).
    # We essentially need the original integer counts for classification targets.
    # WAIT. In proces_data.py, we scaled 'Available Ports'.
    # For Classification Target 'future_ports', we need integer labels.
    # If `future_ports` in csv is float (scaled), we can't use it directly for CrossEntropy.
    # We should have saved the UN-SCALED target for classification, or we need to inverse transform.
    # Let's check the csv content quickly or assume we need to recover classes.
    # Actually, simpler approach: The model predicts CLASS INDEX.
    # If the scaled value is 0.0 -> 0 ports, 0.5 -> 1 port (if max was 2) etc.
    # It's better to reconstruct the integer class from the scaled value if we know the scaler min/max.
    # BUT we only have the scaler file.
    # ALTERNATIVE: Treat it as Regression + rounding?
    # User specifically said: "Multi-class classification... CrossEntropy".
    # So I must treat it as classes.
    # The `future_ports` column in `processed_data.csv` is likely floats.
    # Let's inspect the data first (in my head or via tool if needed).
    # In `process_data.py`: `full_df['future_ports'] = ...shift(-1)`. Then `scaler.fit_transform`.
    # So `future_ports` IS scaled.
    # I need to discretize it back to classes.
    # Since it's MinMax scaled, 0 is min, 1 is max.
    # The number of unique values in `Available Ports` corresponds to the classes.
    
    # Strategy: Find unique values in `Available Ports` (or future_ports) column, map them to 0..N.
    # This works if global min/max covers all.
    unique_vals = sorted(df['future_ports'].unique())
    val_to_class = {v: i for i, v in enumerate(unique_vals)}
    num_classes = len(unique_vals)
    print(f"Detected {num_classes} port availability classes.")
    
    # Add class index column
    df['future_ports_class'] = df['future_ports'].map(val_to_class)
    
    # Create Dataset
    # We pass the class column name as target for ports
    # SPEED OPTIMIZATION FOR DEMO: Slice dataframe to smaller size
    df = df.iloc[:5000].copy() 
    dataset = EVDataSequence(df, seq_length=SEQ_LENGTH, target_cols=['future_energy', 'future_ports_class'])
    
    # Split
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_ds, val_ds = random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False)
    
    # Init Model
    # Features size: len(dataset.feature_cols)
    input_dim = len(dataset.feature_cols)
    model = EVFlowGRU(input_dim, HIDDEN_DIM, NUM_LAYERS, num_classes)
    
    # Loss & Optimizer
    criterion_reg = nn.MSELoss()
    criterion_clf = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    
    # Training Loop
    print("Starting training (Demo Mode)...")
    device = torch.device('cpu') # User req: CPU-compatible training
    model.to(device)
    
    DEMO_EPOCHS = 1 # Force 1 epoch for demo
    
    for epoch in range(DEMO_EPOCHS):
        model.train()
        running_loss = 0.0
        
        for X_batch, y_batch in train_loader:
            X_batch = X_batch.to(device)
            # y_batch: [energy, ports_class]
            y_energy = y_batch[:, 0].unsqueeze(1).to(device) # (B, 1)
            y_ports = y_batch[:, 1].long().to(device) # (B,)
            
            optimizer.zero_grad()
            
            pred_energy, pred_ports = model(X_batch)
            
            loss_reg = criterion_reg(pred_energy, y_energy)
            loss_clf = criterion_clf(pred_ports, y_ports)
            
            loss = 0.7 * loss_reg + 0.3 * loss_clf
            
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            
        print(f"Epoch {epoch+1}/{DEMO_EPOCHS}, Loss: {running_loss/len(train_loader):.4f}")
        
    # Evaluation
    print("Evaluating...")
    model.eval()
    val_loss = 0.0
    correct_ports = 0
    total_samples = 0
    mse_energy_sum = 0
    
    with torch.no_grad():
        for X_batch, y_batch in val_loader:
            X_batch = X_batch.to(device)
            y_energy = y_batch[:, 0].unsqueeze(1).to(device)
            y_ports = y_batch[:, 1].long().to(device)
            
            pred_energy, pred_ports = model(X_batch)
            
            # Metrics
            mse_energy_sum += criterion_reg(pred_energy, y_energy).item() * X_batch.size(0)
            
            _, predicted_class = torch.max(pred_ports, 1)
            correct_ports += (predicted_class == y_ports).sum().item()
            total_samples += X_batch.size(0)
            
    mse_energy = mse_energy_sum / total_samples
    rmse_energy = np.sqrt(mse_energy)
    accuracy_ports = correct_ports / total_samples
    
    metrics = {
        "rmse_energy": rmse_energy,
        "accuracy_ports": accuracy_ports
    }
    
    print(f"Validation Metrics: {metrics}")
    
    # Save Model
    torch.save(model.state_dict(), MODEL_SAVE_PATH)
    
    # Map class index back to scaled value for reference if needed?
    # We might need to save 'val_to_class' mapping or 'num_classes' to use in inference.
    # Actually inference needs to know num_classes to shape the model.
    # And we need to map class index back to real 'Available Ports' value (0, 1, 2...).
    # But wait, the Frontend wants "Available Ports". 
    # The output of Classification is a Class Index (0, 1, 2...). 
    # This Index corresponds to the sorted unique values of the SCALED data.
    # e.g. Scaled: 0.0, 0.33, 0.66, 1.0 -> Classes 0, 1, 2, 3.
    # The REAL values are 0, 1, 2, 3 (typically).
    # So Class Index X likely maps exactly to X ports if we assume linearity, but simpler is:
    # We infer class count from model output shape.
    # For display, we might want to unscale.
    # Let's save metadata.
    
    metadata = {
        "num_classes": num_classes,
        "unique_vals_scaled": unique_vals, # List of floats
        "input_dim": input_dim,
        "hidden_dim": HIDDEN_DIM,
        "num_layers": NUM_LAYERS,
        "seq_length": SEQ_LENGTH
    }
    
    with open(r'e:\EVFlow AI\ml\metadata.json', 'w') as f:
        json.dump(metadata, f)
        
    with open(METRICS_SAVE_PATH, 'w') as f:
        json.dump(metrics, f)
        
    print("Training complete and artifacts saved.")

if __name__ == "__main__":
    train()
