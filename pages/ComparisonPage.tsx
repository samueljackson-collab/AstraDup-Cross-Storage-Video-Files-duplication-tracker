
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFileDetails } from '../services/api';
import { analyzeVideoFrames, groundedQuery } from '../services/gemini';
import type { AnyFile, VideoFile, ImageFile, DocumentFile, EnrichedVideoMetadata } from '../types';
import Spinner from '../components/Spinner';
import { ArrowLeftIcon, CheckCircleIcon, TrashIcon } from '../components/Icons';
import Button from '../components/Button';

// --- Shared Components ---
const DetailItem: React.FC<{ label: string; value: React.ReactNode; mono?: boolean, highlight?: boolean }> = ({ label, value, mono, highlight }) => (
  <div>
    <dt className="text-sm font-semibold text-green-600">{label}</dt>
    <dd className={`mt-1 text-sm break-words ${mono ? 'font-mono' : ''} ${highlight ? 'text-green-300 bg-green-900/50 p-1 rounded' : 'text-green-400'}`}>{value}</dd>
  </div>
);

const AnalysisItem: React.FC<{ label: string; value?: React.ReactNode; confidence: number; mono?: boolean }> = ({ label, value, confidence, mono }) => {
    const confidenceColor = 'bg-green-500';
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <dt className="text-sm font-semibold text-green-600">{label}</dt>
                <dd className="text-sm font-bold text-green-400">{confidence}%</dd>
            </div>
            <div className="w-full bg-green-900 rounded-full h-1" title={`${confidence}% confidence`}><div className={`${confidenceColor} h-1 rounded-full`} style={{ width: `${confidence}%` }}></div></div>
            {value && <div className={`mt-1.5 text-sm text-green-500 truncate ${mono ? 'font-mono' : ''}`} title={typeof value === 'string' ? value : undefined}>{value}</div>}
        </div>
    );
};

const ActionPanel: React.FC<{ fileToKeep: AnyFile, fileToDelete: AnyFile, onDelete: (file: AnyFile) => void }> = ({ fileToKeep, fileToDelete, onDelete }) => {
    return (
        <div className="bg-black border border-green-800 rounded-lg p-3 mt-4 grid grid-cols-2 gap-3">
             <Button variant="primary" className="text-xs" onClick={() => onDelete(fileToDelete)}>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Keep This
            </Button>
            <Button variant="secondary" className="text-xs bg-red-900/50 hover:bg-red-900 border-red-800 text-red-300 hover:text-red-200 focus:ring-red-500" onClick={() => onDelete(fileToDelete)}>
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Other
            </Button>
        </div>
    )
};

