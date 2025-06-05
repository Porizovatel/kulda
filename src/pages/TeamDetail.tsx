import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../data/db';
import { Team, Player, Match, PlayerHistory } from '../types';
import { UserPlus, Calendar, User, ArrowLeft, Edit } from 'lucide-react';
import PlayerFormModal from '../components/PlayerFormModal';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<(Player & { history?: PlayerHistory })[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [currentSeason, setCurrentSeason] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadTeamData(parseInt(id));
    }
  }, [id]);

  const loadTeamData = async (teamId: number) => {
    try {
      const teamData = await db.teams.get(teamId);
      setTeam(teamData || null);
      
      // Get current season
      const season = await db.getCurrentSeason();
      setCurrentSeason(season);
      
      // Get all players with their history
      const teamPlayers = await db.players.where('teamId').equals(teamId).toArray();
      const playersWithHistory = await Promise.all(
        teamPlayers.map(async player => {
          const history = await db.playerHistory
            .where({ playerId: player.id, teamId })
            .first();
          return { ...player, history };
        })
      );
      setPlayers(playersWithHistory);
      
      // Get matches for current season only
      const teamMatches = await db.matches
        .where('season')
        .equals(season)
        .filter(m => m.homeTeamId === teamId || m.awayTeamId === teamId)
        .toArray();
      
      const populatedMatches = await Promise.all(
        teamMatches.map(async match => {
          const homeTeam = await db.teams.get(match.homeTeamId);
          const awayTeam = await db.teams.get(match.awayTeamId);
          return {
            ...match,
            homeTeam,
            awayTeam
          };
        })
      );
      
      // Sort matches by date
      const sortedMatches = populatedMatches.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setMatches(sortedMatches);
    } catch (error) {
      console.error('Chyba při načítání dat týmu:', error);
    }
  };

  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setIsPlayerModalOpen(true);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setIsPlayerModalOpen(true);
  };

  const handleSavePlayer = async (playerData: Player) => {
    try {
      if (!team || !id) {
        throw new Error('Tým není vybrán');
      }

      const teamId = parseInt(id);

      if (editingPlayer?.id) {
        // Update existing player - include id but remove teamId to avoid overwriting
        const { teamId: _, ...playerDataWithoutTeamId } = playerData;
        await db.players.update(editingPlayer.id, {
          ...playerDataWithoutTeamId,
          id: editingPlayer.id
        });

        // Update player history
        const existingHistory = await db.playerHistory
          .where({ playerId: editingPlayer.id, teamId })
          .first();

        if (existingHistory) {
          await db.playerHistory.update(existingHistory.id!, {
            ...existingHistory,
            joinDate: playerData.joinDate,
            leaveDate: playerData.leaveDate
          });
        } else {
          await db.playerHistory.add({
            playerId: editingPlayer.id,
            teamId,
            joinDate: playerData.joinDate,
            leaveDate: playerData.leaveDate
          });
        }
      } else {
        // Add new player - omit id to let Dexie auto-increment
        const { id: _, ...playerDataWithoutId } = playerData;
        const playerId = await db.players.add({
          ...playerDataWithoutId,
          teamId
        });

        // Add player history
        await db.playerHistory.add({
          playerId,
          teamId,
          joinDate: playerData.joinDate,
          leaveDate: playerData.leaveDate
        });
      }

      setIsPlayerModalOpen(false);
      await loadTeamData(teamId);
    } catch (error) {
      console.error('Chyba při ukládání hráče:', error);
      throw error;
    }
  };

  const formatSchedule = (team: Team) => {
    const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
    return `${days[team.schedule.dayOfWeek]}, ${team.schedule.timeStart} - ${team.schedule.timeEnd}`;
  };

  const isPlayerCurrentlyActive = (player: Player & { history?: PlayerHistory }) => {
    if (!player.history) return false;
    
    const now = new Date();
    const joinDate = new Date(player.history.joinDate);
    const leaveDate = player.history.leaveDate ? new Date(player.history.leaveDate) : null;
    
    return joinDate <= now && (!leaveDate || leaveDate >= now);
  };

  const getActivePlayersCount = () => {
    return players.filter(isPlayerCurrentlyActive).length;
  };

  if (!team) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link to="/teams" className="mr-4 text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Detaily týmu</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Domácí kuželna</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{team.venue}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Hrací čas</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatSchedule(team)}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Aktivní hráči</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {getActivePlayersCount()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Soupiska týmu</h3>
          <button
            onClick={handleAddPlayer}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Přidat hráče
          </button>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {players.length === 0 ? (
            <div className="text-center py-6">
              <User className="h-10 w-10 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Žádní hráči</h3>
              <p className="mt-1 text-sm text-gray-500">Přidejte hráče do týmové soupisky.</p>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Jméno
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Pohlaví
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Datum nástupu
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Datum odchodu
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Stav
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Akce</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {players.map(player => {
                    const isActive = isPlayerCurrentlyActive(player);
                    return (
                      <tr key={player.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {player.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            player.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {player.gender === 'male' ? 'Muž' : 'Žena'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {player.history && format(new Date(player.history.joinDate), 'd. MMMM yyyy', { locale: cs })}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {player.history?.leaveDate ? 
                            format(new Date(player.history.leaveDate), 'd. MMMM yyyy', { locale: cs }) :
                            '—'
                          }
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {isActive ? 'Aktivní' : 'Neaktivní'}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleEditPlayer(player)}
                            className="inline-flex items-center text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Upravit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Rozpis zápasů - sezóna {currentSeason}
          </h3>
          <Link
            to="/schedule"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Celý rozpis
          </Link>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {matches.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="h-10 w-10 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Žádné zápasy</h3>
              <p className="mt-1 text-sm text-gray-500">V této sezóně nejsou naplánovány žádné zápasy.</p>
            </div>
          ) : (
            <div className="flow-root">
              <ul className="-mb-8">
                {matches.map((match, matchIdx) => {
                  const isHomeTeam = match.homeTeamId === team.id;
                  const opponent = isHomeTeam ? match.awayTeam : match.homeTeam;
                  const matchDate = new Date(match.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  let statusClass = '';
                  let statusText = '';
                  
                  if (match.completed) {
                    statusClass = 'bg-green-100 text-green-800';
                    statusText = 'Dokončeno';
                  } else if (matchDate < today) {
                    statusClass = 'bg-red-100 text-red-800';
                    statusText = 'Chybí výsledky';
                  } else if (matchDate.toDateString() === today.toDateString()) {
                    statusClass = 'bg-yellow-100 text-yellow-800';
                    statusText = 'Dnes';
                  } else {
                    statusClass = 'bg-blue-100 text-blue-800';
                    statusText = 'Nadcházející';
                  }

                  return (
                    <li key={match.id}>
                      <div className="relative pb-8">
                        {matchIdx !== matches.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center ring-8 ring-white">
                              <Calendar className="h-4 w-4 text-gray-500" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  {format(matchDate, 'EEEE, d. MMMM yyyy', { locale: cs })}
                                </span>
                                <span className="ml-2 text-sm text-gray-500">{match.venue}</span>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                                {statusText}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-500">
                                {isHomeTeam ? 'Doma vs ' : 'Venku vs '}
                                <span className="font-medium text-gray-900">{opponent?.name}</span>
                              </div>
                              <Link
                                to={`/matches/${match.id}`}
                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                              >
                                {match.completed ? 'Zobrazit výsledky' : 'Zadat výsledky'}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {isPlayerModalOpen && (
        <PlayerFormModal
          player={editingPlayer}
          teamId={parseInt(id!)}
          onSave={handleSavePlayer}
          onCancel={() => setIsPlayerModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TeamDetail;