-- Baseline Migration: System Modules & Core Registry
CREATE TABLE IF NOT EXISTS modules (
    key TEXT PRIMARY KEY NOT NULL,
    category TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0,
    activated_at TEXT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- Seed initial module catalog per §7
INSERT OR IGNORE INTO modules (key, category, is_active, activated_at) VALUES
    ('core', 'core', 1, DATETIME('now')),
    ('products', 'operations', 0, NULL),
    ('inventory', 'operations', 0, NULL),
    ('sales', 'operations', 0, NULL),
    ('purchases', 'operations', 0, NULL),
    ('accounting', 'finance', 0, NULL),
    ('invoices', 'finance', 0, NULL),
    ('payments', 'finance', 0, NULL),
    ('employees', 'hr', 0, NULL),
    ('recruitment', 'hr', 0, NULL),
    ('timeoff', 'hr', 0, NULL),
    ('timesheet', 'hr', 0, NULL);
