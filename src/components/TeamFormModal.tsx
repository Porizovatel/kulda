import React from 'react';
import { useForm } from 'react-hook-form';
import { Team } from '../types';
import { X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { cs } from 'date-fns/locale';

interface TeamFormModalProps {
  team: Team | null;
  onSave: (team: Team) => void;
  onCancel: () => void;
}

const TeamFormModal: React.FC<TeamFormModalProps> = ({ team, onSave, onCancel }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Team>({
    defaultValues: team || {
      name: '',
      venue: '',
      schedule: {
        dayOfWeek: 1, // Pondělí
        timeStart: '18:00',
        timeEnd: '20:00'
      },
      startDate: new Date()
    }
  });

  const daysOfWeek = [
    { value: 0, label: 'Neděle' },
    { value: 1, label: 'Pondělí' },
    { value: 2, label: 'Úterý' },
    { value: 3, label: 'Středa' },
    { value: 4, label: 'Čtvrtek' },
    { value: 5, label: 'Pátek' },
    { value: 6, label: 'Sobota' }
  ];

  React.useEffect(() => {
    register('startDate', { required: 'Datum zahájení je povinné' });
    register('endDate');
  }, [register]);

  const handleStartDateChange = (date: Date) => {
    setValue('startDate', date);
  };

  const handleEndDateChange = (date: Date | null) => {
    setValue('endDate', date || undefined);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            {team ? 'Upravit tým' : 'Přidat nový tým'}
          </h3>
          <button 
            onClick={onCancel}
            className="rounded-md text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSave)} className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Název týmu
              </label>
              <input
                type="text"
                id="name"
                {...register('name', { required: 'Název týmu je povinný' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700">
                Domácí kuželna
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
              <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">
                Hrací den
              </label>
              <select
                id="dayOfWeek"
                {...register('schedule.dayOfWeek', { 
                  required: 'Hrací den je povinný',
                  valueAsNumber: true
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {daysOfWeek.map(day => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="timeStart" className="block text-sm font-medium text-gray-700">
                  Začátek
                </label>
                <input
                  type="time"
                  id="timeStart"
                  {...register('schedule.timeStart', { required: 'Čas začátku je povinný' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="timeEnd" className="block text-sm font-medium text-gray-700">
                  Konec
                </label>
                <input
                  type="time"
                  id="timeEnd"
                  {...register('schedule.timeEnd', { required: 'Čas konce je povinný' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Datum zahájení
              </label>
              <DatePicker
                id="startDate"
                selected={watch('startDate')}
                onChange={handleStartDateChange}
                dateFormat="d. MMMM yyyy"
                locale={cs}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                Datum ukončení
              </label>
              <DatePicker
                id="endDate"
                selected={watch('endDate')}
                onChange={handleEndDateChange}
                dateFormat="d. MMMM yyyy"
                locale={cs}
                isClearable
                placeholderText="Neurčeno"
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
              {team ? 'Uložit změny' : 'Přidat tým'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamFormModal;