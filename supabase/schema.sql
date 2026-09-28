-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Counsellors
CREATE TABLE IF NOT EXISTS counsellors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category to Counsellor mapping (many-to-many)
CREATE TABLE IF NOT EXISTS category_counsellor_map (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  counsellor_id UUID REFERENCES counsellors(id) ON DELETE CASCADE,
  UNIQUE(category_id, counsellor_id)
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id TEXT NOT NULL,
  requester_name TEXT,
  requester_email TEXT,
  requester_type TEXT NOT NULL CHECK (requester_type IN ('student', 'employee')),
  counsellor_id UUID REFERENCES counsellors(id),
  category_id UUID REFERENCES categories(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'rescheduled', 'completed', 'reopened')),
  scheduled_at TIMESTAMPTZ,
  location TEXT,
  requester_notes TEXT,
  decline_reason TEXT,
  parent_session_id UUID REFERENCES sessions(id),
  referred_by_id TEXT,
  referred_by_name TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remarks (after session)
CREATE TABLE IF NOT EXISTS remarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  counsellor_notes TEXT,
  student_notes TEXT,
  counsellor_wellbeing_score INTEGER CHECK (counsellor_wellbeing_score BETWEEN 1 AND 5),
  student_wellbeing_score INTEGER CHECK (student_wellbeing_score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  teacher_name TEXT,
  student_id TEXT NOT NULL,
  student_name TEXT,
  student_email TEXT,
  category_id UUID REFERENCES categories(id),
  counsellor_id UUID REFERENCES counsellors(id),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'session_created')),
  session_id UUID REFERENCES sessions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default categories
INSERT INTO categories (name) VALUES
  ('Academic Stress'),
  ('Career Guidance'),
  ('Mental Health'),
  ('Personal Issues'),
  ('Behavioral Concerns'),
  ('Financial Stress'),
  ('Family Issues'),
  ('Peer Relations')
ON CONFLICT (name) DO NOTHING;
