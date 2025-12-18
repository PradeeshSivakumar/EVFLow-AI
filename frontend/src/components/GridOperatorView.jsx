import React from 'react';
import { Zap, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

const GridOperatorView = ({ prediction }) => {
    // Derived state for demo purposes
    const loadStatus = prediction?.predicted_energy > 80 ? 'High' : (prediction?.predicted_energy > 50 ? 'Medium' : 'Low');
    const isHighLoad = loadStatus === 'High';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Grid Operator View</h3>
                    <p className="text-sm text-gray-500">Real-time demand forecasting & stability monitoring</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    Active
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="w-16 h-16 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Forecasted Demand (Next Interval)</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                            {prediction ? prediction.predicted_energy.toFixed(2) : '-.--'}
                        </span>
                        <span className="text-sm text-gray-500">kWh</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-colors">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-16 h-16 text-amber-600" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Grid Load Status</p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`text-2xl font-bold ${isHighLoad ? 'text-red-600' : 'text-green-600'}`}>
                            {loadStatus}
                        </span>
                        {isHighLoad ? (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        ) : (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                    </div>
                </div>
            </div>

            <div className={`p-4 rounded-lg border flex items-start gap-3 ${isHighLoad ? 'bg-red-50 border-red-100 text-red-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                {isHighLoad ? <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> : <Activity className="w-5 h-5 shrink-0 mt-0.5" />}
                <div>
                    <h4 className="font-medium text-sm">System Insight</h4>
                    <p className="text-sm mt-1 opacity-90">
                        {isHighLoad
                            ? "Upcoming demand spike detected. Prepare for load balancing measures."
                            : "Grid load is within safe operational limits. No immediate action required."}
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recommended Actions</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                        {isHighLoad ? <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>}
                        {isHighLoad ? "Initiate demand-response protocols" : "Monitor baseline stability"}
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        Optimize distribution for Sector 4
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default GridOperatorView;
