
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ScanResult, DuplicatePair, AnyFile } from '../types';
import Button from './Button';
import { InfoIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import { FilmIcon, PhotoIcon, DocumentTextIcon } from './FileTypeIcons';

const FileCard: React.FC<{ file: AnyFile }> = ({ file }) => {
    const FileTypeIcon = {
        video: FilmIcon,
        image: PhotoIcon,
        document: DocumentTextIcon,
    }[file.fileType];

    return (
        <div className="bg-slate-900 p-4 rounded-lg flex-1">
            <div className="relative">
                <img src={file.thumbnailUrl} alt={file.name} className="w-full aspect-video object-cover rounded-md mb-3 bg-slate-800" />
                <div className="absolute top-2 right-2 bg-slate-950/50 p-1 rounded-full">
                    <FileTypeIcon className="h-4 w-4 text-white" />
                </div>
            </div>
            <h4 className="font-semibold text-white truncate text-sm">{file.name}</h4>
            <p className="text-xs text-slate-400 font-mono truncate">{file.path}</p>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
                {file.fileType === 'video' && <span>{file.resolution}</span>}
                {file.fileType === 'image' && <span>{file.resolution}</span>}
                {file.fileType === 'document' && <span>{file.pageCount} pages</span>}
                <span>{file.sizeMB} MB</span>
                {file.fileType === 'video' && <span>{file.duration}</span>}
            </div>
            <Link to={`/file/${file.id}`}>
                 <Button variant="secondary" className="w-full mt-3 text-xs py-1">
                    <InfoIcon className="h-3 w-3 mr-2"/>
                    Details
                 </Button>
            </Link>
        </div>
    );
};

const DuplicatePairCard: React.FC<{ pair: DuplicatePair, isSelected: boolean, onSelect: () => void; }> = ({ pair, isSelected, onSelect }) => {
    const scoreColor = pair.similarityScore > 95 ? 'text-green-400' : pair.similarityScore > 85 ? 'text-yellow-400' : 'text-orange-400';
    
    return (
        <div 
            className={`bg-slate-950 border rounded-lg p-4 transition-colors duration-200 flex items-start space-x-4 cursor-pointer ${isSelected ? 'border-indigo-500' : 'border-slate-800'}`}
            onClick={onSelect}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
        >
            <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                onClick={(e) => e.stopPropagation()}
                className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500 ring-offset-slate-950 mt-1"
                aria-label={`Select pair ${pair.id}`}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-bold text-lg text-white capitalize">Duplicate {pair.file1.fileType} Pair Found</h3>
                        <div className="flex items-center mt-1">
                            <span className={`font-mono text-xl font-bold ${scoreColor}`}>{pair.similarityScore}%</span>
                            <span className="ml-2 text-sm text-slate-400">Similarity</span>
                        </div>
                    </div>
                     <div className="flex space-x-2">
                         <Link to={`/compare/${pair.file1.id}/${pair.file2.id}`} onClick={e => e.stopPropagation()}>
                            <Button className="text-xs">Compare</Button>
                         </Link>
                        <Button variant="secondary" className="text-xs" onClick={e => e.stopPropagation()}><TrashIcon className="h-4 w-4 mr-2" /> Delete Lower Quality</Button>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <FileCard file={pair.file1} />
                    <div className="flex items-center justify-center px-4">
                        <div className="w-px h-24 bg-slate-700"></div>
                    </div>
                    <FileCard file={pair.file2} />
                </div>

                <div className="mt-4 text-xs text-slate-400">
                    <strong className="text-slate-300">Matched on:</strong> {pair.matchedModalities.join(', ')}
                </div>
            </div>
        </div>
    );
};


const DuplicateResultDisplay: React.FC<{ result: ScanResult }> = ({ result }) => {
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
    console.log('Deleting pairs:', Array.from(selectedPairs));
    setAllPairs(prev => prev.filter(p => !selectedPairs.has(p.id)));
    setSelectedPairs(new Set());
    alert(`${selectedPairs.size} pairs have been marked for deletion.`);
  };

  const handleMarkNotDuplicate = () => {
    console.log('Marking pairs as not duplicates:', Array.from(selectedPairs));
    setAllPairs(prev => prev.filter(p => !selectedPairs.has(p.id)));
    setSelectedPairs(new Set());
    alert(`${selectedPairs.size} pairs have been marked as not duplicates and removed from this list.`);
  };

  const allSelected = allPairs.length > 0 && selectedPairs.size === allPairs.length;
  const isIndeterminate = selectedPairs.size > 0 && selectedPairs.size < allPairs.length;

  if (result.duplicatePairs.length === 0) {
    return (
      <div className="text-center bg-slate-900 border border-slate-800 rounded-lg p-12">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white">No Duplicates Found!</h2>
        <p className="text-slate-400 mt-2 capitalize">Your {result.scanType} library is clean. Great job!</p>
      </div>
    );
  }

  return (
    <div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6 flex justify-around text-center">
            <div>
                <p className="text-sm text-slate-400 capitalize">Total {result.scanType}s Scanned</p>
                <p className="text-2xl font-bold text-white">{result.summary.totalFiles}</p>
            </div>
            <div>
                <p className="text-sm text-slate-400">Duplicate Pairs Found</p>
                <p className="text-2xl font-bold text-indigo-400">{allPairs.length}</p>
            </div>
            <div>
                <p className="text-sm text-slate-400">Potential Savings</p>
                <p className="text-2xl font-bold text-green-400">{result.summary.potentialSavingsMB.toFixed(2)} MB</p>
            </div>
        </div>
        
        {allPairs.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 mb-6 flex items-center justify-between sticky top-4 z-10 backdrop-blur-sm">
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
                        className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500 ring-offset-slate-800/50"
                        aria-label="Select all pairs"
                    />
                    <span className="ml-3 text-sm font-medium text-white">
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