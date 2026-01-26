
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { VideoFile, AnyFile } from '../types';
import { ArrowLeftIcon, ExternalLinkIcon, XCircleIcon, ChevronDownIcon } from '../components/Icons';
import Button from '../components/Button';
import { FilmIcon, PhotoIcon, DocumentTextIcon } from '../components/FileTypeIcons';

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
};

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

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => (
    <div className="border-b border-slate-700 last:border-b-0">
        <h3 className="text-base font-semibold text-white">
            <button
                type="button"
                className="flex items-center justify-between w-full p-4 text-left"
                onClick={onToggle}
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
        </h3>
        <div 
            className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
            <div className="overflow-hidden">
                <div className="px-4 pb-4">
                    {children}
                </div>
            </div>
        </div>
    </div>
);


interface VideoDetailProps {
    file: VideoFile;
    initialDuplicates: AnyFile[];
}

const VideoDetail: React.FC<VideoDetailProps> = ({ file, initialDuplicates }) => {
    const navigate = useNavigate();
    const [duplicates, setDuplicates] = useState<AnyFile[]>(initialDuplicates);
    const [activeTab, setActiveTab] = useState<DetailTab>(initialDuplicates.length > 0 ? 'duplicates' : 'details');
    const [openSections, setOpenSections] = useState({
        properties: true,
        enriched: true,
        analysis: true,
    });

    const toggleSection = (key: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleMarkAsNotDuplicate = (duplicateId: string) => {
        setDuplicates(currentDuplicates =>
          currentDuplicates.filter(dup => dup.id !== duplicateId)
        );
    };

    const renderDetailsContent = () => (
        <div className="bg-slate-800/20">
            <AccordionItem title="File Properties" isOpen={openSections.properties} onToggle={() => toggleSection('properties')}>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                    <DetailItem label="Size" value={`${file.sizeMB} MB`} />
                    <DetailItem label="Duration" value={file.duration} mono />
                    <DetailItem label="Resolution" value={file.resolution} mono />
                    <DetailItem label="Codec" value={file.codec} />
                </dl>
            </AccordionItem>
            <AccordionItem title="Enriched Data" isOpen={openSections.enriched} onToggle={() => toggleSection('enriched')}>
                <dl className="grid grid-cols-1 gap-y-4">
                    <DetailItem label="Suggested Title" value={file.enrichedData.title} />
                    <div>
                        <dt className="text-sm font-medium text-slate-400">Plot Summary</dt>
                        <dd className="mt-1 text-sm text-white">{file.enrichedData.plot}</dd>
                    </div>
                    <DetailItem label="Genre" value={file.enrichedData.genre} />
                </dl>
            </AccordionItem>
        </div>
    );

    const renderAnalysisContent = () => (
       <div className="bg-slate-800/20">
            <AccordionItem title="Detection Modalities" isOpen={openSections.analysis} onToggle={() => toggleSection('analysis')}>
                <div className="space-y-6">
                    <AnalysisItem label="Perceptual Hash" value={file.analysis.pHash.value} confidence={file.analysis.pHash.confidence} mono />
                    <AnalysisItem label="Difference Hash" value={file.analysis.dHash.value} confidence={file.analysis.dHash.confidence} mono />
                    <AnalysisItem label="Audio Fingerprint" value={file.analysis.audioFingerprint.value} confidence={file.analysis.audioFingerprint.confidence} mono />
                    <AnalysisItem label="Scene Embeddings" confidence={file.analysis.sceneEmbeddings.confidence} />
                    <AnalysisItem label="Face Clusters" value={`${file.analysis.faceClusters.value} clusters`} confidence={file.analysis.faceClusters.confidence} />
                </div>
            </AccordionItem>
        </div>
    );
    
    const renderDuplicatesContent = () => (
        <div className="p-5 space-y-4">
            {duplicates.length > 0 ? (
                duplicates.map(dup => <DuplicateItem key={dup.id} currentFileId={file.id} duplicate={dup} onMarkAsNotDuplicate={handleMarkAsNotDuplicate} />)
            ) : (
                <div className="text-center text-slate-400 py-8"><p>No other duplicates found.</p></div>
            )}
        </div>
    );

    return (
        <div>
          <Button variant="secondary" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="lg:flex lg:space-x-8">
            <div className="lg:w-2/3">
              <video controls poster={file.thumbnailUrl} src={file.videoUrl} className="rounded-lg w-full aspect-video object-contain bg-black">
                Your browser does not support the video tag.
              </video>
              <div className="flex items-center">
                 <h1 className="text-2xl font-bold text-white mt-4">{file.name}</h1>
                 <a href={`https://www.imdb.com/find?q=${encodeURIComponent(file.name.replace(/\.[^/.]+$/, ""))}`} target="_blank" rel="noopener noreferrer" title="Search on IMDb" className="mt-4 ml-3 text-slate-500 hover:text-indigo-400">
                     <ExternalLinkIcon className="h-5 w-5" />
                 </a>
              </div>
              <p className="text-sm text-slate-400 font-mono break-all">{file.path}</p>
            </div>
            <div className="lg:w-1/3 mt-6 lg:mt-0">
               <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                    <div className="border-b border-slate-800 px-4">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')}>Details</TabButton>
                            <TabButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}>AI Analysis</TabButton>
                            <TabButton active={activeTab === 'duplicates'} onClick={() => setActiveTab('duplicates')} badge={duplicates.length}>Duplicates</TabButton>
                        </nav>
                    </div>
                    <div>
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

export default VideoDetail;