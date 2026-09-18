-- ============================================================
-- Personalized Job Recommendation Platform - Database Schema
-- PostgreSQL
-- ============================================================

-- Drop tables if they exist (safe re-run during development)
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS job_skills CASCADE;
DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ------------------------------------------------------------
-- 1. USERS
-- Stores login credentials. Kept separate from "profiles" so
-- authentication data (sensitive) is isolated from profile data.
-- ------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. PROFILES
-- One-to-one with users. Holds resume-like data used to build
-- the "user profile text" fed into TF-IDF.
-- ------------------------------------------------------------
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    education VARCHAR(255),         -- e.g. "B.Tech Computer Science"
    experience_years NUMERIC(4,1) DEFAULT 0,
    preferred_role VARCHAR(255),    -- e.g. "Backend Developer"
    location VARCHAR(255),
    bio TEXT,                       -- free text, also feeds TF-IDF
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. SKILLS
-- Master lookup table of all known skills (Python, SQL, React...).
-- Prevents duplicate/typo'd skill names across the system.
-- ------------------------------------------------------------
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- ------------------------------------------------------------
-- 4. USER_SKILLS (junction table => many-to-many: users <-> skills)
-- A user can have many skills; a skill can belong to many users.
-- ------------------------------------------------------------
CREATE TABLE user_skills (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency VARCHAR(20) DEFAULT 'intermediate', -- beginner/intermediate/advanced
    PRIMARY KEY (user_id, skill_id)
);

-- ------------------------------------------------------------
-- 5. JOBS
-- Job postings. description_text is the raw text used for TF-IDF.
-- ------------------------------------------------------------
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    experience_required NUMERIC(4,1) DEFAULT 0,
    description TEXT NOT NULL,
    category VARCHAR(100),          -- e.g. "Backend", "Data Science"
    created_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. JOB_SKILLS (junction table => many-to-many: jobs <-> skills)
-- ------------------------------------------------------------
CREATE TABLE job_skills (
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);

-- ------------------------------------------------------------
-- 7. APPLICATIONS
-- One-to-many: a user can apply to many jobs; a job can receive
-- many applications. UNIQUE constraint prevents duplicate applies.
-- ------------------------------------------------------------
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'applied', -- applied/shortlisted/rejected/hired
    applied_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, job_id)
);

-- ------------------------------------------------------------
-- 8. RECOMMENDATIONS
-- Stores the last computed recommendation results per user so
-- the frontend can show "why recommended" without recomputing,
-- and so we can evaluate Precision@K / Recall@K later.
-- ------------------------------------------------------------
CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    similarity_score NUMERIC(6,4) NOT NULL,
    matched_skills TEXT,             -- comma-separated matched skills (for explanation)
    generated_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- INDEXES
-- Speed up the queries the app actually runs frequently.
-- ------------------------------------------------------------
CREATE INDEX idx_jobs_title ON jobs USING GIN (to_tsvector('english', title));
CREATE INDEX idx_jobs_location ON jobs (location);
CREATE INDEX idx_jobs_category ON jobs (category);
CREATE INDEX idx_applications_user ON applications (user_id);
CREATE INDEX idx_applications_job ON applications (job_id);
CREATE INDEX idx_recommendations_user ON recommendations (user_id);
CREATE INDEX idx_user_skills_user ON user_skills (user_id);
CREATE INDEX idx_job_skills_job ON job_skills (job_id);
