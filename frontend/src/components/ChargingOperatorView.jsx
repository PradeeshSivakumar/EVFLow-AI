import React, { useState } from 'react';
import { BatteryCharging, Clock, AlertCircle, TrendingUp, DollarSign, Zap, CheckCircle } from 'lucide-react';

const ChargingOperatorView = ({ prediction }) => {
    // State for interactive elements
    const [dynamicPricing, setDynamicPricing] = useState(false);

    // Derived metrics
    const availablePorts = prediction?.predicted_ports_class || 0;
    const utilizationRate = prediction ? ((5 - availablePorts) / 5) * 100 : 0;
    const isCongested = availablePorts < 2;

    // Revenue simulation
    const baseRate = 0.35; // $ per kWh
    const surgeMultiplier = dynamicPricing && isCongested ? 1.5 : 1.0;
    const predictedEnergy = prediction?.predicted_energy || 0;
    const estimatedRevenue = predictedEnergy * baseRate * surgeMultiplier;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Charging Operations Center</h3>
                    <p className="text-sm text-gray-500">Real-time asset utilization & financial projections</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-2 ${isCongested
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${isCongested ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                        {isCongested ? 'High Demand' : 'Optimal Flow'}
                    </span>
                </div>
            </div>

            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Available Ports Card */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BatteryCharging className="w-20 h-20 text-blue-600" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Available Ports</p>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-gray-900">{availablePorts}</span>
                            <span className="text-sm text-gray-400 font-medium">/ 5 Total</span>
                        </div>
                        <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${(availablePorts / 5) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Revenue Card */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="w-20 h-20 text-green-600" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Projected Revenue (1h)</p>
                        <div className="mt-3 flex items-baseline gap-1">
                            <span className="text-2xl font-semibold text-gray-400">$</span>
                            <span className="text-4xl font-bold text-gray-900">{estimatedRevenue.toFixed(2)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-1 rounded-md">
                            <TrendingUp className="w-3 h-3" />
                            <span>+12.5% vs avg</span>
                        </div>
                    </div>
                </div>

                {/* Utilization Card */}
                <div className={`p-5 rounded-xl border shadow-sm relative overflow-hidden transition-all duration-300 ${isCongested ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'
                    }`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap className={`w-20 h-20 ${isCongested ? 'text-amber-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Util. Rate</p>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className={`text-4xl font-bold ${isCongested ? 'text-amber-700' : 'text-gray-900'}`}>
                                {utilizationRate.toFixed(0)}%
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            {isCongested
                                ? 'Warning: Station neering capacity limit.'
                                : 'Station operating within optimal parameters.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Control Panel Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-gray-400" />
                        Smart Grid Controls
                    </h4>
                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded border border-blue-100">
                        Auto-Pilot Active
                    </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Dynamic Pricing Control */}
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-gray-900">Dynamic Pricing</h5>
                                {dynamicPricing && <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded font-medium">ON</span>}
                            </div>
                            <p className="text-sm text-gray-500">Automatically adjust rates during high congestion periods to manage demand.</p>
                        </div>
                        <button
                            onClick={() => setDynamicPricing(!dynamicPricing)}
                            className={`
                                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                ${dynamicPricing ? 'bg-blue-600' : 'bg-gray-200'}
                            `}
                        >
                            <span className={`
                                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                ${dynamicPricing ? 'translate-x-5' : 'translate-x-0'}
                            `} />
                        </button>
                    </div>

                    {/* Load Shedding Status (Read Only) */}
                    <div className="flex items-start justify-between opacity-75">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-gray-900">Load Balancing</h5>
                                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 rounded font-medium">AUTO</span>
                            </div>
                            <p className="text-sm text-gray-500">Grid power limits are currently respected. No active restrictions.</p>
                        </div>
                        <div className="p-2 bg-green-50 rounded-full text-green-600">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert / Insight Banner */}
            <div className={`p-4 rounded-lg flex items-start gap-4 ${isCongested
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'bg-blue-50 text-blue-900 border border-blue-200'
                }`}>
                {isCongested
                    ? <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    : <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                }
                <div>
                    <h5 className="font-semibold text-sm mb-1">
                        {isCongested ? "Congestion Alert" : "Efficiency Insight"}
                    </h5>
                    <p className={`text-sm opacity-90 ${isCongested ? 'text-amber-800' : 'text-blue-800'}`}>
                        {isCongested
                            ? "Utilization is nearing 100%. Dynamic pricing is recommended to smooth the peak demand."
                            : "System is operating efficiently. Predicted energy output is within standard deviation."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChargingOperatorView;