const ConfirmationModal: React.FC<{ file: AnyFile | null, onConfirm: () => void, onCancel: () => void }> = ({ file, onConfirm, onCancel }) => {
    if (!file) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-black border border-green-700 rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                        <TrashIcon className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-4 text-left">
                        <h3 className="text-xl leading-6 font-bold text-green-400">Confirm Deletion</h3>
                        <div className="mt-2">
                            <p className="text-base text-green-600">Are you sure you want to permanently delete this file? This action cannot be undone.</p>
                            <div className="mt-3 bg-gray-900 p-2 rounded text-sm">
                                <p className="font-bold text-green-400 truncate">{file.name}</p>
                                <p className="font-mono text-green-700 truncate">{file.path}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 focus:ring-red-500 w-full sm:ml-3 sm:w-auto">
                        Confirm Delete
                    </Button>
                    <Button onClick={onCancel} variant="secondary" className="mt-3 w-full sm:mt-0 sm:w-auto">
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- Video Comparison ---
const FILENAME_TEMPLATE = "{title} ({year})"; // In a real app, this would come from settings

const EnrichmentPanel: React.FC<{ file: VideoFile }> = ({ file }) => {
    const [suggestions, setSuggestions] = useState<EnrichedVideoMetadata | null>(null);
    const [loading, setLoading] = useState(false);
    const [isApplied, setIsApplied] = useState(false);
    const [error, setError] = useState('');

    const [selectedChanges, setSelectedChanges] = useState({ title: true, plot: true, genre: true, actors: true, rename: true });
    const [manualTitle, setManualTitle] = useState('');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(suggestions) {
            setManualTitle(suggestions.title);
            // Smartly decide if renaming is needed
            const currentName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
            const suggestedTitle = suggestions.title.replace(/_/g, " ");
            if (currentName.toLowerCase().includes(suggestedTitle.toLowerCase()) || suggestedTitle.toLowerCase().includes(currentName.toLowerCase())) {
                setSelectedChanges(prev => ({ ...prev, rename: false }));
            }
        }
    }, [suggestions, file.name]);
    
     const extractFrames = (duration: number): Promise<{ data: string, mimeType: string }[]> => {
        return new Promise((resolve, reject) => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return reject(new Error("Video or Canvas not ready"));

            const frames: { data: string, mimeType: string }[] = [];
            const timestamps = [duration * 0.2, duration * 0.5, duration * 0.8];
            let index = 0;
            
            const seekListener = () => {
                if(index < timestamps.length) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
                    frames.push({ data: canvas.toDataURL('image/jpeg', 0.8), mimeType: 'image/jpeg' });
                    index++;
                    if(index < timestamps.length) {
                        video.currentTime = timestamps[index];
                    } else {
                        video.removeEventListener('seeked', seekListener);
                        resolve(frames);
                    }
                }
            };

            const loadedMetadataListener = () => {
                 video.addEventListener('seeked', seekListener);
                 video.currentTime = timestamps[index];
            };

            video.addEventListener('loadedmetadata', loadedMetadataListener, { once: true });
            
            if (video.readyState >= 1) { // If metadata already loaded
                loadedMetadataListener();
            }
        });
    };

    const handleEnrich = async () => {
        setLoading(true);
        setIsApplied(false);
        setSuggestions(null);
        setError('');
        
        if (!videoRef.current) {
            setLoading(false);
            setError("Video element ref is not available.");
            return;
        }

        try {
            const frames = await extractFrames(videoRef.current.duration);
            if (frames.length === 0) throw new Error("Could not extract any frames from the video.");

            const prompt = `Analyze the video frames. The current filename is "${file.name}". Suggest a proper title, a short plot summary, potential actors, and a genre. Respond ONLY with a valid JSON object with keys: "title", "plot", "actors" (string array), "genre" (string), and "releaseDate" (YYYY-MM-DD string, or empty string if unknown).`;
            const response = await analyzeVideoFrames(prompt, frames);
            
            let jsonString = response.text.trim();
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            } else if (jsonString.startsWith('```')) {
                 jsonString = jsonString.substring(3, jsonString.length - 3).trim();
            }
            
            const data = JSON.parse(jsonString);

            const searchQuery = `"${data.title}" ${data.releaseDate ? `(${data.releaseDate.split('-')[0]})` : ''} movie details`;
            const searchResponse = await groundedQuery(searchQuery);
            const firstWebResult = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks?.find((c: any) => c.web)?.web;

            const finalSuggestions: EnrichedVideoMetadata = {
                title: data.title || file.name,
                plot: data.plot || 'No plot summary available.',
                actors: data.actors || [],
                genre: data.genre || 'Unknown',
                releaseDate: data.releaseDate || '',
                source: {
                    name: firstWebResult?.title || "Gemini AI Analysis",
                    url: firstWebResult?.uri || "",
                }
            };
            setSuggestions(finalSuggestions);
        } catch (err) {
            console.error("Failed to enrich metadata:", err);
            setError("Failed to analyze video. Please check your API key and network connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        // Here you would make an API call to save the changes
        console.log("Applying changes:", { fileId: file.id, selectedChanges, manualTitle });
        setIsApplied(true);
    };

    const suggestedFilename = useMemo(() => {
        if (!suggestions) return '';
        const year = suggestions.releaseDate ? suggestions.releaseDate.split('-')[0] : 'N/A';
        const cleanTitle = manualTitle.replace(/[^\w\s]/gi, '').replace(/\s+/g, '.');

        return FILENAME_TEMPLATE
            .replace('{title}', cleanTitle)
            .replace('{year}', year)
            .replace('{resolution}', file.resolution) // Assuming file is available
            + '.mp4'; // Add extension
    }, [suggestions, manualTitle, file.resolution]);

    if (isApplied) {
        return <div className="bg-black border border-green-800 rounded-lg p-4 mt-4 text-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-base font-bold text-green-400">Metadata Updated!</p>
        </div>
    }

    return (
        <>
            <video ref={videoRef} src={file.videoUrl} className="hidden" crossOrigin="anonymous" preload="metadata" muted playsInline></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            <div className={`bg-black border ${suggestions ? 'border-2 border-green-600' : 'border-green-800'} rounded-lg p-4 mt-4`}>
                {!suggestions ? (
                    <>
                        <h3 className="text-lg font-bold text-green-400 mb-2">Enrich Metadata</h3>
                        <p className="text-sm text-green-600 mb-4">Use AI to analyze the video and fetch rich metadata like title, plot, and actors from online databases.</p>
                        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
                        <Button onClick={handleEnrich} disabled={loading} className="w-full">
                            {loading ? <Spinner /> : 'Find & Suggest Metadata'}
                        </Button>
                    </>
                ) : (
                    <>
                        <h3 className="text-lg font-bold text-green-400 mb-2">Enrichment Suggestions</h3>
                        <p className="text-sm text-green-600 mb-4">Review and apply suggested changes. Source: <a href={suggestions.source.url} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">{suggestions.source.name}</a></p>
                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="flex items-center"><input type="checkbox" checked={selectedChanges.title} onChange={e => setSelectedChanges({...selectedChanges, title: e.target.checked})} className="h-4 w-4 rounded bg-gray-900 border-green-700 text-green-500 focus:ring-green-500" /> <span className="ml-2 text-green-600">Title</span></label>
                                <input type="text" value={manualTitle} onChange={e => setManualTitle(e.target.value)} className="w-full bg-black border border-green-700 rounded-md py-1 px-2 text-green-300 mt-1 text-sm" />
                            </div>
                            <div>
                                <label className="flex items-center"><input type="checkbox" checked={selectedChanges.plot} onChange={e => setSelectedChanges({...selectedChanges, plot: e.target.checked})} className="h-4 w-4 rounded bg-gray-900 border-green-700 text-green-500 focus:ring-green-500" /> <span className="ml-2 text-green-600">Plot Summary</span></label>
                                <p className="text-green-500 mt-1 p-2 bg-green-900/20 rounded">{suggestions.plot}</p>
                            </div>
                            <div>
                                <label className="flex items-center"><input type="checkbox" checked={selectedChanges.genre} onChange={e => setSelectedChanges({...selectedChanges, genre: e.target.checked})} className="h-4 w-4 rounded bg-gray-900 border-green-700 text-green-500 focus:ring-green-500" /> <span className="ml-2 text-green-600">Genre</span></label>
                                <p className="text-green-500 mt-1 p-2 bg-green-900/20 rounded">{suggestions.genre}</p>
                            </div>
                             <hr className="border-green-800" />
                            <div>
                                <label className="flex items-center"><input type="checkbox" checked={selectedChanges.rename} onChange={e => setSelectedChanges({...selectedChanges, rename: e.target.checked})} className="h-4 w-4 rounded bg-gray-900 border-green-700 text-green-500 focus:ring-green-500" /> <span className="ml-2 text-green-600">Suggest New Filename</span></label>
                                <p className="text-green-400 mt-1 p-2 bg-green-900/20 rounded font-mono break-all">{suggestedFilename}</p>
                            </div>
                        </div>
                        <Button onClick={handleApply} className="w-full mt-4">Confirm & Apply Changes</Button>
                    </>
                )}
            </div>
        </>
    );
};

