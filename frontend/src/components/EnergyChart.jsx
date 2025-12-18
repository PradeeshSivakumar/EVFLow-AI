import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap } from 'lucide-react';

export default function EnergyChart({ data }) {
    // data is array of {time, energy}
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-800">Energy Demand Forecast</h3>
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="index" hide />
                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#eab308"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
