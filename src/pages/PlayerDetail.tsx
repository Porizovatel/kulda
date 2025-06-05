import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';

const PlayerDetail = () => {
  const { id } = useParams();
  const { getPlayer } = useDatabase();
  const player = getPlayer(id);

  if (!player) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Hráč nenalezen</h2>
          <p className="mt-2 text-gray-600">Hledaný hráč neexistuje.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link to="/players" className="mr-4 text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{player.name}</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Informace o hráči</h2>
              <div className="mt-2 space-y-2">
                <p className="text-gray-600">Tým: {player.team}</p>
                <p className="text-gray-600">
                  Pohlaví: {player.gender === 'male' ? 'Muž' : 'Žena'}
                </p>
                <p className="text-gray-600">
                  Stav: {player.active ? 'Aktivní' : 'Neaktivní'}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-700">Statistiky sezóny</h2>
              <div className="mt-2 space-y-2">
                <p className="text-gray-600">Odehráno zápasů: {player.gamesPlayed}</p>
                <p className="text-gray-600">Průměr kuželek: {player.avgPins}</p>
                <p className="text-gray-600">Nejlepší výkon: {player.bestScore}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700">Poslední výkony</h2>
            <div className="mt-4 space-y-4">
              {player.recentMatches?.map((match, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <p className="font-medium text-gray-900">{match.opponent}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(match.date), 'd. MMMM yyyy', { locale: cs })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Plné: {match.full} | Dorážka: {match.spare} | Chyby: {match.errors}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;