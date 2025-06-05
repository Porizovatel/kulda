import React from 'react';
import { useForm } from 'react-hook-form';
import { Season } from '../types';
import { X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { cs } from 'date-fns/locale';

interface SeasonFormModalProps {
  season: Season | null;
  onSave: (season: Season) => void;
  onCancel: () => void;
}

const SeasonFormModal: React.FC<SeasonFormModalProps> = ({ season, onSave, onCancel }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Season>({
    defaultValues: season || {
      name: '',
      startDate: new Date(),
      endDate: new Date(),
      active: false
    }
  });

  React.useEffect(() => {
    register('startDate', { required: 'Datum začátku je povinné' });
    register('endDate', { required: 'Datum konce je povinné' });
  }, [register]);

  const handleStartDateChange = (date: Date) => {
    setValue('startDate', date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    if (month >= 9) {
      setValue('name', `${year}/${year + 1}`);
    } else {
      setValue('name', `${year - 1}/${year}`);
    }
  };

  const handleEndDateChange = (date: Date) => {
    setValue('endDate', date);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            {season ? 'Upravit sezónu' : 'Přidat novou sezónu'}
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
                Název sezóny
              </label>
              <input
                type="text"
                id="name"
                {...register('name', { required: 'Název sezóny je povinný' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Začátek sezóny
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
                Konec sezóny
              </label>
              <DatePicker
                id="endDate"
                selected={watch('endDate')}
                onChange={handleEndDateChange}
                dateFormat="d. MMMM yyyy"
                locale={cs}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="flex items-center">
              <input
                id="active"
                type="checkbox"
                {...register('active')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Aktivní sezóna
              </label>
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
              {season ? 'Uložit změny' : 'Přidat sezónu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeasonFormModal;