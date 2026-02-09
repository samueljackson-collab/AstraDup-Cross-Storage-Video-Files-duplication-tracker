
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFileDetails, getDuplicatesForFile } from '../services/api';
import { summarizeText } from '../services/gemini';
import type { AnyFile, VideoFile, ImageFile, DocumentFile } from '../types';
import Spinner from '../components/Spinner';
import {
    ArrowLeftIcon, XCircleIcon, ChevronDownIcon, SparklesIcon,
    ExternalLinkIcon, PlayIcon, PauseIcon, VolumeHighIcon, VolumeMutedIcon, FullscreenIcon, FullscreenExitIcon
} from '../components/Icons';
import Button from '../components/Button';
import { FilmIcon, PhotoIcon, DocumentTextIcon } from '../components/FileTypeIcons';

// --- HELPER COMPONENTS (CONSOLIDATED) ---

const DetailItem: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <dt className="text-base font-semibold text-green-600">{label}</dt>
    <dd className={`mt-1 text-base text-green-400 ${mono ? 'font-mono' : ''}`}>{value}</dd>
  </div>
);

const AnalysisItem: React.FC<{ label: string; value?: string | number | React.ReactNode; confidence: number; mono?: boolean }> = ({ label, value, confidence, mono }) => {
    const getConfidenceColors = (score: number) => {
        if (score >= 95) return { text: 'text-green-400', bg: 'bg-green-500' };
        if (score >= 80) return { text: 'text-yellow-400', bg: 'bg-yellow-500' };
        return { text: 'text-orange-400', bg: 'bg-orange-500' };
    };
    const { text: textColor, bg: bgColor } = getConfidenceColors(confidence);

    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <dt className="text-base font-semibold text-green-600">{label}</dt>
                <dd className={`text-2xl font-extrabold ${textColor}`}>{confidence}%</dd>
            </div>
            {value != null && (
                 <div className={`text-sm text-green-500 truncate mb-2 ${mono ? 'font-mono' : ''}`} title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}>
                    {value}
                 </div>
            )}
            <div className="w-full bg-green-900 rounded-full h-1.5" title={`${confidence}% confidence`}>
                <div className={`${bgColor} h-1.5 rounded-full`} style={{ width: `${confidence}%` }}></div>
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
        <div className="flex items-center justify-between bg-green-900/20 p-3 rounded-lg">
            <div className="flex items-center min-w-0">
                <img src={duplicate.thumbnailUrl} alt={duplicate.name} className="w-24 h-14 object-cover rounded-md flex-shrink-0 bg-black" />
                <div className="ml-4 min-w-0">
                    <div className="flex items-center">
                        <FileTypeIcon className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        <p className="font-bold text-green-400 text-base truncate">{duplicate.name}</p>
                    </div>
                    <p className="text-sm text-green-600 font-mono truncate">{duplicate.path}</p>
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
        className={`relative flex items-center whitespace-nowrap py-3 px-4 border-b-2 font-semibold text-base transition-all duration-200 rounded-t-md
            ${active
                ? 'border-green-500 text-green-300 bg-green-900/50'
                : 'border-transparent text-green-700 hover:text-green-500 hover:bg-green-900/30'
            }`}
    >
        {children}
        {badge !== undefined && badge > 0 && (
            <span className="ml-2 bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>
        )}
    </button>
);

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => (
    <div className="border-b border-green-800 last:border-b-0">
        <h3 className="text-lg font-bold text-green-400">
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


// --- VIDEO DETAIL COMPONENTS ---

const CustomVideoPlayer: React.FC<{file: VideoFile}> = ({ file }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLInputElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const formatTime = (timeInSeconds: number) => {
        if (isNaN(timeInSeconds)) return '0:00';
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const togglePlayPause = useCallback(() => {
        if (videoRef.current?.paused) {
            videoRef.current?.play();
            setIsPlaying(true);
        } else {
            videoRef.current?.pause();
            setIsPlaying(false);
        }
    }, []);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };
    
    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            videoRef.current.currentTime = Number(e.target.value);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = Number(e.target.value);
        if(videoRef.current) videoRef.current.volume = newVolume;
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
            if(videoRef.current) videoRef.current.muted = false;
        }
    };
    
    const toggleMute = () => {
        if(videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
            if(!isMuted && volume === 0) setVolume(1);
        }
    };

    const toggleFullScreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullScreen(true);
        } else {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    };
    
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('ended', () => setIsPlaying(false));
        
        const onFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullscreenChange);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('ended', () => setIsPlaying(false));
            document.removeEventListener('fullscreenchange', onFullscreenChange);
        };
    }, []);

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    return (
        <div ref={containerRef} className="relative aspect-video bg-black rounded-lg group overflow-hidden">
            <video 
                ref={videoRef}
                onClick={togglePlayPause}
                playsInline
                preload="metadata"
                poster={file.thumbnailUrl} 
                src={file.videoUrl} 
                className="w-full h-full object-contain rounded-lg"
            >
                Your browser does not support the video tag.
            </video>
            
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={togglePlayPause} className="p-4 rounded-full bg-black/50 text-white hover:bg-green-500/80 transition-colors pointer-events-auto">
                    {isPlaying ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10" />}
                </button>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <input
                    type="range"
                    ref={progressRef}
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-green-900/50 rounded-lg appearance-none cursor-pointer range-sm"
                    style={{ backgroundSize: `${progressPercent}% 100%` }}
                />
                <div className="flex items-center justify-between mt-2 text-white">
                    <div className="flex items-center space-x-3">
                        <button onClick={togglePlayPause} className="text-white hover:text-green-400">
                            {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                        </button>
                        <div className="relative group/volume flex items-center">
                           <button onClick={toggleMute} className="text-white hover:text-green-400">
                             {(isMuted || volume === 0) ? <VolumeMutedIcon className="w-6 h-6" /> : <VolumeHighIcon className="w-6 h-6" />}
                           </button>
                           <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-2 bg-black/60 rounded-md opacity-0 group-hover/volume:opacity-100 transition-opacity pointer-events-none group-hover/volume:pointer-events-auto">
                               <input 
                                 type="range" 
                                 min="0" max="1" step="0.05" 
                                 value={isMuted ? 0 : volume}
                                 onChange={handleVolumeChange} 
                                 className="h-20 w-1.5 appearance-none bg-green-900/50 rounded-lg cursor-pointer"
                                 style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                               />
                           </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                        <button onClick={toggleFullScreen} className="text-white hover:text-green-400">
                           {isFullScreen ? <FullscreenExitIcon className="w-5 h-5" /> : <FullscreenIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface VideoDetailProps {
    file: VideoFile;
    initialDuplicates: AnyFile[];
}

const VideoDetailContent: React.FC<VideoDetailProps> = ({ file, initialDuplicates }) => {
    const navigate = useNavigate();
    const [duplicates, setDuplicates] = useState<AnyFile[]>(initialDuplicates);
    const [activeTab, setActiveTab] = useState<string>(initialDuplicates.length > 0 ? 'duplicates' : 'properties');

    const handleMarkAsNotDuplicate = (duplicateId: string) => {
        setDuplicates(currentDuplicates =>
          currentDuplicates.filter(dup => dup.id !== duplicateId)
        );
    };

    const renderPropertiesContent = () => (
        <div className="p-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                <DetailItem label="Size" value={`${file.sizeMB} MB`} />
                <DetailItem label="Duration" value={file.duration} mono />
                <DetailItem label="Resolution" value={file.resolution} mono />
                <DetailItem label="Codec" value={file.codec} />
            </dl>
        </div>
    );

    const renderEnrichedContent = () => (
        <div className="p-5">
            <dl className="grid grid-cols-1 gap-y-4">
                <DetailItem label="Suggested Title" value={file.enrichedData.title} />
                <div>
                    <dt className="text-base font-semibold text-green-600">Plot Summary</dt>
                    <dd className="mt-1 text-base text-green-400">{file.enrichedData.plot}</dd>
                </div>
                <DetailItem label="Genre" value={file.enrichedData.genre} />
            </dl>
        </div>
    );
    
    const renderAnalysisContent = () => (
        <div className="p-5 space-y-6">
            <AnalysisItem label="Perceptual Hash" value={file.analysis.pHash.value} confidence={file.analysis.pHash.confidence} mono />
            <AnalysisItem label="Difference Hash" value={file.analysis.dHash.value} confidence={file.analysis.dHash.confidence} mono />
            <AnalysisItem label="Audio Fingerprint" value={file.analysis.audioFingerprint.value} confidence={file.analysis.audioFingerprint.confidence} mono />
            <AnalysisItem label="Scene Embeddings" value={null} confidence={file.analysis.sceneEmbeddings.confidence} />
            <AnalysisItem label="Face Clusters" value={`${file.analysis.faceClusters.value} clusters`} confidence={file.analysis.faceClusters.confidence} />
        </div>
    );

    const renderDuplicatesContent = () => (
        <div className="p-5 space-y-4">
            {duplicates.length > 0 ? (
                duplicates.map(dup => <DuplicateItem key={dup.id} currentFileId={file.id} duplicate={dup} onMarkAsNotDuplicate={handleMarkAsNotDuplicate} />)
            ) : (
                <div className="text-center text-green-600 py-8"><p>No other duplicates found.</p></div>
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
              <CustomVideoPlayer file={file} />
              <div className="flex items-center">
                 <h1 className="text-3xl font-extrabold text-green-400 mt-4">{file.name}</h1>
                 <a href={`https://www.imdb.com/find?q=${encodeURIComponent(file.name.replace(/\.[^/.]+$/, ""))}`} target="_blank" rel="noopener noreferrer" title="Search on IMDb" className="mt-4 ml-3 text-green-700 hover:text-green-400">
                     <ExternalLinkIcon className="h-5 w-5" />
                 </a>
              </div>
              <p className="text-base text-green-600 font-mono break-all">{file.path}</p>
            </div>
            <div className="lg:w-1/3 mt-6 lg:mt-0">
               <div className="bg-black border border-green-800 rounded-lg overflow-hidden">
                    <div className="border-b border-green-800 px-4">
                        <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
                            <TabButton active={activeTab === 'properties'} onClick={() => setActiveTab('properties')}>Properties</TabButton>
                            <TabButton active={activeTab === 'enriched'} onClick={() => setActiveTab('enriched')}>Enriched</TabButton>
                            <TabButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}>Analysis</TabButton>
                            <TabButton active={activeTab === 'duplicates'} onClick={() => setActiveTab('duplicates')} badge={duplicates.length}>Duplicates</TabButton>
                        </nav>
                    </div>
                    <div>
                        {activeTab === 'properties' && renderPropertiesContent()}
                        {activeTab === 'enriched' && renderEnrichedContent()}
                        {activeTab === 'analysis' && renderAnalysisContent()}
                        {activeTab === 'duplicates' && renderDuplicatesContent()}
                    </div>
               </div>
            </div>
          </div>
        </div>
      );
};


// --- MAIN PAGE COMPONENT ---

const FileDetail: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<AnyFile | null>(null);
  const [duplicates, setDuplicates] = useState<AnyFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('details');
  const [openSections, setOpenSections] = useState({
      properties: true,
      exif: true,
      analysis: true,
      aiSummary: false,
  });
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const toggleSection = (key: keyof typeof openSections) => {
      setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
  
  const handleSummarize = async () => {
    if (file?.fileType !== 'document' || !file.content) return;
    setIsSummarizing(true);
    setSummary(null);
    if (!openSections.aiSummary) {
        toggleSection('aiSummary');
    }
    try {
        const response = await summarizeText(file.content);
        setSummary(response.text);
    } catch (error) {
        console.error("Summarization failed:", error);
        setSummary("Failed to generate summary. Please try again.");
    } finally {
        setIsSummarizing(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  if (!file) return <div className="text-center text-green-600">File not found.</div>;

  // Delegate to VideoDetail component for videos
  if (file.fileType === 'video') {
    return <VideoDetailContent file={file as VideoFile} initialDuplicates={duplicates} />;
  }

  const renderDetailsContent = () => {
    const analysisItems = () => {
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
    
    return (
        <div className="bg-green-900/10">
            <AccordionItem title="File Properties" isOpen={openSections.properties} onToggle={() => toggleSection('properties')}>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                    <DetailItem label="Size" value={`${file.sizeMB} MB`} />
                    {file.fileType === 'image' && <DetailItem label="Resolution" value={(file as ImageFile).resolution} mono />}
                    {file.fileType === 'document' && <>
                        <DetailItem label="Page Count" value={(file as DocumentFile).pageCount} />
                        <DetailItem label="Word Count" value={(file as DocumentFile).wordCount} />
                        <DetailItem label="Author" value={(file as DocumentFile).author} />
                    </>}
                </dl>
            </AccordionItem>
            {file.fileType === 'image' && (
                <AccordionItem title="EXIF Data" isOpen={openSections.exif} onToggle={() => toggleSection('exif')}>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                        <DetailItem label="Camera" value={(file as ImageFile).exif.cameraModel} />
                        <DetailItem label="Date Taken" value={new Date((file as ImageFile).exif.dateTaken).toLocaleString()} />
                        <DetailItem label="ISO" value={(file as ImageFile).exif.iso} />
                    </dl>
                </AccordionItem>
            )}
            <AccordionItem title="AI Analysis" isOpen={openSections.analysis} onToggle={() => toggleSection('analysis')}>
                <div className="space-y-6">{analysisItems()}</div>
            </AccordionItem>
            {file.fileType === 'document' && (
                <AccordionItem title="AI Summary" isOpen={openSections.aiSummary} onToggle={() => toggleSection('aiSummary')}>
                   <div className="space-y-3">
                        <Button onClick={handleSummarize} disabled={isSummarizing}>
                            {isSummarizing ? <Spinner /> : <SparklesIcon className="h-4 w-4 mr-2" />}
                            {isSummarizing ? 'Analyzing...' : 'Summarize with AI'}
                        </Button>
                        {isSummarizing && <p className="text-sm text-green-600">Generating summary, please wait...</p>}
                        {summary && <p className="text-base text-green-400">{summary}</p>}
                   </div>
                </AccordionItem>
            )}
        </div>
    );
  };

  const renderDuplicatesContent = () => {
    return (
        <div className="p-5 space-y-4">
            {duplicates.length > 0 ? (
                duplicates.map(dup => <DuplicateItem key={dup.id} currentFileId={file!.id} duplicate={dup} onMarkAsNotDuplicate={handleMarkAsNotDuplicate} />)
            ) : (
                <div className="text-center text-green-600 py-8"><p>No other duplicates found.</p></div>
            )}
        </div>
    );
  }

  // Render logic for Image and Document types
  return (
    <div>
      <Button variant="secondary" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back
      </Button>
      <div className="lg:flex lg:space-x-8">
        <div className="lg:w-2/3">
           <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
             {file.fileType === 'document' ? 
                <DocumentTextIcon className="h-32 w-32 text-green-900" /> :
                <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-contain" />
             }
           </div>
           <h1 className="text-3xl font-extrabold text-green-400 mt-4">{file.name}</h1>
           <p className="text-base text-green-600 font-mono break-all">{file.path}</p>
        </div>
        <div className="lg:w-1/3 mt-6 lg:mt-0">
           <div className="bg-black border border-green-800 rounded-lg overflow-hidden">
                <div className="border-b border-green-800 px-4">
                    <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                        <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')}>Details</TabButton>
                        <TabButton active={activeTab === 'duplicates'} onClick={() => setActiveTab('duplicates')} badge={duplicates.length}>Duplicates</TabButton>
                    </nav>
                </div>
                <div>
                    {activeTab === 'details' && renderDetailsContent()}
                    {activeTab === 'duplicates' && renderDuplicatesContent()}
                </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FileDetail;
