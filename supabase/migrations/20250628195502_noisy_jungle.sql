-- Vytvoření databáze
CREATE DATABASE IF NOT EXISTS kulich_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kulich_db;

-- Tabulka uživatelů
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'reader') NOT NULL DEFAULT 'reader',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Tabulka sezón
CREATE TABLE IF NOT EXISTS seasons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (active),
    INDEX idx_dates (start_date, end_date)
);

-- Tabulka týmů
CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    venue VARCHAR(200) NOT NULL,
    day_of_week TINYINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_venue (venue),
    INDEX idx_schedule (day_of_week, time_start),
    INDEX idx_dates (start_date, end_date)
);

-- Tabulka hráčů
CREATE TABLE IF NOT EXISTS players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team_id INT NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    join_date DATE NOT NULL,
    leave_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_name (name),
    INDEX idx_team (team_id),
    INDEX idx_gender (gender),
    INDEX idx_dates (join_date, leave_date)
);

-- Tabulka historie hráčů
CREATE TABLE IF NOT EXISTS player_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    team_id INT NOT NULL,
    join_date DATE NOT NULL,
    leave_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_player (player_id),
    INDEX idx_team (team_id),
    INDEX idx_dates (join_date, leave_date)
);

-- Tabulka zápasů
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATETIME NOT NULL,
    home_team_id INT NOT NULL,
    away_team_id INT NOT NULL,
    venue VARCHAR(200) NOT NULL,
    season VARCHAR(50) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_date (date),
    INDEX idx_teams (home_team_id, away_team_id),
    INDEX idx_season (season),
    INDEX idx_completed (completed),
    INDEX idx_venue (venue)
);

-- Tabulka výkonů hráčů
CREATE TABLE IF NOT EXISTS player_performances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    player_id INT NOT NULL,
    team_id INT NOT NULL,
    opponent_id INT NOT NULL,
    position TINYINT NOT NULL CHECK (position >= 1 AND position <= 4),
    pins_full INT NOT NULL DEFAULT 0,
    pins_spare INT NOT NULL DEFAULT 0,
    pins_errors INT NOT NULL DEFAULT 0,
    total_pins INT NOT NULL DEFAULT 0,
    points TINYINT NOT NULL DEFAULT 0 CHECK (points >= 0 AND points <= 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (opponent_id) REFERENCES players(id) ON DELETE CASCADE,
    INDEX idx_match (match_id),
    INDEX idx_player (player_id),
    INDEX idx_team (team_id),
    INDEX idx_position (position),
    INDEX idx_performance (total_pins, points)
);

-- Tabulka výkonů týmů
CREATE TABLE IF NOT EXISTS team_performances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    team_id INT NOT NULL,
    total_pins INT NOT NULL DEFAULT 0,
    points TINYINT NOT NULL DEFAULT 0 CHECK (points >= 0 AND points <= 2),
    auxiliary_points INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_match (match_id),
    INDEX idx_team (team_id),
    INDEX idx_performance (total_pins, points, auxiliary_points)
);

-- Vytvoření výchozího admin uživatele
-- Heslo: admin123 (hash pro bcrypt)
INSERT IGNORE INTO users (email, password_hash, role) 
VALUES ('admin@kulich.cz', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Vytvoření výchozí sezóny
INSERT IGNORE INTO seasons (name, start_date, end_date, active) 
VALUES ('2024/2025', '2024-09-01', '2025-04-30', TRUE);