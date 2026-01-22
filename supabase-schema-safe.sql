-- LifeOS Supabase PostgreSQL Schema
-- SAFE TO RUN MULTIPLE TIMES
-- This file is idempotent (can be run repeatedly without errors)

-- =============================================
-- EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE (SYNCED FROM FIREBASE)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  photo_url TEXT,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub');

-- =============================================
-- TASKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;

CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =============================================
-- HABITS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly')),
  streak INTEGER DEFAULT 0,
  last_completed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own habits" ON habits;

CREATE POLICY "Users can manage own habits" ON habits
  FOR ALL USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =============================================
-- EXPENSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own expenses" ON expenses;

CREATE POLICY "Users can manage own expenses" ON expenses
  FOR ALL USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =============================================
-- NOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notes" ON notes;

CREATE POLICY "Users can manage own notes" ON notes
  FOR ALL USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =============================================
-- SUBJECTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own subjects" ON subjects;

CREATE POLICY "Users can manage own subjects" ON subjects
  FOR ALL USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =============================================
-- TOPICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own topics" ON topics;

CREATE POLICY "Users can manage own topics" ON topics
  FOR ALL USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =============================================
-- STUDY SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  duration INTEGER NOT NULL, -- in minutes
  notes TEXT,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own study sessions" ON study_sessions;

CREATE POLICY "Users can manage own study sessions" ON study_sessions
  FOR ALL USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =============================================
-- DOCUMENTS TABLE (FOR STUDY MATERIALS)
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('pdf', 'image')),
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own documents" ON documents;

CREATE POLICY "Users can manage own documents" ON documents
  FOR ALL USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =============================================
-- AI RESULTS TABLE (FOR CACHING AI OUTPUTS)
-- =============================================
CREATE TABLE IF NOT EXISTS ai_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT NOT NULL,
  task_type TEXT CHECK (task_type IN ('summary', 'quiz', 'question', 'evaluation')),
  input_ref UUID,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own ai results" ON ai_results;

CREATE POLICY "Users can manage own ai results" ON ai_results
  FOR ALL USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
-- Drop existing indexes first (safe to recreate)
DROP INDEX IF EXISTS idx_tasks_owner;
DROP INDEX IF EXISTS idx_tasks_due_date;
DROP INDEX IF EXISTS idx_habits_owner;
DROP INDEX IF EXISTS idx_expenses_owner;
DROP INDEX IF EXISTS idx_expenses_date;
DROP INDEX IF EXISTS idx_notes_owner;
DROP INDEX IF EXISTS idx_subjects_owner;
DROP INDEX IF EXISTS idx_topics_owner;
DROP INDEX IF EXISTS idx_study_sessions_owner;
DROP INDEX IF EXISTS idx_documents_owner;
DROP INDEX IF EXISTS idx_users_email_verified;

-- Create indexes
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_habits_owner ON habits(owner_id);
CREATE INDEX idx_expenses_owner ON expenses(owner_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_notes_owner ON notes(owner_id);
CREATE INDEX idx_subjects_owner ON subjects(owner_id);
CREATE INDEX idx_topics_owner ON topics(owner_id);
CREATE INDEX idx_study_sessions_owner ON study_sessions(owner_id);
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_habits_updated_at ON habits;
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Create triggers
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
