import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../data/db';
import { Standing } from '../types';
import { TrendingUp, Trophy, Medal } from 'lucide-react';

const StandingsPage: React.FC = () => {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStandings();
  }, []);

  const loadStandings = async () => {
    try {
      setLoading(true);
      const teamStandings = await db.getTeamStandings();
      setStandings(teamStandings);
    } catch (error) {
      console.error('Chyba při načítání tabulky:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-gray-500">{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Ligová tabulka</h1>
        <button
          onClick={loadStandings}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Obnovit
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
        </div>
      ) : standings.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žádné týmy v tabulce</h3>
          <p className="mt-1 text-sm text-gray-500">
            Dokončete nějaké zápasy pro zobrazení tabulky.
          </p>
          <div className="mt-6">
            <Link
              to="/matches"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Zobrazit zápasy
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Pořadí
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tým
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Zápasy
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Body
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Pomocné body
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Ztracené body
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Celkem kuželek
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Průměr kuželek
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {standings.map((team) => (
                  <tr key={team.teamId} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {getRankIcon(team.rank)}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <Link
                        to={`/teams/${team.teamId}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {team.teamName}
                      </Link>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {team.matchesPlayed}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {team.points}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {team.auxiliaryPoints}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {team.lostPoints}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {team.totalPins}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {team.avgPins.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pravidla bodování</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>Body za zápas:</strong> Výhra = 2 body, Remíza = 1 bod, Prohra = 0 bodů
          </p>
          <p>
            <strong>Pomocné body:</strong> Výhry v duelech hráčů (2 body za každý) + Porovnání celkového počtu kuželek (2 body)
          </p>
          <p>
            <strong>Pořadí při rovnosti bodů:</strong> V případě rovnosti bodů se pořadí určuje podle:
          </p>
          <ol className="list-decimal list-inside pl-4 space-y-1">
            <li>Nejvyšší počet pomocných bodů</li>
            <li>Nejvyšší průměr kuželek na zápas</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default StandingsPage;