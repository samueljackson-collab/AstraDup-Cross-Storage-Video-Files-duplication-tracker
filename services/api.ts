
import type { DashboardStats, ScanResult, AnyFile, DuplicatePair, VideoFile, ImageFile, DocumentFile, FileType, EnrichedVideoMetadata } from '../types';

const BUNNY_VIDEO_URL = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

// --- Mock Data Store ---
const MOCK_FILES: { [key: string]: AnyFile } = {
    // Videos
    'vid1': {
        id: 'vid1', fileType: 'video', name: 'vacation_beach.mp4', path: '/local/videos/vacation_beach.mp4', sizeMB: 250, duration: '00:02:30', resolution: '1920x1080', codec: 'H.264', thumbnailUrl: 'https://picsum.photos/seed/vid1/400/225', videoUrl: BUNNY_VIDEO_URL,
        enrichedData: { title: 'Beach Vacation Highlights', plot: 'A collection of memorable moments from a sunny beach vacation.', actors: [], genre: 'Home Video' },
        analysis: { pHash: { value: 'f0689c9c86846ee4', confidence: 99 }, dHash: { value: '94a4a4b49494b494', confidence: 98 }, sceneEmbeddings: { value: null, confidence: 92 }, audioFingerprint: { value: 'AQADtGKZlUVa_...', confidence: 100 }, faceClusters: { value: 3, confidence: 95 } }
    },
    'vid2': {
        id: 'vid2', fileType: 'video', name: 'IMG_1234.mov', path: '/nas/backups/IMG_1234.mov', sizeMB: 180, duration: '00:02:29', resolution: '1280x720', codec: 'H.265', thumbnailUrl: 'https://picsum.photos/seed/vid2/400/225', videoUrl: BUNNY_VIDEO_URL,
        enrichedData: { title: 'Beach Trip', plot: 'Raw footage from a beach trip.', actors: [], genre: 'Home Video' },
        analysis: { pHash: { value: 'f0689c9c86846ee4', confidence: 99 }, dHash: { value: '94a4a4b49494b494', confidence: 98 }, sceneEmbeddings: { value: null, confidence: 91 }, audioFingerprint: { value: 'AQADtGKZlUVa_...', confidence: 100 }, faceClusters: { value: 3, confidence: 95 } }
    },
    // Images
    'img1': {
        id: 'img1', fileType: 'image', name: 'sunset_coast.jpg', path: '/local/photos/2023/sunset_coast.jpg', sizeMB: 12, resolution: '6000x4000', thumbnailUrl: 'https://picsum.photos/seed/img1/400/225',
        exif: { cameraModel: 'Sony A7 III', dateTaken: '2023-08-15T18:30:00', iso: 100 },
        analysis: { pHash: { value: 'e5e5c3c33030b2b2', confidence: 100 }, dHash: { value: 'c9c9c9e1e1696969', confidence: 100 }, objectTags: { value: ['sunset', 'beach', 'ocean', 'sky'], confidence: 94 } }
    },
    'img2': {
        id: 'img2', fileType: 'image', name: 'DSC01234.arw', path: '/gdrive/photos_raw/DSC01234.arw', sizeMB: 45, resolution: '6000x4000', thumbnailUrl: 'https://picsum.photos/seed/img2/400/225',
        exif: { cameraModel: 'Sony A7 III', dateTaken: '2023-08-15T18:30:05', iso: 100 },
        analysis: { pHash: { value: 'e5e5c3c33030b2b2', confidence: 100 }, dHash: { value: 'c9c9c9e1e1696969', confidence: 100 }, objectTags: { value: ['sunset', 'ocean', 'coastline'], confidence: 92 } }
    },
    // Documents
    'doc1': {
        id: 'doc1', fileType: 'document', name: 'Project_Proposal_Final.pdf', path: '/nas/work/projects/Project_Proposal_Final.pdf', sizeMB: 2, pageCount: 15, wordCount: 3500, author: 'Jane Doe', thumbnailUrl: 'https://picsum.photos/seed/doc1/400/225',
        analysis: { textHash: { value: 'a1b2c3d4e5f6...', confidence: 100 }, keywordDensity: { value: { 'synergy': 12, 'blockchain': 8 }, confidence: 90 } }
    },
    'doc2': {
        id: 'doc2', fileType: 'document', name: 'Project_Proposal_v1.2.docx', path: '/local/documents/archive/Project_Proposal_v1.2.docx', sizeMB: 1.8, pageCount: 15, wordCount: 3450, author: 'Jane Doe', thumbnailUrl: 'https://picsum.photos/seed/doc2/400/225',
        analysis: { textHash: { value: 'a1b2c3d4e5f6...', confidence: 99 }, keywordDensity: { value: { 'synergy': 11, 'blockchain': 8 }, confidence: 88 } }
    }
};

const MOCK_DUPLICATE_PAIRS: DuplicatePair[] = [
    { id: 'pair_vid', file1: MOCK_FILES['vid1'], file2: MOCK_FILES['vid2'], similarityScore: 97, matchedModalities: ['pHash', 'dHash', 'Audio', 'Face Clusters'] },
    { id: 'pair_img', file1: MOCK_FILES['img1'], file2: MOCK_FILES['img2'], similarityScore: 99, matchedModalities: ['pHash', 'dHash', 'EXIF Time'] },
    { id: 'pair_doc', file1: MOCK_FILES['doc1'], file2: MOCK_FILES['doc2'], similarityScore: 98, matchedModalities: ['Text Hash', 'Content Similarity'] }
];

// --- API Functions ---
export const getDashboardStats = (): Promise<DashboardStats> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        filesScanned: 5432,
        videoDuplicates: 128,
        imageDuplicates: 312,
        documentDuplicates: 45,
        storageSavedTB: 3.8
      });
    }, 500);
  });
};

export const startScan = (sources: string[], scanType: FileType): Promise<ScanResult> => {
  console.log(`Starting ${scanType} scan for sources:`, sources);
  return new Promise(resolve => {
    setTimeout(() => {
      const relevantPairs = MOCK_DUPLICATE_PAIRS.filter(p => p.file1.fileType === scanType);
      resolve({
        scanType,
        duplicatePairs: relevantPairs,
        summary: {
          totalFiles: 1024,
          duplicatesFound: relevantPairs.length,
          potentialSavingsMB: relevantPairs.reduce((sum, pair) => sum + Math.min(pair.file1.sizeMB, pair.file2.sizeMB), 0)
        }
      });
    }, 3000);
  });
};

export const getFileDetails = (fileId: string): Promise<AnyFile | undefined> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(MOCK_FILES[fileId]);
    }, 500);
  });
};

export const getDuplicatesForFile = (fileId: string): Promise<AnyFile[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const duplicates: AnyFile[] = [];
            MOCK_DUPLICATE_PAIRS.forEach(pair => {
                if (pair.file1.id === fileId) {
                    duplicates.push(pair.file2);
                } else if (pair.file2.id === fileId) {
                    duplicates.push(pair.file1);
                }
            });
            resolve(duplicates);
        }, 300);
    });
};

export const enrichVideoMetadata = (fileId: string): Promise<EnrichedVideoMetadata> => {
    console.log(`Enriching metadata for ${fileId}`);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                title: "Big Buck Bunny",
                plot: "A large and lovable rabbit deals with three mischievous rodents, Gimli, Frank, and Rinky.",
                actors: ["Big Buck Bunny", "Gimli", "Frank", "Rinky"],
                genre: "Animation, Comedy, Short",
                releaseDate: "2008-05-30",
                source: {
                    name: "IMDb",
                    url: "https://www.imdb.com/title/tt1254207/"
                }
            });
        }, 1200);
    });
};