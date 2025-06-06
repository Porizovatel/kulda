/*
  # Initial Schema Setup
  
  1. New Tables
    - teams: Store team information and schedules
    - players: Store player information and team associations
    - matches: Store match details and results
    - player_performances: Store individual player performance in matches
    - team_performances: Store team performance in matches
    - seasons: Store season information
    - player_history: Track player team history
  
  2. Security
    - Enable RLS on all tables
    - Add basic view policies for public access
*/

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  venue text NOT NULL,
  schedule jsonb NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public teams are viewable by everyone"
  ON teams FOR SELECT
  USING (true);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  team_id uuid REFERENCES teams(id),
  gender text NOT NULL,
  join_date timestamptz NOT NULL,
  leave_date timestamptz
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public players are viewable by everyone"
  ON players FOR SELECT
  USING (true);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz NOT NULL,
  home_team_id uuid REFERENCES teams(id),
  away_team_id uuid REFERENCES teams(id),
  venue text NOT NULL,
  season text NOT NULL,
  completed boolean DEFAULT false
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public matches are viewable by everyone"
  ON matches FOR SELECT
  USING (true);

-- Player performances table
CREATE TABLE IF NOT EXISTS player_performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id),
  player_id uuid REFERENCES players(id),
  team_id uuid REFERENCES teams(id),
  opponent_id uuid REFERENCES players(id),
  position integer NOT NULL,
  pins_full integer NOT NULL,
  pins_spare integer NOT NULL,
  pins_errors integer NOT NULL,
  total_pins integer NOT NULL,
  points integer NOT NULL
);

ALTER TABLE player_performances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public player performances are viewable by everyone"
  ON player_performances FOR SELECT
  USING (true);

-- Team performances table
CREATE TABLE IF NOT EXISTS team_performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id),
  team_id uuid REFERENCES teams(id),
  total_pins integer NOT NULL,
  points integer NOT NULL,
  auxiliary_points integer NOT NULL
);

ALTER TABLE team_performances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public team performances are viewable by everyone"
  ON team_performances FOR SELECT
  USING (true);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  active boolean DEFAULT false
);

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public seasons are viewable by everyone"
  ON seasons FOR SELECT
  USING (true);

-- Player history table
CREATE TABLE IF NOT EXISTS player_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id),
  team_id uuid REFERENCES teams(id),
  join_date timestamptz NOT NULL,
  leave_date timestamptz
);

ALTER TABLE player_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public player history is viewable by everyone"
  ON player_history FOR SELECT
  USING (true);