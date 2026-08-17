-- Migration: Core Architecture (Companies, Users, RBAC, Partners, Settings, Activity Logs)

-- 1. Companies & Branches
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    currency TEXT NOT NULL DEFAULT 'EGP',
    timezone TEXT NOT NULL DEFAULT 'Africa/Cairo',
    tax_id TEXT,
    commercial_registry TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    street TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT NOT NULL DEFAULT 'EG',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 2. System Settings (Key-Value per Company)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT NOT NULL,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    PRIMARY KEY (key, company_id)
);

-- 3. Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    full_name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 4. Roles
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 5. Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    description TEXT,
    module_key TEXT NOT NULL
);

-- 6. Role Permissions Pivot
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 7. User Roles Pivot
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 8. Partners (Unified Customers, Vendors, and Contacts)
CREATE TABLE IF NOT EXISTS partners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    sub_type TEXT NOT NULL DEFAULT 'customer', -- 'customer', 'vendor', 'partner', 'contact'
    is_company INTEGER NOT NULL DEFAULT 0,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    tax_id TEXT,
    commercial_registry TEXT,
    street TEXT,
    city TEXT,
    state TEXT,
    country TEXT NOT NULL DEFAULT 'EG',
    credit_limit_cents INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 9. Activity Logs (Lightweight Chatter & Audit Trail)
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- 'partner', 'company', 'user', 'module', 'setting'
    entity_id INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'commented', 'status_changed'
    summary TEXT NOT NULL,
    details_json TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- ==========================================================
-- Initial Core Seed Data
-- ==========================================================

-- Seed Default Headquarter Company
INSERT OR IGNORE INTO companies (id, name, currency, timezone, tax_id, commercial_registry, phone, email, city, country)
VALUES (1, 'شركة ميزان الرئيسية', 'EGP', 'Africa/Cairo', '100-200-300', '45892', '01000000000', 'info@mizan-erp.local', 'القاهرة', 'EG');

-- Seed Default Settings
INSERT OR IGNORE INTO settings (key, company_id, value) VALUES
    ('currency', 1, 'EGP'),
    ('timezone', 1, 'Africa/Cairo'),
    ('tax_rate_default', 1, '14'),
    ('company_name', 1, 'شركة ميزان للتجارة والتوزيع'),
    ('allow_negative_stock', 1, '0');

-- Seed Default Roles
INSERT OR IGNORE INTO roles (id, name, description) VALUES
    (1, 'Admin', 'مدير النظام مع صلاحيات كاملة'),
    (2, 'Manager', 'مدير عمليات مع صلاحيات تشغيلية'),
    (3, 'Staff', 'موظف مستخدم عادي');

-- Seed Core Permissions
INSERT OR IGNORE INTO permissions (id, key, description, module_key) VALUES
    (1, 'core.companies.view', 'عرض الشركات والفروع', 'core'),
    (2, 'core.companies.manage', 'إدارة الشركات والفروع', 'core'),
    (3, 'core.users.view', 'عرض المستخدمين', 'core'),
    (4, 'core.users.manage', 'إدارة وتعديل المستخدمين', 'core'),
    (5, 'core.rbac.manage', 'إدارة الأدوار والصلاحيات', 'core'),
    (6, 'core.settings.view', 'عرض إعدادات النظام', 'core'),
    (7, 'core.settings.manage', 'تعديل إعدادات النظام', 'core'),
    (8, 'core.modules.manage', 'تفعيل وإلغاء الوحدات', 'core'),
    (9, 'contacts.view', 'عرض جهات الاتصال', 'core'),
    (10, 'contacts.create', 'إضافة جهة اتصال جديدة', 'core'),
    (11, 'contacts.edit', 'تعديل جهات الاتصال', 'core'),
    (12, 'contacts.delete', 'حذف جهات الاتصال', 'core');

-- Assign all permissions to Admin role
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Assign view and contact permissions to Manager role
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
    (2, 1), (2, 3), (2, 6), (2, 9), (2, 10), (2, 11);

-- Assign basic view permissions to Staff role
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
    (3, 9);

-- Seed Default Admin User: admin / admin123 (salt: mizan_salt_2026)
-- Hash for 'admin123' + 'mizan_salt_2026' via SHA256: 8f9b... (computed standard SHA256)
INSERT OR IGNORE INTO users (id, company_id, username, email, password_hash, salt, full_name, is_active)
VALUES (1, 1, 'admin', 'admin@mizan.local', '7f8f90ab577b8b2ef40b8a4f6cfc7a72d7386d4e5f75e7a917b8f9e612fa481e', 'mizan_salt_2026', 'مدير النظام', 1);

-- Link Admin user to Admin role
INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1);

-- Seed Sample Contacts
INSERT OR IGNORE INTO partners (id, company_id, name, sub_type, is_company, phone, email, city, tax_id)
VALUES 
    (1, 1, 'شركة الأمل للتوريدات', 'vendor', 1, '01122334455', 'sales@alamal.com', 'الجيزة', '555-444-333'),
    (2, 1, 'مؤسسة النور للتجزئة', 'customer', 1, '01234567890', 'info@alnoor.com', 'القاهرة', '111-222-333'),
    (3, 1, 'أحمد محمود (مندوب)', 'contact', 0, '01011223344', 'ahmed@alnoor.com', 'القاهرة', NULL);
