-- ====================================================
-- Mizan ERP - Migration 06: General Accounting, Invoicing & Payments
-- ====================================================

-- 1. Chart of Accounts Table (دليل الحسابات المصري الموحد)
CREATE TABLE IF NOT EXISTS account_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'asset', 'liability', 'equity', 'income', 'expense'
    is_reconciled INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_account_accounts_code ON account_accounts(company_id, code);

-- 2. Account Journals Table (دفاتر اليومية)
CREATE TABLE IF NOT EXISTS account_journals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL, -- 'INV', 'BILL', 'BNK', 'CSH', 'MISC'
    type TEXT NOT NULL, -- 'sale', 'purchase', 'bank', 'cash', 'general'
    default_account_id INTEGER REFERENCES account_accounts(id),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, code)
);

-- 3. Double-Entry Journal Moves / Invoices (قيود اليومية والفواتير)
CREATE TABLE IF NOT EXISTS account_moves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT (CURRENT_DATE),
    journal_id INTEGER NOT NULL REFERENCES account_journals(id) ON DELETE RESTRICT,
    partner_id INTEGER REFERENCES partners(id) ON DELETE RESTRICT,
    move_type TEXT NOT NULL DEFAULT 'entry', -- 'entry', 'out_invoice', 'in_invoice', 'out_refund', 'in_refund'
    state TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'posted', 'cancelled'
    amount_untaxed_cents INTEGER NOT NULL DEFAULT 0,
    amount_tax_cents INTEGER NOT NULL DEFAULT 0,
    amount_total_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EGP',
    invoice_date_due DATE,
    payment_state TEXT NOT NULL DEFAULT 'not_paid', -- 'not_paid', 'in_payment', 'paid', 'partial', 'reversed'
    origin TEXT,
    note TEXT,
    reversed_entry_id INTEGER REFERENCES account_moves(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_account_moves_company_type ON account_moves(company_id, move_type, state);
CREATE INDEX IF NOT EXISTS idx_account_moves_partner ON account_moves(partner_id);

-- 4. Move Lines / Double-Entry Ledger Lines (سطور قيود اليومية)
CREATE TABLE IF NOT EXISTS account_move_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    move_id INTEGER NOT NULL REFERENCES account_moves(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES account_accounts(id) ON DELETE RESTRICT,
    partner_id INTEGER REFERENCES partners(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    debit_cents INTEGER NOT NULL DEFAULT 0,
    credit_cents INTEGER NOT NULL DEFAULT 0,
    balance_cents INTEGER NOT NULL DEFAULT 0, -- debit - credit
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity_milli INTEGER,
    price_unit_cents INTEGER,
    discount_percent_milli INTEGER DEFAULT 0,
    tax_rate_milli INTEGER DEFAULT 0,
    tax_account_id INTEGER REFERENCES account_accounts(id),
    sequence INTEGER NOT NULL DEFAULT 10,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_account_move_lines_move ON account_move_lines(move_id);
CREATE INDEX IF NOT EXISTS idx_account_move_lines_account ON account_move_lines(account_id);

-- 5. Payments & Receipts (المقبوضات والمدفوعات)
CREATE TABLE IF NOT EXISTS account_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    payment_type TEXT NOT NULL, -- 'inbound' (customer receipt), 'outbound' (vendor payment)
    amount_cents INTEGER NOT NULL,
    date DATE NOT NULL DEFAULT (CURRENT_DATE),
    journal_id INTEGER NOT NULL REFERENCES account_journals(id) ON DELETE RESTRICT,
    payment_method TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'bank_transfer', 'cheque'
    state TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'posted', 'cancelled'
    move_id INTEGER REFERENCES account_moves(id) ON DELETE SET NULL,
    invoice_id INTEGER REFERENCES account_moves(id) ON DELETE SET NULL,
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_account_payments_partner ON account_payments(partner_id);

-- 6. Permissions for Accounting, Invoices & Payments
INSERT OR IGNORE INTO permissions (key, description, module_key) VALUES
    ('accounting.view', 'عرض دليل الحسابات وقيود اليومية وميزان المراجعة', 'accounting'),
    ('accounting.post', 'ترحيل وتأكيد قيود اليومية', 'accounting'),
    ('invoices.view', 'عرض فواتير العملاء والموردين', 'invoices'),
    ('invoices.create', 'إنشاء وتعديل الفواتير', 'invoices'),
    ('invoices.post', 'ترحيل وتأكيد الفواتير وحساب الضرائب', 'invoices'),
    ('payments.view', 'عرض سندات القبض والصرف', 'payments'),
    ('payments.create', 'تسجيل سندات القبض والصرف', 'payments'),
    ('payments.post', 'ترحيل السندات وإجراء التسوية التلقائية للفواتير', 'payments');

-- Assign permissions to Admin role (id: 1) and Manager role (id: 2)
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE module_key IN ('accounting', 'invoices', 'payments');

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE module_key IN ('accounting', 'invoices', 'payments');

-- Activate accounting, invoices, and payments in modules table
UPDATE modules SET is_active = 1 WHERE key IN ('accounting', 'invoices', 'payments');

-- 7. Seed Standard Egyptian Chart of Accounts (COA) for Company 1
INSERT OR IGNORE INTO account_accounts (id, company_id, code, name, type, is_reconciled) VALUES
    (1, 1, '1010', 'الخزينة الرئيسية (النقدية)', 'asset', 0),
    (2, 1, '1020', 'البنك الأهلي المصري (حساب جاري)', 'asset', 0),
    (3, 1, '1030', 'العملاء والمدينون (حسابات القبض)', 'asset', 1),
    (4, 1, '1040', 'مخزون البضائع والمنتجات', 'asset', 0),
    (5, 1, '2010', 'الموردون والدائنون (حسابات الدفع)', 'liability', 1),
    (6, 1, '2020', 'ضريبة القيمة المضافة المحصلة (مبيعات 14%)', 'liability', 0),
    (7, 1, '2025', 'ضريبة القيمة المضافة المدفوعة (مشتريات 14%)', 'liability', 0),
    (8, 1, '3010', 'رأس المال المدفوع', 'equity', 0),
    (9, 1, '3020', 'الأرباح والخسائر المبقاة', 'equity', 0),
    (10, 1, '4010', 'إيرادات المبيعات والخدمات', 'income', 0),
    (11, 1, '5010', 'تكلفة البضاعة المباعة (COGS)', 'expense', 0),
    (12, 1, '5020', 'مصروفات عمومية وإدارية', 'expense', 0);

-- 8. Seed Default Journals for Company 1
INSERT OR IGNORE INTO account_journals (id, company_id, name, code, type, default_account_id) VALUES
    (1, 1, 'دفتر فواتير المبيعات', 'INV', 'sale', 10),
    (2, 1, 'دفتر فواتير المشتريات', 'BILL', 'purchase', 11),
    (3, 1, 'دفتر الخزينة والنقدية', 'CSH', 'cash', 1),
    (4, 1, 'دفتر البنك والمعاملات المصرفية', 'BNK', 'bank', 2),
    (5, 1, 'دفتر العمليات المتنوعة والقيود', 'MISC', 'general', NULL);

-- 9. Seed Initial Posted Customer Invoice with Double-Entry Balancing Lines
-- Invoice INV/2026/00001: 70,000 EGP + 9,800 EGP (14% VAT) = 79,800 EGP (7,980,000 cents)
-- Debit: Customers (A/R id: 3) = 79,800 EGP
-- Credit: Sales Revenue (id: 10) = 70,000 EGP
-- Credit: VAT Output (id: 6) = 9,800 EGP
-- Total Debit (7,980,000) == Total Credit (7,980,000)
INSERT OR IGNORE INTO account_moves (
    id, company_id, name, date, journal_id, partner_id, move_type, state,
    amount_untaxed_cents, amount_tax_cents, amount_total_cents, currency,
    invoice_date_due, payment_state, origin, note
) VALUES (
    1, 1, 'INV/2026/00001', CURRENT_DATE, 1, 2, 'out_invoice', 'posted',
    7000000, 980000, 7980000, 'EGP',
    DATE(CURRENT_DATE, '+30 days'), 'not_paid', 'SO/2026/00001', 'فاتورة مبيعات توريد حواسب مكتبية'
);

INSERT OR IGNORE INTO account_move_lines (
    id, move_id, account_id, partner_id, name, debit_cents, credit_cents, balance_cents,
    product_id, quantity_milli, price_unit_cents, discount_percent_milli, tax_rate_milli, sequence
) VALUES
    (1, 1, 3, 2, 'العملاء - شركة الأهرام للتجارة', 7980000, 0, 7980000, NULL, NULL, NULL, 0, 0, 10),
    (2, 1, 10, 2, 'لابتوب ديل للأعمال Dell Latitude 5530', 0, 7000000, -7000000, 1, 2000, 3500000, 0, 14000, 20),
    (3, 1, 6, 2, 'ضريبة القيمة المضافة 14% على المبيعات', 0, 980000, -980000, NULL, NULL, NULL, 0, 0, 30);
