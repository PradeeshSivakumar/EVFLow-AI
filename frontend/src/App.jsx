import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, RefreshCw, BatteryCharging } from 'lucide-react';
import Sidebar from './components/Sidebar';
import EnergyChart from './components/EnergyChart';
import PortsChart from './components/PortsChart';
import FeatureImportance from './components/FeatureImportance';
import StakeholderSection from './components/StakeholderSection';

const API_URL = 'http://localhost:8000';

function App() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [prediction, setPrediction] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [inputData, setInputData] = useState(null);
    const [health, setHealth] = useState('Checking...');

    useEffect(() => {
        checkHealth();
        runDemo();
    }, []);

    const checkHealth = async () => {
        try {
            const res = await axios.get(`${API_URL}/health`);
            setHealth(res.data.status);
        } catch (e) {
            setHealth('offline');
        }
    };

    const runDemo = async () => {
        setLoading(true);
        try {
            // 1. Get Sample Data
            const sampleRes = await axios.get(`${API_URL}/sample`);
            const features = sampleRes.data.features;
            setInputData(features);

            // 2. Predict
            const predRes = await axios.post(`${API_URL}/predict`, { features });
            setPrediction(predRes.data);

            // 3. Explain
            const explainRes = await axios.post(`${API_URL}/explain`, { features });
            setExplanation(explainRes.data);

        } catch (e) {
            console.error("Error running demo:", e);
        } finally {
            setLoading(false);
        }
    };

    // Process input data for chart (Energy sequence column 1)
    const getEnergyHistory = () => {
        if (!inputData) return [];
        return inputData.map((row, i) => ({
            index: i,
            value: row[1] // Energy is index 1
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="flex-1 flex flex-col pl-64 transition-all duration-300">
                <header className="px-8 py-6 mb-2 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {activeTab === 'dashboard' ? 'Overview' :
                                activeTab === 'grid' ? 'Grid Operator View' :
                                    activeTab === 'charging' ? 'Charging Operator View' :
                                        activeTab === 'driver' ? 'EV Driver View' :
                                            'Urban Planner View'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            {activeTab === 'dashboard' ? 'Real-time monitoring and forecasting' : 'Stakeholder specific insights and controls'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm text-sm">
                            <span className={`w-2 h-2 rounded-full ${health === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="capitalize">{health}</span>
                        </div>
                        <button
                            onClick={runDemo}
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Run Prediction
                        </button>
                    </div>
                </header>

                <main className="flex-1 px-8 pb-8">
                    {activeTab === 'dashboard' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                            {/* Prediction Cards */}
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg ring-1 ring-blue-400/50">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm font-medium mb-1">Forecasted Energy (t+1)</p>
                                        <h2 className="text-4xl font-bold">
                                            {prediction ? prediction.predicted_energy.toFixed(2) : '-.--'}
                                            <span className="text-xl ml-1 font-normal opacity-80">kWh</span>
                                        </h2>
                                    </div>
                                    <BatteryCharging className="w-8 h-8 opacity-80" />
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium mb-1">Available Ports (Predicted)</p>
                                    <h2 className="text-4xl font-bold text-gray-800">
                                        {prediction ? prediction.predicted_ports_class : '-'}
                                        <span className="text-xl ml-1 font-normal text-gray-400">Slots</span>
                                    </h2>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                                    <div
                                        className="bg-green-500 h-full transition-all duration-500"
                                        style={{ width: prediction ? `${(prediction.predicted_ports_class / 5) * 100}%` : '0%' }}
                                    ></div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                                <div className="text-center">
                                    <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">System Ready</p>
                                    <p className="text-xs text-gray-300 mt-1">v1.0.0 Production</p>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="lg:col-span-2">
                                <EnergyChart data={getEnergyHistory()} />
                            </div>
                            <div>
                                <PortsChart probs={prediction ? prediction.predicted_ports_probs : []} />
                            </div>

                            {/* Feature Importance - Moved to dashboard view as summary */}
                            <div className="lg:col-span-3">
                                <FeatureImportance
                                    shapValues={explanation?.shap_values}
                                    featureNames={explanation?.feature_names}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <StakeholderSection activeTab={activeTab} prediction={prediction} />
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default App
