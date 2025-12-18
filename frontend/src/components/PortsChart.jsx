import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plug } from 'lucide-react';

export default function PortsChart({ probs }) {
    // probs: array of probabilities [p0, p1, p2...]
    const data = probs.map((p, i) => ({
        ports: `${i} Ports`,
        probability: (p * 100).toFixed(1)
    }));

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
                <Plug className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-800">Availability Probability</h3>
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="ports" type="category" width={60} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="probability" radius={[0, 4, 4, 0]} barSize={20}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#22c55e'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
