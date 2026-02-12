
import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import type { DashboardStats, FileType } from '../types';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import { FilmIcon, PhotoIcon, DocumentTextIcon } from '../components/FileTypeIcons';

const StatCard: React.FC<{ title: string; value: string | number; unit?: string; description: string; }> = ({ title, value, unit, description }) => (
  <div className="bg-black border border-green-800 rounded-lg p-6">
    <h3 className="text-base font-semibold text-green-600">{title}</h3>
    <p className="mt-2 text-4xl font-extrabold text-green-400">
      {value}
      {unit && <span className="text-xl font-semibold text-green-600 ml-1">{unit}</span>}
    </p>
    <p className="mt-1 text-sm text-green-700">{description}</p>
  </div>
);

const ActivityItem: React.FC<{ fileType: FileType, fileName: string, action: string, time: string }> = ({ fileType, fileName, action, time }) => {
    const Icon = { video: FilmIcon, image: PhotoIcon, document: DocumentTextIcon}[fileType];
    const color = 'text-green-400';
    return (
        <div className="flex items-center p-3 hover:bg-green-900/20 rounded-md">
            <Icon className={`h-5 w-5 mr-4 ${color}`} />
            <div className="flex-grow">
                <p className="text-base text-green-400"><span className="font-bold">{fileName}</span> {action}</p>
            </div>
            <p className="text-sm text-green-700">{time}</p>
        </div>
    );
}


const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | FileType>('all');

  useEffect(() => {
    setLoading(true);
    getDashboardStats()
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);
  
  const filteredStats = () => {
    if (!stats) return null;
    if (filter === 'all') return [
        { title: "Files Scanned", value: stats.filesScanned.toLocaleString(), desc: "Total files analyzed" },
        { title: "Total Duplicates", value: (stats.videoDuplicates + stats.imageDuplicates + stats.documentDuplicates).toLocaleString(), desc: "All duplicate sets found" },
        { title: "Storage Saved", value: stats.storageSavedTB.toFixed(2), unit: "TB", desc: "Potential space to be reclaimed" },
    ];
    if (filter === 'video') return [
        { title: "Videos Scanned", value: stats.scannedPerType.video.toLocaleString(), desc: "Total videos analyzed" },
        { title: "Video Duplicates", value: stats.videoDuplicates.toLocaleString(), desc: "Duplicate video sets found" },
        { title: "Video Storage Saved", value: stats.savedPerTypeTB.video.toFixed(2), unit: "TB", desc: "Potential space from videos" },
    ];
    if (filter === 'image') return [
        { title: "Images Scanned", value: stats.scannedPerType.image.toLocaleString(), desc: "Total images analyzed" },
        { title: "Image Duplicates", value: stats.imageDuplicates.toLocaleString(), desc: "Duplicate image sets found" },
        { title: "Image Storage Saved", value: stats.savedPerTypeTB.image.toFixed(2), unit: "TB", desc: "Potential space from images" },
    ];
    if (filter === 'document') return [
        { title: "Docs Scanned", value: stats.scannedPerType.document.toLocaleString(), desc: "Total documents analyzed" },
        { title: "Doc Duplicates", value: stats.documentDuplicates.toLocaleString(), desc: "Duplicate document sets found" },
        { title: "Doc Storage Saved", value: stats.savedPerTypeTB.document.toFixed(2), unit: "TB", desc: "Potential space from docs" },
    ];
    return [];
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  if (!stats) return <div className="text-center text-green-600">Failed to load dashboard data.</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-green-400">Dashboard</h1>
            <p className="text-green-600 mt-1 text-lg">Welcome back! Here's a summary of your library.</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 mb-6">
          <Button onClick={() => setFilter('all')} variant={filter === 'all' ? 'primary' : 'secondary'}>All</Button>
          <Button onClick={() => setFilter('video')} variant={filter === 'video' ? 'primary' : 'secondary'}>Videos</Button>
          <Button onClick={() => setFilter('image')} variant={filter === 'image' ? 'primary' : 'secondary'}>Images</Button>
          <Button onClick={() => setFilter('document')} variant={filter === 'document' ? 'primary' : 'secondary'}>Documents</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredStats()?.map(s => <StatCard key={s.title} title={s.title} value={s.value} unit={s.unit} description={s.desc} />)}
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-black border border-green-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-400 mb-4">Welcome to AstraDup</h2>
            <p className="text-green-600 text-base">
              AstraDup helps you find and manage duplicate videos, images, and documents across all your storage locations. 
              Unlike simple file hash checks, it uses advanced AI to understand the content of your files, 
              finding duplicates even if they have been re-encoded, renamed, or edited.
              <br /><br />
              To get started, click the "Start New Scan" button to select a file type and your storage sources to begin the analysis.
            </p>
          </div>
           <div className="bg-black border border-green-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-400 mb-4">Recent Activity</h2>
            <div className="space-y-2">
                <ActivityItem fileType="video" fileName="vacation_beach.mp4" action="was deleted." time="2h ago" />
                <ActivityItem fileType="image" fileName="sunset_coast.jpg" action="metadata was enriched." time="5h ago" />
                <ActivityItem fileType="video" fileName="project_alpha.mov" action="was kept." time="1d ago" />
                <ActivityItem fileType="document" fileName="Proposal_v2.pdf" action="was marked as not a duplicate." time="2d ago" />
            </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
