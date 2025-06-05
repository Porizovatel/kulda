/*
  # Initial Schema Setup

  1. Tables
    - teams
    - players
    - matches
    - player_performances
    - team_performances
    - seasons
    - player_history

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
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

CREATE POLICY "Teams are editable by authenticated users"
  ON teams FOR ALL
  USING (auth.role() = 'authenticated');

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

CREATE POLICY "Players are editable by authenticated users"
  ON players FOR ALL
  USING (auth.role() = 'authenticated');

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

CREATE POLICY "Matches are editable by authenticated users"
  ON matches FOR ALL
  USING (auth.role() = 'authenticated');

-- Player performances table
CREATE TABLE IF NOT EXISTS player_performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id),
  player_id uuid REFERENCES players(id),
  team_id uuid REFERENCES teams(id),
  opponent_id uuid REFERENCES players(id),
  position integer NOT NULL,
  full integer NOT NULL,
  spare integer NOT NULL,
  errors integer NOT NULL,
  total_pins integer NOT NULL,
  points integer NOT NULL
);

ALTER TABLE player_performances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public player performances are viewable by everyone"
  ON player_performances FOR SELECT
  USING (true);

CREATE POLICY "Player performances are editable by authenticated users"
  ON player_performances FOR ALL
  USING (auth.role() = 'authenticated');

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

CREATE POLICY "Team performances are editable by authenticated users"
  ON team_performances FOR ALL
  USING (auth.role() = 'authenticated');

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

CREATE POLICY "Seasons are editable by authenticated users"
  ON seasons FOR ALL
  USING (auth.role() = 'authenticated');

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

CREATE POLICY "Player history is editable by authenticated users"
  ON player_history FOR ALL
  USING (auth.role() = 'authenticated');