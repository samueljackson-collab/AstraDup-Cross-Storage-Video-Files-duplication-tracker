import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFileDetails, getDuplicatesForFile } from '../services/api';
import type { AnyFile, VideoFile, ImageFile, DocumentFile } from '../types';
import Spinner from '../components/Spinner';
import { ArrowLeftIcon, CheckCircleIcon, ChevronDownIcon, ExternalLinkIcon, XCircleIcon } from '../components/Icons';
import Button from '../components/Button';
import { FilmIcon, PhotoIcon, DocumentTextIcon } from '../components/FileTypeIcons';

// --- Accordion Component ---
interface AccordionItemProps {
  title: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, onClick }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="border-b border-slate-800 last:border-b-0">
      {/* Fix: Changed aria-level from string "3" to number {3} to satisfy TypeScript's type checking for accessibility attributes. */}
      <h3 aria-level={3}>
        <button
          type="button"
          className="flex items-center justify-between w-full p-5 font-medium text-left text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700"
          onClick={onClick}
          aria-expanded={isOpen}
        >
          <span className="text-white">{title}</span>
          <ChevronDownIcon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </h3>
      <div
        ref={contentRef}
        style={{ maxHeight: isOpen ? contentRef.current?.scrollHeight : 0 }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        aria-hidden={!isOpen}
      >
        <div className="p-5 border-t border-slate-800 bg-slate-900/50">
          {children}
        </div>
      </div>
    </div>
  );
};

interface AccordionProps {
  items: {
    title: React.ReactNode;
    content: React.ReactNode;
  }[];
  defaultIndex?: number;
}

const Accordion: React.FC<AccordionProps> = ({ items, defaultIndex = 0 }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultIndex);

  const handleClick = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg" id="accordion-main">
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          title={item.title}
          isOpen={openIndex === index}
          onClick={() => handleClick(index)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
};
// --- End of Accordion Component ---

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

const FileDetail: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<AnyFile | null>(null);
  const [duplicates, setDuplicates] = useState<AnyFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fileId) {
      setLoading(true);
      Promise.all([
        getFileDetails(fileId),
        getDuplicatesForFile(fileId)
      ]).then(([fileData, duplicatesData]) => {
        setFile(fileData || null);
        setDuplicates(duplicatesData);
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
    // In a real application, an API call would be made here to persist this change.
  };
  
  const getAccordionItems = () => {
    if (!file) return [];

    const items = [
        {
          title: 'File Properties',
          content: (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
              <DetailItem label="Size" value={`${file.sizeMB} MB`} />
              {file.fileType === 'video' && <DetailItem label="Duration" value={(file as VideoFile).duration} mono />}
              {(file.fileType === 'video' || file.fileType === 'image') && <DetailItem label="Resolution" value={(file as VideoFile | ImageFile).resolution} mono />}
              {file.fileType === 'video' && <DetailItem label="Codec" value={(file as VideoFile).codec} />}
              {file.fileType === 'image' && <DetailItem label="Camera" value={(file as ImageFile).exif.cameraModel} />}
              {file.fileType === 'image' && <DetailItem label="Date Taken" value={new Date((file as ImageFile).exif.dateTaken).toLocaleString()} />}
              {file.fileType === 'document' && <DetailItem label="Page Count" value={(file as DocumentFile).pageCount} />}
              {file.fileType === 'document' && <DetailItem label="Author" value={(file as DocumentFile).author} />}
            </dl>
          )
        }
    ];

    if (file.fileType === 'video') {
        const video = file as VideoFile;
        items.push({
            title: 'Enriched Data',
            content: (
                 <dl className="grid grid-cols-1 gap-y-4">
                  <DetailItem label="Suggested Title" value={video.enrichedData.title} />
                  <div>
                    <dt className="text-sm font-medium text-slate-400">Plot Summary</dt>
                    <dd className="mt-1 text-sm text-white">{video.enrichedData.plot}</dd>
                  </div>
                  <DetailItem label="Genre" value={video.enrichedData.genre} />
                </dl>
            )
        });
    }

    items.push({
      title: 'AI Analysis',
      content: <div className="space-y-6">{renderAnalysisItems()}</div>
    });
    
    items.push({
        title: `Duplicates (${duplicates.length})`,
        content: (
            <div className="space-y-4">
                {duplicates.length > 0 ? (
                    duplicates.map(dup => <DuplicateItem key={dup.id} currentFileId={file.id} duplicate={dup} onMarkAsNotDuplicate={handleMarkAsNotDuplicate} />)
                ) : (
                    <div className="text-center text-slate-400 py-8 bg-slate-800/20 rounded-lg"><p>No other duplicates found.</p></div>
                )}
            </div>
        )
    });

    return items;
  };
  
  const renderAnalysisItems = () => {
    if (!file) return null;
    switch(file.fileType) {
        case 'video':
            const v = file as VideoFile;
            return <>
                <AnalysisItem label="Perceptual Hash" value={v.analysis.pHash.value} confidence={v.analysis.pHash.confidence} mono />
                <AnalysisItem label="Difference Hash" value={v.analysis.dHash.value} confidence={v.analysis.dHash.confidence} mono />
                <AnalysisItem label="Audio Fingerprint" value={v.analysis.audioFingerprint.value} confidence={v.analysis.audioFingerprint.confidence} mono />
                <AnalysisItem label="Scene Embeddings" confidence={v.analysis.sceneEmbeddings.confidence} />
                <AnalysisItem label="Face Clusters" value={`${v.analysis.faceClusters.value} clusters`} confidence={v.analysis.faceClusters.confidence} />
            </>;
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
  };
  
  if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  if (!file) return <div className="text-center text-slate-400">File not found.</div>;

  return (
    <div>
      <Button variant="secondary" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back
      </Button>
      <div className="lg:flex lg:space-x-8">
        <div className="lg:w-1/2">
          {file.fileType === 'video' ? (
             <video controls poster={file.thumbnailUrl} src={(file as VideoFile).videoUrl} className="rounded-lg w-full aspect-video object-contain bg-black" />
          ) : (
             <img src={file.thumbnailUrl} alt={file.name} className="rounded-lg w-full aspect-video object-cover bg-black" />
          )}
           <div className="flex items-center">
             <h1 className="text-2xl font-bold text-white mt-4">{file.name}</h1>
             {file.fileType === 'video' && (
                 <a href={`https://www.imdb.com/find?q=${encodeURIComponent(file.name.replace(/\.[^/.]+$/, ""))}`} target="_blank" rel="noopener noreferrer" title="Search on IMDb" className="mt-4 ml-3 text-slate-500 hover:text-indigo-400">
                     <ExternalLinkIcon className="h-5 w-5" />
                 </a>
             )}
           </div>
          <p className="text-sm text-slate-400 font-mono break-all">{file.path}</p>
        </div>
        <div className="lg:w-1/2 mt-6 lg:mt-0">
          <Accordion items={getAccordionItems()} />
        </div>
      </div>
    </div>
  );
};

export default FileDetail;