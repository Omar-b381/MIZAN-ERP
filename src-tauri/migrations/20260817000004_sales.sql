-- ============================================================================
-- Mizan ERP - Phase 3: Sales Engine Schema & Seed Data
-- ============================================================================

-- Activate Sales module
UPDATE modules SET is_active = 1 WHERE key = 'sales';

-- ----------------------------------------------------------------------------
-- 1. Sales Orders Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    partner_id INTEGER NOT NULL REFERENCES partners(id),
    date_order DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    validity_date DATE,
    state TEXT NOT NULL DEFAULT 'draft' CHECK(state IN ('draft', 'sent', 'sale', 'done', 'cancelled')),
    currency TEXT NOT NULL DEFAULT 'EGP',
    amount_untaxed_cents INTEGER NOT NULL DEFAULT 0,
    amount_tax_cents INTEGER NOT NULL DEFAULT 0,
    amount_total_cents INTEGER NOT NULL DEFAULT 0,
    delivery_status TEXT NOT NULL DEFAULT 'no' CHECK(delivery_status IN ('no', 'to_deliver', 'delivered', 'cancelled')),
    invoice_status TEXT NOT NULL DEFAULT 'no' CHECK(invoice_status IN ('no', 'to_invoice', 'invoiced', 'cancelled')),
    picking_id INTEGER REFERENCES stock_pickings(id),
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_sale_orders_company ON sale_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_sale_orders_partner ON sale_orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_sale_orders_state ON sale_orders(state);

-- ----------------------------------------------------------------------------
-- 2. Sales Order Lines Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_order_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES sale_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    name TEXT NOT NULL,
    product_uom_qty_milli INTEGER NOT NULL DEFAULT 1000,
    product_uom_id INTEGER NOT NULL REFERENCES uoms(id),
    price_unit_cents INTEGER NOT NULL DEFAULT 0,
    discount_percent_milli INTEGER NOT NULL DEFAULT 0,
    tax_rate_milli INTEGER NOT NULL DEFAULT 14000,
    price_subtotal_cents INTEGER NOT NULL DEFAULT 0,
    price_total_cents INTEGER NOT NULL DEFAULT 0,
    qty_delivered_milli INTEGER NOT NULL DEFAULT 0,
    qty_invoiced_milli INTEGER NOT NULL DEFAULT 0,
    sequence INTEGER NOT NULL DEFAULT 10,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sale_order_lines_order ON sale_order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_sale_order_lines_product ON sale_order_lines(product_id);

-- ----------------------------------------------------------------------------
-- 3. Initial Seed Sales Quotation
-- ----------------------------------------------------------------------------
-- Quotation for Customer "شركة الأهرام للتجارة" (partner_id: 2)
-- Items: 2x Dell Latitude Laptop (PROD-DELL-5530) @ 35,000 EGP each with 14% VAT
INSERT OR IGNORE INTO sale_orders (
    id, company_id, name, partner_id, date_order, validity_date, state,
    currency, amount_untaxed_cents, amount_tax_cents, amount_total_cents,
    delivery_status, invoice_status, note
) VALUES (
    1, 1, 'SO/2026/00001', 2, CURRENT_TIMESTAMP, '2026-09-30', 'draft',
    'EGP', 7000000, 980000, 7980000,
    'no', 'no', 'عرض أسعار لتوريد أجهزة حاسوب مكتبية مع ضمان محلي معتمد'
);

INSERT OR IGNORE INTO sale_order_lines (
    id, order_id, product_id, name, product_uom_qty_milli, product_uom_id,
    price_unit_cents, discount_percent_milli, tax_rate_milli,
    price_subtotal_cents, price_total_cents, qty_delivered_milli, qty_invoiced_milli, sequence
) VALUES (
    1, 1, 1, 'لابتوب ديل للأعمال Dell Latitude 5530 - Core i7 16GB', 2000, 1,
    3500000, 0, 14000,
    7000000, 7980000, 0, 0, 10
);
