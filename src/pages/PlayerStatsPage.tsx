import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../data/db';
import { PlayerStat } from '../types';
import { TrendingUp, Star, Filter } from 'lucide-react';

type StatCategory = 'total' | 'full' | 'spare' | 'errors';
type SortOrder = 'asc' | 'desc';
type GenderFilter = 'all' | 'male' | 'female';

const PlayerStatsPage: React.FC = () => {
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<StatCategory>('total');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');

  useEffect(() => {
    loadPlayerStats();
  }, [genderFilter]);

  const loadPlayerStats = async () => {
    try {
      setLoading(true);
      let stats: PlayerStat[];
      
      if (genderFilter === 'all') {
        stats = await db.getPlayerStats();
      } else {
        stats = await db.getPlayerStats(undefined, genderFilter);
      }
      
      setPlayerStats(stats);
    } catch (error) {
      console.error('Chyba při načítání statistik:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedPlayerStats = () => {
    const filteredStats = playerStats.filter(player => player.gamesPlayed > 0);
    
    return filteredStats.sort((a, b) => {
      let aVal = 0;
      let bVal = 0;
      
      switch (category) {
        case 'total':
          aVal = sortOrder === 'desc' ? a.maxTotal : -a.maxTotal;
          bVal = sortOrder === 'desc' ? b.maxTotal : -b.maxTotal;
          break;
        case 'full':
          aVal = sortOrder === 'desc' ? a.maxFulls : -a.maxFulls;
          bVal = sortOrder === 'desc' ? b.maxFulls : -b.maxFulls;
          break;
        case 'spare':
          aVal = sortOrder === 'desc' ? a.maxSpares : -a.maxSpares;
          bVal = sortOrder === 'desc' ? b.maxSpares : -b.maxSpares;
          break;
        case 'errors':
          aVal = sortOrder === 'desc' ? -a.maxErrors : a.maxErrors;
          bVal = sortOrder === 'desc' ? -b.maxErrors : b.maxErrors;
          break;
      }
      
      return bVal - aVal;
    });
  };

  const getCategoryTitle = () => {
    switch (category) {
      case 'total':
        return 'Celkový výkon';
      case 'full':
        return 'Plné';
      case 'spare':
        return 'Dorážka';
      case 'errors':
        return 'Chyby (méně je lépe)';
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const renderStatValue = (player: PlayerStat) => {
    switch (category) {
      case 'total':
        return (
          <>
            <div className="font-medium">{player.maxTotal}</div>
            <div className="text-xs text-gray-500">Průměr: {player.avgTotal.toFixed(1)}</div>
          </>
        );
      case 'full':
        return (
          <>
            <div className="font-medium">{player.maxFulls}</div>
            <div className="text-xs text-gray-500">Průměr: {player.avgFulls.toFixed(1)}</div>
          </>
        );
      case 'spare':
        return (
          <>
            <div className="font-medium">{player.maxSpares}</div>
            <div className="text-xs text-gray-500">Průměr: {player.avgSpares.toFixed(1)}</div>
          </>
        );
      case 'errors':
        return (
          <>
            <div className="font-medium">{player.maxErrors}</div>
            <div className="text-xs text-gray-500">Průměr: {player.avgErrors.toFixed(1)}</div>
          </>
        );
    }
  };

  const filteredStats = sortedPlayerStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Statistiky hráčů</h1>
        <button
          onClick={loadPlayerStats}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Obnovit
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="space-x-2">
            <button
              onClick={() => setCategory('total')}
              className={`px-3 py-1.5 text-sm font-medium rounded ${
                category === 'total'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Celkem
            </button>
            <button
              onClick={() => setCategory('full')}
              className={`px-3 py-1.5 text-sm font-medium rounded ${
                category === 'full'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Plné
            </button>
            <button
              onClick={() => setCategory('spare')}
              className={`px-3 py-1.5 text-sm font-medium rounded ${
                category === 'spare'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Dorážka
            </button>
            <button
              onClick={() => setCategory('errors')}
              className={`px-3 py-1.5 text-sm font-medium rounded ${
                category === 'errors'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Chyby
            </button>
          </div>
          
          <div className="flex space-x-3 items-center">
            <div className="relative">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as GenderFilter)}
                className="block w-full pl-8 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">Všichni hráči</option>
                <option value="male">Pouze muži</option>
                <option value="female">Pouze ženy</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <button
              onClick={toggleSortOrder}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {sortOrder === 'desc' ? 'Nejlepší první' : 'Nejhorší první'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
        </div>
      ) : filteredStats.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <Star className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {genderFilter === 'all' 
              ? 'Žádné statistiky hráčů'
              : genderFilter === 'male'
                ? 'Žádné statistiky mužů'
                : 'Žádné statistiky žen'
            }
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {playerStats.length === 0
              ? 'Dokončete nějaké zápasy pro zobrazení statistik.'
              : 'Žádní hráči neodpovídají vybranému filtru nebo nemají odehrané zápasy.'}
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
          <div className="px-4 py-5 sm:px-6 border-b">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {getCategoryTitle()}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Zobrazeno {filteredStats.length} hráčů
              {genderFilter !== 'all' && ` (${genderFilter === 'male' ? 'Muži' : 'Ženy'})`}
            </p>
          </div>
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
                    Hráč
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
                    Pohlaví
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Odehráno
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {getCategoryTitle()}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStats.map((player, index) => (
                  <tr key={player.playerId} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{player.playerName}</div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{player.teamName}</div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        player.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {player.gender === 'male' ? 'Muž' : 'Žena'}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {player.gamesPlayed}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {renderStatValue(player)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerStatsPage;