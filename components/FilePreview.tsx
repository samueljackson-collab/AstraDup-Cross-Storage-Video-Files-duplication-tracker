
import React from 'react';
import { Link } from 'react-router-dom';
import type { AnyFile, VideoFile, ImageFile, DocumentFile } from '../types';
import { FilmIcon, PhotoIcon, DocumentTextIcon } from './FileTypeIcons';
import Button from './Button';
import { InfoIcon } from './Icons';

const VideoPreview: React.FC<{ file: VideoFile }> = ({ file }) => {
    return (
        <div className="relative group aspect-video">
            <video
                poster={file.thumbnailUrl}
                src={file.videoUrl}
                className="w-full h-full object-cover rounded-t-lg bg-black"
                muted
                loop
                onMouseOver={e => (e.target as HTMLVideoElement).play()}
                onMouseOut={e => (e.target as HTMLVideoElement).pause()}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <svg className="w-12 h-12 text-white/80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">{file.duration}</div>
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">{file.resolution}</div>
            <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"><FilmIcon className="h-4 w-4 text-white" /></div>
        </div>
    );
};

const ImagePreview: React.FC<{ file: ImageFile }> = ({ file }) => {
    return (
        <div className="relative group aspect-video">
            <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover rounded-t-lg bg-slate-800" />
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">{file.resolution}</div>
            <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"><PhotoIcon className="h-4 w-4 text-white" /></div>
        </div>
    );
};

const DocumentPreview: React.FC<{ file: DocumentFile }> = ({ file }) => {
    return (
        <div className="relative group aspect-video bg-slate-800 rounded-t-lg flex flex-col items-center justify-center p-4">
             <DocumentTextIcon className="h-16 w-16 text-slate-600" />
             <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">{file.pageCount} pages</div>
             <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"><DocumentTextIcon className="h-4 w-4 text-white" /></div>
        </div>
    );
};


const FilePreview: React.FC<{ file: AnyFile }> = ({ file }) => {
    return (
        <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden group">
            {file.fileType === 'video' && <VideoPreview file={file} />}
            {file.fileType === 'image' && <ImagePreview file={file} />}
            {file.fileType === 'document' && <DocumentPreview file={file} />}
            
            <div className="p-3">
                 <h4 className="font-semibold text-white truncate text-sm">{file.name}</h4>
                 <p className="text-xs text-slate-400 font-mono truncate">{file.path}</p>
                 <div className="flex justify-between items-center mt-2">
                     <span className="text-xs text-slate-500">{file.sizeMB} MB</span>
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