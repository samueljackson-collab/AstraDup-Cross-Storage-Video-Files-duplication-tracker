
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ScanResult, DuplicatePair } from '../types';
import Button from './Button';
import FilePreview from './FilePreview';
import { TrashIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import { useToast } from './Toast';

const DuplicatePairCard: React.FC<{ pair: DuplicatePair, isSelected: boolean, onSelect: () => void; }> = ({ pair, isSelected, onSelect }) => {
    const scoreColor = 'text-green-400';
    
    return (
        <div 
            className={`bg-black border rounded-lg p-4 transition-colors duration-200 flex items-start space-x-4 ${isSelected ? 'border-green-500' : 'border-green-800'}`}
        >
            <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="h-5 w-5 rounded bg-black border-green-700 text-green-500 focus:ring-2 focus:ring-offset-0 focus:ring-green-500 ring-offset-black mt-1"
                aria-label={`Select pair ${pair.id}`}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-extrabold text-xl text-green-400 capitalize">Duplicate {pair.file1.fileType} Pair Found</h3>
                        <div className="flex items-center mt-1">
                            <span className={`font-mono text-2xl font-extrabold ${scoreColor}`}>{pair.similarityScore}%</span>
                            <span className="ml-2 text-base text-green-600">Similarity</span>
                        </div>
                    </div>
                     <div className="flex space-x-2">
                         <Link to={`/compare/${pair.file1.id}/${pair.file2.id}`} onClick={e => e.stopPropagation()}>
                            <Button className="text-xs">Compare</Button>
                         </Link>
                        <Button variant="secondary" className="text-xs" onClick={e => e.stopPropagation()}><TrashIcon className="h-4 w-4 mr-2" /> Delete Lower Quality</Button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FilePreview file={pair.file1} />
                    <FilePreview file={pair.file2} />
                </div>

                <div className="mt-4 text-sm text-green-600">
                    <strong className="text-green-500 font-semibold">Matched on:</strong> {pair.matchedModalities.join(', ')}
                </div>
            </div>
        </div>
    );
};


const DuplicateResultDisplay: React.FC<{ result: ScanResult }> = ({ result }) => {
  const { showToast } = useToast();
  const [selectedPairs, setSelectedPairs] = useState<Set<string>>(new Set());
  const [allPairs, setAllPairs] = useState(result.duplicatePairs);

  const handleTogglePair = (pairId: string) => {
    setSelectedPairs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pairId)) {
        newSet.delete(pairId);
      } else {
        newSet.add(pairId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPairs(new Set(allPairs.map(p => p.id)));
    } else {
      setSelectedPairs(new Set());
    }
  };

  const handleDeleteSelected = () => {
    const count = selectedPairs.size;
    setAllPairs(prev => prev.filter(p => !selectedPairs.has(p.id)));
    setSelectedPairs(new Set());
    showToast(`${count} pairs have been marked for deletion.`, 'success');
  };

  const handleMarkNotDuplicate = () => {
    const count = selectedPairs.size;
    setAllPairs(prev => prev.filter(p => !selectedPairs.has(p.id)));
    setSelectedPairs(new Set());
    showToast(`${count} pairs have been marked as not duplicates.`, 'info');
  };

  const allSelected = allPairs.length > 0 && selectedPairs.size === allPairs.length;
  const isIndeterminate = selectedPairs.size > 0 && selectedPairs.size < allPairs.length;

  if (allPairs.length === 0) {
    return (
      <div className="text-center bg-black border border-green-800 rounded-lg p-12">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-extrabold text-green-400">No Duplicates Found!</h2>
        <p className="text-green-600 mt-2 capitalize text-lg">Your {result.scanType} library is clean. Great job!</p>
      </div>
    );
  }

  return (
    <div>
        <div className="bg-black border border-green-800 rounded-lg p-4 mb-6 flex justify-around text-center">
            <div>
                <p className="text-base text-green-600 capitalize">Total {result.scanType}s Scanned</p>
                <p className="text-3xl font-extrabold text-green-400">{result.summary.totalFiles}</p>
            </div>
            <div>
                <p className="text-base text-green-600">Duplicate Pairs Found</p>
                <p className="text-3xl font-extrabold text-green-400">{allPairs.length}</p>
            </div>
            <div>
                <p className="text-base text-green-600">Potential Savings</p>
                <p className="text-3xl font-extrabold text-green-400">{result.summary.potentialSavingsMB.toFixed(2)} MB</p>
            </div>
        </div>
        
        {allPairs.length > 0 && (
            <div className="bg-black/50 border border-green-800 rounded-lg p-3 mb-6 flex items-center justify-between sticky top-4 z-10 backdrop-blur-sm">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => {
                          if (el) {
                            el.indeterminate = isIndeterminate;
                          }
                        }}
                        onChange={handleSelectAll}
                        className="h-5 w-5 rounded bg-black border-green-700 text-green-500 focus:ring-2 focus:ring-offset-0 focus:ring-green-500 ring-offset-black/50"
                        aria-label="Select all pairs"
                    />
                    <span className="ml-3 text-base font-semibold text-green-400">
                        {selectedPairs.size > 0 ? `${selectedPairs.size} of ${allPairs.length} selected` : 'Select All'}
                    </span>
                </div>
                {selectedPairs.size > 0 && (
                    <div className="flex items-center space-x-3">
                        <Button onClick={handleMarkNotDuplicate} variant="secondary" className="text-xs">
                            <XCircleIcon className="h-4 w-4 mr-2"/>
                            Mark as Not Duplicate
                        </Button>
                        <Button onClick={handleDeleteSelected} variant="primary" className="text-xs bg-red-600 hover:bg-red-700 focus:ring-red-500">
                             <TrashIcon className="h-4 w-4 mr-2"/>
                            Delete Selected
                        </Button>
                    </div>
                )}
            </div>
        )}

        <div className="space-y-6">
            {allPairs.map(pair => (
                <DuplicatePairCard 
                    key={pair.id} 
                    pair={pair} 
                    isSelected={selectedPairs.has(pair.id)}
                    onSelect={() => handleTogglePair(pair.id)}
                />
            ))}
        </div>
    </div>
  );
};

export default DuplicateResultDisplay;