const VideoColumn: React.FC<{ file: VideoFile, original: VideoFile, onDelete: (file: AnyFile) => void }> = ({ file, original, onDelete }) => (
    <div className="w-full">
        <div className="relative">
            <video controls poster={file.thumbnailUrl} src={file.videoUrl} className="rounded-lg w-full aspect-video object-contain bg-black">
                Your browser does not support the video tag.
            </video>
            {file.resolution !== original.resolution && <span className="absolute top-2 right-2 bg-green-900/80 text-green-300 text-xs font-bold px-2 py-1 rounded-full">{file.resolution}</span>}
        </div>
        <h2 className="text-2xl font-extrabold text-green-400 mt-4 truncate">{file.name}</h2>
        <p className="text-sm text-green-600 font-mono break-all">{file.path}</p>
        <ActionPanel fileToKeep={file} fileToDelete={original} onDelete={onDelete} />
        <div className="bg-black border border-green-800 rounded-lg p-4 mt-4">
            <h3 className="text-lg font-bold text-green-400 border-b border-green-800 pb-2 mb-3">File Metadata</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                <DetailItem label="Size" value={`${file.sizeMB} MB`} highlight={file.sizeMB !== original.sizeMB} />
                <DetailItem label="Duration" value={file.duration} mono highlight={file.duration !== original.duration} />
                <DetailItem label="Resolution" value={file.resolution} mono highlight={file.resolution !== original.resolution} />
                <DetailItem label="Codec" value={file.codec} highlight={file.codec !== original.codec} />
            </dl>
        </div>
         <div className="bg-black border border-green-800 rounded-lg p-4 mt-4">
            <h3 className="text-lg font-bold text-green-400 border-b border-green-800 pb-2 mb-3">Enriched Data</h3>
            <dl className="grid grid-cols-1 gap-y-4">
                <DetailItem label="Title" value={file.enrichedData.title} highlight={file.enrichedData.title !== original.enrichedData.title} />
                <DetailItem label="Plot" value={file.enrichedData.plot} highlight={file.enrichedData.plot !== original.enrichedData.plot} />
                <DetailItem label="Genre" value={file.enrichedData.genre} highlight={file.enrichedData.genre !== original.enrichedData.genre} />
            </dl>
        </div>
        <div className="bg-black border border-green-800 rounded-lg p-4 mt-4">
            <h3 className="text-lg font-bold text-green-400 border-b border-green-800 pb-2 mb-3">AI Analysis</h3>
            <div className="space-y-4">
                <AnalysisItem label="pHash" value={file.analysis.pHash.value} confidence={file.analysis.pHash.confidence} mono />
                <AnalysisItem label="dHash" value={file.analysis.dHash.value} confidence={file.analysis.dHash.confidence} mono />
                <AnalysisItem label="Audio Fingerprint" value={file.analysis.audioFingerprint.value} confidence={file.analysis.audioFingerprint.confidence} mono />
                <AnalysisItem label="Scene Embeddings" confidence={file.analysis.sceneEmbeddings.confidence} />
                <AnalysisItem label="Face Clusters" value={`${file.analysis.faceClusters.value} clusters`} confidence={file.analysis.faceClusters.confidence} />
            </div>
        </div>
        <EnrichmentPanel file={file} />
    </div>
);

