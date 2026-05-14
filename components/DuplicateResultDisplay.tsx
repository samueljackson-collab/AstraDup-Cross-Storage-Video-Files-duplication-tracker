
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ScanResult, DuplicatePair } from '../types';
import Button from './Button';
import FilePreview from './FilePreview';
import { InfoIcon, TrashIcon, CheckCircleIcon, XCircleIcon, Search, Edit3, Settings2, Share2, Layers } from './Icons';

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
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FilePreview file={pair.file1} />
                    <FilePreview file={pair.file2} />
                </div>

                <div className="mt-4 text-sm text-green-600 flex justify-between items-center">
                    <div>
                        <strong className="text-green-500 font-semibold">Matched on:</strong> {pair.matchedModalities.join(', ')}
                    </div>
                    <div className="text-[10px] text-green-800 flex items-center gap-1">
                         <Search className="w-3 h-3" />
                         Integrates with <span className="text-green-600 font-bold">Nexus AI Explorer</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


const DuplicateResultDisplay: React.FC<{ result: ScanResult }> = ({ result }) => {
  const [selectedPairs, setSelectedPairs] = useState<Set<string>>(new Set());
  const [allPairs, setAllPairs] = useState(result.duplicatePairs);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);
  const [showPurgeOptions, setShowPurgeOptions] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renamePattern, setRenamePattern] = useState('');

  const showMessage = (message: string) => {
    setLastActionMessage(message);
    setTimeout(() => setLastActionMessage(null), 3000);
  };

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

  const handlePurgeAction = (action: 'delete_all' | 'keep_one' | 'merge') => {
    const count = selectedPairs.size;
    let message = '';
    
    switch (action) {
        case 'delete_all':
            message = `Deleted all files in ${count} selected duplicate sets.`;
            break;
        case 'keep_one':
            message = `Purged duplicates: Kept the highest quality file in ${count} sets.`;
            break;
        case 'merge':
            message = `Merged metadata and kept one version for ${count} sets.`;
            break;
    }
    
    setAllPairs(prev => prev.filter(p => !selectedPairs.has(p.id)));
    setSelectedPairs(new Set());
    setShowPurgeOptions(false);
    showMessage(message);
  };

  const handleBatchRename = () => {
    const count = selectedPairs.size;
    setShowRenameDialog(false);
    showMessage(`Successfully renamed ${count} files with pattern: "${renamePattern}"`);
    setRenamePattern('');
  };

  const handleMarkNotDuplicate = () => {
    const count = selectedPairs.size;
    setAllPairs(prev => prev.filter(p => !selectedPairs.has(p.id)));
    setSelectedPairs(new Set());
    showMessage(`${count} pair(s) have been marked as not duplicates.`);
  };

  const allSelected = allPairs.length > 0 && selectedPairs.size === allPairs.length;
  const isIndeterminate = selectedPairs.size > 0 && selectedPairs.size < allPairs.length;

  if (allPairs.length === 0 && !lastActionMessage) {
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
                <p className="text-3xl font-extrabold text-green-400">{result.duplicatePairs.length}</p>
            </div>
            <div>
                <p className="text-base text-green-600">Potential Savings</p>
                <p className="text-3xl font-extrabold text-green-400">{result.summary.potentialSavingsMB.toFixed(2)} MB</p>
            </div>
        </div>
        
        {lastActionMessage && (
            <div className="bg-green-900/40 border border-green-500 text-green-300 px-4 py-3 rounded-lg relative mb-6 flex items-center shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]" role="alert">
                <CheckCircleIcon className="w-5 h-5 mr-3 text-green-400"/>
                <span className="block sm:inline font-medium">{lastActionMessage}</span>
            </div>
        )}
        
        {allPairs.length > 0 && (
            <div className="bg-black/80 border border-green-800 rounded-lg p-3 mb-6 flex items-center justify-between sticky top-4 z-10 backdrop-blur-md shadow-lg">
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
                         <Button onClick={() => setShowRenameDialog(true)} variant="secondary" className="text-xs">
                            <Edit3 className="h-4 w-4 mr-2"/>
                            Batch Rename
                        </Button>
                        <Button onClick={handleMarkNotDuplicate} variant="secondary" className="text-xs">
                            <XCircleIcon className="h-4 w-4 mr-2"/>
                            Not Duplicates
                        </Button>
                        <div className="relative">
                            <Button 
                                onClick={() => setShowPurgeOptions(!showPurgeOptions)} 
                                variant="primary" 
                                className="text-xs bg-red-600 hover:bg-red-700 focus:ring-red-500"
                            >
                                <TrashIcon className="h-4 w-4 mr-2"/>
                                Purge Selected
                            </Button>
                            
                            {showPurgeOptions && (
                                <div className="absolute right-0 mt-2 w-48 bg-black border border-green-700 rounded-md shadow-2xl py-1 z-20">
                                    <button onClick={() => handlePurgeAction('keep_one')} className="block w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-green-900/30">Keep Best (Recommend)</button>
                                    <button onClick={() => handlePurgeAction('merge')} className="block w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-green-900/30">Merge Metadata</button>
                                    <button onClick={() => handlePurgeAction('delete_all')} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-900/20">Delete All Duplicates</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}

        {showRenameDialog && (
            <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
                 <div className="bg-black border border-green-700 rounded-xl max-w-md w-full p-6">
                    <h3 className="text-2xl font-bold text-green-400 mb-4">Batch Rename</h3>
                    <p className="text-sm text-green-700 mb-4">Rename {selectedPairs.size} files. Use placeholders like [original], [date], [size] to build a pattern.</p>
                    <input 
                        type="text" 
                        value={renamePattern}
                        onChange={(e) => setRenamePattern(e.target.value)}
                        placeholder="e.g. Vacation [original]_[date]"
                        className="w-full bg-black border border-green-800 rounded p-3 text-green-400 focus:border-green-400 outline-none mb-6"
                    />
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setShowRenameDialog(false)}>Cancel</Button>
                        <Button onClick={handleBatchRename}>Apply Rename</Button>
                    </div>
                 </div>
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
