
import React, { useState } from 'react';
import Button from '../components/Button';
import { PlusIcon, TrashIcon } from '../components/Icons';
import { groundedQuery } from '../services/gemini';
import Spinner from '../components/Spinner';

const SettingsField: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div className="flex justify-between items-start py-6 border-b border-green-800 last:border-b-0">
    <div>
      <h3 className="text-lg font-bold text-green-400">{label}</h3>
      <p className="text-base text-green-600 mt-1">{description}</p>
    </div>
    <div className="w-1/3">{children}</div>
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-green-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-black after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
    </label>
);

const DEFAULT_DATABASES = [
  { id: 'imdb', name: 'IMDb', enabled: true, type: 'default' },
  { id: 'tmdb', name: 'The Movie Database (TMDb)', enabled: true, type: 'default' },
  { id: 'tvdb', name: 'The TVDB', enabled: true, type: 'default' },
  { id: 'rt', name: 'Rotten Tomatoes', enabled: true, type: 'default' },
  { id: 'metacritic', name: 'Metacritic', enabled: true, type: 'default' },
  { id: 'wikipedia', name: 'Wikipedia', enabled: false, type: 'default' },
  { id: 'omdb', name: 'OMDb (Open Movie Database)', enabled: false, type: 'default' },
  { id: 'igdb', name: 'IGDb (Internet Game Database)', enabled: false, type: 'default' },
  { id: 'musicbrainz', name: 'MusicBrainz', enabled: false, type: 'default' },
  { id: 'letterboxd', name: 'Letterboxd', enabled: false, type: 'default' },
];

const Settings: React.FC = () => {
  const [databases, setDatabases] = useState(DEFAULT_DATABASES);
  const [customDbInput, setCustomDbInput] = useState('');
  const [autoEnrich, setAutoEnrich] = useState(true);
  
  // State for AI search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');


  const handleToggleDb = (id: string) => {
    setDatabases(dbs => dbs.map(db => db.id === id ? { ...db, enabled: !db.enabled } : db));
  };

  const handleAddCustomDb = (name: string) => {
    if (name.trim() && !databases.some(db => db.name.toLowerCase() === name.trim().toLowerCase())) {
      const newDb = { id: `custom_${Date.now()}`, name: name.trim(), enabled: true, type: 'custom' };
      setDatabases(dbs => [...dbs, newDb]);
      return true;
    }
    return false;
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
        
        if (jsonString.startsWith('```json')) {
            jsonString = jsonString.substring(7, jsonString.length - 3).trim();
        } else if (jsonString.startsWith('```')) {
            jsonString = jsonString.substring(3, jsonString.length - 3).trim();
        }

        const resultsArray = JSON.parse(jsonString);
        if (Array.isArray(resultsArray)) {
             const newResults = resultsArray.filter(
                (result: any) => typeof result === 'string' && !databases.some(db => db.name.toLowerCase() === result.toLowerCase())
            );
            setSearchResults(newResults);
            if (newResults.length === 0) {
                setSearchError('No new sources found or all suggestions are already in your list.');
            }
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
  
  const handleAddFromSearch = (name: string) => {
    if (handleAddCustomDb(name)) {
        setSearchResults(prev => prev.filter(r => r !== name));
    }
  };


  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight text-green-400 mb-2">Settings</h1>
      <p className="text-green-600 mb-8 text-lg">Configure AstraDup to fit your workflow.</p>

      <div className="bg-black border border-green-800 rounded-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-green-400">Detection</h2>
          <p className="text-base text-green-600 mt-1">Adjust the sensitivity and logic of the duplicate detection engine.</p>
        </div>
        <div className="px-6">
          <SettingsField label="Similarity Threshold" description="Minimum confidence score to consider a pair a duplicate.">
            <div className="flex items-center">
              <input type="range" min="75" max="99" defaultValue="95" className="w-full h-2 bg-green-900 rounded-lg appearance-none cursor-pointer" />
              <span className="ml-4 text-green-400 font-mono text-base">95%</span>
            </div>
          </SettingsField>
          <SettingsField label="Matching Modalities" description="Minimum number of matching signals (e.g., hash, audio) required.">
             <input type="number" defaultValue="3" className="w-full bg-black border border-green-700 rounded-md py-2 px-3 text-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-base" />
          </SettingsField>
        </div>
      </div>

       <div className="bg-black border border-green-800 rounded-lg mt-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-green-400">File Management</h2>
          <p className="text-base text-green-600 mt-1">Control how files are renamed and metadata is updated.</p>
        </div>
        <div className="px-6">
           <SettingsField label="Filename Template" description="Set the pattern for renaming videos after enrichment.">
             <div className="w-full">
                <input type="text" defaultValue="{title} ({year})" className="w-full bg-black border border-green-700 rounded-md py-2 px-3 text-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none font-mono text-base" />
                <p className="text-sm text-green-700 mt-2">Placeholders: <code className="text-green-400">{`{title}`}</code>, <code className="text-green-400">{`{year}`}</code>, <code className="text-green-400">{`{resolution}`}</code></p>
             </div>
          </SettingsField>
          <SettingsField label="Automatic Metadata Enrichment" description="Automatically fetch metadata for new video files during scans.">
             <Toggle checked={autoEnrich} onChange={(e) => setAutoEnrich(e.target.checked)} />
          </SettingsField>
        </div>
      </div>

      <div className="bg-black border border-green-800 rounded-lg mt-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-green-400">Performance</h2>
          <p className="text-base text-green-600 mt-1">Control resource usage during scans.</p>
        </div>
        <div className="px-6">
           <SettingsField label="Parallel Workers" description="Number of videos to process simultaneously. Higher values use more CPU.">
             <input type="number" defaultValue="4" className="w-full bg-black border border-green-700 rounded-md py-2 px-3 text-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-base" />
          </SettingsField>
          <SettingsField label="GPU Acceleration" description="Utilize GPU for faster embedding generation (requires compatible hardware).">
             <Toggle checked={true} onChange={() => {}} />
          </SettingsField>
        </div>
      </div>
      
       <div className={`bg-black border border-green-800 rounded-lg mt-8 transition-opacity duration-300 ${!autoEnrich ? 'opacity-50' : ''}`}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-green-400">Reference Databases</h2>
          <p className="text-base text-green-600 mt-1">Manage external sources for enriching video metadata.</p>
        </div>
        <fieldset disabled={!autoEnrich} className="px-6">
           {databases.map(db => (
              <div key={db.id} className="flex justify-between items-center py-4 border-b border-green-800 last:border-b-0">
                <span className="text-base text-green-400">{db.name}</span>
                <div className="flex items-center">
                  {db.type === 'custom' && (
                    <button onClick={() => handleRemoveCustomDb(db.id)} className="text-green-700 hover:text-red-400 mr-4">
                       <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                  <Toggle checked={db.enabled} onChange={() => handleToggleDb(db.id)} />
                </div>
              </div>
           ))}
            <div className="py-4 border-b border-green-800">
                 <p className="text-base font-bold text-green-400 mb-2">Find Database Sources</p>
                 <div className="flex">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="e.g., popular movie review sites" className="flex-grow bg-black border border-green-700 rounded-l-md py-2 px-3 text-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-base" onKeyUp={(e) => e.key === 'Enter' && handleSearch()} />
                    <Button onClick={handleSearch} disabled={isSearching} className="rounded-l-none w-24 justify-center">{isSearching ? <Spinner /> : 'Search'}</Button>
                 </div>
                 {searchError && <p className="text-sm text-red-400 mt-2">{searchError}</p>}
                 {searchResults.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {searchResults.map(result => (
                            <div key={result} className="flex justify-between items-center bg-green-900/20 p-2 rounded-md">
                                <span className="text-base text-green-500">{result}</span>
                                <Button onClick={() => handleAddFromSearch(result)} variant="secondary" className="text-xs py-1 px-2"><PlusIcon className="w-4 h-4 mr-1"/> Add</Button>
                            </div>
                        ))}
                    </div>
                 )}
            </div>
            <div className="py-4">
                 <p className="text-base font-bold text-green-400 mb-2">Add Custom Source Manually</p>
                <div className="flex">
                    <input type="text" value={customDbInput} onChange={(e) => setCustomDbInput(e.target.value)} placeholder="e.g., My Personal API" className="flex-grow bg-black border border-green-700 rounded-l-md py-2 px-3 text-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-base" />
                    <Button onClick={() => { if(handleAddCustomDb(customDbInput)) setCustomDbInput(''); }} className="rounded-l-none"><PlusIcon className="w-5 h-5"/></Button>
                </div>
            </div>
        </fieldset>
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="secondary" className="mr-4">Reset to Defaults</Button>
        <Button>Save Changes</Button>
      </div>

    </div>
  );
};

export default Settings;
