
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ScanPage from './pages/ScanPage';
import FileDetail from './pages/FileDetail';
import Settings from './pages/Settings';
import ComparisonPage from './pages/ComparisonPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="file/:fileId" element={<FileDetail />} />
          <Route path="settings" element={<Settings />} />
          <Route path="/compare/:fileId1/:fileId2" element={<ComparisonPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
