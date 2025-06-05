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
import LocalUsersPage from './pages/LocalUsersPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import { InfluxDatabaseProvider } from './context/InfluxDatabaseContext';
import { LocalAuthProvider } from './context/LocalAuthContext';
import { AuthGuard, ManagerGuard, AdminGuard } from './components/RouteGuards';

function App() {
  return (
    <InfluxDatabaseProvider>
      <LocalAuthProvider>
        <Router>
          <Routes>
            {/* Veřejné trasy */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Chráněné trasy (vyžadují přihlášení) */}
            <Route element={<AuthGuard />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                
                {/* Trasy pro čtení (dostupné všem přihlášeným) */}
                <Route path="standings" element={<StandingsPage />} />
                <Route path="player-stats" element={<PlayerStatsPage />} />
                
                {/* Trasy vyžadující roli správce nebo admin */}
                <Route element={<ManagerGuard />}>
                  <Route path="teams" element={<TeamsPage />} />
                  <Route path="teams/:id" element={<TeamDetail />} />
                  <Route path="players" element={<PlayersPage />} />
                  <Route path="players/:id" element={<PlayerDetail />} />
                  <Route path="matches" element={<MatchesPage />} />
                  <Route path="matches/:id" element={<MatchDetail />} />
                  <Route path="schedule" element={<SchedulePage />} />
                </Route>
                
                {/* Trasy vyžadující roli admin */}
                <Route element={<AdminGuard />}>
                  <Route path="users" element={<LocalUsersPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </Router>
      </LocalAuthProvider>
    </InfluxDatabaseProvider>
  );
}

export default App;