import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target } from 'lucide-react';

export default function FeatureImportance({ shapValues, featureNames }) {
    // shapValues is array of importance (absolute mean?) or just raw values for the sample.
    // We'll show absolute magnitude.
    if (!shapValues || !featureNames) return null;

    // Flatten if needed or sum over time?
    // SHAP for sequence: (48, 8). We can average over time to get global importance for this sample.
    // shapValues is flat list of 48*8? Or structured? 
    // It came from `values.tolist()`.
    // Let's assume it's (48, 8). We average across axis 0.

    // Wait, `shapValues` from backend is `list`.
    // If shape is [48, 8], we need to aggregate.

    // Safe aggregation
    const getImportance = () => {
        try {
            if (!Array.isArray(shapValues) || shapValues.length === 0) return [];
            const numFeats = shapValues[0].length;
            const importance = new Array(numFeats).fill(0);

            shapValues.forEach(row => {
                row.forEach((val, idx) => {
                    importance[idx] += Math.abs(val);
                });
            });

            return importance.map((val, idx) => ({
                name: featureNames[idx] || `Feat ${idx}`,
                value: val / shapValues.length // Average
            })).sort((a, b) => b.value - a.value);
        } catch (e) {
            return [];
        }
    };

    const data = getImportance();

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-2">
            <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-800">Explainability (SHAP Importance)</h3>
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                        <YAxis hide />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`hsl(${260 + index * 10}, 70%, 60%)`} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
