
import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import { PlusIcon, TrashIcon, CheckCircleIcon } from '../components/Icons';
import { groundedQuery } from '../services/gemini';
import Spinner from '../components/Spinner';

const Toggle: React.FC<{ checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-green-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-black after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
    </label>
);

interface Database {
    id: string;
    name: string;
    enabled: boolean;
    type: 'default' | 'custom';
    url?: string;
    verified?: boolean;
    verifying?: boolean;
}

const DEFAULT_DATABASES: Database[] = [
  { id: 'imdb', name: 'IMDb', enabled: true, type: 'default', url: 'https://www.imdb.com', verified: true },
  { id: 'tmdb', name: 'The Movie Database (TMDb)', enabled: true, type: 'default', url: 'https://www.themoviedb.org', verified: true },
  { id: 'tvdb', name: 'The TVDB', enabled: true, type: 'default', url: 'https://www.thetvdb.com', verified: true },
];

const SETTINGS_STORAGE_KEY = 'astradup_settings';

const Settings: React.FC = () => {
  const [databases, setDatabases] = useState<Database[]>(DEFAULT_DATABASES);
  const [customDbName, setCustomDbName] = useState('');
  const [customDbUrl, setCustomDbUrl] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
        try {
            const parsed = JSON.parse(savedSettings);
            if(parsed.databases) setDatabases(parsed.databases);
        } catch (e) {
            console.error("Failed to parse settings from localStorage", e);
            setDatabases(DEFAULT_DATABASES);
        }
    }
  }, []);

  const handleSaveChanges = () => {
    const settingsToSave = { databases };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsToSave));
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 2000);
  };

  const handleResetToDefaults = () => {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    setDatabases(DEFAULT_DATABASES);
  };

  const handleToggleDb = (id: string) => {
    setDatabases(dbs => dbs.map(db => db.id === id ? { ...db, enabled: !db.enabled } : db));
  };

  const handleAddCustomDb = () => {
    if (customDbName.trim() && customDbUrl.trim() && !databases.some(db => db.name.toLowerCase() === customDbName.trim().toLowerCase())) {
      const newDb: Database = { id: `custom_${Date.now()}`, name: customDbName.trim(), url: customDbUrl.trim(), enabled: true, type: 'custom', verified: false };
      setDatabases(dbs => [...dbs, newDb]);
      setCustomDbName('');
      setCustomDbUrl('');
    }
  };
  
  const handleVerifyDb = (id: string) => {
      setDatabases(dbs => dbs.map(db => db.id === id ? { ...db, verifying: true } : db));
      // Simulate verification API call
      setTimeout(() => {
          setDatabases(dbs => dbs.map(db => db.id === id ? { ...db, verifying: false, verified: true } : db));
      }, 1500);
  };

  const handleRemoveCustomDb = (id: string) => {
    setDatabases(dbs => dbs.filter(db => db.id !== id));
  };
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
        const prompt = `Based on the query "${searchQuery}", find names of relevant movie, TV show, or general entertainment databases. Respond ONLY with a valid JSON array of strings. Example: ["Rotten Tomatoes", "Metacritic"]`;
        const response = await groundedQuery(prompt);
        let jsonString = response.text.trim();
        if (jsonString.startsWith('```json')) jsonString = jsonString.substring(7, jsonString.length - 3).trim();
        else if (jsonString.startsWith('```')) jsonString = jsonString.substring(3, jsonString.length - 3).trim();

        const resultsArray = JSON.parse(jsonString);
        if (Array.isArray(resultsArray)) {
             const newResults = resultsArray.filter(
                (result: any) => typeof result === 'string' && !databases.some(db => db.name.toLowerCase() === result.toLowerCase())
            );
            setSearchResults(newResults);
            if (newResults.length === 0) setSearchError('No new sources found or all suggestions are already in your list.');
        } else {
            throw new Error('Invalid response format from AI.');
        }
    } catch (error) {
        console.error("Database search failed:", error);
        setSearchError("Failed to fetch suggestions. Please try again.");
    } finally {
        setIsSearching(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight text-green-400 mb-2">Settings</h1>
      <p className="text-green-600 mb-8 text-lg">Configure AstraDup to fit your workflow.</p>
      
      <div className="bg-black border border-green-800 rounded-lg mt-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-green-400">Reference Databases</h2>
          <p className="text-base text-green-600 mt-1">Manage external sources for enriching video metadata.</p>
        </div>
        <fieldset className="px-6">
           {databases.map(db => (
              <div key={db.id} className="flex justify-between items-center py-4 border-b border-green-800 last:border-b-0">
                <div>
                    <span className="text-base text-green-400">{db.name}</span>
                    <p className="text-sm text-green-700 font-mono">{db.url}</p>
                </div>
                <div className="flex items-center space-x-4">
                  {db.type === 'custom' && (
                    <>
                      {!db.verified ? (
                        <Button onClick={() => handleVerifyDb(db.id)} disabled={db.verifying} variant="secondary" className="text-xs py-1 px-2">
                           {db.verifying ? <Spinner /> : 'Verify'}
                        </Button>
                      ) : (
                        <span className="flex items-center text-xs text-green-400"><CheckCircleIcon className="h-4 w-4 mr-1.5" /> Verified</span>
                      )}
                      <button onClick={() => handleRemoveCustomDb(db.id)} className="text-green-700 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                    </>
                  )}
                  <Toggle checked={db.enabled} onChange={() => handleToggleDb(db.id)} />
                </div>
              </div>
           ))}
           <div className="py-4">
                 <p className="text-base font-bold text-green-400 mb-2">Add Custom Source Manually</p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={customDbName} onChange={(e) => setCustomDbName(e.target.value)} placeholder="Database Name" className="flex-grow bg-black border border-green-700 rounded-md py-2 px-3 text-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-base" />
                    <input type="url" value={customDbUrl} onChange={(e) => setCustomDbUrl(e.target.value)} placeholder="https://example.com/api" className="flex-grow bg-black border border-green-700 rounded-md py-2 px-3 text-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-base" />
                    <Button onClick={handleAddCustomDb} className="sm:w-auto"><PlusIcon className="w-5 h-5"/></Button>
                </div>
            </div>
        </fieldset>
      </div>

      <div className="mt-8 flex justify-end items-center">
        {showSaveConfirmation && <span className="text-green-400 mr-4 transition-opacity duration-300">Settings Saved!</span>}
        <Button onClick={handleResetToDefaults} variant="secondary" className="mr-4">Reset to Defaults</Button>
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  );
};

export default Settings;
