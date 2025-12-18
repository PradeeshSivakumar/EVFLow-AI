import torch
import torch.nn as nn

class EVFlowGRU(nn.Module):
    def __init__(self, input_dim, hidden_dim, num_layers, num_classes):
        super(EVFlowGRU, self).__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        # Shared GRU Encoder
        self.gru = nn.GRU(
            input_dim, 
            hidden_dim, 
            num_layers, 
            batch_first=True, 
            dropout=0.2 if num_layers > 1 else 0
        )
        
        # Regression Head (Energy)
        self.reg_head = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1) # Single value output
        )
        
        # Classification Head (Ports)
        # Output logits for each class
        self.clf_head = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, num_classes) 
        )
        
    def forward(self, x):
        # x shape: (batch, seq_len, input_dim)
        
        # GRU Output
        # out shape: (batch, seq_len, hidden_dim)
        # h_n shape: (num_layers, batch, hidden_dim)
        out, _ = self.gru(x)
        
        # Use the last time step features for prediction
        last_step_out = out[:, -1, :]
        
        # Heads
        energy_pred = self.reg_head(last_step_out)
        ports_logits = self.clf_head(last_step_out)
        
        return energy_pred, ports_logits
