
import React from 'react';
import { Link } from 'react-router-dom';
import type { AnyFile, VideoFile, ImageFile, DocumentFile } from '../types';
import { FilmIcon, PhotoIcon, DocumentTextIcon } from './FileTypeIcons';
import Button from './Button';
import { InfoIcon } from './Icons';

const VideoPreview: React.FC<{ file: VideoFile }> = ({ file }) => {
    return (
        <div className="relative group aspect-video bg-black rounded-t-lg">
            <video
                controls
                poster={file.thumbnailUrl}
                src={file.videoUrl}
                className="w-full h-full object-contain"
            >
                Your browser does not support the video tag.
            </video>
            <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full pointer-events-none"><FilmIcon className="h-4 w-4 text-green-300" /></div>
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
        <div className="relative group aspect-video bg-black rounded-t-lg flex flex-col items-center justify-center p-4">
             <DocumentTextIcon className="h-16 w-16 text-green-900" />
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