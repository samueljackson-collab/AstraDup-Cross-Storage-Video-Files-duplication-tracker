
import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFileDetails, getDuplicatesForFile } from '../services/api';
import type { AnyFile, VideoFile, ImageFile, DocumentFile } from '../types';
import Spinner from '../components/Spinner';
import { ArrowLeftIcon, XCircleIcon } from '../components/Icons';
import Button from '../components/Button';
import { FilmIcon, PhotoIcon, DocumentTextIcon } from '../components/FileTypeIcons';
import VideoDetail from './VideoDetail';

type DetailTab = 'details' | 'analysis' | 'duplicates';

const DetailItem: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <dt className="text-sm font-medium text-slate-400">{label}</dt>
    <dd className={`mt-1 text-sm text-white ${mono ? 'font-mono' : ''}`}>{value}</dd>
  </div>
);

const AnalysisItem: React.FC<{ label: string; value?: string | number | React.ReactNode; confidence: number; mono?: boolean }> = ({ label, value, confidence, mono }) => {
    const confidenceColor = confidence > 95 ? 'bg-green-500' : confidence > 85 ? 'bg-yellow-500' : 'bg-orange-500';
    return (
        <div className="grid grid-cols-3 items-center gap-x-4">
            <dt className="text-sm font-medium text-slate-400 col-span-1">{label}</dt>
            <div className="col-span-2">
                <div className="flex justify-between items-center mb-1">
                     <div className={`text-xs text-slate-300 truncate ${mono ? 'font-mono' : ''}`} title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}>
                        {value !== undefined && value !== null ? value : 'N/A'}
                     </div>
                     <dd className="text-sm font-semibold text-white">{confidence}%</dd>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5" title={`${confidence}% confidence`}>
                    <div className={`${confidenceColor} h-1.5 rounded-full`} style={{ width: `${confidence}%` }}></div>
                </div>
            </div>
        </div>
    );
}