// --- Image Comparison ---
const ImageColumn: React.FC<{ file: ImageFile, original: ImageFile, onDelete: (file: AnyFile) => void, showDiff?: boolean, overlaySrc?: string }> = ({ file, original, onDelete, showDiff, overlaySrc }) => {
    const hasExifDiff = file.resolution !== original.resolution || file.exif.cameraModel !== original.exif.cameraModel || file.exif.dateTaken !== original.exif.dateTaken || file.exif.iso !== original.exif.iso;
    return (
        <div className="w-full">
            <div className={`relative rounded-lg overflow-hidden ${hasExifDiff ? 'border-2 border-green-500/50' : ''}`}>
                <img src={file.thumbnailUrl} alt={file.name} className="w-full aspect-video object-contain bg-black" />
                {showDiff && overlaySrc && <img src={overlaySrc} alt="diff" className="absolute top-0 left-0 w-full h-full aspect-video object-contain mix-blend-difference" />}
            </div>
            <h2 className="text-2xl font-extrabold text-green-400 mt-4 truncate">{file.name}</h2>
            <p className="text-sm text-green-600 font-mono break-all">{file.path}</p>
            <ActionPanel fileToKeep={file} fileToDelete={original} onDelete={onDelete} />
            <div className="bg-black border border-green-800 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-bold text-green-400 border-b border-green-800 pb-2 mb-3">EXIF Data</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <DetailItem label="Resolution" value={file.resolution} mono highlight={file.resolution !== original.resolution} />
                    <DetailItem label="Camera" value={file.exif.cameraModel} highlight={file.exif.cameraModel !== original.exif.cameraModel} />
                    <DetailItem label="Date Taken" value={new Date(file.exif.dateTaken).toLocaleString()} highlight={file.exif.dateTaken !== original.exif.dateTaken} />
                    <DetailItem label="ISO" value={file.exif.iso} highlight={file.exif.iso !== original.exif.iso} />
                </dl>
            </div>
            <div className="bg-black border border-green-800 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-bold text-green-400 border-b border-green-800 pb-2 mb-3">AI Analysis</h3>
                <div className="space-y-4">
                    <AnalysisItem label="pHash" value={file.analysis.pHash.value} confidence={file.analysis.pHash.confidence} mono />
                    <AnalysisItem label="dHash" value={file.analysis.dHash.value} confidence={file.analysis.dHash.confidence} mono />
                    <AnalysisItem label="Object Tags" value={file.analysis.objectTags.value.join(', ')} confidence={file.analysis.objectTags.confidence} />
                </div>
            </div>
        </div>
    );
};

