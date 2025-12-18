import pandas as pd
import numpy as np
import pickle
from sklearn.preprocessing import MinMaxScaler, LabelEncoder
import os

# Configuration
INPUT_FILE = r'e:\EVFlow AI\data\raw\ev_data.xlsx.csv'
OUTPUT_DIR = r'e:\EVFlow AI\data\processed'
PROCESSED_DATA_FILE = os.path.join(OUTPUT_DIR, 'processed_data.csv')
SCALER_FILE = os.path.join(OUTPUT_DIR, 'scaler.pkl')
ENCODER_FILE = os.path.join(OUTPUT_DIR, 'encoders.pkl')

def parse_duration_to_minutes(duration_str):
    """Parses hh:mm:ss string to minutes (float)."""
    if pd.isna(duration_str):
        return 0.0
    try:
        parts = str(duration_str).split(':')
        if len(parts) == 3:
            h, m, s = map(float, parts)
            return h * 60 + m + s / 60
        return 0.0
    except:
        return 0.0

def process_data():
    print("Loading data...", flush=True)
    df = pd.read_csv(INPUT_FILE)
    
    # 1. Data Cleaning & PII Removal
    print("Cleaning data...", flush=True)
    # Drop PII
    cols_to_drop = ['User ID', 'Driver Postal Code']
    existing_drop_cols = [c for c in cols_to_drop if c in df.columns]
    df.drop(columns=existing_drop_cols, inplace=True)
    
    # Drop rows with missing Energy
    df.dropna(subset=['Energy (kWh)'], inplace=True)
    
    # Parse Timestamps
    # 'Start Date', 'End Date' seem to contain both date and time based on previous view_file
    df['Start Date'] = pd.to_datetime(df['Start Date'], errors='coerce')
    df['End Date'] = pd.to_datetime(df['End Date'], errors='coerce')
    
    # Drop invalid timestamps
    df.dropna(subset=['Start Date', 'End Date'], inplace=True)
    
    # 2. Duration Conversion
    print("Converting durations...", flush=True)
    df['Total Duration (min)'] = df['Total Duration (hh:mm:ss)'].apply(parse_duration_to_minutes)
    df['Charging Time (min)'] = df['Charging Time (hh:mm:ss)'].apply(parse_duration_to_minutes)
    
    # 3. Port Availability Reconstruction & Energy Load Estimation
    print("Reconstructing port availability and energy load...", flush=True)
    
    # Calculate Total Ports per Station
    # Assuming Port Number is 1-based index, max port number ~ total ports
    station_capacity = df.groupby('Station Name')['Port Number'].max().fillna(1).astype(int)
    
    # Event-based simulation for efficiency
    # Events: (Timestamp, Station, PortChange, PowerChange)
    
    # Prepare Power (kW)
    # Energy (kWh) = Power (kW) * Time (h) -> Power = Energy / (Time_min / 60)
    # Avoid division by zero
    calc_time = df['Charging Time (min)'].replace(0, np.nan).fillna(df['Total Duration (min)'])
    calc_time = calc_time.replace(0, 15) # Fallback to 15 min if both are 0 to avoid inf
    
    df['Avg Power (kW)'] = df['Energy (kWh)'] / (calc_time / 60.0)
    df['Charging End Date'] = df['Start Date'] + pd.to_timedelta(calc_time, unit='m')
    
    # Normalize Charging End Date: It shouldn't exceed End Date by much, but theoretically could if "Charging" is logic time distinct from "Plugged In"
    # Actually "End Date" is usually plug out. Charging stops at "Charging End Date". Occupancy lasts until "End Date".
    
    # Create Events List
    # 1. Session Start: Occupancy +1, Load +Power
    starts = df[['Start Date', 'Station Name', 'Avg Power (kW)']].copy()
    starts.columns = ['timestamp', 'station', 'power_change']
    starts['port_change'] = 1
    
    # 2. Charging End: Load -Power (Occupancy unchanged)
    charges_end = df[['Charging End Date', 'Station Name', 'Avg Power (kW)']].copy()
    charges_end.columns = ['timestamp', 'station', 'power_change']
    charges_end['power_change'] = -charges_end['power_change']
    charges_end['port_change'] = 0
    
    # 3. Session End: Occupancy -1 (Load unchanged)
    ends = df[['End Date', 'Station Name']].copy()
    ends.columns = ['timestamp', 'station']
    ends['port_change'] = -1
    ends['power_change'] = 0
    
    # Combine
    all_events = pd.concat([starts, charges_end, ends], ignore_index=True)
    all_events.sort_values(by='timestamp', inplace=True)
    
    # Process per station
    processed_dfs = []
    
    unique_stations = df['Station Name'].unique()
    
    print(f"Processing {len(unique_stations)} stations...")
    
    for station in unique_stations:
        # Filter events for this station
        events = all_events[all_events['station'] == station].copy()
        
        # Cumulative Sum
        events['occupied_ports'] = events['port_change'].cumsum()
        events['current_load_kw'] = events['power_change'].cumsum()
        
        # Resample to 15-min grid
        # Create a complete grid from min to max
        if events.empty:
            continue
            
        start_grid = events['timestamp'].min().floor('15min')
        end_grid = events['timestamp'].max().ceil('15min')
        grid = pd.date_range(start_grid, end_grid, freq='15min', name='timestamp')
        
        # Set index to timestamp
        events.set_index('timestamp', inplace=True)
        
        # Handle duplicate timestamps (multiple events same time) -> take the last one as it reflects final state
        # But we need to use 'last' of the cumsum.
        # However, if we resample directly, we might miss events that happen between grid points?
        # No, 'asof' logic or 'step' logic is needed.
        # We want the state AT 10:00, 10:15.
        # events includes ALL changes.
        # duplicate index clearing:
        events = events[~events.index.duplicated(keep='last')]
        
        # Reindex to grid using 'ffill' (pad) to carry forward the state
        resampled = events[['occupied_ports', 'current_load_kw']].reindex(grid, method='ffill').fillna(0)
        
        # Constraints
        capacity = station_capacity.get(station, 1) # Default to 1 if missing?
        
        # Ensure non-negative and cap at capacity
        resampled['occupied_ports'] = resampled['occupied_ports'].clip(lower=0, upper=capacity)
        resampled['current_load_kw'] = resampled['current_load_kw'].clip(lower=0)
        
        resampled['Available Ports'] = capacity - resampled['occupied_ports']
        
        # Calculate Energy (kWh) for the 15-min interval
        # Power (kW) * 0.25 h
        resampled['Energy (kWh)'] = resampled['current_load_kw'] * 0.25
        
        resampled['Station Name'] = station
        
        processed_dfs.append(resampled)
        
    # combine
    if not processed_dfs:
        print("No data to process.")
        return

    full_df = pd.concat(processed_dfs).reset_index()
    
    # 4. Feature Engineering
    print("Engineering features...")
    full_df['Hour'] = full_df['timestamp'].dt.hour
    full_df['DayOfWeek'] = full_df['timestamp'].dt.dayofweek
    full_df['Month'] = full_df['timestamp'].dt.month
    full_df['IsWeekend'] = (full_df['DayOfWeek'] >= 5).astype(int)
    
    # Sort
    full_df.sort_values(by=['Station Name', 'timestamp'], inplace=True)
    
    # Historical Features (Rolling Mean of Energy)
    # Ensure usage of values strictly in the past is handled by window shifting or just rolling on current?
    # "3 previous intervals". 
    # rolling(3).mean() includes the current one by default unless closed='left' or we shift.
    # We want features for PREDICTION at time T using T-1, T-2, T-3.
    # So we compute rolling on T (representing consumption up to T) and then shift?
    # Actually, Energy at T is consumption during T. We usually know history up to T-1.
    # So we calculate rolling mean, then shift.
    
    full_df['Energy_Roll_3'] = full_df.groupby('Station Name')['Energy (kWh)'].transform(
        lambda x: x.shift(1).rolling(window=3).mean()
    )
    full_df['Energy_Roll_6'] = full_df.groupby('Station Name')['Energy (kWh)'].transform(
        lambda x: x.shift(1).rolling(window=6).mean()
    )
    
    # Fill NA for rolling (first few rows) with 0? Or drop. Prompt says "Drop rows with missing future values" later.
    full_df.fillna(0, inplace=True) # Assume 0 for initial
    
    # 5. Target Construction
    # Predict Future Energy (t+1) and Future Ports (t+1)
    full_df['future_energy'] = full_df.groupby('Station Name')['Energy (kWh)'].shift(-1)
    full_df['future_ports'] = full_df.groupby('Station Name')['Available Ports'].shift(-1)
    
    # Drop rows with NaNs in targets
    full_df.dropna(subset=['future_energy', 'future_ports'], inplace=True)
    
    # 6. Scaling & Encoding
    print("Scaling and encoding...")
    
    # Encode Station Name
    le = LabelEncoder()
    full_df['Station_ID_Encoded'] = le.fit_transform(full_df['Station Name'])
    
    # Scale Numerical Features
    # Features: Hour, DayOfWeek, Month, IsWeekend, Energy_Roll_3, Energy_Roll_6, Available Ports?
    # Usually we scale inputs.
    # Inputs: 'Available Ports', 'Energy (kWh)', 'Hour', 'DayOfWeek', 'Month', 'IsWeekend', 'Energy_Roll_3', 'Energy_Roll_6'
    
    cols_to_scale = [
        'Available Ports', 
        'Energy (kWh)', 
        'Energy_Roll_3', 
        'Energy_Roll_6', 
        'Hour', 'DayOfWeek', 'Month'
    ]
    
    scaler = MinMaxScaler()
    full_df[cols_to_scale] = scaler.fit_transform(full_df[cols_to_scale])
    
    # Save Artifacts
    print("Saving artifacts...")
    with open(SCALER_FILE, 'wb') as f:
        pickle.dump(scaler, f)
        
    with open(ENCODER_FILE, 'wb') as f:
        pickle.dump(le, f)
        
    # Save Data
    # Final Columns Selection
    final_cols = [
        'timestamp', 'Station Name', 'Station_ID_Encoded',
        'Available Ports', 'Energy (kWh)',
        'Hour', 'DayOfWeek', 'Month', 'IsWeekend',
        'Energy_Roll_3', 'Energy_Roll_6',
        'future_energy', 'future_ports'
    ]
    
    full_df = full_df[final_cols]
    full_df.to_csv(PROCESSED_DATA_FILE, index=False)
    
    print(f"Processing complete. Saved to {PROCESSED_DATA_FILE}")

if __name__ == "__main__":
    process_data()
