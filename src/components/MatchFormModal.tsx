import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Team, Match, Season } from '../types';
import { X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { cs } from 'date-fns/locale';
import { db } from '../data/db';

interface MatchFormModalProps {
  onSave: (match: Match) => void;
  onCancel: () => void;
}

const MatchFormModal: React.FC<MatchFormModalProps> = ({ onSave, onCancel }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Match>({
    defaultValues: {
      date: new Date(),
      completed: false
    }
  });

  const watchHomeTeamId = watch('homeTeamId');
  const watchAwayTeamId = watch('awayTeamId');

  useEffect(() => {
    const loadData = async () => {
      const allTeams = await db.teams.toArray();
      const allSeasons = await db.getAvailableSeasons();
      const currentSeason = await db.getCurrentSeason();
      
      setTeams(allTeams);
      setSeasons(allSeasons);
      setValue('season', currentSeason);
    };
    loadData();
  }, [setValue]);

  useEffect(() => {
    register('date', { required: 'Datum zápasu je povinné' });
  }, [register]);

  const handleDateChange = (date: Date) => {
    setValue('date', date);
  };

  const handleHomeTeamChange = (teamId: number) => {
    setValue('homeTeamId', teamId);
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setValue('venue', team.venue);
    }
  };

  const onSubmit = (data: any) => {
    // Convert string IDs to numbers
    const match: Match = {
      ...data,
      homeTeamId: parseInt(data.homeTeamId),
      awayTeamId: parseInt(data.awayTeamId)
    };
    onSave(match);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            Přidat nový zápas
          </h3>
          <button 
            onClick={onCancel}
            className="rounded-md text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="homeTeamId" className="block text-sm font-medium text-gray-700">
                Domácí tým
              </label>
              <select
                id="homeTeamId"
                {...register('homeTeamId', { required: 'Domácí tým je povinný' })}
                onChange={(e) => handleHomeTeamChange(parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Vyberte tým</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {errors.homeTeamId && (
                <p className="mt-1 text-sm text-red-600">{errors.homeTeamId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="awayTeamId" className="block text-sm font-medium text-gray-700">
                Hostující tým
              </label>
              <select
                id="awayTeamId"
                {...register('awayTeamId', { 
                  required: 'Hostující tým je povinný',
                  validate: value => parseInt(value) !== parseInt(watchHomeTeamId as string) || 'Hostující tým musí být jiný než domácí'
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Vyberte tým</option>
                {teams.map(team => (
                  <option 
                    key={team.id} 
                    value={team.id}
                    disabled={team.id === parseInt(watchHomeTeamId as string)}
                  >
                    {team.name}
                  </option>
                ))}
              </select>
              {errors.awayTeamId && (
                <p className="mt-1 text-sm text-red-600">{errors.awayTeamId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Datum zápasu
              </label>
              <DatePicker
                id="date"
                selected={watch('date')}
                onChange={handleDateChange}
                dateFormat="d. MMMM yyyy"
                locale={cs}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700">
                Kuželna
              </label>
              <input
                type="text"
                id="venue"
                {...register('venue', { required: 'Kuželna je povinná' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.venue && (
                <p className="mt-1 text-sm text-red-600">{errors.venue.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="season" className="block text-sm font-medium text-gray-700">
                Sezóna
              </label>
              <select
                id="season"
                {...register('season', { required: 'Sezóna je povinná' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {seasons.map(season => (
                  <option key={season.id} value={season.name}>
                    {season.name}
                  </option>
                ))}
              </select>
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
              Přidat zápas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchFormModal;