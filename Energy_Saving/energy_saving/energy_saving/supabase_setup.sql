-- Supabase Tables Setup Script for Energy Saving Model Application
-- Copy and paste this script into the Supabase SQL Editor to create the required tables.

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  reset_token TEXT,
  reset_expires BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create appliances table
CREATE TABLE IF NOT EXISTS appliances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  power_consumption REAL NOT NULL,
  hours REAL NOT NULL
);

-- 3. Create user_energy_summary table
CREATE TABLE IF NOT EXISTS user_energy_summary (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_consumption REAL NOT NULL DEFAULT 0,
  monthly_consumption REAL NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS) if desired, or leave open for development
-- For simplicity in development, you can disable RLS or write policies:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE appliances ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_energy_summary ENABLE ROW LEVEL SECURITY;
