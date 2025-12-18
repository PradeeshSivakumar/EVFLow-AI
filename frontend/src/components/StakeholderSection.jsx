import React, { useState } from 'react';
import { Users, Zap, BatteryCharging, Car, Building2 } from 'lucide-react';
import GridOperatorView from './GridOperatorView';
import ChargingOperatorView from './ChargingOperatorView';
import EVDriverView from './EVDriverView';
import UrbanPlanningView from './UrbanPlanningView';

const StakeholderSection = ({ activeTab, prediction }) => {

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header removed as it is now in Sidebar */}


            <div className="p-6">
                {activeTab === 'grid' && <GridOperatorView prediction={prediction} />}
                {activeTab === 'charging' && <ChargingOperatorView prediction={prediction} />}
                {activeTab === 'driver' && <EVDriverView />}
                {activeTab === 'urban' && <UrbanPlanningView />}
            </div>
        </div>
    );
};

export default StakeholderSection;
