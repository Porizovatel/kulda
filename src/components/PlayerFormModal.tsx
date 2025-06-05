import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Player, Team } from '../types';
import { X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { db } from '../data/db';

interface PlayerFormModalProps {
  player: Player | null;
  teamId: number;
  onSave: (player: Player) => void;
  onCancel: () => void;
}

const PlayerFormModal: React.FC<PlayerFormModalProps> = ({ player, teamId, onSave, onCancel }) => {
  const [teams, setTeams] = React.useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Player>({
    defaultValues: player || {
      name: '',
      teamId,
      gender: 'male',
      joinDate: new Date()
    }
  });

  const watchTeamId = watch('teamId');
  const watchJoinDate = watch('joinDate');
  const watchLeaveDate = watch('leaveDate');

  React.useEffect(() => {
    const loadTeams = async () => {
      const allTeams = await db.teams.toArray();
      setTeams(allTeams.map(team => ({ id: team.id!, name: team.name })));
    };
    loadTeams();
  }, []);

  React.useEffect(() => {
    register('joinDate', { required: 'Datum nástupu je povinné' });
    register('leaveDate');
  }, [register]);

  const handleJoinDateChange = (date: Date) => {
    setValue('joinDate', date);
  };

  const handleLeaveDateChange = (date: Date | null) => {
    setValue('leaveDate', date || undefined);
  };

  const handleFormSubmit = async (formData: Player) => {
    try {
      setError(null);

      const canJoin = await db.canPlayerJoinTeam(
        player?.id || -1,
        formData.teamId,
        formData.joinDate,
        formData.leaveDate
      );

      if (!canJoin) {
        setError('Hráč již působí v jiném týmu ve zvoleném období');
        return;
      }

      onSave(formData);
    } catch (error) {
      console.error('Error saving player:', error);
      setError('Při ukládání hráče došlo k chybě');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            {player ? 'Upravit hráče' : 'Přidat nového hráče'}
          </h3>
          <button 
            onClick={onCancel}
            className="rounded-md text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="px-6 py-4">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Jméno hráče
              </label>
              <input
                type="text"
                id="name"
                {...register('name', { required: 'Jméno hráče je povinné' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="teamId" className="block text-sm font-medium text-gray-700">
                Tým
              </label>
              <select
                id="teamId"
                {...register('teamId', { required: 'Tým je povinný' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Pohlaví
              </label>
              <select
                id="gender"
                {...register('gender', { required: 'Pohlaví je povinné' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="male">Muž</option>
                <option value="female">Žena</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="joinDate" className="block text-sm font-medium text-gray-700">
                Datum nástupu
              </label>
              <DatePicker
                id="joinDate"
                selected={watchJoinDate}
                onChange={handleJoinDateChange}
                dateFormat="d. MMMM yyyy"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="leaveDate" className="block text-sm font-medium text-gray-700">
                Datum odchodu (volitelné)
              </label>
              <DatePicker
                id="leaveDate"
                selected={watchLeaveDate}
                onChange={handleLeaveDateChange}
                dateFormat="d. MMMM yyyy"
                isClearable
                placeholderText="Stále aktivní"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {player ? 'Uložit změny' : 'Přidat hráče'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerFormModal;