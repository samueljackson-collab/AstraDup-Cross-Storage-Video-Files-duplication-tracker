
import React, { useState, useCallback, useRef } from 'react';
import type { GenerateContentResponse } from '@google/genai';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { FilmIcon, PhotoIcon } from '../components/FileTypeIcons';
import { GlobeIcon, UploadCloudIcon, SparklesIcon } from '../components/Icons';
import { analyzeImage, analyzeVideoFrames, groundedQuery } from '../services/gemini';

type AnalyzerTool = 'image' | 'video' | 'web';

// --- Shared Components ---

const Dropzone: React.FC<{ onDrop: (file: File) => void; accept: string; fileType: string }> = ({ onDrop, accept, fileType }) => {
    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onDrop(e.dataTransfer.files[0]);
        }
    }, [onDrop]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onDrop(e.target.files[0]);
        }
    };

    return (
        <label
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-green-700 border-dashed rounded-lg cursor-pointer bg-black/50 hover:bg-green-900/20 transition-colors"
        >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-green-600">
                <UploadCloudIcon className="w-10 h-10 mb-3" />
                <p className="mb-2 text-base"><span className="font-semibold text-green-400">Click to upload</span> or drag and drop</p>
                <p className="text-sm">Your {fileType} file</p>
            </div>
            <input type="file" className="hidden" accept={accept} onChange={handleFileChange} />
        </label>
    );
};

