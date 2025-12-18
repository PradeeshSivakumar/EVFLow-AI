import torch
import shap
import numpy as np

class EVFlowExplainer:
    def __init__(self, model, background_data):
        """
        model: Trained PyTorch model
        background_data: Tensor of shape (k, seq_len, input_dim) to use as baseline
        """
        self.model = model
        self.device = next(model.parameters()).device
        
        # Ensure model is in eval mode
        self.model.eval()
        
        # GradientExplainer is suitable for PyTorch models
        # We need to wrap model output to return a single tensor or handle tuple.
        # SHAP expects model(*args) -> tensor.
        # Our model returns (energy, ports).
        # We'll create a wrapper for Energy explanation and one for Ports explanation?
        # Or just explain Energy for now as it's the primary regression target.
        
        self.background = background_data.to(self.device)
        self.explainer_energy = shap.GradientExplainer(self.energy_wrapper, self.background)
        # Ports is ArgMax? Or logits? GradientExplainer works on logits.
        self.explainer_ports = shap.GradientExplainer(self.ports_wrapper, self.background)
        
    def energy_wrapper(self, x):
        e, _ = self.model(x)
        return e
        
    def ports_wrapper(self, x):
        _, p = self.model(x)
        return p
        
    def explain(self, x):
        """
        x: Input tensor (batch, seq_len, dim)
        Returns: Dict with shap values for energy and ports
        """
        x = x.to(self.device).requires_grad_(True)
        
        # SHAP values shape: (batch, seq_len, dim)
        shap_energy = self.explainer_energy.shap_values(x)
        
        # For multi-class ports, shap_values is a list of tensors (one per class)
        shap_ports = self.explainer_ports.shap_values(x)
        
        return {
            "energy_shap": np.array(shap_energy), 
            "ports_shap": [np.array(s) for s in shap_ports]
        }
