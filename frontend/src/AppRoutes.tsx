import { Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PeoplePage from './pages/PeoplePage';
import TeamsPage from './pages/TeamsPage';
import ProjectsPage from './pages/ProjectsPage';
import StoriesPage from './pages/StoriesPage';
import DailyLogPage from './pages/DailyLogPage';
import BugsPage from './pages/BugsPage';
import DeploymentsPage from './pages/DeploymentsPage';
import ReportsPage from './pages/ReportsPage';
import { useApp } from './context/AppContext';

export default function AppRoutes() {
  const { currentUser } = useApp();

  if (!currentUser) return <LoginPage />;

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/daily-log" element={<DailyLogPage />} />
        <Route path="/bugs" element={<BugsPage />} />
        <Route path="/deployments" element={<DeploymentsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </MainLayout>
  );
}
