import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, BrainCircuit, History, AlertTriangle, Code, ChevronLeft, Sparkles, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { enrichVideoMetadata } from '../services/gemini';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import { VideoFile } from '../types';

// Placeholder data - replace with actual data fetching
const mockVideoData = {
  id: '12345',
  name: 'project_alpha_final_v2.mp4',
  path: '/mnt/nas/projects/2024/project_alpha/final_renders/project_alpha_final_v2.mp4',
  size: '1.2 GB',
  codec: 'H.264',
  resolution: '1920x1080',
  duration: '2m 34s',
  bitrate: '8 Mbps',
  frameRate: '29.97 fps',
  createdAt: '2024-07-21T14:30:00Z',
  aiAnalysis: {
    summary: 'A fast-paced promotional video for a new tech product, featuring dynamic shots of the device and user interactions.',
    tags: ['tech', 'promo', 'product launch', 'dynamic', 'upbeat'],
    shotDurations: [2.1, 1.5, 3.0, 2.5, 1.8, 2.2],
    audioTranscript: 'Welcome to the future of technology...',
    visualSimilarityScore: 98.5,
  },
  scanHistory: [
    { id: 'scan-001', date: '2024-07-21T12:00:00Z', source: 'Local Drive' },
    { id: 'scan-002', date: '2024-07-22T18:00:00Z', source: 'Cloud Storage' },
  ],
  potentialIssues: [
    'Possible duplicate of file XYZ.mp4 (99% similarity)',
    'Audio levels peak above -0.5dB',
  ],
  rawMetadata: {
    'format': 'MPEG-4',
    'format_profile': 'Base Media',
    'codec_id': 'isom (isom/iso2/avc1/mp41)',
    'file_size': '1288490188',
    'duration': '154.321000',
    'overall_bit_rate': '66782832',
  }
};

type Tab = 'metadata' | 'ai-analysis' | 'history' | 'issues' | 'raw';

