import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MarketsPage from './pages/MarketsPage';
import CreateMarketPage from './pages/CreateMarketPage';
import CreateSportsMarketPage from './pages/CreateSportsMarketPage';
import CreateFinanceMarketPage from './pages/CreateFinanceMarketPage';
import CreatePoliticsMarketPage from './pages/CreatePoliticsMarketPage';
import CreateTechnologyMarketPage from './pages/CreateTechnologyMarketPage';
import CreateEntertainmentMarketPage from './pages/CreateEntertainmentMarketPage';
import CreateOtherMarketPage from './pages/CreateOtherMarketPage';
import ResourcesPage from './pages/ResourcesPage';
import TemplatesPage from './pages/TemplatesPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';
import LoadingSpinner from './components/UI/LoadingSpinner';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/markets" element={<MarketsPage />} />
        <Route path="/create-market" element={<CreateMarketPage />} />
        <Route path="/create-market/sports" element={<CreateSportsMarketPage />} />
        <Route path="/create-market/finance" element={<CreateFinanceMarketPage />} />
        <Route path="/create-market/politics" element={<CreatePoliticsMarketPage />} />
        <Route path="/create-market/technology" element={<CreateTechnologyMarketPage />} />
        <Route path="/create-market/entertainment" element={<CreateEntertainmentMarketPage />} />
        <Route path="/create-market/other" element={<CreateOtherMarketPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;