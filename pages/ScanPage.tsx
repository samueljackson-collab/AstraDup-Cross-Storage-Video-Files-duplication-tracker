
import { useState, useEffect } from 'react';
import StorageSelector from '../components/StorageSelector';
import DuplicateResultDisplay from '../components/DuplicateResultDisplay';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import { startScan } from '../services/api';
import type { ScanResult, StorageSource, FileType } from '../types';
import { HardDriveIcon, ServerIcon, GoogleDriveIcon, DropboxIcon, OneDriveIcon, CheckCircleIcon } from '../components/Icons';
import { FilmIcon, PhotoIcon, DocumentTextIcon } from '../components/FileTypeIcons';
import { useToast } from '../components/Toast';

type ScanPhase = 'type_selection' | 'source_selection' | 'scanning' | 'complete';

const ALL_STORAGE_SOURCES: StorageSource[] = [
    { id: 'local', name: 'Local Drive', type: 'Local', icon: HardDriveIcon },
    { id: 'nas', name: 'NAS', type: 'NAS', icon: ServerIcon },
    { id: 'gdrive', name: 'Google Drive', type: 'Google Drive', icon: GoogleDriveIcon },
    { id: 'dropbox', name: 'Dropbox', type: 'Dropbox', icon: DropboxIcon },
    { id: 'onedrive', name: 'OneDrive', type: 'OneDrive', icon: OneDriveIcon },
];

const METADATA_DATABASES = [
    { id: 'imdb', name: 'IMDb' },
    { id: 'tmdb', name: 'The Movie Database (TMDb)' },
    { id: 'tvdb', name: 'The TVDB' },
];


const CLOUD_SOURCE_TYPES: Array<StorageSource['type']> = ['Google Drive', 'Dropbox', 'OneDrive', 'S3', 'GCS', 'Azure'];

const ScanTypeCard: React.FC<{ title: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; onClick: () => void }> = ({ title, icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center p-8 rounded-lg border-2 transition-all duration-200 text-center bg-black border-green-800 text-green-600 hover:border-green-500 hover:text-green-400 group"
    >
        <Icon className="h-16 w-16 mb-4 text-green-700 group-hover:text-green-400 transition-colors" />
        <span className="text-xl font-bold">{title}</span>
        <span className="text-base mt-1">Find duplicate {title.toLowerCase()}</span>
    </button>
);

const ScanConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (enabledDbs: string[]) => void;
    scanType: FileType;
    sourceCount: number;
}> = ({ isOpen, onClose, onConfirm, scanType, sourceCount }) => {
    const [enabledDatabases, setEnabledDatabases] = useState<Set<string>>(new Set(METADATA_DATABASES.map(db => db.id)));

    const handleToggleDb = (id: string) => {
        setEnabledDatabases(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-black border border-green-700 rounded-lg shadow-xl max-w-lg w-full p-6">
                 <h3 className="text-2xl leading-6 font-bold text-green-400">Confirm Scan Options</h3>
                 <div className="mt-4 space-y-4">
                    <p className="text-base text-green-600">
                        You are about to start a <span className="font-bold text-green-400 capitalize">{scanType}</span> scan across <span className="font-bold text-green-400">{sourceCount}</span> selected storage source(s).
                    </p>
                    <div>
                        <h4 className="font-bold text-green-400 mb-2 text-lg">Metadata Enrichment</h4>
                        <p className="text-sm text-green-700 mb-3">Select the databases to use for enriching file metadata during this scan.</p>
                        <div className="space-y-2">
                            {METADATA_DATABASES.map(db => (
                                <label key={db.id} className="flex items-center justify-between bg-gray-900 p-3 rounded-md">
                                    <span className="text-base text-green-500">{db.name}</span>
                                    <input
                                        type="checkbox"
                                        checked={enabledDatabases.has(db.id)}
                                        onChange={() => handleToggleDb(db.id)}
                                        className="h-5 w-5 rounded bg-black border-green-700 text-green-500 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ring-offset-black"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                 </div>
                 <div className="mt-6 flex justify-end space-x-3">
                    <Button onClick={onClose} variant="secondary">Cancel</Button>
                    <Button onClick={() => onConfirm(Array.from(enabledDatabases))}>Start Scan</Button>
                 </div>
            </div>
        </div>
    );
};


const ScanPage: React.FC = () => {
  const { showToast } = useToast();
  const [scanPhase, setScanPhase] = useState<ScanPhase>('type_selection');
  const [scanType, setScanType] = useState<FileType | null>(null);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(['local'])); // Select local by default
  const [connectedSources, setConnectedSources] = useState<Set<string>>(new Set());
  const [connectingSource, setConnectingSource] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [etr, setEtr] = useState('');
  const [scanStartTime, setScanStartTime] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  
  const handleConnectSource = (sourceId: string) => {
    setConnectingSource(sourceId);
    // Simulate SSO login flow
    setTimeout(() => {
        setConnectedSources(prev => new Set(prev).add(sourceId));
        setSelectedSources(prev => new Set(prev).add(sourceId));
        setConnectingSource(null);
    }, 1500);
  };

  const handleStartScan = async (enabledDatabases: string[]) => {
    setIsModalOpen(false);
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
    } catch {
      showToast('An error occurred during the scan.', 'error');
      setScanPhase('source_selection');
    } finally {
        setScanStartTime(null);
    }
  };
  
  const handleNewScan = () => {
    setScanPhase('type_selection');
    setScanResult(null);
    setSelectedSources(new Set(['local']));
    // We keep connectedSources state
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
                    cloudSourceTypes={CLOUD_SOURCE_TYPES}
                    selected={selectedSources}
                    connected={connectedSources}
                    connectingId={connectingSource}
                    onToggle={handleToggleSource}
                    onConnect={handleConnectSource}
                  />
                  <div className="mt-8 flex space-x-4">
                    <Button onClick={() => setIsModalOpen(true)} disabled={selectedSources.size === 0 || !!connectingSource}>
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
                <div className="flex flex-col items-center justify-center bg-black border border-green-800 rounded-lg p-12 mt-8">
                    <h2 className="text-2xl font-bold text-green-400 mb-6">Scan in Progress</h2>
                    <div className="w-full max-w-lg">
                        <div className="flex justify-between items-center mb-1 text-base">
                            <span className="font-bold text-green-400 capitalize">Analyzing {scanType}s...</span>
                            <span className="font-mono font-extrabold text-green-400">{progress}%</span>
                        </div>
                        <div className="w-full bg-green-900 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-green-500 h-2.5 rounded-full transition-all duration-300 ease-linear" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="text-right text-sm text-green-600 mt-2">
                            <span>{etr}</span>
                        </div>
                    </div>
                    <p className="text-green-600 text-base mt-8">This may take a while depending on the number of files.</p>
                </div>
            );
        case 'complete':
            return scanResult && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-green-400 capitalize">{scanType} Scan Results</h2>
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
      {scanType && <ScanConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleStartScan}
        scanType={scanType}
        sourceCount={selectedSources.size}
      />}
      <h1 className="text-4xl font-extrabold tracking-tight text-green-400 mb-2">Duplicate Scan</h1>
      <p className="text-green-600 mb-8 text-lg">
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