
import type * as React from 'react';

export type FileType = 'video' | 'image' | 'document';

export interface DashboardStats {
  filesScanned: number;
  videoDuplicates: number;
  imageDuplicates: number;
  documentDuplicates: number;
  storageSavedTB: number;
}

export interface StorageSource {
  id: string;
  name: string;
  type: 'Local' | 'NAS' | 'S3' | 'GCS' | 'Azure' | 'Google Drive' | 'OneDrive' | 'Dropbox';
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface BaseFile {
  id: string;
  fileType: FileType;
  name: string;
  path: string;
  sizeMB: number;
  thumbnailUrl: string;
}

export interface AnalysisModality<T> {
    value: T;
    confidence: number; // Percentage 0-100
}

// --- Video Specific Types ---
export interface VideoFile extends BaseFile {
  fileType: 'video';
  duration: string;
  resolution: string;
  codec: string;
  videoUrl: string;
  enrichedData: {
      title: string;
      plot: string;
      actors: string[];
      genre: string;
  };
  analysis: {
      pHash: AnalysisModality<string>;
      dHash: AnalysisModality<string>;
      sceneEmbeddings: AnalysisModality<null>;
      audioFingerprint: AnalysisModality<string>;
      faceClusters: AnalysisModality<number>;
  };
}

// --- Image Specific Types ---
export interface ImageFile extends BaseFile {
    fileType: 'image';
    resolution: string;
    exif: {
        cameraModel: string;
        dateTaken: string;
        iso: number;
    };
    analysis: {
        pHash: AnalysisModality<string>;
        dHash: AnalysisModality<string>;
        objectTags: AnalysisModality<string[]>;
    };
}

// --- Document Specific Types ---
export interface DocumentFile extends BaseFile {
    fileType: 'document';
    pageCount: number;
    wordCount: number;
    author: string;
    analysis: {
        textHash: AnalysisModality<string>;
        keywordDensity: AnalysisModality<Record<string, number>>;
        cosineSimilarity?: AnalysisModality<number>; // Only relevant in pairs
    };
}

export type AnyFile = VideoFile | ImageFile | DocumentFile;

export interface DuplicatePair {
  id: string;
  file1: AnyFile;
  file2: AnyFile;
  similarityScore: number;
  matchedModalities: string[];
}

export interface ScanResult {
  scanType: FileType;
  duplicatePairs: DuplicatePair[];
  summary: {
    totalFiles: number;
    duplicatesFound: number;
    potentialSavingsMB: number;
  };
}

export interface EnrichedVideoMetadata {
    title: string;
    plot: string;
    actors: string[];
    genre: string;
    releaseDate: string;
    source: {
        name: string;
        url: string;
    };
}