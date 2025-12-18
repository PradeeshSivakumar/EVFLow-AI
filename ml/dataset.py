import torch
from torch.utils.data import Dataset
import numpy as np

class EVDataSequence(Dataset):
    def __init__(self, df, seq_length=48, target_cols=['future_energy', 'future_ports']):
        self.seq_length = seq_length
        self.df = df
        
        # Features to Use
        self.feature_cols = [
            'Available Ports', 
            'Energy (kWh)', 
            'Hour', 
            'DayOfWeek', 
            'Month', 
            'IsWeekend', 
            'Energy_Roll_3', 
            'Energy_Roll_6'
            # Station_ID_Encoded is used for grouping/splitting but maybe not as a direct feature 
            # if we are just learning generic dynamics. Or we can include it as an embedding input.
            # For simplicity and robustness, let's treat it as a generic model first.
            # User wants "Shared GRU encoder".
        ]
        
        # We need to create sequences per STATION.
        # It's cleaner to pre-process sequences into a list or index map.
        self.sequences = []
        self.targets = []
        
        station_groups = df.groupby('Station Name')
        
        for name, group in station_groups:
            # Sort by time just in case
            group = group.sort_values('timestamp')
            
            data_values = group[self.feature_cols].values.astype(np.float32)
            target_values = group[target_cols].values.astype(np.float32)
            
            num_samples = len(group) - seq_length
            
            if num_samples <= 0:
                continue
                
            for i in range(num_samples):
                # Input: [i : i+seq_len]
                seq = data_values[i : i+seq_length]
                # Target: [i+seq_len-1] (This is the target corresponding to the END of the sequence? 
                # OR is target[i] corresponding to predicting i+1?
                # In processed_data.csv, 'future_energy' is ALREADY shifted (-1).
                # So row T contains input features at T and target for T+1.
                # If we input sequence T-47 ... T, we want to predict T+1.
                # Row T contains `future_energy` (T+1).
                # So we want the target from the LAST row of the sequence.
                target = target_values[i + seq_length - 1]
                
                self.sequences.append(seq)
                self.targets.append(target)
                
    def __len__(self):
        return len(self.sequences)
    
    def __getitem__(self, idx):
        return torch.tensor(self.sequences[idx]), torch.tensor(self.targets[idx])
