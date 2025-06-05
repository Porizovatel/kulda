import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../data/db';
import { Player, Team } from '../types';
import { Plus, User, Filter, Search } from 'lucide-react';
import PlayerFormModal from '../components/PlayerFormModal';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

const PlayersPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState<number | 'all'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const allTeams = await db.teams.toArray();
      setTeams(allTeams);
      
      const allPlayers = await db.players.toArray();
      const playersWithDetails = await Promise.all(
        allPlayers.map(async player => {
          const team = await db.teams.get(player.teamId);
          const history = await db.playerHistory
            .where({ playerId: player.id, teamId: player.teamId })
            .first();
          
          return {
            ...player,
            teamName: team?.name || 'Unknown',
            joinDate: history?.joinDate || player.joinDate,
            leaveDate: history?.leaveDate || player.leaveDate
          };
        })
      );
      
      setPlayers(playersWithDetails);
    } catch (error) {
      console.error('Error loading player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = () => {
    if (teams.length === 0) {
      alert('You must create at least one team before adding players');
      return;
    }
    
    setEditingPlayer(null);
    setIsModalOpen(true);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setIsModalOpen(true);
  };

  const handleSavePlayer = async (playerData: Player) => {
    try {
      if (editingPlayer?.id) {
        await db.players.update(editingPlayer.id, playerData);
        
        // Update player history
        const existingHistory = await db.playerHistory
          .where({ playerId: editingPlayer.id, teamId: playerData.teamId })
          .first();
        
        if (existingHistory) {
          await db.playerHistory.update(existingHistory.id!, {
            joinDate: playerData.joinDate,
            leaveDate: playerData.leaveDate
          });
        } else {
          await db.playerHistory.add({
            playerId: editingPlayer.id,
            teamId: playerData.teamId,
            joinDate: playerData.joinDate,
            leaveDate: playerData.leaveDate
          });
        }
      } else {
        const playerId = await db.players.add(playerData);
        
        // Create initial player history
        await db.playerHistory.add({
          playerId,
          teamId: playerData.teamId,
          joinDate: playerData.joinDate,
          leaveDate: playerData.leaveDate
        });
      }
      
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving player:', error);
      throw error;
    }
  };

  const isPlayerActive = (player: Player) => {
    const now = new Date();
    const joinDate = new Date(player.joinDate);
    const leaveDate = player.leaveDate ? new Date(player.leaveDate) : null;
    
    return joinDate <= now && (!leaveDate || leaveDate >= now);
  };

  const filteredPlayers = () => {
    return players.filter(player => {
      if (teamFilter !== 'all' && player.teamId !== teamFilter) {
        return false;
      }
      
      if (genderFilter !== 'all' && player.gender !== genderFilter) {
        return false;
      }
      
      if (searchQuery && !player.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Players</h1>
        <button
          onClick={handleAddPlayer}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Player
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search players..."
            />
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
              <option value="all">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as 'all' | 'male' | 'female')}
            className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          >
            <option value="all">All Genders</option>
            <option value="male">Male Only</option>
            <option value="female">Female Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
        </div>
      ) : filteredPlayers().length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Players</h3>
          <p className="mt-1 text-sm text-gray-500">
            {players.length === 0
              ? 'Start by adding a new player.'
              : 'No players match the selected filters.'}
          </p>
          {players.length === 0 && (
            <div className="mt-6">
              <button
                onClick={handleAddPlayer}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Date
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlayers().map((player) => {
                const active = isPlayerActive(player);
                return (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{player.name}</div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            player.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {player.gender === 'male' ? 'Male' : 'Female'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <Link to={`/teams/${player.teamId}`} className="text-blue-600 hover:text-blue-900">
                          {player.teamName}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(player.joinDate), 'd. MMMM yyyy', { locale: cs })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.leaveDate ? 
                        format(new Date(player.leaveDate), 'd. MMMM yyyy', { locale: cs }) : 
                        '—'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditPlayer(player)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <PlayerFormModal
          player={editingPlayer}
          teamId={editingPlayer?.teamId || teams[0]?.id || 0}
          onSave={handleSavePlayer}
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default PlayersPage;