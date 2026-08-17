-- ====================================================
-- Mizan ERP - Migration 05: Purchases & Vendor Orders
-- ====================================================

-- 1. Purchase Orders Header Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    date_order DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_planned DATETIME,
    state TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'purchase', 'done', 'cancelled'
    currency TEXT NOT NULL DEFAULT 'EGP',
    amount_untaxed_cents INTEGER NOT NULL DEFAULT 0,
    amount_tax_cents INTEGER NOT NULL DEFAULT 0,
    amount_total_cents INTEGER NOT NULL DEFAULT 0,
    receipt_status TEXT NOT NULL DEFAULT 'no', -- 'no', 'to_receive', 'received', 'cancelled'
    invoice_status TEXT NOT NULL DEFAULT 'no', -- 'no', 'to_bill', 'billed', 'cancelled'
    picking_id INTEGER REFERENCES stock_pickings(id) ON DELETE SET NULL,
    origin TEXT,
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_state ON purchase_orders(company_id, state);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_partner ON purchase_orders(partner_id);

-- 2. Purchase Order Lines Table
CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    product_uom_qty_milli INTEGER NOT NULL DEFAULT 1000,
    product_uom_id INTEGER NOT NULL REFERENCES uoms(id) ON DELETE RESTRICT,
    price_unit_cents INTEGER NOT NULL DEFAULT 0,
    discount_percent_milli INTEGER NOT NULL DEFAULT 0,
    tax_rate_milli INTEGER NOT NULL DEFAULT 14000, -- 14% Egyptian VAT
    price_subtotal_cents INTEGER NOT NULL DEFAULT 0,
    price_total_cents INTEGER NOT NULL DEFAULT 0,
    qty_received_milli INTEGER NOT NULL DEFAULT 0,
    qty_billed_milli INTEGER NOT NULL DEFAULT 0,
    sequence INTEGER NOT NULL DEFAULT 10,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_lines_order ON purchase_order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_lines_product ON purchase_order_lines(product_id);

-- 3. Seed Permissions for Purchases
INSERT OR IGNORE INTO permissions (key, description, module_key) VALUES
    ('purchases.view', 'عرض أوامر الشراء وطلبات عروض الأسعار', 'purchases'),
    ('purchases.create', 'إنشاء طلبات الشراء وعروض الموردين', 'purchases'),
    ('purchases.edit', 'تعديل أوامر الشراء', 'purchases'),
    ('purchases.confirm', 'اعتماد وتأكيد أمر الشراء وتوليد إذن الاستلام', 'purchases'),
    ('purchases.cancel', 'إلغاء أمر الشراء', 'purchases');

-- Assign permissions to Admin role (id: 1) and Manager role (id: 2)
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE module_key = 'purchases';

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE module_key = 'purchases';

-- Activate purchases module in modules table
UPDATE modules SET is_active = 1 WHERE key = 'purchases';

-- 4. Seed Initial Purchase Order / RFQ
-- Line 1: 5x Dell Latitude 5530 @ 28,000 EGP (2,800,000 cents) = 140,000 EGP (14,000,000 cents)
-- Tax (14% VAT): 19,600 EGP (1,960,000 cents)
-- Total: 159,600 EGP (15,960,000 cents)
INSERT OR IGNORE INTO purchase_orders (
    id, company_id, name, partner_id, date_order, date_planned,
    state, currency, amount_untaxed_cents, amount_tax_cents, amount_total_cents,
    receipt_status, invoice_status, origin, note
) VALUES (
    1, 1, 'PO/2026/00001', 3, CURRENT_TIMESTAMP, '2026-09-15',
    'draft', 'EGP', 14000000, 1960000, 15960000,
    'no', 'no', 'PR/2026/001', 'طلب شراء أجهزة حاسوب من المورد مؤسسة الأمل'
);

INSERT OR IGNORE INTO purchase_order_lines (
    id, order_id, product_id, name,
    product_uom_qty_milli, product_uom_id, price_unit_cents,
    discount_percent_milli, tax_rate_milli, price_subtotal_cents, price_total_cents,
    qty_received_milli, qty_billed_milli, sequence
) VALUES (
    1, 1, 1, 'لابتوب ديل للأعمال Dell Latitude 5530 - Core i7 16GB',
    5000, 1, 2800000,
    0, 14000, 14000000, 15960000,
    0, 0, 10
);
