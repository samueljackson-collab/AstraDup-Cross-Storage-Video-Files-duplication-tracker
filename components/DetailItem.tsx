import React from 'react';

const DetailItem: React.FC<{ label: string; value: React.ReactNode; mono?: boolean; highlight?: boolean }> = ({ label, value, mono, highlight }) => (
  <div>
    <dt className="text-sm font-semibold text-green-600">{label}</dt>
    <dd className={`mt-1 text-sm break-words ${mono ? 'font-mono' : ''} ${highlight ? 'text-green-300 bg-green-900/50 p-1 rounded' : 'text-green-400'}`}>{value}</dd>
  </div>
);

export default DetailItem;
