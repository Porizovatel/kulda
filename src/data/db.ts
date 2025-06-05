import Dexie, { Table } from 'dexie';
import { Team, Player, Match, PlayerPerformance, TeamPerformance, Season, PlayerHistory } from '../types';

class BowlingDatabase extends Dexie {
  teams!: Table<Team>;
  players!: Table<Player>;
  matches!: Table<Match>;
  playerPerformances!: Table<PlayerPerformance>;
  teamPerformances!: Table<TeamPerformance>;
  seasons!: Table<Season>;
  playerHistory!: Table<PlayerHistory>;

  constructor() {
    super('BowlingLeagueDB');
    
    this.version(1241).stores({
      teams: '++id, name, startDate, endDate',
      players: '++id, name, teamId, gender, joinDate, leaveDate',
      matches: '++id, date, homeTeamId, awayTeamId, season, completed',
      playerPerformances: '++id, matchId, playerId, teamId, opponentId, position',
      teamPerformances: '++id, matchId, teamId',
      seasons: '++id, name, startDate, endDate, active',
      playerHistory: '++id, playerId, teamId, joinDate, leaveDate'
    });
  }

  async isPlayerActiveInTeam(playerId: number, teamId: number, date: Date): Promise<boolean> {
    const history = await this.playerHistory
      .where({ playerId, teamId })
      .first();

    if (!history) return false;

    const joinDate = new Date(history.joinDate);
    const leaveDate = history.leaveDate ? new Date(history.leaveDate) : null;
    const checkDate = new Date(date);

    return joinDate <= checkDate && (!leaveDate || leaveDate >= checkDate);
  }

  async getActivePlayersForTeam(teamId: number, date: Date): Promise<Player[]> {
    const players = await this.players
      .where('teamId')
      .equals(teamId)
      .toArray();

    const activePlayers = await Promise.all(
      players.map(async player => {
        const isActive = await this.isPlayerActiveInTeam(player.id!, teamId, date);
        return isActive ? player : null;
      })
    );

    return activePlayers.filter((player): player is Player => player !== null);
  }

  async deleteUpcomingMatches() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingMatches = await this.matches
      .where('date')
      .above(today)
      .toArray();
    
    const matchIds = upcomingMatches.map(match => match.id!);
    
    await this.playerPerformances
      .where('matchId')
      .anyOf(matchIds)
      .delete();
    
    await this.teamPerformances
      .where('matchId')
      .anyOf(matchIds)
      .delete();
    
    await this.matches
      .where('date')
      .above(today)
      .delete();
  }

  async getTeamStandings(season?: string) {
    const currentSeason = season || await this.getCurrentSeason();
    const activeSeason = await this.seasons.filter(s => s.active).first();
    
    if (!activeSeason) return [];
    
    const teams = await this.teams.toArray();
    const matches = await this.matches
      .filter(m => m.completed && m.season === currentSeason)
      .toArray();
    const teamPerformances = await this.teamPerformances.toArray();
    
    const standings = teams
      .filter(team => {
        const teamStart = new Date(team.startDate);
        const teamEnd = team.endDate ? new Date(team.endDate) : null;
        const seasonStart = new Date(activeSeason.startDate);
        const seasonEnd = new Date(activeSeason.endDate);
        
        return teamStart <= seasonEnd && (!teamEnd || teamEnd >= seasonStart);
      })
      .map(team => {
        const teamMatches = matches.filter(
          m => m.homeTeamId === team.id || m.awayTeamId === team.id
        );
        
        const performances = teamPerformances.filter(tp => 
          tp.teamId === team.id && 
          teamMatches.some(m => m.id === tp.matchId)
        );
        
        const totalPoints = performances.reduce((sum, tp) => sum + tp.points, 0);
        const totalPins = performances.reduce((sum, tp) => sum + tp.totalPins, 0);
        const matchesPlayed = teamMatches.length;
        const avgPins = matchesPlayed > 0 ? totalPins / matchesPlayed : 0;
        const auxiliaryPoints = performances.reduce((sum, tp) => sum + tp.auxiliaryPoints, 0);
        
        const maxPossiblePoints = matchesPlayed * 10;
        const lostPoints = maxPossiblePoints - auxiliaryPoints;
        
        return {
          teamId: team.id!,
          teamName: team.name,
          season: currentSeason,
          matchesPlayed,
          points: totalPoints,
          auxiliaryPoints,
          lostPoints,
          totalPins,
          avgPins,
          rank: 0
        };
      });
    
    const sortedStandings = standings.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.auxiliaryPoints !== b.auxiliaryPoints) return b.auxiliaryPoints - a.auxiliaryPoints;
      return b.avgPins - a.avgPins;
    });
    
    sortedStandings.forEach((standing, index) => {
      standing.rank = index + 1;
    });
    
    return sortedStandings;
  }

  async getPlayerStats(season?: string, genderFilter?: 'male' | 'female') {
    const currentSeason = season || await this.getCurrentSeason();
    
    let players = await this.players.toArray();
    
    if (genderFilter) {
      players = players.filter(player => player.gender === genderFilter);
    }
    
    const matches = await this.matches
      .filter(m => m.completed && m.season === currentSeason)
      .toArray();
    const performances = await this.playerPerformances.toArray();
    
    const playerStats = await Promise.all(
      players.map(async player => {
        const playerPerfs = performances.filter(perf => 
          perf.playerId === player.id &&
          matches.some(m => m.id === perf.matchId)
        );
        
        if (playerPerfs.length === 0) {
          return {
            playerId: player.id!,
            playerName: player.name,
            teamName: (await this.teams.get(player.teamId))?.name || 'Unknown',
            gender: player.gender,
            season: currentSeason,
            gamesPlayed: 0,
            maxTotal: 0,
            avgTotal: 0,
            maxFulls: 0,
            avgFulls: 0,
            maxSpares: 0,
            avgSpares: 0,
            maxErrors: 0,
            avgErrors: 0
          };
        }
        
        const totals = playerPerfs.map(perf => perf.totalPins);
        const fulls = playerPerfs.map(perf => perf.full);
        const spares = playerPerfs.map(perf => perf.spare);
        const errors = playerPerfs.map(perf => perf.errors);
        
        return {
          playerId: player.id!,
          playerName: player.name,
          teamName: (await this.teams.get(player.teamId))?.name || 'Unknown',
          gender: player.gender,
          season: currentSeason,
          gamesPlayed: playerPerfs.length,
          maxTotal: Math.max(...totals),
          avgTotal: totals.reduce((sum, val) => sum + val, 0) / totals.length,
          maxFulls: Math.max(...fulls),
          avgFulls: fulls.reduce((sum, val) => sum + val, 0) / fulls.length,
          maxSpares: Math.max(...spares),
          avgSpares: spares.reduce((sum, val) => sum + val, 0) / spares.length,
          maxErrors: Math.max(...errors),
          avgErrors: errors.reduce((sum, val) => sum + val, 0) / errors.length
        };
      })
    );
    
    return playerStats;
  }

  async getCurrentSeason() {
    const activeSeason = await this.seasons
      .filter(s => s.active)
      .first();
    
    if (activeSeason) {
      return activeSeason.name;
    }
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    if (month >= 9) {
      return `${year}/${year + 1}`;
    } else if (month <= 4) {
      return `${year - 1}/${year}`;
    } else {
      return `${year}/${year + 1}`;
    }
  }

  async getAvailableSeasons() {
    return await this.seasons.orderBy('startDate').reverse().toArray();
  }

  async getActivePlayersCount() {
    const activeSeason = await this.seasons.filter(s => s.active).first();
    if (!activeSeason) return 0;

    const now = new Date();
    const activeHistoryRecords = await this.playerHistory
      .filter(record => {
        const joinDate = new Date(record.joinDate);
        const leaveDate = record.leaveDate ? new Date(record.leaveDate) : null;
        return joinDate <= now && (!leaveDate || leaveDate >= now);
      })
      .toArray();

    return activeHistoryRecords.length;
  }

  async isPlayerActiveInAnyTeam(playerId: number, date: Date): Promise<boolean> {
    const history = await this.playerHistory
      .where('playerId')
      .equals(playerId)
      .toArray();

    return history.some(record => {
      const joinDate = new Date(record.joinDate);
      const leaveDate = record.leaveDate ? new Date(record.leaveDate) : null;
      return joinDate <= date && (!leaveDate || leaveDate >= date);
    });
  }

  async getPlayerTeamHistory(playerId: number): Promise<PlayerHistory[]> {
    return await this.playerHistory
      .where('playerId')
      .equals(playerId)
      .toArray();
  }

  async canPlayerJoinTeam(playerId: number, teamId: number, joinDate: Date, leaveDate?: Date): Promise<boolean> {
    const history = await this.playerHistory
      .where('playerId')
      .equals(playerId)
      .toArray();

    // Filter out the current team's history if we're updating
    const otherTeamsHistory = history.filter(h => h.teamId !== teamId);

    // Check for overlaps with other team memberships
    return !otherTeamsHistory.some(record => {
      const recordStart = new Date(record.joinDate);
      const recordEnd = record.leaveDate ? new Date(record.leaveDate) : null;

      // If the new period starts during an existing period
      const startsInPeriod = joinDate >= recordStart && (!recordEnd || joinDate <= recordEnd);

      // If the new period ends during an existing period
      const endsInPeriod = leaveDate && recordStart <= leaveDate && (!recordEnd || leaveDate <= recordEnd);

      // If the new period completely encompasses an existing period
      const encompassesPeriod = joinDate <= recordStart && leaveDate && (!recordEnd || leaveDate >= recordEnd);

      return startsInPeriod || endsInPeriod || encompassesPeriod;
    });
  }
}

export const db = new BowlingDatabase();