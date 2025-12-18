# EVFlow AI Prediction System

This document outlines the internal logic of the EVFlow AI prediction system, detailing how raw EV session data is transformed into actionable forecasts for energy demand and port availability.

## 1. System Overview

The pipeline consists of three main stages:
1.  **Data Reconstruction**: Converting event-based charging sessions into a continuous time-series.
2.  **Feature Engineering**: Creating temporal and historical rolling features.
3.  **Deep Learning Model**: A GRU-based recurrent neural network that predicts future states based on a 12-hour history (48 x 15-minute intervals).

## 2. Data Processing Strategy

The raw data consists of individual charging sessions (Start Time, End Time, Energy). To predict demand at any specific time, we first transform this into a fixed time-grid.

### 2.1 Time-Series Reconstruction (`process_data.py`)
- **Granularity**: The timeline is divided into **15-minute intervals**.
- **Port Occupancy**: Calculated by simulating port plug-in (+1) and plug-out (-1) events cumulatively.
- **Energy Load**:
  - The average power ($kW$) for a session is derived from Total Energy / Duration.
  - This power load is added to the grid for the duration of the charging session.
  - **Energy (kWh)** for a specific 15-minute interval is calculated as $Load(kW) \times 0.25h$.

## 3. Input Features

The model receives a sequence of **48 time steps** (representing the last 12 hours) to predict the state of the *next* time step. Each time step contains the following 8 features:

| Feature Name | Description |
| :--- | :--- |
| **Available Ports** | Number of empty ports at that station. |
| **Energy (kWh)** | Energy consumed in that 15-min interval. |
| **Hour** | Hour of the day (0-23). |
| **DayOfWeek** | Day (0=Mon, 6=Sun). |
| **Month** | Month (1-12). |
| **IsWeekend** | Binary flag (1 if Sat/Sun, else 0). |
| **Energy_Roll_3** | Rolling average of energy over the last 3 intervals (45 mins). |
| **Energy_Roll_6** | Rolling average of energy over the last 6 intervals (90 mins). |

*Note: All numerical features are scaled using `MinMaxScaler` to a 0-1 range before entering the network.*

## 4. Model Architecture (`ml/model.py`)

The core model is a **Gated Recurrent Unit (GRU)** designed to handle sequential dependencies.

### Structure
1.  **Encoder (GRU)**:
    - Input: `(Batch, 48, 8)`
    - Hidden Dimensions: Configurable (e.g., 64 or 128 units).
    - Layers: 2 stacked GRU layers for complex pattern recognition.
    - Captures temporal dynamics like morning spikes or weekend usage patterns.

2.  **Regression Head (Energy)**:
    - Takes the final hidden state of the GRU.
    - `Linear -> ReLU -> Linear` -> **Scalar Output** (Predicted Energy in kWh).

3.  **Classification Head (Ports)**:
    - Takes the final hidden state of the GRU.
    - `Linear -> ReLU -> Linear` -> **Softmax Output** (Class Distrubution).
    - Predicts which "Availability Class" (e.g., Low, Medium, High availability) the station will fall into.

## 5. Inference & Explainability

### Inference Flow
1.  **API Request**: The backend receives a sequence of the last 48 steps of data.
2.  **Preprocessing**: Data is validated and converted to a PyTorch tensor.
3.  **Forward Pass**: The GRU processes the sequence.
4.  **Output**: Returns the predicted Energy value and the Port Availability probabilities.

### Explainability (SHAP)
To build trust, the system uses **SHAP (SHapley Additive exPlanations)** via the `GradientExplainer`.
- It calculates which input features (e.g., "Hour of Day" vs "Recent Energy usage") contributed most to the model's energy prediction.
- This allows station managers to understand *why* a spike is predicted (e.g., "High predicted demand due to it being 6 PM on a Friday").
