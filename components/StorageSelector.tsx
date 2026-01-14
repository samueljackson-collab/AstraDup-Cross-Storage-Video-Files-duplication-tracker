
import React from 'react';
import type { StorageSource } from '../types';

interface StorageSelectorProps {
  sources: StorageSource[];
  selected: Set<string>;
  onToggle: (sourceId: string) => void;
}

const StorageSelector: React.FC<StorageSelectorProps> = ({ sources, selected, onToggle }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {sources.map(source => {
        const isSelected = selected.has(source.id);
        return (
          <button
            key={source.id}
            onClick={() => onToggle(source.id)}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all duration-200 text-center
              ${isSelected ? 'bg-indigo-900/50 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'}
            `}
          >
            <source.icon className={`h-10 w-10 mb-3 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span className="text-sm font-medium">{source.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default StorageSelector;
