import React from 'react';

const AnalysisItem: React.FC<{ label: string; value?: string | number | React.ReactNode; confidence: number; mono?: boolean }> = ({ label, value, confidence, mono }) => {
    const getConfidenceColors = (score: number) => {
        if (score >= 95) return { text: 'text-green-400', bg: 'bg-green-500' };
        if (score >= 80) return { text: 'text-yellow-400', bg: 'bg-yellow-500' };
        return { text: 'text-orange-400', bg: 'bg-orange-500' };
    };
    const { text: textColor, bg: bgColor } = getConfidenceColors(confidence);

    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <dt className="text-sm font-semibold text-green-600">{label}</dt>
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

export default AnalysisItem;
