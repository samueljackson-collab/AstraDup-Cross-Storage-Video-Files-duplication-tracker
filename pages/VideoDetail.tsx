import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, BrainCircuit, History, AlertTriangle, Code, ChevronLeft, Sparkles, Loader } from 'lucide-react';
import { enrichVideoMetadata } from '../services/gemini';
import { extractFramesFromVideo } from '../utils/video';

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
  const [isEnriching, setIsEnriching] = useState(false);
  const [showAllRaw, setShowAllRaw] = useState(false);

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
          <div>
            <h3 className="text-lg font-bold text-green-400 mb-2">AI Summary</h3>
            <p className="bg-black p-3 rounded-lg border border-green-800/50 mb-4 text-sm">{video.aiAnalysis.summary}</p>
            <h3 className="text-lg font-bold text-green-400 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {video.aiAnalysis.tags.map(tag => <span key={tag} className="bg-green-900 text-green-300 text-xs font-medium px-2.5 py-0.5 rounded-full">{tag}</span>)}
            </div>

            <div className="mt-6 p-4 border border-dashed border-green-700/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-green-400">Enriched Metadata</h3>
                    <button 
                        onClick={handleEnrichment}
                        disabled={isEnriching}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors duration-200">
                        {isEnriching ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isEnriching ? 'Analyzing...' : 'Analyze Video'}
                    </button>
                </div>
                {enrichedData ? (
                    <div className="text-sm space-y-2">
                        <p><strong className="text-green-400">Title:</strong> {enrichedData.title}</p>
                        <p><strong className="text-green-400">Plot:</strong> {enrichedData.plot}</p>
                        <p><strong className="text-green-400">Actors:</strong> {enrichedData.actors.join(', ')}</p>
                        <p><strong className="text-green-400">Genre:</strong> {enrichedData.genre}</p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400">Click "Analyze Video" to fetch detailed metadata using AI. This can identify movies, shows, or describe the content of the video.</p>
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