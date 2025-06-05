import React, { useState } from 'react';
import { db } from '../data/db';
import { Team, Match, Season } from '../types';
import { X, Calendar, CheckCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addDays, format, setHours, setMinutes, isAfter, isBefore } from 'date-fns';
import { cs } from 'date-fns/locale';

interface ScheduleFormModalProps {
  onComplete: () => void;
  onCancel: () => void;
}

const ScheduleFormModal: React.FC<ScheduleFormModalProps> = ({ onComplete, onCancel }) => {
  const [generating, setGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isValidTimeFormat = (time: string): boolean => {
    return /^\d{2}:\d{2}$/.test(time);
  };

  const convertTimeToHHMM = (time: string | number): string => {
    if (typeof time === 'string' && isValidTimeFormat(time)) {
      return time;
    }

    const timeValue = typeof time === 'string' ? parseFloat(time) : time;
    const totalHours = timeValue * 24;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getAvailableTimeslot = (team: Team, baseDate: Date): Date | null => {
    try {
      let date = new Date(baseDate);
      const targetDay = team.schedule.dayOfWeek;
      
      while (date.getDay() !== targetDay) {
        date = addDays(date, 1);
      }
      
      const timeStartString = convertTimeToHHMM(team.schedule.timeStart);
      if (!isValidTimeFormat(timeStartString)) {
        console.error(`Invalid time format for team ${team.name}:`, timeStartString);
        return null;
      }
      
      const [startHour, startMinute] = timeStartString.split(':').map(Number);
      if (isNaN(startHour) || isNaN(startMinute)) {
        console.error(`Invalid time values for team ${team.name}:`, { startHour, startMinute });
        return null;
      }
      
      return setMinutes(setHours(date, startHour), startMinute);
    } catch (error) {
      console.error(`Error processing time for team ${team.name}:`, error);
      return null;
    }
  };

  const isDateAvailable = async (date: Date, teamId: number): Promise<boolean> => {
    const existingMatch = await db.matches
      .filter(m => {
        const matchDate = new Date(m.date);
        return (
          matchDate.getFullYear() === date.getFullYear() &&
          matchDate.getMonth() === date.getMonth() &&
          matchDate.getDate() === date.getDate() &&
          (m.homeTeamId === teamId || m.awayTeamId === teamId)
        );
      })
      .first();
    
    return !existingMatch;
  };

  const findNextAvailableDate = async (baseDate: Date, team: Team, isHome: boolean, seasonEnd: Date): Promise<Date | null> => {
    let currentDate = new Date(baseDate);
    let attempts = 0;
    const maxAttempts = 52; // Maximum weeks to try

    while (attempts < maxAttempts && currentDate <= seasonEnd) {
      const timeslot = getAvailableTimeslot(team, currentDate);
      if (timeslot && await isDateAvailable(timeslot, team.id!)) {
        return timeslot;
      }
      currentDate = addDays(currentDate, 7);
      attempts++;
    }

    return null;
  };

  const generateSchedule = async () => {
    try {
      setGenerating(true);
      setError(null);

      // Get active season
      const activeSeason = await db.seasons.filter(s => s.active).first();
      if (!activeSeason) {
        throw new Error('Není nastavena aktivní sezóna');
      }

      const seasonStart = new Date(activeSeason.startDate);
      const seasonEnd = new Date(activeSeason.endDate);

      // Get active teams
      const allTeams = await db.teams.toArray();
      const activeTeams = allTeams.filter(team => {
        const teamStart = new Date(team.startDate);
        const teamEnd = team.endDate ? new Date(team.endDate) : null;
        return teamStart <= seasonEnd && (!teamEnd || teamEnd >= seasonStart);
      });

      if (activeTeams.length < 2) {
        throw new Error('Pro generování rozpisu jsou potřeba alespoň 2 aktivní týmy');
      }

      // Clear only matches for active season
      await db.matches
        .filter(m => m.season === activeSeason.name)
        .delete();

      const matches: Match[] = [];
      const teamLastMatches = new Map<number, { date: Date; wasHome: boolean }>();

      // Generate matches between all teams
      for (let i = 0; i < activeTeams.length; i++) {
        for (let j = i + 1; j < activeTeams.length; j++) {
          const homeTeam = activeTeams[i];
          const awayTeam = activeTeams[j];

          // First round - home match
          const lastHomeMatch = teamLastMatches.get(homeTeam.id!);
          const lastAwayMatch = teamLastMatches.get(awayTeam.id!);
          
          let firstRoundDate = await findNextAvailableDate(
            seasonStart,
            homeTeam,
            true,
            seasonEnd
          );

          if (!firstRoundDate) {
            console.warn(`Could not find available date for first round match between ${homeTeam.name} and ${awayTeam.name}`);
            continue; // Skip this match pair if no date is available
          }

          // Ensure 7 days between matches for both teams
          if (lastHomeMatch && (firstRoundDate.getTime() - lastHomeMatch.date.getTime()) < 7 * 24 * 60 * 60 * 1000) {
            firstRoundDate = await findNextAvailableDate(
              addDays(lastHomeMatch.date, 7),
              homeTeam,
              true,
              seasonEnd
            );
            if (!firstRoundDate) {
              console.warn(`Could not find available date for first round match after last home match`);
              continue;
            }
          }
          
          if (lastAwayMatch && (firstRoundDate.getTime() - lastAwayMatch.date.getTime()) < 7 * 24 * 60 * 60 * 1000) {
            firstRoundDate = await findNextAvailableDate(
              addDays(lastAwayMatch.date, 7),
              homeTeam,
              true,
              seasonEnd
            );
            if (!firstRoundDate) {
              console.warn(`Could not find available date for first round match after last away match`);
              continue;
            }
          }

          matches.push({
            date: firstRoundDate,
            homeTeamId: homeTeam.id!,
            awayTeamId: awayTeam.id!,
            venue: homeTeam.venue,
            season: activeSeason.name,
            completed: false
          });

          teamLastMatches.set(homeTeam.id!, { date: firstRoundDate, wasHome: true });
          teamLastMatches.set(awayTeam.id!, { date: firstRoundDate, wasHome: false });

          // Second round - away match (teams switch)
          let secondRoundDate = await findNextAvailableDate(
            addDays(firstRoundDate, 14), // At least 2 weeks after first round
            awayTeam,
            true,
            seasonEnd
          );

          if (!secondRoundDate) {
            console.warn(`Could not find available date for second round match between ${awayTeam.name} and ${homeTeam.name}`);
            continue; // Skip second round if no date is available
          }

          const lastHomeMatchSecondRound = teamLastMatches.get(awayTeam.id!);
          const lastAwayMatchSecondRound = teamLastMatches.get(homeTeam.id!);

          if (lastHomeMatchSecondRound && (secondRoundDate.getTime() - lastHomeMatchSecondRound.date.getTime()) < 7 * 24 * 60 * 60 * 1000) {
            secondRoundDate = await findNextAvailableDate(
              addDays(lastHomeMatchSecondRound.date, 7),
              awayTeam,
              true,
              seasonEnd
            );
            if (!secondRoundDate) {
              console.warn(`Could not find available date for second round match after last home match`);
              continue;
            }
          }
          
          if (lastAwayMatchSecondRound && (secondRoundDate.getTime() - lastAwayMatchSecondRound.date.getTime()) < 7 * 24 * 60 * 60 * 1000) {
            secondRoundDate = await findNextAvailableDate(
              addDays(lastAwayMatchSecondRound.date, 7),
              awayTeam,
              true,
              seasonEnd
            );
            if (!secondRoundDate) {
              console.warn(`Could not find available date for second round match after last away match`);
              continue;
            }
          }

          matches.push({
            date: secondRoundDate,
            homeTeamId: awayTeam.id!,
            awayTeamId: homeTeam.id!,
            venue: awayTeam.venue,
            season: activeSeason.name,
            completed: false
          });

          teamLastMatches.set(awayTeam.id!, { date: secondRoundDate, wasHome: true });
          teamLastMatches.set(homeTeam.id!, { date: secondRoundDate, wasHome: false });
        }
      }

      if (matches.length === 0) {
        throw new Error('Nepodařilo se vygenerovat žádné zápasy. Zkontrolujte prosím dostupnost termínů.');
      }

      // Sort matches by date
      matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Save matches
      await db.matches.bulkAdd(matches);
      setMatchCount(matches.length);
      setIsGenerated(true);
    } catch (error) {
      console.error('Chyba při generování rozpisu:', error);
      setError(error instanceof Error ? error.message : 'Neznámá chyba');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            Generování rozpisu zápasů
          </h3>
          <button 
            onClick={onCancel}
            className="rounded-md text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          {!isGenerated ? (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Vygenerujte kompletní rozpis pro aktivní sezónu. Rozpis bude:
                <br />
                • Generován pouze pro aktivní týmy
                <br />
                • Respektovat hrací dny a časy týmů
                <br />
                • Zajistí rozestup mezi zápasy min. 7 dní
                <br />
                • Střídat domácí a venkovní zápasy
              </p>
              
              {error && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                  {error}
                </div>
              )}
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Tato akce vymaže všechny zápasy v aktivní sezóně a vytvoří nový rozpis.
                      Zápasy v ostatních sezónách nebudou ovlivněny.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Zrušit
                </button>
                <button
                  type="button"
                  onClick={generateSchedule}
                  disabled={generating}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generuji...
                    </>
                  ) : (
                    'Generovat rozpis'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Rozpis vygenerován!</h3>
              <div className="mt-3">
                <p className="text-sm text-gray-500">
                  Úspěšně vytvořeno {matchCount} zápasů pro aktivní sezónu.
                </p>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={onComplete}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                >
                  Zobrazit rozpis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleFormModal;