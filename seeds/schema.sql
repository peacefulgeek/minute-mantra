-- Minute Mantra — Full Database Schema
-- Run this against your Railway MySQL database before seeding

CREATE TABLE IF NOT EXISTS mantras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  day_of_year INT NOT NULL UNIQUE,
  original_script TEXT NOT NULL,
  transliteration VARCHAR(500) NOT NULL,
  english_translation TEXT NOT NULL,
  tradition ENUM('vedic_shiva','vedic_vishnu','vedic_shakti','vedic_ganesha','vedic_solar','buddhist','sikh','universal') NOT NULL,
  intention VARCHAR(100) NOT NULL,
  phonetic_guide VARCHAR(500),
  audio_filename VARCHAR(255),
  audio_url VARCHAR(500),
  hero_image_url VARCHAR(500),
  go_deeper_url VARCHAR(500) DEFAULT 'https://paulwagner.com',
  go_deeper_teaser VARCHAR(255),
  context_note TEXT,
  sacred_geometry_type ENUM('seed_of_life','sri_yantra','lotus','flower_of_life') DEFAULT 'seed_of_life',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  notification_time TIME DEFAULT '07:00:00',
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  push_notifications_enabled BOOLEAN DEFAULT FALSE,
  push_subscription JSON,
  newsletter_opted_in BOOLEAN DEFAULT FALSE,
  subscription_tier ENUM('free','premium') DEFAULT 'free',
  square_customer_id VARCHAR(255),
  square_subscription_id VARCHAR(255),
  subscription_status ENUM('active','canceled','past_due','none') DEFAULT 'none',
  subscription_plan ENUM('monthly','annual','none') DEFAULT 'none',
  reset_token VARCHAR(255),
  reset_token_expiry DATETIME,
  unsubscribe_token VARCHAR(255) UNIQUE DEFAULT (UUID()),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  mantra_id INT NOT NULL,
  session_date DATE NOT NULL,
  duration_seconds INT NOT NULL,
  mode ENUM('timer','mala') DEFAULT 'timer',
  mala_count INT DEFAULT 0,
  completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mantra_id) REFERENCES mantras(id),
  INDEX idx_user_date (user_id, session_date)
);

CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  mantra_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mantra_id) REFERENCES mantras(id),
  UNIQUE KEY unique_user_mantra (user_id, mantra_id)
);

CREATE TABLE IF NOT EXISTS streaks (
  user_id INT PRIMARY KEY,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_session_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id INT NOT NULL,
  reflection TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
