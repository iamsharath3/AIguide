-- Database Schema for MentorAI

-- Users Table (New)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Career Logs Table (Updated)
CREATE TABLE IF NOT EXISTS career_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- Link to user
    education VARCHAR(255),
    major VARCHAR(255),
    skills TEXT,
    interests TEXT,
    goals TEXT,
    generated_content JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_career_logs_user_id ON career_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON career_logs(created_at);
