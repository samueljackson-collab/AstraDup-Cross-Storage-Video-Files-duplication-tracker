import React, { useState, useEffect, useRef } from 'react';
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

interface KnownDatabase {
    name: string;
    url: string;
}

const KNOWN_DATABASES: KnownDatabase[] = [
    { name: 'IMDb', url: 'https://www.imdb.com' },
    { name: 'The Movie Database (TMDb)', url: 'https://www.themoviedb.org' },
    { name: 'The TVDB', url: 'https://www.thetvdb.com' },
    { name: 'Rotten Tomatoes', url: 'https://www.rottentomatoes.com' },
    { name: 'Metacritic', url: 'https://www.metacritic.com' },
    { name: 'Letterboxd', url: 'https://letterboxd.com' },
    { name: 'Trakt', url: 'https://trakt.tv' },
    { name: 'AniDB', url: 'https://anidb.net' },
    { name: 'MyAnimeList', url: 'https://myanimelist.net' },
    { name: 'Kitsu', url: 'https://kitsu.io' },
    { name: 'AniList', url: 'https://anilist.co' },
    { name: 'Filmweb', url: 'https://www.filmweb.pl' },
    { name: 'AllMovie', url: 'https://www.allmovie.com' },
    { name: 'TV Maze', url: 'https://www.tvmaze.com' },
    { name: 'Simkl', url: 'https://simkl.com' },
    { name: 'Plex', url: 'https://www.plex.tv' },
    { name: 'JustWatch', url: 'https://www.justwatch.com' },
    { name: 'FilmAffinity', url: 'https://www.filmaffinity.com' },
    { name: 'Douban', url: 'https://www.douban.com' },
    { name: 'Fandango', url: 'https://www.fandango.com' },
    { name: 'Open Movie Database (OMDb)', url: 'https://www.omdbapi.com' },
    { name: 'Wikidata', url: 'https://www.wikidata.org' },
    { name: 'MusicBrainz', url: 'https://musicbrainz.org' },
    { name: 'TheTVDB Legacy', url: 'https://legacy.thetvdb.com' },
    { name: 'Netflix', url: 'https://www.netflix.com' },
    { name: 'Amazon Prime Video', url: 'https://www.primevideo.com' },
];

const DEFAULT_DATABASES: Database[] = [
  { id: 'imdb', name: 'IMDb', enabled: true, type: 'default', url: 'https://www.imdb.com', verified: true },
  { id: 'tmdb', name: 'The Movie Database (TMDb)', enabled: true, type: 'default', url: 'https://www.themoviedb.org', verified: true },
  { id: 'tvdb', name: 'The TVDB', enabled: true, type: 'default', url: 'https://www.thetvdb.com', verified: true },
];

const SETTINGS_STORAGE_KEY = 'astradup_settings';

const GEMINI_KEY_STORAGE = 'GEMINI_API_KEY';