const VideoDetail: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('metadata');
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [editableMetadata, setEditableMetadata] = useState<any>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [showEnrichment, setShowEnrichment] = useState(true);
  const [showAllRaw, setShowAllRaw] = useState(false);

  // Convert mock data to VideoFile type for player
  const videoFile: VideoFile = {
      ...mockVideoData,
      fileType: 'video',
      sizeMB: 1228.8,
      videoUrl: 'https://archive.org/download/BigBuckBunny_124/BigBuckBunny_512kb.mp4',
      thumbnailUrl: '',
      enrichedData: {
          title: '',
          plot: '',
          actors: [],
          genre: '',
      },
      analysis: {
          pHash: { value: '', confidence: 0 },
          dHash: { value: '', confidence: 0 },
          sceneEmbeddings: { value: null, confidence: 0 },
          audioFingerprint: { value: null, confidence: 0 },
          faceClusters: { value: null, confidence: 0 }
      }
  };

  // In a real app, you would fetch data based on fileId
  const video = mockVideoData;

  const handleEnrichment = async () => {
    setIsEnriching(true);
    try {
      // In a real app, you'd get the video file object
      // For this example, we'll simulate frame extraction
      const mockFrames = [
        { data: 'base64-encoded-frame-1', mimeType: 'image/jpeg' },
        { data: 'base64-encoded-frame-2', mimeType: 'image/jpeg' },
        { data: 'base64-encoded-frame-3', mimeType: 'image/jpeg' },
      ];

      const response = await enrichVideoMetadata(mockFrames);
      const text = response.text.trim();
      const data = JSON.parse(text);
      setEnrichedData(data);
      setEditableMetadata(data);
      // Update the mock data to reflect the enrichment
      mockVideoData.aiAnalysis.summary = data.plot;
      mockVideoData.aiAnalysis.tags = data.genre.split(', ');

    } catch (error) {
      console.error("Error enriching video metadata:", error);
      // You could set an error state here to show in the UI
    } finally {
      setIsEnriching(false);
    }
  };

  const handleApplyChanges = () => {
      if (editableMetadata) {
          setEnrichedData(editableMetadata);
          // In a real app, this would be an API call
          alert("Metadata updated successfully!");
      }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'metadata':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-black p-3 rounded-lg border border-green-800/50"><strong className="block text-green-400">Size</strong> {video.size}</div>
            <div className="bg-black p-3 rounded-lg border border-green-800/50"><strong className="block text-green-400">Codec</strong> {video.codec}</div>
            <div className="bg-black p-3 rounded-lg border border-green-800/50"><strong className="block text-green-400">Resolution</strong> {video.resolution}</div>
            <div className="bg-black p-3 rounded-lg border border-green-800/50"><strong className="block text-green-400">Duration</strong> {video.duration}</div>
            <div className="bg-black p-3 rounded-lg border border-green-800/50"><strong className="block text-green-400">Bitrate</strong> {video.bitrate}</div>
            <div className="bg-black p-3 rounded-lg border border-green-800/50"><strong className="block text-green-400">Frame Rate</strong> {video.frameRate}</div>
            <div className="bg-black p-3 rounded-lg border border-green-800/50 col-span-full"><strong className="block text-green-400">Created At</strong> {new Date(video.createdAt).toLocaleString()}</div>
            <div className="bg-black p-3 rounded-lg border border-green-800/50 col-span-full"><strong className="block text-green-400">Full Path</strong> <span className="break-all">{video.path}</span></div>
          </div>
        );
      case 'ai-analysis':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                   <h3 className="text-lg font-bold text-green-400 mb-2">Video Context</h3>
                   <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-green-800/50">
                        <CustomVideoPlayer file={videoFile} />
                   </div>
                   <div className="mt-4 flex gap-2">
                        <button 
                            onClick={handleEnrichment}
                            disabled={isEnriching}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                            {isEnriching ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {isEnriching ? 'Analyzing...' : 'Analyze with AI'}
                        </button>
                   </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-green-400 mb-2">Current AI Summary</h3>
                        <p className="bg-black/50 p-3 rounded-lg border border-green-800/50 text-sm italic">{video.aiAnalysis.summary}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-green-400 mb-2">Scene Analysis</h3>
                        <div className="bg-black/50 p-3 rounded-lg border border-green-800/50 text-sm">
                            <p>Visual Similarity Score: <span className="text-green-400 font-bold">{video.aiAnalysis.visualSimilarityScore}%</span></p>
                            <p className="mt-2">Estimated cuts: {video.aiAnalysis.shotDurations.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border border-green-700/50 bg-green-950/10 rounded-xl overflow-hidden">
                <button 
                    onClick={() => setShowEnrichment(!showEnrichment)}
                    className="w-full flex justify-between items-center text-left mb-2 group">
                    <div className="flex items-center gap-2 text-green-400">
                         <BrainCircuit className="w-5 h-5" />
                         <h3 className="text-xl font-bold">Metadata Enrichment Suggested by AI</h3>
                    </div>
                    {showEnrichment ? <ChevronUp className="w-5 h-5 text-green-600" /> : <ChevronDown className="w-5 h-5 text-green-600 group-hover:text-green-400" />}
                </button>
                
                {showEnrichment && (
                    <div className="mt-4 animate-in slide-in-from-top duration-300">
                        {editableMetadata ? (
                            <div className="text-sm space-y-4 bg-black/40 p-4 rounded-lg border border-green-900/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="enrich-title" className="block text-green-600 mb-1 font-semibold uppercase text-[10px] tracking-widest">Suggested Title</label>
                                        <input 
                                            id="enrich-title"
                                            type="text" 
                                            value={editableMetadata.title} 
                                            onChange={e => setEditableMetadata({...editableMetadata, title: e.target.value})}
                                            className="w-full bg-black/80 border border-green-800 rounded p-2 text-green-300 focus:outline-none focus:border-green-400 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="enrich-genre" className="block text-green-600 mb-1 font-semibold uppercase text-[10px] tracking-widest">Genre / Category</label>
                                        <input 
                                            id="enrich-genre"
                                            type="text" 
                                            value={editableMetadata.genre} 
                                            onChange={e => setEditableMetadata({...editableMetadata, genre: e.target.value})}
                                            className="w-full bg-black/80 border border-green-800 rounded p-2 text-green-300 focus:outline-none focus:border-green-400 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="enrich-plot" className="block text-green-600 mb-1 font-semibold uppercase text-[10px] tracking-widest">Plot / Content Summary</label>
                                    <textarea 
                                        id="enrich-plot"
                                        value={editableMetadata.plot} 
                                        onChange={e => setEditableMetadata({...editableMetadata, plot: e.target.value})}
                                        className="w-full bg-black/80 border border-green-800 rounded p-2 text-green-300 h-24 focus:outline-none focus:border-green-400 transition-colors resize-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="enrich-actors" className="block text-green-600 mb-1 font-semibold uppercase text-[10px] tracking-widest">Identified Actors & People</label>
                                    <input 
                                        id="enrich-actors"
                                        type="text" 
                                        value={editableMetadata.actors.join(', ')} 
                                        onChange={e => setEditableMetadata({...editableMetadata, actors: e.target.value.split(',').map((s: string) => s.trim())})}
                                        className="w-full bg-black/80 border border-green-800 rounded p-2 text-green-300 focus:outline-none focus:border-green-400 transition-colors"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-2">
                                    <button 
                                        onClick={() => setEditableMetadata(null)}
                                        className="text-green-700 hover:text-green-500 text-xs font-bold py-2 px-4 transition-colors"
                                    >
                                        Discard suggestions
                                    </button>
                                    <button 
                                        id="btn-apply-enrichment"
                                        onClick={handleApplyChanges}
                                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-[0_0_15px_-5px_rgba(34,197,94,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Apply Suggested Metadata
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-black/40 p-8 rounded-lg border border-dashed border-green-900 flex flex-col items-center text-center">
                                <Sparkles className="w-8 h-8 text-green-800 mb-3" />
                                <p className="text-sm text-green-700 max-w-sm">
                                    AstraDup AI can analyze this video and check against global databases (TMDb, IMDb) to find accurate titles, actors, and plot summaries.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
          </div>
        );
      case 'history':
        return (
          <ul className="space-y-2">
            {video.scanHistory.map(scan => (
              <li key={scan.id} className="bg-black p-3 rounded-lg border border-green-800/50 text-sm">
                Scanned from <strong>{scan.source}</strong> on {new Date(scan.date).toLocaleString()}
              </li>
            ))}
          </ul>
        );
      case 'issues':
        return (
          <ul className="space-y-2">
            {video.potentialIssues.map((issue, i) => (
              <li key={i} className="bg-red-900/50 text-red-300 p-3 rounded-lg border border-red-700/50 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {issue}
              </li>
            ))}
          </ul>
        );
      case 'raw':
        return (
            <div>
              <pre className={`bg-black p-4 rounded-lg border border-green-800/50 text-xs overflow-auto ${showAllRaw ? '' : 'max-h-60'}`}>{JSON.stringify(video.rawMetadata, null, 2)}</pre>
              <button onClick={() => setShowAllRaw(!showAllRaw)} className="text-green-400 text-xs mt-2">{showAllRaw ? 'Show Less' : 'Show All'}</button>
            </div>
        );
      default:
        return null;
    }
  };

  const TabButton = ({ tab, icon: Icon, label }: { tab: Tab, icon: React.ElementType, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${activeTab === tab ? 'bg-green-900/80 border-b-2 border-green-400 text-green-300' : 'text-gray-400 hover:bg-green-900/50 hover:text-green-400'}`}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="p-4 md:p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-4 text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
        </Link>
      <h1 className="text-2xl md:text-3xl font-bold text-glow mb-2 break-all">{video.name}</h1>
      
      <div className="mt-6">
        <div className="border-b border-green-800/50 flex space-x-1">
            <TabButton tab="metadata" icon={FileText} label="Metadata" />
            <TabButton tab="ai-analysis" icon={BrainCircuit} label="AI Analysis" />
            <TabButton tab="history" icon={History} label="History" />
            <TabButton tab="issues" icon={AlertTriangle} label="Issues" />
            <TabButton tab="raw" icon={Code} label="Raw Data" />
        </div>
        <div className="p-4 bg-black/30 rounded-b-lg">
            {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;