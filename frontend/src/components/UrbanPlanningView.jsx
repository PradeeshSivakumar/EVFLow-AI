import React from 'react';
import { Building2, BarChart3, PieChart } from 'lucide-react';

const UrbanPlanningView = () => {
    return (
        <div className="space-y-6 opacity-60 pointer-events-none select-none relative">
            <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="bg-yellow-100/90 text-yellow-800 px-4 py-2 rounded-full backdrop-blur-sm border border-yellow-200 shadow-sm text-sm font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Feature Under Development
                </div>
            </div>

            <div className="flex items-center justify-between blur-[1px]">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Urban Planning View</h3>
                    <p className="text-sm text-gray-500">Long-term infrastructure analysis</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium border border-yellow-200">
                    Under Development
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 blur-[1px]">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <BarChart3 className="w-8 h-8 text-indigo-500 mb-3" />
                    <p className="text-xs text-gray-500 uppercase font-semibold">Demand Trend</p>
                    <p className="text-lg font-bold text-gray-900">+15% YoY</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <PieChart className="w-8 h-8 text-teal-500 mb-3" />
                    <p className="text-xs text-gray-500 uppercase font-semibold">Green Coverage</p>
                    <p className="text-lg font-bold text-gray-900">42%</p>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 blur-[1px]">
                <p className="text-xs text-gray-500 text-center">
                    This module supports long-term infrastructure planning and smart-city policy decisions.
                </p>
            </div>
        </div>
    );
};

export default UrbanPlanningView;
