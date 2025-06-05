import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../data/db';
import { Team, Player, Match, Season, PlayerPerformance, TeamPerformance } from '../types';

interface ImportModalProps {
  onClose: () => void;
  onComplete: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onComplete }) => {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const exportData = async () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Export seasons
      const seasons = await db.seasons.toArray();
      const seasonsWS = XLSX.utils.json_to_sheet(seasons.map(season => ({
        name: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
        active: season.active ? 'ano' : 'ne'
      })));
      XLSX.utils.book_append_sheet(workbook, seasonsWS, 'Sezóny');
      
      // Export teams
      const teams = await db.teams.toArray();
      const teamsWS = XLSX.utils.json_to_sheet(teams.map(team => ({
        name: team.name,
        venue: team.venue,
        dayOfWeek: team.schedule.dayOfWeek,
        timeStart: team.schedule.timeStart,
        timeEnd: team.schedule.timeEnd,
        startDate: team.startDate,
        endDate: team.endDate || ''
      })));
      XLSX.utils.book_append_sheet(workbook, teamsWS, 'Týmy');
      
      // Export players with history
      const players = await db.players.toArray();
      const playerHistories = await db.playerHistory.toArray();
      
      const playersData = await Promise.all(players.map(async player => {
        const history = playerHistories.find(h => h.playerId === player.id && h.teamId === player.teamId);
        const team = teams.find(t => t.id === player.teamId);
        return {
          name: player.name,
          teamName: team?.name || '',
          gender: player.gender === 'male' ? 'muž' : 'žena',
          joinDate: history?.joinDate || player.joinDate,
          leaveDate: history?.leaveDate || player.leaveDate || '',
          active: !history?.leaveDate ? 'ano' : 'ne'
        };
      }));
      
      const playersWS = XLSX.utils.json_to_sheet(playersData);
      XLSX.utils.book_append_sheet(workbook, playersWS, 'Hráči');
      
      // Export matches with results
      const matches = await db.matches.toArray();
      const playerPerformances = await db.playerPerformances.toArray();
      const teamPerformances = await db.teamPerformances.toArray();
      
      const matchesData = await Promise.all(matches.map(async match => {
        const matchPlayerPerfs = playerPerformances.filter(p => p.matchId === match.id);
        const matchTeamPerfs = teamPerformances.filter(p => p.matchId === match.id);
        
        const homeTeam = teams.find(t => t.id === match.homeTeamId);
        const awayTeam = teams.find(t => t.id === match.awayTeamId);
        
        const homeTeamPerf = matchTeamPerfs.find(p => p.teamId === match.homeTeamId);
        const awayTeamPerf = matchTeamPerfs.find(p => p.teamId === match.awayTeamId);
        
        const homePlayers = matchPlayerPerfs
          .filter(p => p.teamId === match.homeTeamId)
          .sort((a, b) => a.position - b.position)
          .map(p => ({
            playerName: players.find(pl => pl.id === p.playerId)?.name || '',
            position: p.position,
            full: p.full,
            spare: p.spare,
            errors: p.errors,
            totalPins: p.totalPins,
            points: p.points
          }));
        
        const awayPlayers = matchPlayerPerfs
          .filter(p => p.teamId === match.awayTeamId)
          .sort((a, b) => a.position - b.position)
          .map(p => ({
            playerName: players.find(pl => pl.id === p.playerId)?.name || '',
            position: p.position,
            full: p.full,
            spare: p.spare,
            errors: p.errors,
            totalPins: p.totalPins,
            points: p.points
          }));
        
        return {
          date: match.date,
          homeTeam: homeTeam?.name || '',
          awayTeam: awayTeam?.name || '',
          venue: match.venue,
          season: match.season,
          completed: match.completed ? 'ano' : 'ne',
          homeTeamPoints: homeTeamPerf?.points || 0,
          homeTeamAuxPoints: homeTeamPerf?.auxiliaryPoints || 0,
          homeTeamTotalPins: homeTeamPerf?.totalPins || 0,
          awayTeamPoints: awayTeamPerf?.points || 0,
          awayTeamAuxPoints: awayTeamPerf?.auxiliaryPoints || 0,
          awayTeamTotalPins: awayTeamPerf?.totalPins || 0,
          homePlayer1: homePlayers[0]?.playerName || '',
          homePlayer1Full: homePlayers[0]?.full || 0,
          homePlayer1Spare: homePlayers[0]?.spare || 0,
          homePlayer1Errors: homePlayers[0]?.errors || 0,
          homePlayer1Points: homePlayers[0]?.points || 0,
          homePlayer2: homePlayers[1]?.playerName || '',
          homePlayer2Full: homePlayers[1]?.full || 0,
          homePlayer2Spare: homePlayers[1]?.spare || 0,
          homePlayer2Errors: homePlayers[1]?.errors || 0,
          homePlayer2Points: homePlayers[1]?.points || 0,
          homePlayer3: homePlayers[2]?.playerName || '',
          homePlayer3Full: homePlayers[2]?.full || 0,
          homePlayer3Spare: homePlayers[2]?.spare || 0,
          homePlayer3Errors: homePlayers[2]?.errors || 0,
          homePlayer3Points: homePlayers[2]?.points || 0,
          homePlayer4: homePlayers[3]?.playerName || '',
          homePlayer4Full: homePlayers[3]?.full || 0,
          homePlayer4Spare: homePlayers[3]?.spare || 0,
          homePlayer4Errors: homePlayers[3]?.errors || 0,
          homePlayer4Points: homePlayers[3]?.points || 0,
          awayPlayer1: awayPlayers[0]?.playerName || '',
          awayPlayer1Full: awayPlayers[0]?.full || 0,
          awayPlayer1Spare: awayPlayers[0]?.spare || 0,
          awayPlayer1Errors: awayPlayers[0]?.errors || 0,
          awayPlayer1Points: awayPlayers[0]?.points || 0,
          awayPlayer2: awayPlayers[1]?.playerName || '',
          awayPlayer2Full: awayPlayers[1]?.full || 0,
          awayPlayer2Spare: awayPlayers[1]?.spare || 0,
          awayPlayer2Errors: awayPlayers[1]?.errors || 0,
          awayPlayer2Points: awayPlayers[1]?.points || 0,
          awayPlayer3: awayPlayers[2]?.playerName || '',
          awayPlayer3Full: awayPlayers[2]?.full || 0,
          awayPlayer3Spare: awayPlayers[2]?.spare || 0,
          awayPlayer3Errors: awayPlayers[2]?.errors || 0,
          awayPlayer3Points: awayPlayers[2]?.points || 0,
          awayPlayer4: awayPlayers[3]?.playerName || '',
          awayPlayer4Full: awayPlayers[3]?.full || 0,
          awayPlayer4Spare: awayPlayers[3]?.spare || 0,
          awayPlayer4Errors: awayPlayers[3]?.errors || 0,
          awayPlayer4Points: awayPlayers[3]?.points || 0
        };
      }));
      
      const matchesWS = XLSX.utils.json_to_sheet(matchesData);
      XLSX.utils.book_append_sheet(workbook, matchesWS, 'Zápasy');
      
      // Generate filename with current date
      const date = new Date();
      const filename = `kulich-zaloha-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Chyba při exportu dat:', error);
      setError('Při exportu dat došlo k chybě');
    }
  };

  const parseDate = (dateStr: string | number): Date | null => {
    if (!dateStr) return null;

    try {
      // If it's already a Date object
      if (dateStr instanceof Date) {
        return dateStr;
      }

      // If it's a number (Excel date)
      if (typeof dateStr === 'number') {
        const date = new Date((dateStr - 25569) * 86400000);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Try parsing as string
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }

      // Try DD.MM.YYYY format
      if (typeof dateStr === 'string') {
        const parts = dateStr.split('.');
        if (parts.length === 3) {
          const date = new Date(
            parseInt(parts[2]), // year
            parseInt(parts[1]) - 1, // month (0-based)
            parseInt(parts[0]) // day
          );
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError(null);
      setWarnings([]);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      // Clear existing data
      await db.seasons.clear();
      await db.teams.clear();
      await db.players.clear();
      await db.matches.clear();
      await db.playerPerformances.clear();
      await db.teamPerformances.clear();
      await db.playerHistory.clear();

      // Import seasons first
      const seasonsSheet = workbook.Sheets['Sezóny'];
      if (!seasonsSheet) throw new Error('List "Sezóny" nebyl nalezen');

      const seasonsData = XLSX.utils.sheet_to_json<any>(seasonsSheet);
      const seasons: Season[] = [];
      
      for (const row of seasonsData) {
        const startDate = parseDate(row.startDate);
        const endDate = parseDate(row.endDate);
        
        if (!startDate || !endDate) {
          setWarnings(prev => [...prev, `Sezóna "${row.name}" má neplatné datum`]);
          continue;
        }

        seasons.push({
          name: row.name,
          startDate,
          endDate,
          active: row.active?.toString().toLowerCase() === 'ano'
        });
      }

      // Save seasons
      await db.seasons.bulkAdd(seasons);

      // Import teams
      const teamsSheet = workbook.Sheets['Týmy'];
      if (!teamsSheet) throw new Error('List "Týmy" nebyl nalezen');

      const teamsData = XLSX.utils.sheet_to_json<any>(teamsSheet);
      const teams: Team[] = [];
      
      for (const row of teamsData) {
        const startDate = parseDate(row.startDate);
        const endDate = row.endDate ? parseDate(row.endDate) : undefined;
        
        if (!startDate) {
          setWarnings(prev => [...prev, `Tým "${row.name}" má neplatné datum zahájení`]);
          continue;
        }
        
        teams.push({
          name: row.name,
          venue: row.venue,
          schedule: {
            dayOfWeek: parseInt(row.dayOfWeek),
            timeStart: row.timeStart,
            timeEnd: row.timeEnd
          },
          startDate,
          endDate
        });
      }

      // Save teams and create name to ID mapping
      const teamIds = new Map<string, number>();
      for (const team of teams) {
        const id = await db.teams.add(team);
        teamIds.set(team.name, id);
      }

      // Import players
      const playersSheet = workbook.Sheets['Hráči'];
      if (!playersSheet) throw new Error('List "Hráči" nebyl nalezen');

      const playersData = XLSX.utils.sheet_to_json<any>(playersSheet);
      const skippedPlayers: string[] = [];
      const playerIds = new Map<string, number>();

      for (const row of playersData) {
        const teamId = teamIds.get(row.teamName);
        if (!teamId) {
          skippedPlayers.push(`${row.name} (tým "${row.teamName}" nenalezen)`);
          continue;
        }

        const joinDate = parseDate(row.joinDate);
        const leaveDate = row.leaveDate ? parseDate(row.leaveDate) : undefined;

        if (!joinDate) {
          skippedPlayers.push(`${row.name} (neplatné datum nástupu)`);
          continue;
        }

        const player: Player = {
          name: row.name,
          teamId,
          gender: row.gender.toLowerCase() === 'muž' ? 'male' : 'female',
          joinDate,
          leaveDate
        };

        const playerId = await db.players.add(player);
        playerIds.set(player.name, playerId);

        // Add player history
        await db.playerHistory.add({
          playerId,
          teamId,
          joinDate,
          leaveDate
        });
      }

      // Import matches
      const matchesSheet = workbook.Sheets['Zápasy'];
      if (!matchesSheet) throw new Error('List "Zápasy" nebyl nalezen');

      const matchesData = XLSX.utils.sheet_to_json<any>(matchesSheet);
      const skippedMatches: string[] = [];

      for (const row of matchesData) {
        const homeTeamId = teamIds.get(row.homeTeam);
        const awayTeamId = teamIds.get(row.awayTeam);
        const date = parseDate(row.date);

        if (!homeTeamId || !awayTeamId) {
          skippedMatches.push(`${row.homeTeam} vs ${row.awayTeam} (tým nenalezen)`);
          continue;
        }

        if (!date) {
          skippedMatches.push(`${row.homeTeam} vs ${row.awayTeam} (neplatné datum)`);
          continue;
        }

        const match: Match = {
          date,
          homeTeamId,
          awayTeamId,
          venue: row.venue,
          season: row.season,
          completed: row.completed?.toString().toLowerCase() === 'ano'
        };

        const matchId = await db.matches.add(match);

        if (match.completed) {
          // Add team performances
          await db.teamPerformances.add({
            matchId,
            teamId: homeTeamId,
            totalPins: parseInt(row.homeTeamTotalPins) || 0,
            points: parseInt(row.homeTeamPoints) || 0,
            auxiliaryPoints: parseInt(row.homeTeamAuxPoints) || 0
          });

          await db.teamPerformances.add({
            matchId,
            teamId: awayTeamId,
            totalPins: parseInt(row.awayTeamTotalPins) || 0,
            points: parseInt(row.awayTeamPoints) || 0,
            auxiliaryPoints: parseInt(row.awayTeamAuxPoints) || 0
          });

          // Add player performances
          for (let i = 1; i <= 4; i++) {
            const homePlayerName = row[`homePlayer${i}`];
            const awayPlayerName = row[`awayPlayer${i}`];
            
            if (homePlayerName && awayPlayerName) {
              const homePlayerId = playerIds.get(homePlayerName);
              const awayPlayerId = playerIds.get(awayPlayerName);
              
              if (homePlayerId && awayPlayerId) {
                await db.playerPerformances.add({
                  matchId,
                  playerId: homePlayerId,
                  teamId: homeTeamId,
                  opponentId: awayPlayerId,
                  position: i,
                  full: parseInt(row[`homePlayer${i}Full`]) || 0,
                  spare: parseInt(row[`homePlayer${i}Spare`]) || 0,
                  errors: parseInt(row[`homePlayer${i}Errors`]) || 0,
                  totalPins: (parseInt(row[`homePlayer${i}Full`]) || 0) + (parseInt(row[`homePlayer${i}Spare`]) || 0),
                  points: parseInt(row[`homePlayer${i}Points`]) || 0
                });

                await db.playerPerformances.add({
                  matchId,
                  playerId: awayPlayerId,
                  teamId: awayTeamId,
                  opponentId: homePlayerId,
                  position: i,
                  full: parseInt(row[`awayPlayer${i}Full`]) || 0,
                  spare: parseInt(row[`awayPlayer${i}Spare`]) || 0,
                  errors: parseInt(row[`awayPlayer${i}Errors`]) || 0,
                  totalPins: (parseInt(row[`awayPlayer${i}Full`]) || 0) + (parseInt(row[`awayPlayer${i}Spare`]) || 0),
                  points: parseInt(row[`awayPlayer${i}Points`]) || 0
                });
              }
            }
          }
        }
      }

      // Set warnings
      if (skippedPlayers.length > 0) {
        setWarnings(prev => [...prev, `Následující hráči byli přeskočeni: ${skippedPlayers.join(', ')}`]);
      }
      if (skippedMatches.length > 0) {
        setWarnings(prev => [...prev, `Následující zápasy byly přeskočeny: ${skippedMatches.join(', ')}`]);
      }

      onComplete();
    } catch (err) {
      console.error('Chyba při importu:', err);
      setError(err instanceof Error ? err.message : 'Při importu došlo k neočekávané chybě');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            Import/Export dat
          </h3>
          <button 
            onClick={onClose}
            className="rounded-md text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">
                Exportujte data pro zálohu nebo importujte dříve vytvořenou zálohu.
                Záloha obsahuje týmy, hráče, sezóny, zápasy a jejich výsledky.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={exportData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportovat zálohu
              </button>
            </div>

            <div className="border-t border-b border-gray-200 py-4">
              <div className="flex justify-center px-6 pt-5 pb-6">
                <div className="space-y-1 text-center">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Nahrát zálohu</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".xlsx"
                        onChange={handleFileUpload}
                        disabled={importing}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">XLSX soubor do 10MB</p>
                </div>
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    {warnings.map((warning, index) => (
                      <p key={index} className="text-sm text-yellow-700">
                        {warning}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {importing && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Importuji data...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;