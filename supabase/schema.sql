-- ==============================================================================
-- TaskFlow Database Schema for Supabase
-- Run this script in the Supabase SQL Editor (SQL Query Runner)
-- ==============================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT DEFAULT '',
    lead_id TEXT,
    target_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    initials TEXT NOT NULL,
    avatar_bg TEXT DEFAULT '#E0F2FE',
    avatar_text TEXT DEFAULT '#0369A1',
    weekly_capacity_hours NUMERIC DEFAULT 40,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'backlog', -- 'backlog', 'in_progress', 'in_review', 'completed'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'urgent', 'high', 'medium', 'low'
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    assignee_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
    due_date DATE,
    estimate_hours NUMERIC DEFAULT 0,
    subtasks JSONB DEFAULT '[]'::jsonb,
    comments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes for fast lookups & filtering
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies: Allow public / anonymous access for TaskFlow workspace
-- (Can be restricted later if Supabase Auth is enabled)
DROP POLICY IF EXISTS "Public access projects" ON projects;
CREATE POLICY "Public access projects" ON projects
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public access team_members" ON team_members;
CREATE POLICY "Public access team_members" ON team_members
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public access tasks" ON tasks;
CREATE POLICY "Public access tasks" ON tasks
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 8. Seed Initial Projects
INSERT INTO projects (id, name, code, description, lead_id, target_date)
VALUES
    ('p1', 'Core Platform', 'CORE', 'Workspace performance, permission scopes, and audit log exports.', 'm3', '2026-12-04'),
    ('p2', 'Mobile Checkout', 'PAY', 'One-tap Apple Pay and localized tax summary flow.', 'm2', '2026-11-29'),
    ('p3', 'Design System', 'DS', 'Accessible form primitives, focus rings, and table density tokens.', 'm4', '2026-12-12'),
    ('p4', 'API Gateway', 'API', 'Rate-limiting rules, webhook retries, and OAuth token rotation.', 'm3', '2026-11-28')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    description = EXCLUDED.description,
    lead_id = EXCLUDED.lead_id,
    target_date = EXCLUDED.target_date;

-- 9. Seed Initial Team Members
INSERT INTO team_members (id, name, role, initials, avatar_bg, avatar_text, weekly_capacity_hours)
VALUES
    ('m1', 'Maya Lin', 'Product Lead', 'ML', '#EDE9FE', '#5B21B6', 36),
    ('m2', 'Devon Brooks', 'Staff Frontend Engineer', 'DB', '#E0F2FE', '#0369A1', 40),
    ('m3', 'Priya Nair', 'Backend Architect', 'PN', '#ECFDF5', '#047857', 40),
    ('m4', 'Lucas Weber', 'Product Designer', 'LW', '#FEF3C7', '#B45309', 38),
    ('m5', 'Elena Vance', 'QA & Release Lead', 'EV', '#F1F5F9', '#334155', 36)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    initials = EXCLUDED.initials,
    avatar_bg = EXCLUDED.avatar_bg,
    avatar_text = EXCLUDED.avatar_text,
    weekly_capacity_hours = EXCLUDED.weekly_capacity_hours;

-- 10. Seed Initial Tasks
INSERT INTO tasks (id, key, title, description, status, priority, project_id, assignee_id, due_date, estimate_hours, subtasks, comments, updated_at)
VALUES
    (
        't1',
        'TF-241',
        'Finalize webhook retry backoff policy',
        'Configure exponential jitter retries (max 6 attempts) for failed billing webhooks and expose delivery status in the developer console.',
        'in_progress',
        'urgent',
        'p4',
        'm3',
        '2026-11-24',
        6,
        '[{"id":"st-1","title":"Set ceiling to 6 retries with decorrelated jitter","completed":true},{"id":"st-2","title":"Update documentation table in /docs/webhooks","completed":false},{"id":"st-3","title":"Add automated replay test suite","completed":false}]'::jsonb,
        '[{"id":"cm-1","authorId":"m1","text":"Flagged as launch blocker for EMEA billing partner.","createdAt":"2026-11-23T16:30:00Z"}]'::jsonb,
        NOW()
    ),
    (
        't2',
        'TF-242',
        'Address table keyboard navigation trap',
        'Screen reader focus gets captured in the density toggle inside the tasks table. Ensure Tab key flows to next interactive control.',
        'backlog',
        'medium',
        'p3',
        'm4',
        '2026-11-27',
        4,
        '[{"id":"st-4","title":"Audit with VoiceOver and NVDA","completed":false},{"id":"st-5","title":"Apply roving tabIndex pattern","completed":false}]'::jsonb,
        '[]'::jsonb,
        NOW()
    ),
    (
        't3',
        'TF-243',
        'Apple Pay tokenization certificate rotation',
        'Generate new CSR and upload merchant identity cert for sandbox testing before current credential expires next week.',
        'in_review',
        'high',
        'p2',
        'm2',
        '2026-11-25',
        8,
        '[{"id":"st-6","title":"Generate production CSR via Keychain","completed":true},{"id":"st-7","title":"Submit to Apple Developer portal","completed":true},{"id":"st-8","title":"Deploy to staging checkout runner","completed":false}]'::jsonb,
        '[{"id":"cm-2","authorId":"m5","text":"Verified passkey fallback works cleanly on iOS 18.","createdAt":"2026-11-24T09:15:00Z"}]'::jsonb,
        NOW()
    ),
    (
        't4',
        'TF-244',
        'Audit log CSV streaming endpoint',
        'Implement chunked transfer encoding for workspace audit logs exceeding 100k rows to avoid memory spikes on server instances.',
        'completed',
        'medium',
        'p1',
        'm3',
        '2026-11-23',
        10,
        '[{"id":"st-9","title":"Stream response cursor from PostgreSQL","completed":true},{"id":"st-10","title":"Add client download abort signal handling","completed":true}]'::jsonb,
        '[]'::jsonb,
        NOW()
    ),
    (
        't5',
        'TF-245',
        'Responsive Kanban swimlane drag boundaries',
        'Prevent horizontal overflow when cards are dragged between columns on laptop displays below 1280px viewport width.',
        'in_progress',
        'high',
        'p3',
        'm2',
        '2026-11-26',
        5,
        '[{"id":"st-11","title":"Clamp dragged ghost card width to column width","completed":true},{"id":"st-12","title":"Add auto-scroll on column boundary hover","completed":false}]'::jsonb,
        '[]'::jsonb,
        NOW()
    ),
    (
        't6',
        'TF-246',
        'OAuth refresh token sliding expiration',
        'Extend session lifetime on active API requests while invalidating tokens inactive for longer than 30 days.',
        'backlog',
        'urgent',
        'p4',
        'm3',
        '2026-11-29',
        7,
        '[{"id":"st-13","title":"Update Redis TTL key schema","completed":false},{"id":"st-14","title":"Handle concurrent refresh race conditions","completed":false}]'::jsonb,
        '[]'::jsonb,
        NOW()
    )
ON CONFLICT (id) DO NOTHING;
