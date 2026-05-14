
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFileDetails, getDuplicatesForFile, getComparisonHistory } from '../services/api';
import { summarizeText } from '../services/gemini';
import type { AnyFile, VideoFile, ImageFile, DocumentFile, ComparisonHistoryItem } from '../types';
import Spinner from '../components/Spinner';
import {
    ArrowLeftIcon, XCircleIcon, SparklesIcon,
    ExternalLinkIcon, CheckCircleIcon, AlertCircleIcon
} from '../components/Icons';
import Button from '../components/Button';
import { FilmIcon, PhotoIcon, DocumentTextIcon } from '../components/FileTypeIcons';
import { DetailItem, AnalysisItem } from '../components/DetailViews';
import CustomVideoPlayer from '../components/CustomVideoPlayer';

// --- HELPER COMPONENTS (CONSOLIDATED) ---
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
                        <Link to={`/compare/${currentFileId}/${duplicate.id}`} className="font-bold text-green-400 text-base truncate hover:underline">{duplicate.name}</Link>
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

// --- MAIN PAGE COMPONENT ---

const FileDetail: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<AnyFile | null>(null);
  const [duplicates, setDuplicates] = useState<AnyFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('properties');
  const [comparisonHistory, setComparisonHistory] = useState<ComparisonHistoryItem[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    if (fileId) {
      setLoading(true);
      Promise.all([
        getFileDetails(fileId),
        getDuplicatesForFile(fileId),
        getComparisonHistory(fileId)
      ]).then(([fileData, duplicatesData, historyData]) => {
        setComparisonHistory(historyData);
        setFile(fileData || null);
        setDuplicates(duplicatesData);
        if (duplicatesData.length > 0) {
            setActiveTab('duplicates');
        } else {
            setActiveTab('properties');
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

  const renderPropertiesContent = () => {
    if (!file) return null;
    return (
        <div className="p-5">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <DetailItem label="Size" value={`${file.sizeMB} MB`} />
                <DetailItem label="Path" value={file.path} mono className="col-span-2" />
                {file.fileType === 'video' && <>
                    <DetailItem label="Duration" value={(file as VideoFile).duration} mono />
                    <DetailItem label="Resolution" value={(file as VideoFile).resolution} mono />
                    <DetailItem label="Codec" value={(file as VideoFile).codec} />
                </>}
                 {file.fileType === 'image' && <DetailItem label="Resolution" value={(file as ImageFile).resolution} mono />}
                 {file.fileType === 'document' && <>
                    <DetailItem label="Page Count" value={(file as DocumentFile).pageCount} />
                    <DetailItem label="Word Count" value={(file as DocumentFile).wordCount} />
                    <DetailItem label="Author" value={(file as DocumentFile).author} />
                </>}
            </dl>
            {file.fileType === 'video' && (file as VideoFile).enrichedData &&
                <>
                    <hr className="border-green-800 my-4" />
                    <h4 className="text-lg font-bold text-green-500 mb-3">Enriched Metadata</h4>
                    <dl className="grid grid-cols-1 gap-y-4">
                        <DetailItem label="Suggested Title" value={(file as VideoFile).enrichedData.title} />
                         <div>
                            <dt className="text-base font-semibold text-green-600">Plot Summary</dt>
                            <dd className="mt-1 text-base text-green-400">{(file as VideoFile).enrichedData.plot}</dd>
                        </div>
                        <DetailItem label="Genre" value={(file as VideoFile).enrichedData.genre} />
                    </dl>
                </>
            }
             {file.fileType === 'image' && (file as ImageFile).exif &&
                <>
                    <hr className="border-green-800 my-4" />
                    <h4 className="text-lg font-bold text-green-500 mb-3">EXIF Data</h4>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                         <DetailItem label="Camera" value={(file as ImageFile).exif.cameraModel} />
                        <DetailItem label="Date Taken" value={new Date((file as ImageFile).exif.dateTaken).toLocaleString()} />
                        <DetailItem label="ISO" value={(file as ImageFile).exif.iso} />
                    </dl>
                </>
            }
        </div>
    );
  };

  const renderAnalysisContent = () => {
    if (!file) return null;
    return (
        <div className="p-5 space-y-6">
            {file.fileType === 'video' && <>
                <AnalysisItem label="Perceptual Hash" value={(file as VideoFile).analysis.pHash.value} confidence={(file as VideoFile).analysis.pHash.confidence} mono />
                <AnalysisItem label="Difference Hash" value={(file as VideoFile).analysis.dHash.value} confidence={(file as VideoFile).analysis.dHash.confidence} mono />
                <AnalysisItem label="Audio Fingerprint" value={(file as VideoFile).analysis.audioFingerprint.value} confidence={(file as VideoFile).analysis.audioFingerprint.confidence} mono />
                <AnalysisItem label="Scene Embeddings" value={null} confidence={(file as VideoFile).analysis.sceneEmbeddings.confidence} />
                <AnalysisItem label="Face Clusters" value={`${(file as VideoFile).analysis.faceClusters.value} clusters`} confidence={(file as VideoFile).analysis.faceClusters.confidence} />
            </>}
             {file.fileType === 'image' && <>
                <AnalysisItem label="Perceptual Hash" value={(file as ImageFile).analysis.pHash.value} confidence={(file as ImageFile).analysis.pHash.confidence} mono />
                <AnalysisItem label="Difference Hash" value={(file as ImageFile).analysis.dHash.value} confidence={(file as ImageFile).analysis.dHash.confidence} mono />
                <AnalysisItem label="Object Tags" value={(file as ImageFile).analysis.objectTags.value.join(', ')} confidence={(file as ImageFile).analysis.objectTags.confidence} />
            </>}
            {file.fileType === 'document' && <>
                <AnalysisItem label="Text Hash" value={(file as DocumentFile).analysis.textHash.value} confidence={(file as DocumentFile).analysis.textHash.confidence} mono />
                <AnalysisItem label="Keyword Density" value={Object.entries((file as DocumentFile).analysis.keywordDensity.value).map(([k,v]) => `${k} (${v})`).join(', ')} confidence={(file as DocumentFile).analysis.keywordDensity.confidence} />
                 <hr className="border-green-800" />
                 <div className="space-y-3">
                    <h4 className="text-lg font-bold text-green-500">AI Summary</h4>
                    <Button onClick={handleSummarize} disabled={isSummarizing}>
                        {isSummarizing ? <Spinner /> : <SparklesIcon className="h-4 w-4 mr-2" />}
                        {isSummarizing ? 'Analyzing...' : 'Summarize with AI'}
                    </Button>
                    {isSummarizing && <p className="text-sm text-green-600">Generating summary, please wait...</p>}
                    {summary && <p className="text-base text-green-400">{summary}</p>}
               </div>
            </>}
        </div>
    );
  };

  const renderHistoryContent = () => {
    return (
        <div className="p-5 space-y-3">
            {comparisonHistory.length > 0 ? (
                comparisonHistory.map(comp => (
                    <div key={comp.id} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-md">
                        <div>
                            <div className="flex items-center">
                                {comp.similarityScore > 95 ? 
                                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" /> : 
                                    <AlertCircleIcon className="h-5 w-5 text-yellow-500 mr-3" />
                                }
                                <div>
                                    <p className="font-semibold text-green-400">Compared with: <span className="font-normal">{comp.otherFile.name}</span></p>
                                    <p className="text-sm text-green-600">{new Date(comp.date).toLocaleString()} - <span className="font-bold">{comp.similarityScore}% match</span></p>
                                </div>
                            </div>
                            
                        </div>
                        <Link to={`/compare/${fileId}/${comp.otherFile.id}`}>
                            <Button variant="secondary" className="text-xs">Revisit</Button>
                        </Link>
                    </div>
                ))
            ) : (
                <div className="text-center text-green-600 py-8"><p>No comparison history for this file.</p></div>
            )}
        </div>
    );
  };

  const renderDuplicatesContent = () => {
    return (
        <div className="p-5 space-y-4">
            {duplicates.length > 0 && (
                <div className="mb-4">
                    <Link to={`/compare/${fileId}/${duplicates[0].id}`}>
                        <Button className="w-full">Compare with Duplicates</Button>
                    </Link>
                </div>
            )}
            {duplicates.length > 0 ? (
                duplicates.map(dup => <DuplicateItem key={dup.id} currentFileId={fileId!} duplicate={dup} onMarkAsNotDuplicate={handleMarkAsNotDuplicate} />)
            ) : (
                <div className="text-center text-green-600 py-8"><p>No duplicates found for this file.</p></div>
            )}
        </div>
    );
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  if (!file) return <div className="text-center text-green-600">File not found.</div>;

  return (
    <div>
      <Button variant="secondary" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back
      </Button>
      <div className="lg:flex lg:space-x-8">
        <div className="lg:w-2/3">
           <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
             {file.fileType === 'video' ? <CustomVideoPlayer file={file as VideoFile} /> :
              file.fileType === 'document' ? <DocumentTextIcon className="h-32 w-32 text-green-900" /> :
              <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-contain rounded-lg" />
             }
           </div>
           <div className="flex items-center">
              <h1 className="text-3xl font-extrabold text-green-400 mt-4">{file.name}</h1>
              {file.fileType === 'video' &&
                <a href={`https://www.imdb.com/find?q=${encodeURIComponent(file.name.replace(/\.[^/.]+$/, ""))}`} target="_blank" rel="noopener noreferrer" title="Search on IMDb" className="mt-4 ml-3 text-green-700 hover:text-green-400">
                    <ExternalLinkIcon className="h-5 w-5" />
                </a>
              }
           </div>
           <p className="text-base text-green-600 font-mono break-all">{file.path}</p>
        </div>
        <div className="lg:w-1/3 mt-6 lg:mt-0">
           <div className="bg-black border border-green-800 rounded-lg overflow-hidden">
                <div className="border-b border-green-800 px-4">
                    <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
                        <TabButton active={activeTab === 'properties'} onClick={() => setActiveTab('properties')}>Properties</TabButton>
                        <TabButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}>AI Analysis</TabButton>
                        <TabButton active={activeTab === 'duplicates'} onClick={() => setActiveTab('duplicates')} badge={duplicates.length}>Duplicates</TabButton>
                        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} badge={comparisonHistory.length}>History</TabButton>
                    </nav>
                </div>
                <div>
                    {activeTab === 'properties' && renderPropertiesContent()}
                    {activeTab === 'analysis' && renderAnalysisContent()}
                    {activeTab === 'duplicates' && renderDuplicatesContent()}
                    {activeTab === 'history' && renderHistoryContent()}
                </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FileDetail;