const DuplicateItem: React.FC<{ currentFileId: string; duplicate: AnyFile; onMarkAsNotDuplicate: (duplicateId: string) => void; }> = ({ currentFileId, duplicate, onMarkAsNotDuplicate }) => {
    const FileTypeIcon = {
        video: FilmIcon,
        image: PhotoIcon,
        document: DocumentTextIcon,
    }[duplicate.fileType];

    return (
        <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
            <div className="flex items-center min-w-0">
                <img src={duplicate.thumbnailUrl} alt={duplicate.name} className="w-24 h-14 object-cover rounded-md flex-shrink-0 bg-slate-700" />
                <div className="ml-4 min-w-0">
                    <div className="flex items-center">
                        <FileTypeIcon className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                        <p className="font-semibold text-white text-sm truncate">{duplicate.name}</p>
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate">{duplicate.path}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                <Button onClick={() => onMarkAsNotDuplicate(duplicate.id)} variant="secondary" className="text-xs">
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Not a Duplicate
                </Button>
                <Link to={`/compare/${currentFileId}/${duplicate.id}`}>
                    <Button className="text-xs">Compare</Button>
                </Link>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; badge?: number; }> = ({ active, onClick, children, badge }) => (
    <button
        onClick={onClick}
        className={`relative flex items-center whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
            ${active
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
    >
        {children}
        {badge !== undefined && badge > 0 && (
            <span className="ml-2 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>
        )}
    </button>
);


const FileDetail: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<AnyFile | null>(null);
  const [duplicates, setDuplicates] = useState<AnyFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('details');

  useEffect(() => {
    if (fileId) {
      setLoading(true);
      Promise.all([
        getFileDetails(fileId),
        getDuplicatesForFile(fileId)
      ]).then(([fileData, duplicatesData]) => {
        setFile(fileData || null);
        setDuplicates(duplicatesData);
        if (duplicatesData.length > 0) {
            setActiveTab('duplicates');
        } else {
            setActiveTab('details');
        }
        setLoading(false);
      }).catch(err => {
          console.error(err);
          setLoading(false);
      });
    }
  }, [fileId]);

  const handleMarkAsNotDuplicate = (duplicateId: string) => {
    setDuplicates(currentDuplicates =>
      currentDuplicates.filter(dup => dup.id !== duplicateId)
    );
  };
  
  if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  if (!file) return <div className="text-center text-slate-400">File not found.</div>;
  
  if (file.fileType === 'video') {
    return <VideoDetail file={file as VideoFile} initialDuplicates={duplicates} />;
  }

  // Generic renderer for Image and Document files
  const renderDetailsContent = () => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-md font-semibold text-white mb-4">File Properties</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                <DetailItem label="Size" value={`${file.sizeMB} MB`} />
                {file.fileType === 'image' && <DetailItem label="Resolution" value={(file as ImageFile).resolution} mono />}
                {file.fileType === 'image' && <DetailItem label="Camera" value={(file as ImageFile).exif.cameraModel} />}
                {file.fileType === 'image' && <DetailItem label="Date Taken" value={new Date((file as ImageFile).exif.dateTaken).toLocaleString()} />}
                {file.fileType === 'document' && <DetailItem label="Page Count" value={(file as DocumentFile).pageCount} />}
                {file.fileType === 'document' && <DetailItem label="Author" value={(file as DocumentFile).author} />}
                </dl>
            </div>
        </div>
    );
  };

  const renderAnalysisContent = () => {
    const items = () => {
        switch(file.fileType) {
            case 'image':
                const i = file as ImageFile;
                return <>
                    <AnalysisItem label="Perceptual Hash" value={i.analysis.pHash.value} confidence={i.analysis.pHash.confidence} mono />
                    <AnalysisItem label="Difference Hash" value={i.analysis.dHash.value} confidence={i.analysis.dHash.confidence} mono />
                    <AnalysisItem label="Object Tags" value={i.analysis.objectTags.value.join(', ')} confidence={i.analysis.objectTags.confidence} />
                </>;
            case 'document':
                const d = file as DocumentFile;
                return <>
                    <AnalysisItem label="Text Hash" value={d.analysis.textHash.value} confidence={d.analysis.textHash.confidence} mono />
                    <AnalysisItem label="Keyword Density" value={Object.entries(d.analysis.keywordDensity.value).map(([k,v]) => `${k} (${v})`).join(', ')} confidence={d.analysis.keywordDensity.confidence} />
                </>;
            default: return null;
        }
    }
    return <div className="space-y-6">{items()}</div>;
  };

  const renderDuplicatesContent = () => {
    return (
        <div className="space-y-4">
            {duplicates.length > 0 ? (
                duplicates.map(dup => <DuplicateItem key={dup.id} currentFileId={file!.id} duplicate={dup} onMarkAsNotDuplicate={handleMarkAsNotDuplicate} />)
            ) : (
                <div className="text-center text-slate-400 py-8"><p>No other duplicates found.</p></div>
            )}
        </div>
    );
  }

  return (
    <div>
      <Button variant="secondary" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back
      </Button>
      <div className="lg:flex lg:space-x-8">
        <div className="lg:w-2/3">
           <img src={file.thumbnailUrl} alt={file.name} className="rounded-lg w-full aspect-video object-cover bg-black" />
           <div className="flex items-center">
             <h1 className="text-2xl font-bold text-white mt-4">{file.name}</h1>
           </div>
          <p className="text-sm text-slate-400 font-mono break-all">{file.path}</p>
        </div>
        <div className="lg:w-1/3 mt-6 lg:mt-0">
           <div className="bg-slate-900 border border-slate-800 rounded-lg">
                <div className="border-b border-slate-800 px-4">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')}>Details</TabButton>
                        <TabButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}>AI Analysis</TabButton>
                        <TabButton active={activeTab === 'duplicates'} onClick={() => setActiveTab('duplicates')} badge={duplicates.length}>Duplicates</TabButton>
                    </nav>
                </div>
                <div className="p-5">
                    {activeTab === 'details' && renderDetailsContent()}
                    {activeTab === 'analysis' && renderAnalysisContent()}
                    {activeTab === 'duplicates' && renderDuplicatesContent()}
                </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FileDetail;