import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ScanPage from './pages/ScanPage';
import FileDetail from './pages/FileDetail';
import Settings from './pages/Settings';
import ComparisonPage from './pages/ComparisonPage';
import AnalyzerPage from './pages/AnalyzerPage';

const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <p className="text-6xl font-extrabold text-green-800">404</p>
    <h2 className="mt-4 text-2xl font-bold text-green-400">Page Not Found</h2>
    <p className="mt-2 text-green-600">The page you are looking for does not exist.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="analyzer" element={<AnalyzerPage />} />
          <Route path="file/:fileId" element={<FileDetail />} />
          <Route path="settings" element={<Settings />} />
          <Route path="compare/:fileId1/:fileId2" element={<ComparisonPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
