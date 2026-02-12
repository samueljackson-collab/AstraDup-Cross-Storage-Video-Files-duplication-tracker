
import React from 'react';

export const DetailItem: React.FC<{ label: string; value: React.ReactNode; mono?: boolean, highlight?: boolean }> = ({ label, value, mono, highlight }) => (
    <div>
      <dt className={`text-base font-semibold ${highlight ? 'text-green-500' : 'text-green-600'}`}>{label}</dt>
      <dd className={`mt-1 text-base break-words ${mono ? 'font-mono' : ''} ${highlight ? 'text-green-300 bg-green-900/50 p-1 rounded' : 'text-green-400'}`}>{value}</dd>
    </div>
);

export const AnalysisItem: React.FC<{ label: string; value?: string | number | React.ReactNode; confidence: number; mono?: boolean }> = ({ label, value, confidence, mono }) => {
    const getConfidenceColors = (score: number) => {
        if (score >= 95) return { text: 'text-green-400', bg: 'bg-green-500' };
        if (score >= 80) return { text: 'text-yellow-400', bg: 'bg-yellow-500' };
        return { text: 'text-orange-400', bg: 'bg-orange-500' };
    };
    const { text: textColor, bg: bgColor } = getConfidenceColors(confidence);

    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <dt className="text-base font-semibold text-green-600">{label}</dt>
                <dd className={`text-2xl font-extrabold ${textColor}`}>{confidence}%</dd>
            </div>
            {value != null && (
                 <div className={`text-sm text-green-500 truncate mb-2 ${mono ? 'font-mono' : ''}`} title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}>
                    {value}
                 </div>
            )}
            <div className="w-full bg-green-900 rounded-full h-1.5" title={`${confidence}% confidence`}>
                <div className={`${bgColor} h-1.5 rounded-full`} style={{ width: `${confidence}%` }}></div>
            </div>
        </div>
    );
};
