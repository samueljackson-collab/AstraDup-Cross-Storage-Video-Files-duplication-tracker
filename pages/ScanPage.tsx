
import React, { useState, useEffect } from 'react';
import StorageSelector from '../components/StorageSelector';
import DuplicateResultDisplay from '../components/DuplicateResultDisplay';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import { startScan } from '../services/api';
import type { ScanResult, StorageSource, FileType } from '../types';
import { HardDriveIcon, ServerIcon, CloudIcon, ScanIcon, CheckCircleIcon } from '../components/Icons';
import { FilmIcon, PhotoIcon, DocumentTextIcon } from '../components/FileTypeIcons';

type ScanPhase = 'type_selection' | 'source_selection' | 'scanning' | 'complete';

const ALL_STORAGE_SOURCES: StorageSource[] = [
    { id: 'local', name: 'Local Drive', type: 'Local', icon: HardDriveIcon },
    { id: 'nas', name: 'NAS', type: 'NAS', icon: ServerIcon },
    { id: 's3', name: 'AWS S3', type: 'S3', icon: CloudIcon },
    { id: 'gcs', name: 'Google Cloud', type: 'GCS', icon: CloudIcon },
    { id: 'azure', name: 'Azure Blob', type: 'Azure', icon: CloudIcon },
    { id: 'gdrive', name: 'Google Drive', type: 'Google Drive', icon: CloudIcon },
];

const ScanTypeCard: React.FC<{ title: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; onClick: () => void }> = ({ title, icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center p-8 rounded-lg border-2 transition-all duration-200 text-center bg-slate-900 border-slate-800 text-slate-400 hover:border-indigo-500 hover:text-white group"
    >
        <Icon className="h-16 w-16 mb-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
        <span className="text-lg font-semibold">{title}</span>
        <span className="text-sm mt-1">Find duplicate {title.toLowerCase()}</span>
    </button>
);

const ScanPage: React.FC = () => {
  const [scanPhase, setScanPhase] = useState<ScanPhase>('type_selection');
  const [scanType, setScanType] = useState<FileType | null>(null);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [etr, setEtr] = useState('');
  const [scanStartTime, setScanStartTime] = useState<number | null>(null);

  useEffect(() => {
    let interval: number | undefined;
    const totalDuration = 3; 

    if (scanPhase === 'scanning' && scanStartTime) {
        interval = window.setInterval(() => {
            const elapsedTime = (Date.now() - scanStartTime) / 1000;
            if (elapsedTime >= totalDuration) {
                setProgress(99);
                setEtr('Finishing up...');
                clearInterval(interval);
                return;
            }
            const currentProgress = Math.floor((elapsedTime / totalDuration) * 100);
            setProgress(currentProgress);
            const remainingTime = totalDuration - elapsedTime;
            const minutes = Math.floor(remainingTime / 60);
            const seconds = Math.floor(remainingTime % 60);
            setEtr(`~${minutes}m ${seconds.toString().padStart(2, '0')}s remaining`);
        }, 150);
    }
    return () => clearInterval(interval);
  }, [scanPhase, scanStartTime]);
  
  const handleSelectScanType = (type: FileType) => {
    setScanType(type);
    setScanPhase('source_selection');
  };

  const handleToggleSource = (sourceId: string) => {
    setSelectedSources(prev => {
      const newSelected = new Set(prev);
      newSelected.has(sourceId) ? newSelected.delete(sourceId) : newSelected.add(sourceId);
      return newSelected;
    });
  };

  const handleStartScan = async () => {
    if (selectedSources.size === 0 || !scanType) return;
    setScanPhase('scanning');
    setScanResult(null);
    setProgress(0);
    setEtr('Calculating...');
    setScanStartTime(Date.now());

    try {
      const result = await startScan(Array.from(selectedSources), scanType);
      setProgress(100);
      setScanResult(result);
      setScanPhase('complete');
    } catch (error) {
      console.error('Scan failed:', error);
      alert('An error occurred during the scan.');
      setScanPhase('source_selection');
    } finally {
        setScanStartTime(null);
    }
  };
  
  const handleNewScan = () => {
    setScanPhase('type_selection');
    setScanResult(null);
    setSelectedSources(new Set());
    setScanType(null);
    setProgress(0);
    setEtr('');
  };
  
  const renderContent = () => {
    switch(scanPhase) {
        case 'type_selection':
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <ScanTypeCard title="Videos" icon={FilmIcon} onClick={() => handleSelectScanType('video')} />
                    <ScanTypeCard title="Images" icon={PhotoIcon} onClick={() => handleSelectScanType('image')} />
                    <ScanTypeCard title="Documents" icon={DocumentTextIcon} onClick={() => handleSelectScanType('document')} />
                </div>
            );
        case 'source_selection':
            return (
                <>
                  <StorageSelector
                    sources={ALL_STORAGE_SOURCES}
                    selected={selectedSources}
                    onToggle={handleToggleSource}
                  />
                  <div className="mt-8 flex space-x-4">
                    <Button onClick={handleStartScan} disabled={selectedSources.size === 0}>
                      Start {scanType} Scan
                    </Button>
                    <Button onClick={() => setScanPhase('type_selection')} variant="secondary">
                        Back
                    </Button>
                  </div>
                </>
            );
        case 'scanning':
            return (
                <div className="flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-lg p-12 mt-8">
                    <h2 className="text-xl font-semibold text-white mb-6">Scan in Progress</h2>
                    <div className="w-full max-w-lg">
                        <div className="flex justify-between items-center mb-1 text-sm">
                            <span className="font-medium text-indigo-400 capitalize">Analyzing {scanType}s...</span>
                            <span className="font-mono font-semibold text-white">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300 ease-linear" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="text-right text-xs text-slate-400 mt-2">
                            <span>{etr}</span>
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm mt-8">This may take a while depending on the number of files.</p>
                </div>
            );
        case 'complete':
            return scanResult && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-white capitalize">{scanType} Scan Results</h2>
                    <Button onClick={handleNewScan} variant="secondary">
                      Start New Scan
                    </Button>
                  </div>
                  <DuplicateResultDisplay result={scanResult} />
                </>
            );
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Duplicate Scan</h1>
      <p className="text-slate-400 mb-8">
        {scanPhase === 'type_selection' && 'First, select the type of file you want to scan for.'}
        {scanPhase === 'source_selection' && `Now, select storage sources to scan for duplicate ${scanType}s.`}
        {scanPhase === 'scanning' && 'Scan is underway. Please wait...'}
        {scanPhase === 'complete' && 'Review the results of your scan below.'}
      </p>
      {renderContent()}
    </div>
  );
};

export default ScanPage;
