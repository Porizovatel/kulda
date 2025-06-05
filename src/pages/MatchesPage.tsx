import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../data/db';
import { Match } from '../types';
import { Filter, CheckCircle, XCircle, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import MatchFormModal from '../components/MatchFormModal';

type StatusFilter = 'all' | 'completed' | 'pending' | 'upcoming' | 'missed';
type TeamFilter = number | 'all';
type SeasonFilter = string | 'all';

const MatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const allTeams = await db.teams.toArray();
      setTeams(allTeams.map(team => ({ id: team.id!, name: team.name })));
      
      const allMatches = await db.matches.toArray();
      
      const populatedMatches = await Promise.all(
        allMatches.map(async match => {
          const homeTeam = await db.teams.get(match.homeTeamId);
          const awayTeam = await db.teams.get(match.awayTeamId);
          return {
            ...match,
            homeTeam,
            awayTeam
          };
        })
      );
      
      const sortedMatches = populatedMatches.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setMatches(sortedMatches);

      // Set initial season filter to active season
      const currentSeason = await db.getCurrentSeason();
      setSeasonFilter(currentSeason);
    } catch (error) {
      console.error('Chyba při načítání dat zápasů:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMatch = async (match: Match) => {
    try {
      await db.matches.add(match);
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Chyba při přidávání zápasu:', error);
      alert('Při přidávání zápasu došlo k chybě');
    }
  };

  const filteredMatches = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return matches.filter(match => {
      const matchDate = new Date(match.date);
      
      if (teamFilter !== 'all' && match.homeTeamId !== teamFilter && match.awayTeamId !== teamFilter) {
        return false;
      }

      if (seasonFilter !== 'all' && match.season !== seasonFilter) {
        return false;
      }
      
      switch (statusFilter) {
        case 'completed':
          return match.completed;
        case 'pending':
          return !match.completed && matchDate < today;
        case 'upcoming':
          return !match.completed && matchDate >= today;
        case 'missed':
          return !match.completed && matchDate < today;
        default:
          return true;
      }
    });
  };

  const getStatusInfo = (match: Match) => {
    const matchDate = new Date(match.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (match.completed) {
      return {
        label: 'Dokončeno',
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-4 w-4 mr-1" />
      };
    } else if (matchDate < today) {
      return {
        label: 'Chybí výsledky',
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="h-4 w-4 mr-1" />
      };
    } else {
      return {
        label: 'Nadcházející',
        color: 'bg-blue-100 text-blue-800',
        icon: <Calendar className="h-4 w-4 mr-1" />
      };
    }
  };

  const uniqueSeasons = Array.from(new Set(matches.map(m => m.season))).sort().reverse();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Zápasy</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Přidat zápas
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            >
              <option value="all">Všechny zápasy</option>
              <option value="completed">Dokončené</option>
              <option value="pending">Chybí výsledky</option>
              <option value="upcoming">Nadcházející</option>
            </select>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={teamFilter === 'all' ? 'all' : teamFilter.toString()}
              onChange={(e) => setTeamFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            >
              <option value="all">Všechny týmy</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            >
              <option value="all">Všechny sezóny</option>
              {uniqueSeasons.map((season) => (
                <option key={season} value={season}>
                  Sezóna {season}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
        </div>
      ) : filteredMatches().length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žádné zápasy</h3>
          <p className="mt-1 text-sm text-gray-500">
            {matches.length === 0
              ? 'Začněte přidáním nového zápasu.'
              : 'Žádné zápasy neodpovídají vybraným filtrům.'}
          </p>
          {matches.length === 0 && (
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                Přidat zápas
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {filteredMatches().map((match) => {
              const status = getStatusInfo(match);
              
              return (
                <li key={match.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {match.homeTeam?.name} vs {match.awayTeam?.name}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {format(new Date(match.date), 'EEEE, d. MMMM yyyy', { locale: cs })}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {match.venue} • Sezóna {match.season}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                      <Link
                        to={`/matches/${match.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        {match.completed ? 'Zobrazit výsledky' : 'Zadat výsledky'}
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isModalOpen && (
        <MatchFormModal
          onSave={handleAddMatch}
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default MatchesPage;