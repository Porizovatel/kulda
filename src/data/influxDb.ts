import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { OrgsAPI, BucketsAPI } from '@influxdata/influxdb-client-apis';

// Configure InfluxDB connection
const url = import.meta.env.VITE_INFLUXDB_URL;
const token = import.meta.env.VITE_INFLUXDB_TOKEN;
const org = 'kulich';
const bucket = 'bowling_league';

class InfluxBowlingDB {
  private influxDB: InfluxDB;
  private writeApi: any;
  private queryApi: any;

  constructor() {
    if (!url || !token) {
      console.warn('InfluxDB URL or token not configured, using defaults');
    }

    this.influxDB = new InfluxDB({
      url: url || 'http://localhost:8086',
      token: token || 'default-token',
      timeout: 10000,
      transportOptions: {
        retry: {
          retries: 3,
          minTimeout: 1000,
          maxTimeout: 5000
        }
      }
    });

    this.writeApi = this.influxDB.getWriteApi(org, bucket, 'ns');
    this.queryApi = this.influxDB.getQueryApi(org);
  }

  async init() {
    // Test connection before proceeding
    try {
      const health = await fetch(`${url}/health`);
      if (!health.ok) {
        throw new Error(`InfluxDB health check failed: ${health.statusText}`);
      }
    } catch (error) {
      console.error('InfluxDB health check failed:', error);
      throw new Error(`Failed to connect to InfluxDB at ${url}. Please check if the server is running and accessible.`);
    }

    const orgsApi = new OrgsAPI(this.influxDB);
    const bucketsApi = new BucketsAPI(this.influxDB);

    try {
      // Create organization if it doesn't exist
      const orgs = await orgsApi.getOrgs({ org });
      if (orgs.orgs.length === 0) {
        await orgsApi.postOrgs({ body: { name: org } });
      }

      // Create bucket if it doesn't exist
      const buckets = await bucketsApi.getBuckets({ name: bucket });
      if (buckets.buckets.length === 0) {
        await bucketsApi.postBuckets({
          body: {
            orgID: orgs.orgs[0].id,
            name: bucket,
            retentionRules: [{ type: 'expire', everySeconds: 2592000 }] // 30 days
          }
        });
      }
    } catch (error: any) {
      console.error('Error setting up InfluxDB:', error);
      if (error.message.includes('unauthorized')) {
        throw new Error('Invalid InfluxDB token. Please check your credentials.');
      }
      throw new Error(`Failed to setup InfluxDB: ${error.message}`);
    }
  }

  async writeTeam(team: any) {
    const point = new Point('team')
      .tag('id', team.id)
      .stringField('name', team.name)
      .stringField('venue', team.venue)
      .stringField('schedule', JSON.stringify(team.schedule))
      .timestamp(new Date());

    await this.writeApi.writePoint(point);
    await this.writeApi.flush();
  }

  async writeMatch(match: any) {
    const point = new Point('match')
      .tag('id', match.id)
      .tag('homeTeamId', match.homeTeamId)
      .tag('awayTeamId', match.awayTeamId)
      .stringField('venue', match.venue)
      .stringField('season', match.season)
      .booleanField('completed', match.completed)
      .timestamp(new Date(match.date));

    await this.writeApi.writePoint(point);
    await this.writeApi.flush();
  }

  async writePlayerPerformance(performance: any) {
    const point = new Point('player_performance')
      .tag('matchId', performance.matchId)
      .tag('playerId', performance.playerId)
      .tag('teamId', performance.teamId)
      .intField('position', performance.position)
      .intField('full', performance.full)
      .intField('spare', performance.spare)
      .intField('errors', performance.errors)
      .intField('totalPins', performance.totalPins)
      .intField('points', performance.points)
      .timestamp(new Date());

    await this.writeApi.writePoint(point);
    await this.writeApi.flush();
  }

  async queryTeams() {
    const query = `
      from(bucket: "${bucket}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "team")
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
    `;

    const result = await this.queryApi.collectRows(query);
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      venue: row.venue,
      schedule: JSON.parse(row.schedule)
    }));
  }

  async queryMatches(season: string) {
    const query = `
      from(bucket: "${bucket}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "match" and r.season == "${season}")
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
    `;

    return await this.queryApi.collectRows(query);
  }

  async queryPlayerPerformances(matchId: string) {
    const query = `
      from(bucket: "${bucket}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "player_performance" and r.matchId == "${matchId}")
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
    `;

    return await this.queryApi.collectRows(query);
  }

  async queryTeamStandings(season: string) {
    const query = `
      from(bucket: "${bucket}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "match" and r.season == "${season}")
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> group(columns: ["homeTeamId", "awayTeamId"])
        |> count()
    `;

    return await this.queryApi.collectRows(query);
  }
}

export const influxDb = new InfluxBowlingDB();