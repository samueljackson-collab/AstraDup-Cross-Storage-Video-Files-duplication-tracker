
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { AnyFile, VideoFile, ImageFile, DocumentFile } from '../types';
import { FilmIcon, PhotoIcon, DocumentTextIcon } from './FileTypeIcons';
import Button from './Button';
import { InfoIcon, PlayIcon, PauseIcon, VolumeHighIcon, VolumeMutedIcon } from './Icons';

const VideoPreview: React.FC<{ file: VideoFile }> = ({ file }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLInputElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const togglePlayPause = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (videoRef.current?.paused) {
            videoRef.current?.play();
        } else {
            videoRef.current?.pause();
        }
    }, []);

    const handleTimeUpdate = () => {
        if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
    };
    
    const handleLoadedMetadata = () => {
        if (videoRef.current) setDuration(videoRef.current.duration);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (videoRef.current) videoRef.current.currentTime = Number(e.target.value);
    };
    
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };
    
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        
        const playHandler = () => setIsPlaying(true);
        const pauseHandler = () => setIsPlaying(false);
        const volumeChangeHandler = () => {
            if(video) {
                setVolume(video.volume);
                setIsMuted(video.muted);
            }
        };

        video.addEventListener('play', playHandler);
        video.addEventListener('pause', pauseHandler);
        video.addEventListener('ended', pauseHandler);
        video.addEventListener('volumechange', volumeChangeHandler);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        
        return () => {
            video.removeEventListener('play', playHandler);
            video.removeEventListener('pause', pauseHandler);
            video.removeEventListener('ended', pauseHandler);
            video.removeEventListener('volumechange', volumeChangeHandler);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, []);

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="relative group aspect-video bg-black rounded-t-lg overflow-hidden">
            <video
                ref={videoRef}
                poster={file.thumbnailUrl}
                src={file.videoUrl}
                className="w-full h-full object-contain"
                muted
                playsInline
                preload="metadata"
                onMouseEnter={e => e.currentTarget.play()}
                onMouseLeave={e => e.currentTarget.pause()}
            >
                Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2 pointer-events-none">
                <div className="flex justify-between items-start">
                    <span className="bg-black/50 text-green-300 text-xs px-1.5 py-0.5 rounded">{file.resolution}</span>
                    <div className="bg-black/50 p-1 rounded-full"><FilmIcon className="h-4 w-4 text-green-300" /></div>
                </div>
                <div className="pointer-events-auto">
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        onClick={e => e.stopPropagation()}
                        className="w-full h-1 bg-green-900/50 rounded-lg appearance-none cursor-pointer range-sm"
                        style={{ backgroundSize: `${progressPercent}% 100%` }}
                    />
                     <div className="flex items-center justify-between text-white mt-1">
                        <button onClick={togglePlayPause} className="text-white hover:text-green-400">
                            {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                        </button>
                        <button onClick={toggleMute} className="text-white hover:text-green-400">
                            {(isMuted || volume === 0) ? <VolumeMutedIcon className="w-5 h-5" /> : <VolumeHighIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ImagePreview: React.FC<{ file: ImageFile }> = ({ file }) => {
    return (
        <div className="relative group aspect-video">
            <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover rounded-t-lg bg-black" />
            <div className="absolute bottom-2 right-2 bg-black/50 text-green-300 text-xs px-1.5 py-0.5 rounded">{file.resolution}</div>
            <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"><PhotoIcon className="h-4 w-4 text-green-300" /></div>
        </div>
    );
};

const DocumentPreview: React.FC<{ file: DocumentFile }> = ({ file }) => {
    return (
        <div className="relative group aspect-video bg-black rounded-t-lg flex flex-col items-center justify-center p-4 text-center">
             <DocumentTextIcon className="h-16 w-16 text-green-900" />
             <p className="text-base font-bold text-green-700 mt-2 break-all">{file.name.replace(/\.[^/.]+$/, "")}</p>
             <div className="absolute bottom-2 left-2 bg-black/50 text-green-300 text-xs px-1.5 py-0.5 rounded">{file.pageCount} pages</div>
             <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"><DocumentTextIcon className="h-4 w-4 text-green-300" /></div>
        </div>
    );
};


const FilePreview: React.FC<{ file: AnyFile }> = ({ file }) => {
    return (
        <div className="bg-black rounded-lg border border-green-800 overflow-hidden group">
            {file.fileType === 'video' && <VideoPreview file={file} />}
            {file.fileType === 'image' && <ImagePreview file={file} />}
            {file.fileType === 'document' && <DocumentPreview file={file} />}
            
            <div className="p-3">
                 <h4 className="font-bold text-green-300 truncate text-base">{file.name}</h4>
                 <p className="text-xs text-green-600 font-mono truncate">{file.path}</p>
                 <div className="flex justify-between items-center mt-2">
                     <span className="text-xs text-green-700">{file.sizeMB} MB</span>
                     <Link to={`/file/${file.id}`}>
                         <Button variant="secondary" className="text-xs py-1 px-2">
                            <InfoIcon className="h-3 w-3 mr-1.5"/>
                            Details
                         </Button>
                    </Link>
                 </div>
            </div>
        </div>
    );
};

export default FilePreview;
