import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../data/db';
import { Team } from '../types';
import { Plus, Users, Edit, Trash2 } from 'lucide-react';
import TeamFormModal from '../components/TeamFormModal';

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    const allTeams = await db.teams.toArray();
    setTeams(allTeams);
  };

  const handleAddTeam = () => {
    setEditingTeam(null);
    setIsModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleDeleteTeam = async (teamId: number | undefined) => {
    if (!teamId || !window.confirm('Opravdu chcete smazat tento tým?')) {
      return;
    }
    
    try {
      const playerCount = await db.players.where('teamId').equals(teamId).count();
      const matchCount = await db.matches
        .where('homeTeamId').equals(teamId)
        .or('awayTeamId').equals(teamId)
        .count();
      
      if (playerCount > 0 || matchCount > 0) {
        alert(`Nelze smazat tým, protože má ${playerCount} hráčů a ${matchCount} zápasů.`);
        return;
      }
      
      await db.teams.delete(teamId);
      setTeams(teams.filter(team => team.id !== teamId));
    } catch (error) {
      console.error('Chyba při mazání týmu:', error);
      alert('Při mazání týmu došlo k chybě');
    }
  };

  const handleSaveTeam = async (team: Team) => {
    try {
      if (editingTeam?.id) {
        await db.teams.update(editingTeam.id, team);
      } else {
        await db.teams.add({
          ...team,
          createdAt: new Date()
        });
      }
      
      setIsModalOpen(false);
      loadTeams();
    } catch (error) {
      console.error('Chyba při ukládání týmu:', error);
      alert('Při ukládání týmu došlo k chybě');
    }
  };

  const formatSchedule = (team: Team) => {
    const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
    return `${days[team.schedule.dayOfWeek]}, ${team.schedule.timeStart} - ${team.schedule.timeEnd}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Týmy</h1>
        <button
          onClick={handleAddTeam}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Přidat tým
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Žádné týmy</h3>
            <p className="mt-1 text-sm text-gray-500">Začněte vytvořením nového týmu.</p>
            <div className="mt-6">
              <button
                onClick={handleAddTeam}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Přidat tým
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {teams.map((team) => (
              <li key={team.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-lg font-medium text-blue-600">
                        <Link to={`/teams/${team.id}`} className="hover:underline">
                          {team.name}
                        </Link>
                      </div>
                      <div className="text-sm text-gray-500">
                        {team.venue} • {formatSchedule(team)}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTeam(team)}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isModalOpen && (
        <TeamFormModal
          team={editingTeam}
          onSave={handleSaveTeam}
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TeamsPage;