const Settings: React.FC = () => {
  const [databases, setDatabases] = useState<Database[]>(DEFAULT_DATABASES);
  const [customDbName, setCustomDbName] = useState('');
  const [customDbUrl, setCustomDbUrl] = useState('');
  const [nameSuggestions, setNameSuggestions] = useState<KnownDatabase[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  const [geminiKey, setGeminiKey] = useState('');
  const [savedGeminiKey, setSavedGeminiKey] = useState('');
  const [showApiKeySaved, setShowApiKeySaved] = useState(false);

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
    const existingKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
    setSavedGeminiKey(existingKey);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCustomDbNameChange = (value: string) => {
    setCustomDbName(value);
    setActiveSuggestionIndex(-1);
    if (value.trim().length >= 2) {
      const lower = value.trim().toLowerCase();
      const filtered = KNOWN_DATABASES.filter(
        db =>
          db.name.toLowerCase().includes(lower) &&
          !databases.some(existing => existing.name.toLowerCase() === db.name.toLowerCase())
      );
      setNameSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setNameSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: KnownDatabase) => {
    setCustomDbName(suggestion.name);
    if (!customDbUrl.trim()) setCustomDbUrl(suggestion.url);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(i => Math.min(i + 1, nameSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(nameSuggestions[activeSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleSaveApiKey = () => {
    const trimmed = geminiKey.trim();
    if (trimmed) {
      localStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
      setSavedGeminiKey(trimmed);
      setGeminiKey('');
      setShowApiKeySaved(true);
      setTimeout(() => setShowApiKeySaved(false), 2000);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
    setSavedGeminiKey('');
    setGeminiKey('');
  };

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
    const trimmedUrl = customDbUrl.trim();
    let parsedUrl: URL;
    try { parsedUrl = new URL(trimmedUrl); } catch { return; }
    if (!['https:', 'http:'].includes(parsedUrl.protocol)) return;
    if (customDbName.trim() && trimmedUrl && !databases.some(db => db.name.toLowerCase() === customDbName.trim().toLowerCase())) {
      const newDb: Database = { id: `custom_${Date.now()}`, name: customDbName.trim(), url: trimmedUrl, enabled: true, type: 'custom', verified: false };
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
        const sanitized = searchQuery.replace(/"/g, '').trim();
        const prompt = `Based on the query "${sanitized}", find names of relevant movie, TV show, or general entertainment databases. Respond ONLY with a valid JSON array of strings. Example: ["Rotten Tomatoes", "Metacritic"]`;
        const response = await groundedQuery(prompt);
        let jsonString = response.text.trim();
        if (jsonString.startsWith('```json')) jsonString = jsonString.substring(7, jsonString.length - 3).trim();
        else if (jsonString.startsWith('```')) jsonString = jsonString.substring(3, jsonString.length - 3).trim();

        const resultsArray = JSON.parse(jsonString);
        if (Array.isArray(resultsArray)) {
             const newResults = resultsArray.filter(
                (result: string) => typeof result === 'string' && !databases.some(db => db.name.toLowerCase() === result.toLowerCase())
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
      
      {/* Gemini API Key Section */}
      <div className="bg-black border border-green-800 rounded-lg mt-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-green-400">Gemini AI API Key</h2>
          <p className="text-base text-green-600 mt-1">
            Required for AI analysis features.{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 underline hover:text-green-300"
            >
              Get a free key at Google AI Studio ↗
            </a>
          </p>
        </div>
        <div className="px-6 pb-6">
          {savedGeminiKey ? (
            <div className="flex items-center justify-between p-3 bg-green-950 border border-green-700 rounded-md mb-3">
              <span className="text-green-400 text-sm font-mono">
                Key saved: •••••••••••••••{savedGeminiKey.slice(-4)}
              </span>
              <button
                onClick={handleClearApiKey}
                className="text-xs text-red-500 hover:text-red-400 ml-4"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex items-center p-3 bg-black border border-yellow-700 rounded-md mb-3">
              <span className="text-yellow-500 text-sm">No API key configured — AI features are disabled.</span>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
              placeholder={savedGeminiKey ? 'Enter new key to replace...' : 'Paste your Gemini API key...'}
              className="flex-grow bg-black border border-green-700 rounded-md py-2 px-3 text-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-base font-mono"
            />
            <Button onClick={handleSaveApiKey} disabled={!geminiKey.trim()}>
              {showApiKeySaved ? 'Saved!' : 'Save Key'}
            </Button>
          </div>
        </div>
      </div>

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
                    <div ref={autocompleteRef} className="relative flex-grow">
                        <input
                            type="text"
                            value={customDbName}
                            onChange={(e) => handleCustomDbNameChange(e.target.value)}
                            onKeyDown={handleNameKeyDown}
                            onFocus={() => customDbName.trim().length >= 2 && nameSuggestions.length > 0 && setShowSuggestions(true)}
                            placeholder="Database Name"
                            autoComplete="off"
                            aria-autocomplete="list"
                            aria-expanded={showSuggestions}
                            className="w-full bg-black border border-green-700 rounded-md py-2 px-3 text-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-base"
                        />
                        {showSuggestions && (
                            <ul
                                role="listbox"
                                className="absolute z-20 left-0 right-0 mt-1 bg-black border border-green-700 rounded-md shadow-lg max-h-48 overflow-y-auto"
                            >
                                {nameSuggestions.map((suggestion, index) => (
                                    <li
                                        key={suggestion.name}
                                        role="option"
                                        aria-selected={index === activeSuggestionIndex}
                                        onMouseDown={() => handleSelectSuggestion(suggestion)}
                                        onMouseEnter={() => setActiveSuggestionIndex(index)}
                                        className={`px-3 py-2 cursor-pointer text-sm ${
                                            index === activeSuggestionIndex
                                                ? 'bg-green-800 text-green-200'
                                                : 'text-green-400 hover:bg-green-900'
                                        }`}
                                    >
                                        <span className="font-medium">{suggestion.name}</span>
                                        <span className="ml-2 text-green-700 font-mono text-xs">{suggestion.url}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
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
