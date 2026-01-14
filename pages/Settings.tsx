
import React, { useState } from 'react';
import Button from '../components/Button';
import { PlusIcon, TrashIcon } from '../components/Icons';

const SettingsField: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div className="flex justify-between items-start py-6 border-b border-slate-800 last:border-b-0">
    <div>
      <h3 className="text-base font-medium text-white">{label}</h3>
      <p className="text-sm text-slate-400 mt-1">{description}</p>
    </div>
    <div className="w-1/3">{children}</div>
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
    </label>
);

const DEFAULT_DATABASES = [
  { id: 'imdb', name: 'IMDb', enabled: true, type: 'default' },
  { id: 'tmdb', name: 'The Movie Database (TMDb)', enabled: true, type: 'default' },
  { id: 'tvdb', name: 'The TVDB', enabled: false, type: 'default' },
  { id: 'musicbrainz', name: 'MusicBrainz', enabled: true, type: 'default' },
  { id: 'wikipedia', name: 'Wikipedia', enabled: true, type: 'default' },
  { id: 'googlebooks', name: 'Google Books', enabled: false, type: 'default' },
  { id: 'ign', name: 'IGN', enabled: false, type: 'default' },
  { id: 'steam', name: 'Steam', enabled: false, type: 'default' },
  { id: 'gog', name: 'GOG.com', enabled: false, type: 'default' },
  { id: 'igdb', name: 'IGDB', enabled: true, type: 'default' },
];

const Settings: React.FC = () => {
  const [databases, setDatabases] = useState(DEFAULT_DATABASES);
  const [customDbInput, setCustomDbInput] = useState('');

  const handleToggleDb = (id: string) => {
    setDatabases(dbs => dbs.map(db => db.id === id ? { ...db, enabled: !db.enabled } : db));
  };

  const handleAddCustomDb = () => {
    if (customDbInput.trim() && !databases.some(db => db.name === customDbInput.trim())) {
      const newDb = { id: `custom_${Date.now()}`, name: customDbInput.trim(), enabled: true, type: 'custom' };
      setDatabases(dbs => [...dbs, newDb]);
      setCustomDbInput('');
    }
  };

  const handleRemoveCustomDb = (id: string) => {
    setDatabases(dbs => dbs.filter(db => db.id !== id));
  };


  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h1>
      <p className="text-slate-400 mb-8">Configure AstraDup to fit your workflow.</p>

      <div className="bg-slate-900 border border-slate-800 rounded-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white">Detection</h2>
          <p className="text-sm text-slate-400 mt-1">Adjust the sensitivity and logic of the duplicate detection engine.</p>
        </div>
        <div className="px-6">
          <SettingsField label="Similarity Threshold" description="Minimum confidence score to consider a pair a duplicate.">
            <div className="flex items-center">
              <input type="range" min="75" max="99" defaultValue="95" className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
              <span className="ml-4 text-white font-mono text-sm">95%</span>
            </div>
          </SettingsField>
          <SettingsField label="Matching Modalities" description="Minimum number of matching signals (e.g., hash, audio) required.">
             <input type="number" defaultValue="3" className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </SettingsField>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg mt-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white">Performance</h2>
          <p className="text-sm text-slate-400 mt-1">Control resource usage during scans.</p>
        </div>
        <div className="px-6">
           <SettingsField label="Parallel Workers" description="Number of videos to process simultaneously. Higher values use more CPU.">
             <input type="number" defaultValue="4" className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </SettingsField>
          <SettingsField label="GPU Acceleration" description="Utilize GPU for faster embedding generation (requires compatible hardware).">
             <Toggle checked={true} onChange={() => {}} />
          </SettingsField>
        </div>
      </div>
      
       <div className="bg-slate-900 border border-slate-800 rounded-lg mt-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white">Reference Databases</h2>
          <p className="text-sm text-slate-400 mt-1">Manage external sources for enriching video metadata.</p>
        </div>
        <div className="px-6">
           {databases.map(db => (
              <div key={db.id} className="flex justify-between items-center py-4 border-b border-slate-800 last:border-b-0">
                <span className="text-sm text-white">{db.name}</span>
                <div className="flex items-center">
                  {db.type === 'custom' && (
                    <button onClick={() => handleRemoveCustomDb(db.id)} className="text-slate-500 hover:text-red-400 mr-4">
                       <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                  <Toggle checked={db.enabled} onChange={() => handleToggleDb(db.id)} />
                </div>
              </div>
           ))}
            <div className="py-4">
                 <p className="text-sm font-medium text-white mb-2">Add Custom Source</p>
                <div className="flex">
                    <input type="text" value={customDbInput} onChange={(e) => setCustomDbInput(e.target.value)} placeholder="e.g., My Personal API" className="flex-grow bg-slate-800 border border-slate-700 rounded-l-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
                    <Button onClick={handleAddCustomDb} className="rounded-l-none"><PlusIcon className="w-5 h-5"/></Button>
                </div>
            </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="secondary" className="mr-4">Reset to Defaults</Button>
        <Button>Save Changes</Button>
      </div>

    </div>
  );
};

export default Settings;