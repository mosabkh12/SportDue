import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import CoachDashboard from './pages/CoachDashboard.jsx';
import GroupDetailsPage from './pages/GroupDetailsPage.jsx';
import PlayerDetailsPage from './pages/PlayerDetailsPage.jsx';
import AttendancePage from './pages/AttendancePage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminProfilePage from './pages/AdminProfilePage.jsx';
import CoachProfilePage from './pages/CoachProfilePage.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './App.css';

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />

    <Route element={<ProtectedRoute allowedRoles={['coach']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/coach/dashboard" element={<CoachDashboard />} />
        <Route path="/coach/profile" element={<CoachProfilePage />} />
        <Route path="/coach/groups/:groupId" element={<GroupDetailsPage />} />
        <Route path="/coach/groups/:groupId/attendance" element={<AttendancePage />} />
        <Route path="/coach/players/:playerId" element={<PlayerDetailsPage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default App;