// --- Document Comparison ---
const DocumentColumn: React.FC<{ file: DocumentFile, original: DocumentFile, onDelete: (file: AnyFile) => void, showDiff: boolean }> = ({ file, original, onDelete, showDiff }) => (
    <div className="w-full bg-black border border-green-800 rounded-lg p-4 flex flex-col">
        <div className="flex justify-between items-start">
            <h2 className="text-2xl font-extrabold text-green-400 truncate">{file.name}</h2>
            {file.pageCount !== original.pageCount && <span className="flex-shrink-0 ml-2 bg-green-900/80 text-green-300 text-sm font-bold px-2 py-1 rounded-full">{file.pageCount} pages</span>}
        </div>
        <p className="text-sm text-green-600 font-mono break-all mb-4">{file.path}</p>
        <ActionPanel fileToKeep={file} fileToDelete={original} onDelete={onDelete} />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 my-4">
            <DetailItem label="Size" value={`${file.sizeMB} MB`} highlight={file.sizeMB !== original.sizeMB} />
            <DetailItem label="Page Count" value={file.pageCount} highlight={file.pageCount !== original.pageCount} />
            <DetailItem label="Word Count" value={file.wordCount} highlight={file.wordCount !== original.wordCount} />
            <DetailItem label="Author" value={file.author} highlight={file.author !== original.author} />
        </dl>
        <div className="bg-black rounded-lg p-3 text-sm text-green-500 flex-grow overflow-y-auto font-mono h-96">
           {showDiff ? (
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit... <span className="bg-red-900/50 text-red-300 line-through">Vestibulum ante ipsum primis in faucibus</span> orci luctus et ultrices posuere cubilia Curae; <span className="bg-green-900/50 text-green-300">This is an added sentence for clarity.</span> Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem.</p>
           ) : (
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit... Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem.</p>
           )}
        </div>
    </div>
);

const ComparisonPage: React.FC = () => {
    const { fileId1, fileId2 } = useParams<{ fileId1: string, fileId2: string }>();
    const navigate = useNavigate();
    const [files, setFiles] = useState<[AnyFile | null, AnyFile | null]>([null, null]);
    const [loading, setLoading] = useState(true);
    const [showPixelDiff, setShowPixelDiff] = useState(false);
    const [showTextDiff, setShowTextDiff] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState<AnyFile | null>(null);

    useEffect(() => {
        if (fileId1 && fileId2) {
            setLoading(true);
            Promise.all([ getFileDetails(fileId1), getFileDetails(fileId2) ])
                .then(([data1, data2]) => { setFiles([data1 || null, data2 || null]); setLoading(false); })
                .catch(error => { console.error("Failed to fetch file details", error); setLoading(false); });
        }
    }, [fileId1, fileId2]);

    const handleDeleteRequest = (file: AnyFile) => {
        setConfirmingDelete(file);
    };

    const handleConfirmDelete = () => {
        if (confirmingDelete) {
            console.log(`Deleting file: ${confirmingDelete.id}`);
            alert(`File "${confirmingDelete.name}" has been marked for deletion.`);
            setConfirmingDelete(null);
            navigate(-1); // Go back after deletion
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    
    const [file1, file2] = files;
    if (!file1 || !file2 || file1.fileType !== file2.fileType) {
        return <div className="text-center text-green-600">Files for comparison could not be found or are of different types.</div>;
    }

    const renderComparison = () => {
        switch (file1.fileType) {
            case 'video': return <>
                <VideoColumn file={file1 as VideoFile} original={file2 as VideoFile} onDelete={handleDeleteRequest}/>
                <div className="hidden md:flex items-center justify-center px-4"><div className="text-3xl font-bold text-green-800">VS</div></div>
                <VideoColumn file={file2 as VideoFile} original={file1 as VideoFile} onDelete={handleDeleteRequest}/>
            </>;
            case 'image': return <>
                <ImageColumn file={file1 as ImageFile} original={file2 as ImageFile} onDelete={handleDeleteRequest} showDiff={showPixelDiff} overlaySrc={file2.thumbnailUrl} />
                <div className="hidden md:flex flex-col items-center justify-center px-4">
                    <div className="text-3xl font-bold text-green-800 mb-4">VS</div>
                    <Button variant="secondary" className="text-xs" onClick={() => setShowPixelDiff(!showPixelDiff)}>{showPixelDiff ? 'Hide' : 'Show'} Pixel Diff</Button>
                </div>
                <ImageColumn file={file2 as ImageFile} original={file1 as ImageFile} onDelete={handleDeleteRequest}/>
            </>;
            case 'document': return <>
                <DocumentColumn file={file1 as DocumentFile} original={file2 as DocumentFile} onDelete={handleDeleteRequest} showDiff={showTextDiff} />
                 <div className="hidden lg:flex flex-col items-center justify-center px-4">
                    <div className="text-3xl font-bold text-green-800 mb-4">VS</div>
                    <Button variant="secondary" className="text-xs" onClick={() => setShowTextDiff(!showTextDiff)}>{showTextDiff ? 'Hide' : 'Show'} Text Diff</Button>
                </div>
                <DocumentColumn file={file2 as DocumentFile} original={file1 as DocumentFile} onDelete={handleDeleteRequest} showDiff={showTextDiff} />
            </>;
            default: return null;
        }
    };

    return (
        <div>
            <ConfirmationModal file={confirmingDelete} onConfirm={handleConfirmDelete} onCancel={() => setConfirmingDelete(null)} />
            <Button variant="secondary" onClick={() => navigate(-1)} className="mb-6"><ArrowLeftIcon className="h-4 w-4 mr-2" />Back</Button>
            <h1 className="text-4xl font-extrabold tracking-tight text-green-400 mb-8 capitalize">{file1.fileType} Duplicate Comparison</h1>
            <div className={`flex flex-col ${file1.fileType === 'document' ? 'lg:flex-row' : 'md:flex-row'} gap-8`}>
                {renderComparison()}
            </div>
        </div>
    );
};

export default ComparisonPage;