const ResultDisplay: React.FC<{ result: GenerateContentResponse | null; error?: string }> = ({ result, error }) => {
    const sources = result?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    return (
        <div className="bg-black border border-green-800 rounded-lg p-5 mt-4 min-h-[10rem]">
            {error ? (
                <p className="text-red-400">{error}</p>
            ) : result ? (
                <>
                    <p className="text-green-400 whitespace-pre-wrap font-mono text-base">{result.text}</p>
                    {sources && sources.length > 0 && (
                         <div className="mt-6 border-t border-green-800 pt-4">
                            <h4 className="text-base font-bold text-green-500 mb-2">Sources:</h4>
                            <ul className="space-y-2">
                                {sources.map((source: any, index: number) => (
                                    source.web && (
                                        <li key={index} className="text-sm">
                                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline truncate block">
                                               {source.web.title || source.web.uri}
                                            </a>
                                        </li>
                                    )
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            ) : (
                <p className="text-green-700 text-base">AI response will appear here...</p>
            )}
        </div>
    );
};

// --- Analyzer Tools ---

const ImageAnalyzer = () => {
    const [file, setFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState<string>('What is in this image?');
    const [result, setResult] = useState<GenerateContentResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!file || !prompt) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const response = await analyzeImage(prompt, file);
            setResult(response);
        } catch (e) {
            setError('Failed to analyze image. Please check the API key and try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                {file ? <img src={URL.createObjectURL(file)} alt="preview" className="rounded-lg w-full aspect-video object-contain bg-black" /> : <Dropzone onDrop={setFile} accept="image/*" fileType="image" />}
                {file && <Button variant="secondary" className="w-full mt-2" onClick={() => setFile(null)}>Clear Image</Button>}
            </div>
            <div>
                <h3 className="text-xl font-bold text-green-400 mb-2">Your Prompt</h3>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="w-full bg-black border border-green-700 rounded-md py-2 px-3 text-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-base"
                    placeholder="e.g., Describe this scene, what is the brand of the car?"
                />
                <Button onClick={handleSubmit} disabled={!file || !prompt || loading} className="w-full mt-4">
                    {loading ? <Spinner /> : <><SparklesIcon className="h-4 w-4 mr-2" />Analyze Image</>}
                </Button>
                <ResultDisplay result={result} error={error} />
            </div>
        </div>
    );
};

const VideoAnalyzer = () => {
    const [file, setFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState<string>('Describe what happens in this video based on these frames.');
    const [result, setResult] = useState<GenerateContentResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const extractFrames = (duration: number): Promise<{ data: string, mimeType: string }[]> => {
        return new Promise((resolve) => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return resolve([]);
    
            const frames: { data: string, mimeType: string }[] = [];
            const timestamps = [duration * 0.1, duration * 0.3, duration * 0.5, duration * 0.7, duration * 0.9];
            if (timestamps.some(isNaN)) {
                console.error("Invalid video duration, cannot extract frames.");
                return resolve([]);
            }
    
            let index = 0;
    
            const seekListener = () => {
                if (index < timestamps.length) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                    frames.push({ data: canvas.toDataURL('image/jpeg', 0.8), mimeType: 'image/jpeg' });
                    index++;
                    if (index < timestamps.length) {
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

    const handleSubmit = async () => {
        if (!file || !prompt || !videoRef.current) return;
        setLoading(true);
        setError('');
        setResult(null);

        setStatus('Extracting frames...');
        const frames = await extractFrames(videoRef.current.duration);
        
        if (frames.length === 0) {
            setError('Could not extract frames from video.');
            setLoading(false);
            return;
        }

        setStatus('Analyzing video...');
        try {
            const response = await analyzeVideoFrames(prompt, frames);
            setResult(response);
        } catch (e) {
            setError('Failed to analyze video. Please check the API key and try again.');
            console.error(e);
        } finally {
            setLoading(false);
            setStatus('');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                {file ? <video ref={videoRef} src={URL.createObjectURL(file)} controls className="rounded-lg w-full aspect-video object-contain bg-black" crossOrigin="anonymous" preload="metadata"/> : <Dropzone onDrop={setFile} accept="video/*" fileType="video" />}
                <canvas ref={canvasRef} className="hidden" />
                {file && <Button variant="secondary" className="w-full mt-2" onClick={() => setFile(null)}>Clear Video</Button>}
            </div>
            <div>
                <h3 className="text-xl font-bold text-green-400 mb-2">Your Prompt</h3>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="w-full bg-black border border-green-700 rounded-md py-2 px-3 text-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-base"
                    placeholder="e.g., Summarize this video, what are the key objects?"
                />
                <Button onClick={handleSubmit} disabled={!file || !prompt || loading} className="w-full mt-4">
                    {loading ? <><Spinner /> <span className="ml-2">{status}</span></> : <><SparklesIcon className="h-4 w-4 mr-2" />Analyze Video</>}
                </Button>
                <ResultDisplay result={result} error={error} />
            </div>
        </div>
    );
};


const WebAnalyzer = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [result, setResult] = useState<GenerateContentResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!prompt) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const response = await groundedQuery(prompt);
            setResult(response);
        } catch (e) {
            setError('Failed to query web. Please check the API key and try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-green-400 mb-2">Ask a question</h3>
             <div className="flex">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-grow bg-black border border-green-700 rounded-l-md py-2 px-3 text-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-base"
                    placeholder="Who won the last F1 race?"
                    onKeyUp={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <Button onClick={handleSubmit} disabled={!prompt || loading} className="rounded-l-none">
                    {loading ? <Spinner /> : 'Ask'}
                </Button>
            </div>
            <ResultDisplay result={result} error={error} />
        </div>
    );
};


// --- Main Component ---

const AnalyzerPage: React.FC = () => {
    const [activeTool, setActiveTool] = useState<AnalyzerTool>('image');

    const renderTool = () => {
        switch (activeTool) {
            case 'image': return <ImageAnalyzer />;
            case 'video': return <VideoAnalyzer />;
            case 'web': return <WebAnalyzer />;
            default: return null;
        }
    };
    
    const TabButton: React.FC<{ tool: AnalyzerTool, label: string, icon: React.FC<any> }> = ({ tool, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTool(tool)}
            className={`flex items-center space-x-2 px-4 py-2 text-base font-semibold rounded-md transition-colors ${
                activeTool === tool ? 'bg-green-600 text-black font-bold' : 'text-green-600 hover:bg-green-900/20 hover:text-green-400'
            }`}
        >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-green-400 mb-2">AI Analyzer</h1>
            <p className="text-green-600 mb-8 text-lg">Use generative AI to understand your media and get up-to-date information from the web.</p>
            
            <div className="flex space-x-2 border-b border-green-800 mb-8 pb-4">
                <TabButton tool="image" label="Image Analysis" icon={PhotoIcon} />
                <TabButton tool="video" label="Video Analysis" icon={FilmIcon} />
                <TabButton tool="web" label="Web Analysis" icon={GlobeIcon} />
            </div>

            {renderTool()}
        </div>
    );
};

export default AnalyzerPage;