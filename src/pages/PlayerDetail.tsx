import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../data/db';
import { Player, Team, PlayerHistory } from '../types';
import { ArrowLeft, User } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

const PlayerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [playerHistory, setPlayerHistory] = useState<PlayerHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPlayerData(parseInt(id));
    }
  }, [id]);

  const loadPlayerData = async (playerId: number) => {
    try {
      setLoading(true);
      
      const playerData = await db.players.get(playerId);
      if (!playerData) {
        setLoading(false);
        return;
      }
      
      setPlayer(playerData);
      
      const teamData = await db.teams.get(playerData.teamId);
      setTeam(teamData || null);
      
      const history = await db.getPlayerTeamHistory(playerId);
      setPlayerHistory(history);
      
    } catch (error) {
      console.error('Chyba při načítání dat hráče:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Hráč nenalezen</h2>
          <p className="mt-2 text-gray-600">Hledaný hráč neexistuje.</p>
          <Link
            to="/players"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět na seznam hráčů
          </Link>
        </div>
      </div>
    );
  }

  const isPlayerActive = () => {
    const now = new Date();
    const joinDate = new Date(player.joinDate);
    const leaveDate = player.leaveDate ? new Date(player.leaveDate) : null;
    
    return joinDate <= now && (!leaveDate || leaveDate >= now);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link to="/players" className="mr-4 text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{player.name}</h1>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Informace o hráči</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Jméno</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{player.name}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Tým</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {team ? (
                  <Link to={`/teams/${team.id}`} className="text-blue-600 hover:text-blue-800">
                    {team.name}
                  </Link>
                ) : (
                  'Neznámý tým'
                )}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Pohlaví</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  player.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                }`}>
                  {player.gender === 'male' ? 'Muž' : 'Žena'}
                </span>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Datum nástupu</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {format(new Date(player.joinDate), 'd. MMMM yyyy', { locale: cs })}
              </dd>
            </div>
            {player.leaveDate && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Datum odchodu</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {format(new Date(player.leaveDate), 'd. MMMM yyyy', { locale: cs })}
                </dd>
              </div>
            )}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Stav</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isPlayerActive() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isPlayerActive() ? 'Aktivní' : 'Neaktivní'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {playerHistory.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Historie týmů</h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {playerHistory.map((history, index) => (
                <li key={history.id || index} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Tým ID: {history.teamId}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(history.joinDate), 'd. MMMM yyyy', { locale: cs })}
                        {history.leaveDate && (
                          <> - {format(new Date(history.leaveDate), 'd. MMMM yyyy', { locale: cs })}</>
                        )}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDetail;