import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PeoplePage from './pages/PeoplePage';
import TeamsPage from './pages/TeamsPage';
import StoriesPage from './pages/StoriesPage';
import DailyLogPage from './pages/DailyLogPage';
import BugsPage from './pages/BugsPage';
import DeploymentsPage from './pages/DeploymentsPage';
import ReportsPage from './pages/ReportsPage';
import HelpPage from './pages/HelpPage';
import LoginActivityPage from './pages/LoginActivityPage';
import LeavePage from './pages/LeavePage';
import { useApp } from './context/AppContext';
import { PRIVILEGED_ROLES } from './constants/roles';

export { PRIVILEGED_ROLES };

export default function AppRoutes() {
  const { currentUser } = useApp();

  if (!currentUser) return <LoginPage />;

  const isPrivileged = PRIVILEGED_ROLES.includes(currentUser.role);
  const isAdmin = currentUser.role === 'Admin';

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/daily-log" element={<DailyLogPage />} />
        <Route path="/bugs" element={<BugsPage />} />
        <Route path="/deployments" element={<DeploymentsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/login-activity" element={isPrivileged ? <LoginActivityPage /> : <Navigate to="/" replace />} />
        <Route path="/leave" element={isAdmin ? <LeavePage /> : <Navigate to="/" replace />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </MainLayout>
  );
}
