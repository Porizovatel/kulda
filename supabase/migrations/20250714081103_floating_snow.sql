-- SQLite schema for KuLiCh application

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Tabulka uživatelů
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'manager', 'reader')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Tabulka sezón
CREATE TABLE IF NOT EXISTS seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    active INTEGER DEFAULT 0 CHECK (active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(active);
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date);

-- Tabulka týmů
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    venue TEXT NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    time_start TEXT NOT NULL,
    time_end TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_venue ON teams(venue);
CREATE INDEX IF NOT EXISTS idx_teams_schedule ON teams(day_of_week, time_start);
CREATE INDEX IF NOT EXISTS idx_teams_dates ON teams(start_date, end_date);

-- Tabulka hráčů
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    team_id INTEGER NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    join_date TEXT NOT NULL,
    leave_date TEXT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_gender ON players(gender);
CREATE INDEX IF NOT EXISTS idx_players_dates ON players(join_date, leave_date);

-- Tabulka historie hráčů
CREATE TABLE IF NOT EXISTS player_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    join_date TEXT NOT NULL,
    leave_date TEXT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_player_history_player ON player_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_history_team ON player_history(team_id);
CREATE INDEX IF NOT EXISTS idx_player_history_dates ON player_history(join_date, leave_date);

-- Tabulka zápasů
CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    home_team_id INTEGER NOT NULL,
    away_team_id INTEGER NOT NULL,
    venue TEXT NOT NULL,
    season TEXT NOT NULL,
    completed INTEGER DEFAULT 0 CHECK (completed IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season);
CREATE INDEX IF NOT EXISTS idx_matches_completed ON matches(completed);
CREATE INDEX IF NOT EXISTS idx_matches_venue ON matches(venue);

-- Tabulka výkonů hráčů
CREATE TABLE IF NOT EXISTS player_performances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    opponent_id INTEGER NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 1 AND position <= 4),
    pins_full INTEGER NOT NULL DEFAULT 0,
    pins_spare INTEGER NOT NULL DEFAULT 0,
    pins_errors INTEGER NOT NULL DEFAULT 0,
    total_pins INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0 AND points <= 2),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (opponent_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_player_performances_match ON player_performances(match_id);
CREATE INDEX IF NOT EXISTS idx_player_performances_player ON player_performances(player_id);
CREATE INDEX IF NOT EXISTS idx_player_performances_team ON player_performances(team_id);
CREATE INDEX IF NOT EXISTS idx_player_performances_position ON player_performances(position);
CREATE INDEX IF NOT EXISTS idx_player_performances_performance ON player_performances(total_pins, points);

-- Tabulka výkonů týmů
CREATE TABLE IF NOT EXISTS team_performances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    total_pins INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0 AND points <= 2),
    auxiliary_points INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_team_performances_match ON team_performances(match_id);
CREATE INDEX IF NOT EXISTS idx_team_performances_team ON team_performances(team_id);
CREATE INDEX IF NOT EXISTS idx_team_performances_performance ON team_performances(total_pins, points, auxiliary_points);

-- Vytvoření výchozího admin uživatele
-- Heslo: admin123 (hash pro bcrypt)
INSERT OR IGNORE INTO users (email, password_hash, role) 
VALUES ('admin@kulich.cz', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Vytvoření výchozí sezóny
INSERT OR IGNORE INTO seasons (name, start_date, end_date, active) 
VALUES ('2024/2025', '2024-09-01', '2025-04-30', 1);