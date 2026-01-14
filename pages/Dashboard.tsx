
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import type { DashboardStats } from '../types';
import Spinner from '../components/Spinner';

const StatCard: React.FC<{ title: string; value: string | number; unit?: string; description: string; }> = ({ title, value, unit, description }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
    <h3 className="text-sm font-medium text-slate-400">{title}</h3>
    <p className="mt-2 text-3xl font-bold text-white">
      {value}
      {unit && <span className="text-lg font-medium text-slate-400 ml-1">{unit}</span>}
    </p>
    <p className="mt-1 text-xs text-slate-500">{description}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-slate-400">Failed to load dashboard data.</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <Link
          to="/scan"
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors duration-200"
        >
          Start New Scan
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Files Scanned" 
          value={stats.filesScanned.toLocaleString()} 
          description="Total files analyzed across all sources"
        />
        <StatCard 
          title="Video Duplicates" 
          value={stats.videoDuplicates.toLocaleString()}
          description="Duplicate video sets found"
        />
        <StatCard 
          title="Image Duplicates" 
          value={stats.imageDuplicates.toLocaleString()}
          description="Duplicate image sets found"
        />
        <StatCard 
          title="Storage Saved" 
          value={stats.storageSavedTB}
          unit="TB"
          description="Potential space to be reclaimed"
        />
      </div>
      <div className="mt-10 bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Welcome to AstraDup</h2>
        <p className="text-slate-400 text-sm">
          AstraDup helps you find and manage duplicate videos, images, and documents across all your storage locations. 
          Unlike simple file hash checks, it uses advanced AI to understand the content of your files, 
          finding duplicates even if they have been re-encoded, renamed, or edited.
          <br /><br />
          To get started, click the "Start New Scan" button to select a file type and your storage sources to begin the analysis.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
