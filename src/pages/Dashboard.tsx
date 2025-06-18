import React, { useState, useEffect } from 'react';
import { db } from '../data/db';
import { Trophy, Users, Calendar, TrendingUp, Star, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalTeams: 0,
    activePlayers: 0,
    completedMatches: 0,
    upcomingMatches: 0,
    currentSeason: ''
  });
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Základní statistiky
      const totalTeams = await db.teams.count();
      const activePlayers = await db.getActivePlayersCount();
      const currentSeason = await db.getCurrentSeason();
      
      const allMatches = await db.matches
        .filter(m => m.season === currentSeason)
        .toArray();
      
      const completedMatches = allMatches.filter(m => m.completed).length;
      const upcomingMatches = allMatches.filter(m => !m.completed).length;
      
      setStats({
        totalTeams,
        activePlayers,
        completedMatches,
        upcomingMatches,
        currentSeason
      });
      
      // Nedávné zápasy
      const recent = await db.matches
        .filter(m => m.completed && m.season === currentSeason)
        .limit(5)
        .toArray();
      
      const recentWithTeams = await Promise.all(
        recent.map(async match => {
          const homeTeam = await db.teams.get(match.homeTeamId);
          const awayTeam = await db.teams.get(match.awayTeamId);
          return { ...match, homeTeam, awayTeam };
        })
      );
      
      setRecentMatches(recentWithTeams.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
      
      // Top hráči
      const playerStats = await db.getPlayerStats(currentSeason);
      const topPerformers = playerStats
        .filter(p => p.gamesPlayed >= 3)
        .sort((a, b) => b.avgTotal - a.avgTotal)
        .slice(0, 5);
      
      setTopPlayers(topPerformers);
      
    } catch (error) {
      console.error('Chyba při načítání dat dashboardu:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Načítání přehledu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hlavní statistiky */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Týmy
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalTeams}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/teams" className="font-medium text-blue-600 hover:text-blue-500">
                Zobrazit týmy
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Aktivní hráči
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activePlayers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/players" className="font-medium text-green-600 hover:text-green-500">
                Zobrazit hráče
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Dokončené zápasy
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.completedMatches}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/matches" className="font-medium text-yellow-600 hover:text-yellow-500">
                Zobrazit zápasy
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Nadcházející zápasy
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.upcomingMatches}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/schedule" className="font-medium text-purple-600 hover:text-purple-500">
                Zobrazit rozpis
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nedávné zápasy */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Nedávné zápasy
            </h3>
            {recentMatches.length === 0 ? (
              <div className="text-center py-6">
                <Trophy className="h-10 w-10 text-gray-400 mx-auto" />
                <p className="mt-2 text-sm text-gray-500">Žádné dokončené zápasy</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {match.homeTeam?.name} vs {match.awayTeam?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(match.date), 'd. MMMM yyyy', { locale: cs })}
                      </div>
                    </div>
                    <Link
                      to={`/matches/${match.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Zobrazit
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top hráči */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Nejlepší hráči (průměr kuželek)
            </h3>
            {topPlayers.length === 0 ? (
              <div className="text-center py-6">
                <Star className="h-10 w-10 text-gray-400 mx-auto" />
                <p className="mt-2 text-sm text-gray-500">Žádné statistiky hráčů</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topPlayers.map((player, index) => (
                  <div key={player.playerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-6 text-center">
                        <span className="text-sm font-medium text-gray-500">
                          {index + 1}.
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {player.playerName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {player.teamName} • {player.gamesPlayed} zápasů
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {player.avgTotal.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Max: {player.maxTotal}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Aktuální sezóna */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Aktuální sezóna: {stats.currentSeason}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Přehled současné sezóny a rychlé akce
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/standings"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Tabulka
              </Link>
              <Link
                to="/player-stats"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Star className="h-4 w-4 mr-2" />
                Statistiky
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;