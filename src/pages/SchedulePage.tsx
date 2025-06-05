import React, { useState, useEffect } from 'react';
import { db } from '../data/db';
import { Team, Match, Season } from '../types';
import { Calendar as CalendarIcon, Plus, ArrowRight, List, CalendarDays, Search, Filter } from 'lucide-react';
import { format, isAfter, isBefore, addDays, startOfWeek } from 'date-fns';
import { cs } from 'date-fns/locale';
import ScheduleFormModal from '../components/ScheduleFormModal';
import { Link } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format as dateFnsFormat, parse, getDay } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'cs': cs
};

const localizer = dateFnsLocalizer({
  format: dateFnsFormat,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const SchedulePage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [selectedSeason]);

  const loadData = async () => {
    try {
      const allTeams = await db.teams.toArray();
      setTeams(allTeams);
      
      // Load seasons
      const allSeasons = await db.getAvailableSeasons();
      setSeasons(allSeasons);
      
      // Set current season if not already selected
      if (!selectedSeason) {
        const currentSeason = await db.getCurrentSeason();
        setSelectedSeason(currentSeason);
      }
      
      // Load matches for selected season
      const allMatches = await db.matches
        .filter(m => !selectedSeason || m.season === selectedSeason)
        .toArray();
      
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
      
      setMatches(populatedMatches);
    } catch (error) {
      console.error('Chyba při načítání dat rozpisu:', error);
    }
  };

  const handleGenerateSchedule = () => {
    setIsModalOpen(true);
  };

  const handleGenerateComplete = async () => {
    setIsModalOpen(false);
    await loadData();
  };

  const handleDateSearch = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setCalendarDate(date);
    }
  };

  const isFirstRound = (date: Date) => {
    const firstRoundStart = new Date(date.getFullYear(), 8, 1); // 1. září
    const firstRoundEnd = new Date(date.getFullYear(), 11, 15); // 15. prosince
    
    return (
      !isBefore(date, firstRoundStart) && 
      !isAfter(date, firstRoundEnd)
    );
  };

  const isSecondRound = (date: Date) => {
    const secondRoundStart = new Date(date.getFullYear(), 0, 15); // 15. ledna
    const secondRoundEnd = new Date(date.getFullYear(), 3, 30); // 30. dubna
    
    return (
      !isBefore(date, secondRoundStart) && 
      !isAfter(date, secondRoundEnd)
    );
  };

  const getMonthName = (date: Date) => {
    return format(date, 'LLLL yyyy', { locale: cs });
  };

  const matchesByMonth: Record<string, Match[]> = {};
  
  matches.forEach(match => {
    const monthKey = getMonthName(new Date(match.date));
    
    if (!matchesByMonth[monthKey]) {
      matchesByMonth[monthKey] = [];
    }
    
    matchesByMonth[monthKey].push(match);
  });

  const sortedMonths = Object.keys(matchesByMonth).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  const calendarEvents = matches.map(match => ({
    id: match.id,
    title: `${match.homeTeam?.name} vs ${match.awayTeam?.name}`,
    start: new Date(match.date),
    end: new Date(match.date),
    allDay: true,
    resource: match
  }));

  const getStatusInfo = (match: Match) => {
    const matchDate = new Date(match.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (match.completed) {
      return {
        label: 'Dokončeno',
        color: 'bg-green-100 text-green-800',
        icon: <CalendarIcon className="h-4 w-4 mr-1" />
      };
    } else if (matchDate < today) {
      return {
        label: 'Chybí výsledky',
        color: 'bg-red-100 text-red-800',
        icon: <CalendarIcon className="h-4 w-4 mr-1" />
      };
    } else {
      return {
        label: 'Nadcházející',
        color: 'bg-blue-100 text-blue-800',
        icon: <CalendarIcon className="h-4 w-4 mr-1" />
      };
    }
  };

  const eventStyleGetter = (event: any) => {
    const match = event.resource as Match;
    const status = getStatusInfo(match);
    let backgroundColor = '#3B82F6'; // blue-500
    let textColor = '#FFFFFF';
    
    if (match.completed) {
      backgroundColor = '#10B981'; // green-500
    } else if (new Date(match.date) < new Date()) {
      backgroundColor = '#EF4444'; // red-500
    }

    return {
      style: {
        backgroundColor,
        color: textColor,
        border: 'none',
        borderRadius: '4px'
      }
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Rozpis zápasů</h1>
        <div className="flex space-x-4">
          <div className="flex rounded-lg shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 rounded-l-lg focus:z-10 focus:outline-none`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-l-0 border-gray-300 rounded-r-lg focus:z-10 focus:outline-none`}
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
          {teams.length >= 2 && (
            <button
              onClick={handleGenerateSchedule}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generovat rozpis
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.name}>
                Sezóna {season.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === 'calendar' && (
        <div className="bg-white shadow rounded-lg p-4">
          <div className="mb-4 flex items-center space-x-4">
            <div className="relative flex-grow max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <DatePicker
                selected={selectedDate}
                onChange={handleDateSearch}
                dateFormat="d. MMMM yyyy"
                locale={cs}
                placeholderText="Vyhledat datum..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {teams.length < 2 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nedostatek týmů</h3>
          <p className="mt-1 text-sm text-gray-500">
            Pro generování rozpisu potřebujete alespoň 2 týmy.
          </p>
          <div className="mt-6">
            <Link
              to="/teams"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Přidat týmy
            </Link>
          </div>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žádné zápasy</h3>
          <p className="mt-1 text-sm text-gray-500">
            Vygenerujte rozpis pro vytvoření zápasů mezi týmy.
          </p>
          <div className="mt-6">
            <button
              onClick={handleGenerateSchedule}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generovat rozpis
            </button>
          </div>
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="bg-white shadow rounded-lg p-6">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700 }}
            eventPropGetter={eventStyleGetter}
            culture="cs"
            date={calendarDate}
            onNavigate={date => setCalendarDate(date)}
            messages={{
              next: "Další",
              previous: "Předchozí",
              today: "Dnes",
              month: "Měsíc",
              week: "Týden",
              day: "Den",
              agenda: "Agenda",
              date: "Datum",
              time: "Čas",
              event: "Událost",
              noEventsInRange: "V tomto období nejsou žádné zápasy"
            }}
            onSelectEvent={(event) => {
              window.location.href = `/matches/${event.id}`;
            }}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {sortedMonths.map(month => (
            <div key={month} className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{month}</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {matchesByMonth[month]
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map(match => {
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
                    
                    let roundInfo = '';
                    if (isFirstRound(matchDate)) {
                      roundInfo = 'První kolo';
                    } else if (isSecondRound(matchDate)) {
                      roundInfo = 'Druhé kolo';
                    }
                    
                    return (
                      <li key={match.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {format(matchDate, 'EEEE, d. MMMM yyyy', { locale: cs })}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {match.venue} • {roundInfo}
                              </p>
                              <div className="flex items-center mt-2">
                                <span className="text-sm font-medium">{match.homeTeam?.name}</span>
                                <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                                <span className="text-sm font-medium">{match.awayTeam?.name}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass} mr-3`}>
                              {statusText}
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
          ))}
        </div>
      )}

      {isModalOpen && (
        <ScheduleFormModal
          onComplete={handleGenerateComplete}
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SchedulePage;