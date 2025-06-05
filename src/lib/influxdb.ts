import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { OrgsAPI, BucketsAPI } from '@influxdata/influxdb-client-apis';

// Configure InfluxDB connection
const url = import.meta.env.VITE_INFLUXDB_URL;
const token = import.meta.env.VITE_INFLUXDB_TOKEN;
const org = 'kulich';
const bucket = 'bowling_league';

// Configure client with timeout and retry options
const influxDB = new InfluxDB({
  url,
  token,
  timeout: 30000, // 30 seconds timeout
  transportOptions: {
    retry: {
      retries: 5,
      minTimeout: 2000,
      maxTimeout: 15000
    }
  }
});

const writeApi = influxDB.getWriteApi(org, bucket, 'ns');
const queryApi = influxDB.getQueryApi(org);

export const setupInfluxDB = async () => {
  if (!url || !token) {
    throw new Error('InfluxDB URL and token must be configured in environment variables. Check your .env file.');
  }

  // Test connection before proceeding
  try {
    const response = await fetch(`${url}/api/v2/ping`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`
      },
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`InfluxDB ping failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('InfluxDB ping failed:', error);
    throw new Error(`Failed to connect to InfluxDB at ${url}. Please check if the server is running and accessible.`);
  }

  const orgsApi = new OrgsAPI(influxDB);
  const bucketsApi = new BucketsAPI(influxDB);

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
      throw new Error('Invalid InfluxDB token. Please check your credentials in .env file.');
    }
    throw new Error(`Failed to setup InfluxDB: ${error.message}`);
  }
};

// Write functions for each entity type
export const writeTeam = async (team: any) => {
  const point = new Point('team')
    .tag('id', team.id)
    .stringField('name', team.name)
    .stringField('venue', team.venue)
    .stringField('schedule', JSON.stringify(team.schedule))
    .timestamp(new Date());

  await writeApi.writePoint(point);
  await writeApi.flush();
};

export const writeMatch = async (match: any) => {
  const point = new Point('match')
    .tag('id', match.id)
    .tag('homeTeamId', match.homeTeamId)
    .tag('awayTeamId', match.awayTeamId)
    .stringField('venue', match.venue)
    .stringField('season', match.season)
    .booleanField('completed', match.completed)
    .timestamp(new Date(match.date));

  await writeApi.writePoint(point);
  await writeApi.flush();
};

export const writePlayerPerformance = async (performance: any) => {
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

  await writeApi.writePoint(point);
  await writeApi.flush();
};

// Query functions
export const queryTeams = async () => {
  const query = `
    from(bucket: "${bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "team")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;

  const result = await queryApi.collectRows(query);
  return result.map(row => ({
    id: row.id,
    name: row.name,
    venue: row.venue,
    schedule: JSON.parse(row.schedule)
  }));
};

export const queryMatches = async (season: string) => {
  const query = `
    from(bucket: "${bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "match" and r.season == "${season}")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;

  return await queryApi.collectRows(query);
};

export const queryPlayerPerformances = async (matchId: string) => {
  const query = `
    from(bucket: "${bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "player_performance" and r.matchId == "${matchId}")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;

  return await queryApi.collectRows(query);
};

export const queryTeamStandings = async (season: string) => {
  const query = `
    from(bucket: "${bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "match" and r.season == "${season}")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> group(columns: ["homeTeamId", "awayTeamId"])
      |> count()
  `;

  return await queryApi.collectRows(query);
};

export default {
  setupInfluxDB,
  writeTeam,
  writeMatch,
  writePlayerPerformance,
  queryTeams,
  queryMatches,
  queryPlayerPerformances,
  queryTeamStandings
};