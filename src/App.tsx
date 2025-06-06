import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TeamsPage from './pages/TeamsPage';
import TeamDetail from './pages/TeamDetail';
import PlayersPage from './pages/PlayersPage';
import PlayerDetail from './pages/PlayerDetail';
import MatchesPage from './pages/MatchesPage';
import MatchDetail from './pages/MatchDetail';
import StandingsPage from './pages/StandingsPage';
import SchedulePage from './pages/SchedulePage';
import PlayerStatsPage from './pages/PlayerStatsPage';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard, ManagerGuard, AdminGuard } from './components/RouteGuards';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Protected routes */}
          <Route element={<AuthGuard />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              
              {/* Read-only routes */}
              <Route path="standings" element={<StandingsPage />} />
              <Route path="player-stats" element={<PlayerStatsPage />} />
              
              {/* Manager/Admin routes */}
              <Route element={<ManagerGuard />}>
                <Route path="teams" element={<TeamsPage />} />
                <Route path="teams/:id" element={<TeamDetail />} />
                <Route path="players" element={<PlayersPage />} />
                <Route path="players/:id" element={<PlayerDetail />} />
                <Route path="matches" element={<MatchesPage />} />
                <Route path="matches/:id" element={<MatchDetail />} />
                <Route path="schedule" element={<SchedulePage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;