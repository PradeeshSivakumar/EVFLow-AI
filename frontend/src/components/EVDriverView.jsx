import React from 'react';
import { Car, MapPin, Clock, Search } from 'lucide-react';

const EVDriverView = () => {
    return (
        <div className="space-y-6 opacity-60 pointer-events-none select-none relative">
            <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="bg-yellow-100/90 text-yellow-800 px-4 py-2 rounded-full backdrop-blur-sm border border-yellow-200 shadow-sm text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Feature Under Development
                </div>
            </div>

            <div className="flex items-center justify-between blur-[1px]">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">EV Driver View</h3>
                    <p className="text-sm text-gray-500">Trip planning & charging availability</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium border border-yellow-200">
                    Under Development
                </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm blur-[1px]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Car className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Nearest Station</p>
                            <p className="text-xs text-gray-500">2.4 miles away</p>
                        </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-blue-600">
                        <MapPin className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Wait Time</span>
                        <span className="font-medium text-green-600">~5 mins</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Available Plugs</span>
                        <span className="font-medium text-gray-900">3 x CCS2</span>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 blur-[1px]">
                <p className="text-xs text-gray-500 text-center">
                    This view will be integrated into mobile apps and vehicle dashboards in future versions.
                </p>
            </div>
        </div>
    );
};

export default EVDriverView;
