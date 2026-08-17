-- ====================================================
-- Mizan ERP - Migration 07: Human Resources (HR)
-- ====================================================

-- 1. Departments Table (الأقسام والإدارات)
CREATE TABLE IF NOT EXISTS hr_departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES hr_departments(id) ON DELETE SET NULL,
    manager_id INTEGER, -- forward reference to hr_employees(id)
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hr_departments_company ON hr_departments(company_id);

-- 2. Job Positions Table (المسميات والوظائف)
CREATE TABLE IF NOT EXISTS hr_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    department_id INTEGER REFERENCES hr_departments(id) ON DELETE SET NULL,
    expected_employees INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hr_jobs_company ON hr_jobs(company_id);

-- 3. Employees Directory Table (دليل الموظفين)
CREATE TABLE IF NOT EXISTS hr_employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    work_email TEXT,
    work_phone TEXT,
    department_id INTEGER REFERENCES hr_departments(id) ON DELETE SET NULL,
    job_id INTEGER REFERENCES hr_jobs(id) ON DELETE SET NULL,
    manager_id INTEGER REFERENCES hr_employees(id) ON DELETE SET NULL,
    hire_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    national_id TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'on_leave', 'terminated'
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hr_employees_company_dept ON hr_employees(company_id, department_id);

-- 4. Employment Contracts Table (عقود العمل والرواتب)
CREATE TABLE IF NOT EXISTS hr_contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. 'CON/2026/00001'
    wage_cents INTEGER NOT NULL DEFAULT 0, -- Base monthly salary in minor units (cents)
    date_start DATE NOT NULL DEFAULT (CURRENT_DATE),
    date_end DATE,
    state TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'open', 'close', 'cancelled'
    working_hours_per_week INTEGER NOT NULL DEFAULT 40,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_hr_contracts_employee ON hr_contracts(employee_id);

-- 5. Time-Off / Leave Requests Table (طلبات الإجازات)
CREATE TABLE IF NOT EXISTS hr_leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL DEFAULT 'annual', -- 'annual', 'sick', 'unpaid', 'emergency'
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    duration_days_milli INTEGER NOT NULL DEFAULT 1000, -- 1.000 days
    state TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'confirm', 'validate', 'refuse'
    reason TEXT,
    approved_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hr_leaves_employee ON hr_leaves(employee_id);

-- 6. Attendances & Timesheets Table (سجلات الحضور والانصراف)
CREATE TABLE IF NOT EXISTS hr_attendances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT (CURRENT_DATE),
    check_in DATETIME NOT NULL,
    check_out DATETIME,
    worked_hours_milli INTEGER NOT NULL DEFAULT 0, -- 8.000 hrs = 8000
    status TEXT NOT NULL DEFAULT 'present', -- 'present', 'late', 'absent'
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hr_attendances_emp_date ON hr_attendances(employee_id, date);

-- 7. Permissions for HR Module
INSERT OR IGNORE INTO permissions (name, description, module_key) VALUES
    ('hr.view', 'عرض دليل الموظفين والأقسام', 'employees'),
    ('hr.manage', 'إضافة وتعديل بيانات الموظفين والهيكل الإداري', 'employees'),
    ('hr.contracts', 'إدارة عقود العمل والرواتب', 'employees'),
    ('hr.leaves.manage', 'إدارة واعتماد طلبات الإجازات', 'employees'),
    ('hr.attendance.manage', 'تسجيل ومتابعة الحضور والانصراف', 'employees');

-- Assign permissions to Admin (id: 1) and Manager (id: 2)
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE module_key = 'employees';

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE module_key = 'employees';

-- Activate employees module in modules table
UPDATE modules SET is_active = 1 WHERE key = 'employees';

-- 8. Seed Initial HR Data for Company 1
INSERT OR IGNORE INTO hr_departments (id, company_id, name, parent_id) VALUES
    (1, 1, 'الإدارة العامة والمكتب التنفيذي', NULL),
    (2, 1, 'إدارة تكنولوجيا المعلومات والهندسة', 1),
    (3, 1, 'إدارة المبيعات والتسويق', 1),
    (4, 1, 'إدارة الحسابات والمالية', 1);

INSERT OR IGNORE INTO hr_jobs (id, company_id, name, department_id, expected_employees) VALUES
    (1, 1, 'كبير مهندسي البرمجيات (Lead Engineer)', 2, 2),
    (2, 1, 'مدير مبيعات أول (Senior Sales Exec)', 3, 3),
    (3, 1, 'محاسب مالي أول (Senior Accountant)', 4, 2);

INSERT OR IGNORE INTO hr_employees (
    id, company_id, name, work_email, work_phone, department_id, job_id,
    hire_date, national_id, status
) VALUES
    (1, 1, 'أحمد محمود القاضي', 'ahmed.kadi@mizan.local', '+201011122233', 2, 1, '2025-01-01', '29001011234567', 'active'),
    (2, 1, 'سارة إبراهيم حسن', 'sara.hassan@mizan.local', '+201022233344', 3, 2, '2025-03-15', '29205151234568', 'active'),
    (3, 1, 'محمد طارق عبد الله', 'm.tarek@mizan.local', '+201033344455', 4, 3, '2025-06-01', '29408201234569', 'active');

INSERT OR IGNORE INTO hr_contracts (
    id, company_id, employee_id, name, wage_cents, date_start, state, working_hours_per_week, notes
) VALUES
    (1, 1, 1, 'CON/2026/00001', 3500000, '2025-01-01', 'open', 40, 'عقد عمل بدوام كامل - راتب شهري 35,000 ج.م'),
    (2, 1, 2, 'CON/2026/00002', 2500000, '2025-03-15', 'open', 40, 'عقد عمل بدوام كامل - راتب شهري 25,000 ج.م + عمولة'),
    (3, 1, 3, 'CON/2026/00003', 2000000, '2025-06-01', 'open', 40, 'عقد عمل بدوام كامل - راتب شهري 20,000 ج.م');

INSERT OR IGNORE INTO hr_leaves (
    id, company_id, employee_id, leave_type, date_from, date_to, duration_days_milli, state, reason, approved_by_id
) VALUES
    (1, 1, 1, 'annual', '2026-09-01', '2026-09-05', 5000, 'validate', 'إجازة سنوية اعتيادية', 1);

INSERT OR IGNORE INTO hr_attendances (
    id, company_id, employee_id, date, check_in, check_out, worked_hours_milli, status, notes
) VALUES
    (1, 1, 1, CURRENT_DATE, '2026-08-17 09:00:00', '2026-08-17 17:00:00', 8000, 'present', 'حضور مكتمل 8 ساعات');
