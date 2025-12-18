import React from 'react';
import { Users, Zap, BatteryCharging, Car, Building2, BarChart2 } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'dashboard', label: 'Overview', icon: BarChart2, group: 'Main' },
        { id: 'grid', label: 'Grid Operator', icon: Zap, group: 'Stakeholders' },
        { id: 'charging', label: 'Charging Operator', icon: BatteryCharging, group: 'Stakeholders' },
        { id: 'driver', label: 'EV Driver', icon: Car, group: 'Stakeholders' },
        { id: 'urban', label: 'Urban Planner', icon: Building2, group: 'Stakeholders' },
    ];

    return (
        <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50 shadow-sm">
            {/* Logo Area */}
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">
                    EV-Flow AI
                </h1>
                <p className="text-xs text-gray-500 mt-1 font-medium tracking-wide">INTELLIGENT FORECASTING</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {/* Optional: We could group them if we wanted, but flat for now is fine given the small number */}

                <div className="mb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Dashboards
                </div>

                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                                ${isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }
                            `}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Footer / User Profile placeholder */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        JD
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">John Doe</p>
                        <p className="text-xs text-gray-500">Admin</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
