import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../data/db';
import { Team, Player, Match, PlayerPerformance, TeamPerformance } from '../types';
import { ArrowLeft, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const MatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<Player[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<Player[]>([]);
  const [selectedHomePlayers, setSelectedHomePlayers] = useState<(Player & { position?: number })[]>([]);
  const [selectedAwayPlayers, setSelectedAwayPlayers] = useState<(Player & { position?: number })[]>([]);
  const [playerPerformances, setPlayerPerformances] = useState<Record<number, PlayerPerformance>>({});
  const [teamPerformances, setTeamPerformances] = useState<Record<number, TeamPerformance>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [isDateEditing, setIsDateEditing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEditingCompleted, setIsEditingCompleted] = useState(false);

  useEffect(() => {
    if (id) {
      loadMatchData(parseInt(id));
    }
  }, [id]);

  const loadMatchData = async (matchId: number) => {
    try {
      const matchData = await db.matches.get(matchId);
      if (matchData) {
        const [homeTeam, awayTeam] = await Promise.all([
          db.teams.get(matchData.homeTeamId),
          db.teams.get(matchData.awayTeamId)
        ]);
        
        setMatch({
          ...matchData,
          homeTeam,
          awayTeam
        });

        const matchDate = new Date(matchData.date);
        
        const [homePlayers, awayPlayers] = await Promise.all([
          matchData.completed 
            ? db.players.where('teamId').equals(matchData.homeTeamId).toArray()
            : db.getActivePlayersForTeam(matchData.homeTeamId, matchDate),
          matchData.completed
            ? db.players.where('teamId').equals(matchData.awayTeamId).toArray()
            : db.getActivePlayersForTeam(matchData.awayTeamId, matchDate)
        ]);

        if (matchData.completed) {
          const activeHomePlayers = await Promise.all(
            homePlayers.map(async player => {
              const wasActive = await db.isPlayerActiveInTeam(player.id!, matchData.homeTeamId, matchDate);
              return wasActive ? player : null;
            })
          );

          const activeAwayPlayers = await Promise.all(
            awayPlayers.map(async player => {
              const wasActive = await db.isPlayerActiveInTeam(player.id!, matchData.awayTeamId, matchDate);
              return wasActive ? player : null;
            })
          );

          setHomeTeamPlayers(activeHomePlayers.filter((p): p is Player => p !== null));
          setAwayTeamPlayers(activeAwayPlayers.filter((p): p is Player => p !== null));
        } else {
          setHomeTeamPlayers(homePlayers);
          setAwayTeamPlayers(awayPlayers);
        }
        
        const existingPerfs = await db.playerPerformances
          .where('matchId')
          .equals(matchId)
          .toArray();
        
        const perfsMap: Record<number, PlayerPerformance> = {};
        existingPerfs.forEach(perf => {
          perfsMap[perf.playerId] = perf;
        });
        
        setPlayerPerformances(perfsMap);
        
        const existingTeamPerfs = await db.teamPerformances
          .where('matchId')
          .equals(matchId)
          .toArray();
        
        const teamPerfsMap: Record<number, TeamPerformance> = {};
        existingTeamPerfs.forEach(perf => {
          teamPerfsMap[perf.teamId] = perf;
        });
        
        setTeamPerformances(teamPerfsMap);
        
        const homeSelectedPlayers = homePlayers
          .filter(player => existingPerfs.some(perf => perf.playerId === player.id))
          .map(player => {
            const perf = existingPerfs.find(p => p.playerId === player.id);
            return { ...player, position: perf?.position };
          })
          .sort((a, b) => (a.position || 0) - (b.position || 0));

        const awaySelectedPlayers = awayPlayers
          .filter(player => existingPerfs.some(perf => perf.playerId === player.id))
          .map(player => {
            const perf = existingPerfs.find(p => p.playerId === player.id);
            return { ...player, position: perf?.position };
          })
          .sort((a, b) => (a.position || 0) - (b.position || 0));
        
        setSelectedHomePlayers(homeSelectedPlayers);
        setSelectedAwayPlayers(awaySelectedPlayers);
        setIsEditing(!matchData.completed);
        setIsEditingCompleted(false);
      }
    } catch (error) {
      console.error('Chyba při načítání dat zápasu:', error);
    }
  };

  const handleTogglePlayer = (player: Player, team: 'home' | 'away') => {
    if (!isEditing) return;

    const players = team === 'home' ? selectedHomePlayers : selectedAwayPlayers;
    const setPlayers = team === 'home' ? setSelectedHomePlayers : setSelectedAwayPlayers;
    const maxPlayers = 4;

    if (players.find(p => p.id === player.id)) {
      setPlayers(players.filter(p => p.id !== player.id));
    } else if (players.length < maxPlayers) {
      setPlayers([...players, { ...player, position: players.length + 1 }]);
    }
  };

  const handlePositionChange = (player: Player & { position?: number }, newPosition: number, team: 'home' | 'away') => {
    const players = team === 'home' ? selectedHomePlayers : selectedAwayPlayers;
    const setPlayers = team === 'home' ? setSelectedHomePlayers : setSelectedAwayPlayers;

    if (newPosition < 1 || newPosition > 4) return;

    const updatedPlayers = players.map(p => {
      if (p.id === player.id) {
        return { ...p, position: newPosition };
      }
      if (p.position === newPosition) {
        return { ...p, position: player.position };
      }
      return p;
    });

    setPlayers(updatedPlayers.sort((a, b) => (a.position || 0) - (b.position || 0)));
  };

  const handleEditResults = (playerId: number) => {
    if (!isEditing) return;
    
    if (!playerPerformances[playerId]) {
      const player = [...homeTeamPlayers, ...awayTeamPlayers].find(p => p.id === playerId);
      if (player && match) {
        const isHomePlayer = homeTeamPlayers.some(p => p.id === playerId);
        const playerIndex = (isHomePlayer ? selectedHomePlayers : selectedAwayPlayers)
          .findIndex(p => p.id === playerId);
        
        const opponentPlayers = isHomePlayer ? selectedAwayPlayers : selectedHomePlayers;
        const opponentId = opponentPlayers[playerIndex]?.id;
        
        if (opponentId) {
          setPlayerPerformances(prev => ({
            ...prev,
            [playerId]: {
              matchId: match.id!,
              playerId,
              teamId: player.teamId,
              opponentId,
              position: playerIndex + 1,
              full: 0,
              spare: 0,
              errors: 0,
              totalPins: 0,
              points: 0
            }
          }));
        }
      }
    }
    setEditingPlayerId(playerId);
  };

  const handleSavePlayerResults = (playerId: number, results: {
    full: number;
    spare: number;
    errors: number;
  }) => {
    if (!isEditing || !match) return;

    const player = [...homeTeamPlayers, ...awayTeamPlayers].find(p => p.id === playerId);
    
    if (!player) return;
    
    const isHomePlayer = homeTeamPlayers.some(p => p.id === playerId);
    const playerIndex = (isHomePlayer ? selectedHomePlayers : selectedAwayPlayers)
      .findIndex(p => p.id === playerId);
    
    const opponentPlayers = isHomePlayer ? selectedAwayPlayers : selectedHomePlayers;
    const opponentId = opponentPlayers[playerIndex]?.id;
    
    if (opponentId === undefined) return;
    
    const updatedPerf = {
      matchId: match.id!,
      playerId,
      teamId: player.teamId,
      opponentId,
      position: playerIndex + 1,
      ...results,
      totalPins: results.full + results.spare,
      points: 0
    };
    
    setPlayerPerformances(prevPerfs => ({
      ...prevPerfs,
      [playerId]: {
        ...prevPerfs[playerId],
        ...updatedPerf
      }
    }));
    
    setEditingPlayerId(null);
  };

  const calculateDuelPoints = () => {
    if (!match || selectedHomePlayers.length !== 4 || selectedAwayPlayers.length !== 4) return;

    const sortedHomePlayers = [...selectedHomePlayers].sort((a, b) => (a.position || 0) - (b.position || 0));
    const sortedAwayPlayers = [...selectedAwayPlayers].sort((a, b) => (a.position || 0) - (b.position || 0));

    const updatedPlayerPerfs = { ...playerPerformances };
    
    for (let i = 0; i < 4; i++) {
      const homePlayer = sortedHomePlayers[i];
      const awayPlayer = sortedAwayPlayers[i];
      
      if (homePlayer?.id && awayPlayer?.id) {
        const homePerf = updatedPlayerPerfs[homePlayer.id];
        const awayPerf = updatedPlayerPerfs[awayPlayer.id];
        
        if (homePerf && awayPerf) {
          const homeTotalPins = homePerf.totalPins;
          const awayTotalPins = awayPerf.totalPins;
          
          if (homeTotalPins > awayTotalPins) {
            homePerf.points = 2;
            awayPerf.points = 0;
          } else if (homeTotalPins < awayTotalPins) {
            homePerf.points = 0;
            awayPerf.points = 2;
          } else {
            homePerf.points = 1;
            awayPerf.points = 1;
          }
        }
      }
    }
    
    setPlayerPerformances(updatedPlayerPerfs);
    
    const homeTotalPins = sortedHomePlayers.reduce((sum, player) => {
      return sum + (player.id ? (updatedPlayerPerfs[player.id]?.totalPins || 0) : 0);
    }, 0);
    
    const awayTotalPins = sortedAwayPlayers.reduce((sum, player) => {
      return sum + (player.id ? (updatedPlayerPerfs[player.id]?.totalPins || 0) : 0);
    }, 0);
    
    const homePlayerPoints = sortedHomePlayers.reduce((sum, player) => {
      return sum + (player.id ? (updatedPlayerPerfs[player.id]?.points || 0) : 0);
    }, 0);
    
    const awayPlayerPoints = sortedAwayPlayers.reduce((sum, player) => {
      return sum + (player.id ? (updatedPlayerPerfs[player.id]?.points || 0) : 0);
    }, 0);
    
    let homeTeamPinsPoints = 0;
    let awayTeamPinsPoints = 0;
    
    if (homeTotalPins > awayTotalPins) {
      homeTeamPinsPoints = 2;
    } else if (homeTotalPins < awayTotalPins) {
      awayTeamPinsPoints = 2;
    } else {
      homeTeamPinsPoints = 1;
      awayTeamPinsPoints = 1;
    }
    
    const homeTotalAuxPoints = homePlayerPoints + homeTeamPinsPoints;
    const awayTotalAuxPoints = awayPlayerPoints + awayTeamPinsPoints;
    
    let homeMatchPoints = 0;
    let awayMatchPoints = 0;
    
    if (homeTotalAuxPoints > awayTotalAuxPoints) {
      homeMatchPoints = 2;
    } else if (homeTotalAuxPoints < awayTotalAuxPoints) {
      awayMatchPoints = 2;
    } else {
      homeMatchPoints = 1;
      awayMatchPoints = 1;
    }
    
    const updatedTeamPerfs = {
      [match.homeTeamId]: {
        id: teamPerformances[match.homeTeamId]?.id,
        matchId: match.id!,
        teamId: match.homeTeamId,
        totalPins: homeTotalPins,
        points: homeMatchPoints,
        auxiliaryPoints: homeTotalAuxPoints
      },
      [match.awayTeamId]: {
        id: teamPerformances[match.awayTeamId]?.id,
        matchId: match.id!,
        teamId: match.awayTeamId,
        totalPins: awayTotalPins,
        points: awayMatchPoints,
        auxiliaryPoints: awayTotalAuxPoints
      }
    };
    
    setTeamPerformances(updatedTeamPerfs);
    
    return {
      playerPerformances: updatedPlayerPerfs,
      teamPerformances: updatedTeamPerfs
    };
  };

  const handleSaveResults = async () => {
    if (!match) return;
    
    setValidationError(null);
    
    if (selectedHomePlayers.length !== 4 || selectedAwayPlayers.length !== 4) {
      setValidationError('Prosím vyberte 4 hráče z každého týmu');
      return;
    }
    
    const sortedHomePlayers = [...selectedHomePlayers].sort((a, b) => (a.position || 0) - (b.position || 0));
    const sortedAwayPlayers = [...selectedAwayPlayers].sort((a, b) => (a.position || 0) - (b.position || 0));
    
    try {
      setIsSaving(true);
      
      const calculatedResults = calculateDuelPoints();
      if (!calculatedResults) return;
      
      const { playerPerformances: finalPerformances, teamPerformances: updatedTeamPerfs } = calculatedResults;
      
      for (let i = 0; i < 4; i++) {
        const homePlayer = sortedHomePlayers[i];
        const awayPlayer = sortedAwayPlayers[i];
        
        if (homePlayer.id && finalPerformances[homePlayer.id]) {
          finalPerformances[homePlayer.id].position = i + 1;
        }
        if (awayPlayer.id && finalPerformances[awayPlayer.id]) {
          finalPerformances[awayPlayer.id].position = i + 1;
        }
      }
      
      await Promise.all(
        Object.values(finalPerformances).map(perf => {
          if (perf.id) {
            return db.playerPerformances.update(perf.id, perf);
          } else {
            return db.playerPerformances.add(perf);
          }
        })
      );
      
      await Promise.all(
        Object.values(updatedTeamPerfs).map(perf => {
          if (perf.id) {
            return db.teamPerformances.update(perf.id, perf);
          } else {
            return db.teamPerformances.add(perf);
          }
        })
      );
      
      await db.matches.update(match.id!, { completed: true });
      await loadMatchData(match.id!);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Chyba při ukládání výsledků:', error);
      setValidationError('Při ukládání výsledků došlo k chybě');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPlayerPerformance = (player: Player) => {
    const perf = player.id ? playerPerformances[player.id] : null;
    
    if (!perf) {
      return (
        <div className="text-center mt-2">
          {isEditing && (
            <button
              onClick={() => handleEditResults(player.id!)}
              className="px-2 py-1 text-xs border border-gray-300 rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Upravit výsledky
            </button>
          )}
        </div>
      );
    }
    
    if (editingPlayerId === player.id) {
      return (
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            
            handleSavePlayerResults(player.id!, {
              full: parseInt(formData.get('full') as string) || 0,
              spare: parseInt(formData.get('spare') as string) || 0,
              errors: parseInt(formData.get('errors') as string) || 0
            });
          }}
          className="mt-4 p-4 border rounded-lg bg-gray-50"
        >
          <h4 className="text-sm font-medium text-gray-900 mb-4">Zadání výsledků</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Plné
              </label>
              <input
                type="number"
                name="full"
                defaultValue={perf.full}
                className="w-full p-1 text-sm border rounded"
                min="0"
                max="400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Dorážka
              </label>
              <input
                type="number"
                name="spare"
                defaultValue={perf.spare}
                className="w-full p-1 text-sm border rounded"
                min="0"
                max="400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Chyby
              </label>
              <input
                type="number"
                name="errors"
                defaultValue={perf.errors}
                className="w-full p-1 text-sm border rounded"
                min="0"
                max="400"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={() => setEditingPlayerId(null)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-sm border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Uložit
            </button>
          </div>
        </form>
      );
    }
    
    return (
      <div className="mt-2">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500">Plné</div>
            <div className="text-sm">{perf.full}</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500">Dorážka</div>
            <div className="text-sm">{perf.spare}</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500">Chyby</div>
            <div className="text-sm">{perf.errors}</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="font-medium">Celkem:</span>{' '}
            <span className="text-blue-600">{perf.totalPins}</span>
          </div>
          {isEditing && (
            <button
              onClick={() => handleEditResults(player.id!)}
              className="px-2 py-1 text-xs border border-gray-300 rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Upravit výsledky
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderTeamPerformance = (teamId: number) => {
    const perf = teamPerformances[teamId];
    
    if (!perf) {
      return null;
    }
    
    return (
      <div className="mt-4 bg-gray-50 p-3 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Výsledky týmu</h4>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-500">Celkem kuželek</div>
            <div className="text-lg font-medium">{perf.totalPins}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Pomocné body</div>
            <div className="text-lg font-medium">{perf.auxiliaryPoints}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Body za zápas</div>
            <div className="text-lg font-medium">{perf.points}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Výsledek</div>
            <div className="text-lg font-medium">
              {perf.points === 2 
                ? <span className="text-green-600">Výhra</span> 
                : perf.points === 1 
                  ? <span className="text-yellow-600">Remíza</span>
                  : <span className="text-red-600">Prohra</span>
              }
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMatchResultsTable = () => {
    if (!match || selectedHomePlayers.length === 0 || selectedAwayPlayers.length === 0) {
      return null;
    }

    const sortedHomePlayers = [...selectedHomePlayers].sort((a, b) => (a.position || 0) - (b.position || 0));
    const sortedAwayPlayers = [...selectedAwayPlayers].sort((a, b) => (a.position || 0) - (b.position || 0));

    const homeTotalPins = sortedHomePlayers.map(player => 
      player.id ? playerPerformances[player.id]?.totalPins || 0 : 0
    );
    const awayTotalPins = sortedAwayPlayers.map(player => 
      player.id ? playerPerformances[player.id]?.totalPins || 0 : 0
    );
    
    const bestHomePins = Math.max(...homeTotalPins);
    const bestAwayPins = Math.max(...awayTotalPins);

    return (
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Výsledky zápasu
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pořadí
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {match.homeTeam?.name}
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plné
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dorážka
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chyby
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Celkem
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Body
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {match.awayTeam?.name}
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plné
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dorážka
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chyby
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Celkem
                </th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Body
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedHomePlayers.map((homePlayer, index) => {
                const awayPlayer = sortedAwayPlayers[index];
                const homePerf = homePlayer.id ? playerPerformances[homePlayer.id] : null;
                const awayPerf = awayPlayer?.id ? playerPerformances[awayPlayer.id] : null;
                
                const isHomeBest = homePerf?.totalPins === bestHomePins && bestHomePins > 0;
                const isAwayBest = awayPerf?.totalPins === bestAwayPins && bestAwayPins > 0;

                return (
                  <tr key={index}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className={`px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${isHomeBest ? 'bg-yellow-50' : ''}`}>
                      {homePlayer.name}
                    </td>
                    <td className={`px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 ${isHomeBest ? 'bg-yellow-50' : ''}`}>
                      {homePerf?.full || 0}
                    </td>
                    <td className={`px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 ${isHomeBest ? 'bg-yellow-50' : ''}`}>
                      {homePerf?.spare || 0}
                    </td>
                    <td className={`px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 ${isHomeBest ? 'bg-yellow-50' : ''}`}>
                      {homePerf?.errors || 0}
                    </td>
                    <td className={`px-3 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900 ${isHomeBest ? 'bg-yellow-50' : ''}`}>
                      {homePerf?.totalPins || 0}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        homePerf?.points === 2 ? 'bg-green-100 text-green-800' :
                        homePerf?.points === 1 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {homePerf?.points || 0}
                      </span>
                    </td>
                
                    <td className={`px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${isAwayBest ? 'bg-yellow-50' : ''}`}>
                      {awayPlayer?.name || ''}
                    </td>
                    <td className={`px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 ${isAwayBest ? 'bg-yellow-50' : ''}`}>
                      {awayPerf?.full || 0}
                    </td>
                    <td className={`px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 ${isAwayBest ? 'bg-yellow-50' : ''}`}>
                      {awayPerf?.spare || 0}
                    </td>
                    <td className={`px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 ${isAwayBest ? 'bg-yellow-50' : ''}`}>
                      {awayPerf?.errors || 0}
                    </td>
                    <td className={`px-3 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900 ${isAwayBest ? 'bg-yellow-50' : ''}`}>
                      {awayPerf?.totalPins || 0}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        awayPerf?.points === 2 ? 'bg-green-100 text-green-800' :
                        awayPerf?.points === 1 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {awayPerf?.points || 0}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {match.completed && (
                <tr className="bg-gray-50 font-medium">
                  <td colSpan={5} className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    Celkem:
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                    {teamPerformances[match.homeTeamId]?.totalPins || 0}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      teamPerformances[match.homeTeamId]?.points === 2 ? 'bg-green-100 text-green-800' :
                      teamPerformances[match.homeTeamId]?.points === 1 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {teamPerformances[match.homeTeamId]?.points || 0}
                    </span>
                  </td>
                  <td colSpan={4} className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    Celkem:
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                    {teamPerformances[match.awayTeamId]?.totalPins || 0}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      teamPerformances[match.awayTeamId]?.points === 2 ? 'bg-green-100 text-green-800' :
                      teamPerformances[match.awayTeamId]?.points === 1 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {teamPerformances[match.awayTeamId]?.points || 0}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {match.completed && (
          <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">{match.homeTeam?.name}</h4>
                {renderTeamPerformance(match.homeTeamId)}
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">{match.awayTeam?.name}</h4>
                {renderTeamPerformance(match.awayTeamId)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!match) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  const matchDate = new Date(match.date);
  const isInPast = matchDate < new Date();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/matches" className="mr-4 text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {match.homeTeam?.name} vs {match.awayTeam?.name}
          </h1>
        </div>
        {!isEditing && (
          <button
            onClick={() => {
              setIsEditing(true);
              setIsEditingCompleted(match.completed);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {match.completed ? 'Upravit výsledky' : 'Zadat výsledky'}
          </button>
        )}
        {isEditing && (
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setIsEditing(false);
                setIsEditingCompleted(false);
                loadMatchData(match.id!);
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 mr-2" />
              Zrušit
            </button>
            <button
              onClick={handleSaveResults}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSaving ? (
                <span className="inline-flex items-center">
                  <div className="animate-spin -ml-1 mr-3 h-4 w-4 text-white">...</div>
                  Ukládání...
                </span>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditingCompleted ? 'Uložit změny' : 'Uložit výsledky'}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {validationError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {validationError}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          <div className="px-4 py-3">
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-20">Datum:</span>
              <span className="font-medium">{format(new Date(match?.date || new Date()), 'd. MMMM yyyy', { locale: cs })}</span>
            </div>
            <div className="flex items-center text-sm mt-2">
              <span className="text-gray-500 w-20">Místo:</span>
              <span className="font-medium">{match?.venue}</span>
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center text-sm">
              <span className="text-gray-500 w-20">Kolo:</span>
              <span className="font-medium">{match?.round === 1 ? 'První kolo' : 'Druhé kolo'}</span>
            </div>
            <div className="flex items-center text-sm mt-2">
              <span className="text-gray-500 w-20">Stav:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                match?.completed 
                  ? 'bg-green-100 text-green-800' 
                  : new Date(match?.date || 0) < new Date()
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
              }`}>
                {match?.completed 
                  ? 'Dokončeno' 
                  : new Date(match?.date || 0) < new Date()
                    ? 'Chybí výsledky'
                    : 'Nadcházející'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {renderMatchResultsTable()}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Domácí tým */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-blue-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {match.homeTeam?.name} (Domácí)
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Vyberte hráče {isEditing ? `(${selectedHomePlayers.length}/4)` : ''}
            </h4>
            <div className="space-y-3">
              {homeTeamPlayers.map(player => {
                const isSelected = selectedHomePlayers.some(p => p.id === player.id);
                const selectedPlayer = selectedHomePlayers.find(p => p.id === player.id);
                
                return (
                  <div 
                    key={player.id} 
                    className={`p-3 border rounded-md ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{player.name}</div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            player.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {player.gender === 'male' ? 'Muž' : 'Žena'}
                          </span>
                        </div>
                        {isEditing && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleTogglePlayer(player, 'home')}
                              className={`px-2 py-1 text-xs rounded ${
                                isSelected
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {isSelected ? 'Odebrat' : 'Vybrat'}
                            </button>
                            {isSelected && (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">Pořadí:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="4"
                                  value={selectedPlayer?.position || 0}
                                  onChange={(e) => handlePositionChange(selectedPlayer!,
                                    parseInt(e.target.value), 'home')}
                                  className="w-16 px-2 py-1 text-xs border rounded"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isSelected && renderPlayerPerformance(player)}
                  </div>
                );
              })}
              
              {homeTeamPlayers.length === 0 && (
                <div className="text-center py-4 text-gray-500">Žádní aktivní hráči v týmu</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Hostující tým */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-green-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {match.awayTeam?.name} (Hosté)
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Vyberte hráče {isEditing ? `(${selectedAwayPlayers.length}/4)` : ''}
            </h4>
            <div className="space-y-3">
              {awayTeamPlayers.map(player => {
                const isSelected = selectedAwayPlayers.some(p => p.id === player.id);
                const selectedPlayer = selectedAwayPlayers.find(p => p.id === player.id);
                
                return (
                  <div 
                    key={player.id} 
                    className={`p-3 border rounded-md ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{player.name}</div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            player.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {player.gender === 'male' ? 'Muž' : 'Žena'}
                          </span>
                        </div>
                        {isEditing && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleTogglePlayer(player, 'away')}
                              className={`px-2 py-1 text-xs rounded ${
                                isSelected
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {isSelected ? 'Odebrat' : 'Vybrat'}
                            </button>
                            {isSelected && (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">Pořadí:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="4"
                                  value={selectedPlayer?.position || 0}
                                  onChange={(e) => handlePositionChange(selectedPlayer!,
                                    parseInt(e.target.value), 'away')}
                                  className="w-16 px-2 py-1 text-xs border rounded"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isSelected && renderPlayerPerformance(player)}
                  </div>
                );
              })}
              
              {awayTeamPlayers.length === 0 && (
                <div className="text-center py-4 text-gray-500">Žádní aktivní hráči v týmu</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetail;