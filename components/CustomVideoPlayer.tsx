import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { VideoFile } from '../types';
import { PlayIcon, PauseIcon, VolumeHighIcon, VolumeMutedIcon, FullscreenIcon, FullscreenExitIcon } from './Icons';

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
        } else {
            videoRef.current?.pause();
        }
    }, []);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = Number(e.target.value);
        if(videoRef.current) {
            videoRef.current.volume = newVolume;
            videoRef.current.muted = newVolume === 0;
        }
    };
    
    const toggleMute = useCallback(() => {
        if(videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
        }
    }, []);

    const toggleFullScreen = useCallback(() => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, []);
    
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        
        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleLoadedMetadata = () => setDuration(video.duration);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const onFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
        const handleVolumeStateChange = () => {
            setVolume(video.volume);
            setIsMuted(video.muted);
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handlePause);
        video.addEventListener('volumechange', handleVolumeStateChange);
        document.addEventListener('fullscreenchange', onFullscreenChange);

        handleVolumeStateChange();

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handlePause);
            video.removeEventListener('volumechange', handleVolumeStateChange);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
        };
    }, []);

    useEffect(() => {
        const playerContainer = containerRef.current;
        if (!playerContainer) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target !== playerContainer) return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlayPause();
                    break;
                case 'KeyM':
                    toggleMute();
                    break;
                case 'KeyF':
                    toggleFullScreen();
                    break;
                case 'ArrowRight':
                    if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5);
                    break;
                case 'ArrowLeft':
                    if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
                    break;
            }
        };

        playerContainer.addEventListener('keydown', handleKeyDown);
        return () => {
            playerContainer.removeEventListener('keydown', handleKeyDown);
        };
    }, [togglePlayPause, toggleMute, toggleFullScreen]);

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    return (
        <div ref={containerRef} className="relative aspect-video bg-black rounded-lg group overflow-hidden outline-none focus:ring-2 focus:ring-green-500" tabIndex={0}>
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
                    onChange={(e) => { if (videoRef.current) videoRef.current.currentTime = Number(e.target.value); }}
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

export default CustomVideoPlayer;
