
import React from 'react';
import type { StorageSource } from '../types';
import Button from './Button';
import { LinkIcon, CheckCircleIcon } from './Icons';
import Spinner from './Spinner';

interface StorageSelectorProps {
  sources: StorageSource[];
  cloudSourceTypes: Array<StorageSource['type']>;
  selected: Set<string>;
  connected: Set<string>;
  connectingId: string | null;
  onToggle: (sourceId: string) => void;
  onConnect: (sourceId: string) => void;
}

const StorageSelector: React.FC<StorageSelectorProps> = ({ sources, cloudSourceTypes, selected, connected, connectingId, onToggle, onConnect }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {sources.map(source => {
        const isSelected = selected.has(source.id);
        const isCloud = cloudSourceTypes.includes(source.type);
        const isConnected = connected.has(source.id);
        const isConnecting = connectingId === source.id;

        const handleClick = () => {
            if (isCloud && !isConnected) {
                // Cloud sources must be connected first, do nothing on main card click
                return;
            }
            onToggle(source.id);
        };

        return (
          <div
            key={source.id}
            onClick={handleClick}
            className={`relative flex flex-col items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 text-center h-40
              ${isSelected ? 'bg-green-900/50 border-green-500 text-green-300 shadow-lg shadow-green-900/50' : 'bg-black border-green-800 text-green-600 hover:border-green-600 hover:text-green-400'}
              ${(isCloud && !isConnected) ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            {isConnected && (
                 <div className="absolute top-2 right-2 flex items-center bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded-full">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    Connected
                 </div>
            )}
            <div className="flex flex-col items-center justify-center flex-grow">
                <source.icon className={`h-10 w-10 mb-2 transition-colors ${isSelected ? 'text-green-400' : 'text-green-700'}`} />
                <span className="text-base font-semibold">{source.name}</span>
            </div>

            {isCloud && !isConnected && (
                <Button
                    variant="secondary"
                    className="w-full text-xs"
                    onClick={() => onConnect(source.id)}
                    disabled={isConnecting}
                >
                    {isConnecting ? <Spinner /> : <LinkIcon className="h-4 w-4 mr-2" />}
                    {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StorageSelector;