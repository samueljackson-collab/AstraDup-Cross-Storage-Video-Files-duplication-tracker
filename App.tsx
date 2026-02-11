
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ScanPage from './pages/ScanPage';
import FileDetail from './pages/FileDetail';
import Settings from './pages/Settings';
import ComparisonPage from './pages/ComparisonPage';
import AnalyzerPage from './pages/AnalyzerPage';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            <Route path="scan" element={<ErrorBoundary><ScanPage /></ErrorBoundary>} />
            <Route path="analyzer" element={<ErrorBoundary><AnalyzerPage /></ErrorBoundary>} />
            <Route path="file/:fileId" element={<ErrorBoundary><FileDetail /></ErrorBoundary>} />
            <Route path="settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
            <Route path="compare/:fileId1/:fileId2" element={<ErrorBoundary><ComparisonPage /></ErrorBoundary>} />
          </Route>
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;