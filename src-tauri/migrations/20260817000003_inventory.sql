-- Migration: Products & Inventory Architecture (Catalog, Locations, Stock Moves, Quantities, Adjustments)

-- 1. UOM Categories & UOMs
CREATE TABLE IF NOT EXISTS uom_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE TABLE IF NOT EXISTS uoms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES uom_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    uom_type TEXT NOT NULL DEFAULT 'reference' CHECK (uom_type IN ('reference', 'bigger', 'smaller')),
    ratio REAL NOT NULL DEFAULT 1.0,
    rounding REAL NOT NULL DEFAULT 0.001,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 2. Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    complete_name TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 3. Products
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'storable' CHECK (type IN ('storable', 'consumable', 'service')),
    category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    uom_id INTEGER NOT NULL REFERENCES uoms(id),
    purchase_uom_id INTEGER NOT NULL REFERENCES uoms(id),
    sale_price_cents INTEGER NOT NULL DEFAULT 0,
    cost_price_cents INTEGER NOT NULL DEFAULT 0,
    tracking_mode TEXT NOT NULL DEFAULT 'none' CHECK (tracking_mode IN ('none', 'lot', 'serial')),
    min_stock_milli INTEGER NOT NULL DEFAULT 0,
    max_stock_milli INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 4. Stock Locations (Double-Entry Tree)
CREATE TABLE IF NOT EXISTS stock_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES stock_locations(id) ON DELETE CASCADE,
    complete_name TEXT NOT NULL,
    location_type TEXT NOT NULL DEFAULT 'internal' CHECK (location_type IN ('view', 'internal', 'customer', 'supplier', 'inventory_loss', 'production')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 5. Stock Warehouses
CREATE TABLE IF NOT EXISTS stock_warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    view_location_id INTEGER NOT NULL REFERENCES stock_locations(id),
    lot_stock_location_id INTEGER NOT NULL REFERENCES stock_locations(id),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 6. Stock Picking Types (Operation Types)
CREATE TABLE IF NOT EXISTS stock_picking_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id INTEGER REFERENCES stock_warehouses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL CHECK (code IN ('incoming', 'outgoing', 'internal', 'adjustment')),
    sequence_prefix TEXT NOT NULL,
    next_number INTEGER NOT NULL DEFAULT 1,
    default_src_location_id INTEGER REFERENCES stock_locations(id),
    default_dest_location_id INTEGER REFERENCES stock_locations(id),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 7. Stock Pickings (Transfer Headers)
CREATE TABLE IF NOT EXISTS stock_pickings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    picking_type_id INTEGER NOT NULL REFERENCES stock_picking_types(id),
    partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
    src_location_id INTEGER NOT NULL REFERENCES stock_locations(id),
    dest_location_id INTEGER NOT NULL REFERENCES stock_locations(id),
    scheduled_date TEXT,
    date_done TEXT,
    origin TEXT,
    state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'waiting', 'confirmed', 'done', 'cancelled')),
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 8. Stock Moves (Append-Only Movement Ledger)
CREATE TABLE IF NOT EXISTS stock_moves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    picking_id INTEGER REFERENCES stock_pickings(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    name TEXT NOT NULL,
    src_location_id INTEGER NOT NULL REFERENCES stock_locations(id),
    dest_location_id INTEGER NOT NULL REFERENCES stock_locations(id),
    quantity_milli INTEGER NOT NULL CHECK (quantity_milli > 0),
    uom_id INTEGER NOT NULL REFERENCES uoms(id),
    state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'confirmed', 'done', 'cancelled')),
    reference TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 9. Stock Move Lines (Detailed Operations with Lot/Serial Tracking)
CREATE TABLE IF NOT EXISTS stock_move_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    move_id INTEGER NOT NULL REFERENCES stock_moves(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    src_location_id INTEGER NOT NULL REFERENCES stock_locations(id),
    dest_location_id INTEGER NOT NULL REFERENCES stock_locations(id),
    lot_serial_number TEXT,
    quantity_milli INTEGER NOT NULL CHECK (quantity_milli > 0),
    state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'confirmed', 'done', 'cancelled')),
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 10. Materialized Stock Quantities Grain Cache
CREATE TABLE IF NOT EXISTS stock_quantities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    location_id INTEGER NOT NULL REFERENCES stock_locations(id) ON DELETE CASCADE,
    lot_serial_number TEXT NOT NULL DEFAULT '',
    quantity_milli INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    UNIQUE (company_id, product_id, location_id, lot_serial_number)
);

-- 11. Stock Inventory Adjustments
CREATE TABLE IF NOT EXISTS stock_inventory_adjustments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location_id INTEGER NOT NULL REFERENCES stock_locations(id),
    state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'in_progress', 'done', 'cancelled')),
    accounting_date TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE TABLE IF NOT EXISTS stock_inventory_adjustment_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    adjustment_id INTEGER NOT NULL REFERENCES stock_inventory_adjustments(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    lot_serial_number TEXT NOT NULL DEFAULT '',
    theoretical_qty_milli INTEGER NOT NULL DEFAULT 0,
    counted_qty_milli INTEGER NOT NULL DEFAULT 0,
    difference_qty_milli INTEGER NOT NULL DEFAULT 0
);

-- ====================================================
-- SEED DATA: Phase 2 Foundation
-- ====================================================

-- 1. UOM Categories
INSERT OR IGNORE INTO uom_categories (id, name) VALUES
    (1, 'الوحدة / Unit'),
    (2, 'الوزن / Weight'),
    (3, 'الحجم / Volume'),
    (4, 'الطول / Length');

-- 2. Standard UOMs
INSERT OR IGNORE INTO uoms (id, category_id, name, uom_type, ratio, rounding) VALUES
    (1, 1, 'قطعة / Unit', 'reference', 1.0, 1.0),
    (2, 1, 'كرتونة (12 قطعة) / Box of 12', 'bigger', 12.0, 1.0),
    (3, 1, 'كرتونة (24 قطعة) / Box of 24', 'bigger', 24.0, 1.0),
    (4, 2, 'كيلوجرام / kg', 'reference', 1.0, 0.001),
    (5, 2, 'جرام / g', 'smaller', 0.001, 1.0),
    (6, 2, 'طن / Ton', 'bigger', 1000.0, 0.001),
    (7, 3, 'لتر / Liter', 'reference', 1.0, 0.001),
    (8, 4, 'متر / Meter', 'reference', 1.0, 0.01);

-- 3. Default Product Categories
INSERT OR IGNORE INTO product_categories (id, company_id, name, parent_id, complete_name) VALUES
    (1, 1, 'الكل / All', NULL, 'الكل'),
    (2, 1, 'منتجات تامة الصنع', 1, 'الكل / منتجات تامة الصنع'),
    (3, 1, 'مواد خام ومستلزمات', 1, 'الكل / مواد خام ومستلزمات'),
    (4, 1, 'خدمات واستشارات', 1, 'الكل / خدمات واستشارات');

-- 4. Default Hierarchical Stock Locations for Company 1
-- Root Virtual View Locations
INSERT OR IGNORE INTO stock_locations (id, company_id, name, parent_id, complete_name, location_type) VALUES
    (1, 1, 'المواقع الافتراضية / Physical Locations', NULL, 'المواقع الافتراضية', 'view'),
    (2, 1, 'مواقع الشركاء / Partner Locations', NULL, 'مواقع الشركاء', 'view'),
    (3, 1, 'المواقع الافتراضية للتسوية / Virtual Locations', NULL, 'المواقع الافتراضية للتسوية', 'view');

-- Physical Internal Locations
INSERT OR IGNORE INTO stock_locations (id, company_id, name, parent_id, complete_name, location_type) VALUES
    (4, 1, 'المستودع الرئيسي (WH)', 1, 'المواقع الافتراضية / المستودع الرئيسي (WH)', 'view'),
    (5, 1, 'المخزن الرئيسي / Stock', 4, 'المواقع الافتراضية / المستودع الرئيسي (WH) / المخزن الرئيسي (Stock)', 'internal'),
    (6, 1, 'منطقة الاستلام والتفتيش / Input', 4, 'المواقع الافتراضية / المستودع الرئيسي (WH) / منطقة الاستلام (Input)', 'internal'),
    (7, 1, 'منطقة الشحن والتعبئة / Output', 4, 'المواقع الافتراضية / المستودع الرئيسي (WH) / منطقة الشحن (Output)', 'internal');

-- Virtual Partner & System Balancing Locations
INSERT OR IGNORE INTO stock_locations (id, company_id, name, parent_id, complete_name, location_type) VALUES
    (8, 1, 'الموردون / Vendors', 2, 'مواقع الشركاء / الموردون', 'supplier'),
    (9, 1, 'العملاء / Customers', 2, 'مواقع الشركاء / العملاء', 'customer'),
    (10, 1, 'فروقات وتلفيات الجرد / Inventory Loss', 3, 'المواقع الافتراضية للتسوية / فروقات وتلفيات الجرد', 'inventory_loss'),
    (11, 1, 'خطوط الإنتاج / Production', 3, 'المواقع الافتراضية للتسوية / خطوط الإنتاج', 'production');

-- 5. Default Warehouse for Company 1
INSERT OR IGNORE INTO stock_warehouses (id, company_id, name, code, view_location_id, lot_stock_location_id) VALUES
    (1, 1, 'المستودع الرئيسي - القاهرة', 'WH', 4, 5);

-- 6. Default Operation Types for Warehouse 1
INSERT OR IGNORE INTO stock_picking_types (id, company_id, warehouse_id, name, code, sequence_prefix, next_number, default_src_location_id, default_dest_location_id) VALUES
    (1, 1, 1, 'إيصالات الاستلام / Receipts', 'incoming', 'WH/IN/', 1, 8, 5),
    (2, 1, 1, 'أوامر التوصيل / Delivery Orders', 'outgoing', 'WH/OUT/', 1, 5, 9),
    (3, 1, 1, 'التحويلات الداخلية / Internal Transfers', 'internal', 'WH/INT/', 1, 5, 6),
    (4, 1, 1, 'تسويات الجرد / Inventory Adjustments', 'adjustment', 'WH/ADJ/', 1, 10, 5);

-- 7. Seed Initial Product Catalog
INSERT OR IGNORE INTO products (id, company_id, name, sku, barcode, description, type, category_id, uom_id, purchase_uom_id, sale_price_cents, cost_price_cents, tracking_mode, min_stock_milli, max_stock_milli) VALUES
    (1, 1, 'لابتوب ديل للأعمال Dell Latitude 5530', 'PROD-DELL-5530', '622123456001', 'Core i7, 16GB RAM, 512GB SSD', 'storable', 2, 1, 1, 3500000, 2800000, 'serial', 5000, 50000),
    (2, 1, 'شاشة سامسونج 27 بوصة IPS 75Hz', 'PROD-SAM-27', '622123456002', 'Samsung Full HD IPS Monitor', 'storable', 2, 1, 1, 620000, 480000, 'lot', 10000, 100000),
    (3, 1, 'كابل شبكة Cat6 ممتاز (بكرة 305 متر)', 'PROD-CAT6-305', '622123456003', 'High quality copper network cable', 'storable', 3, 1, 1, 310000, 240000, 'none', 2000, 20000),
    (4, 1, 'خدمة دعم فني وصيانة سنوية', 'SERV-SUP-ANNUAL', NULL, 'Annual maintenance agreement per seat', 'service', 4, 1, 1, 1200000, 0, 'none', 0, 0);

-- Activate Products & Inventory Modules
UPDATE modules SET is_active = 1, activated_at = DATETIME('now') WHERE key IN ('products', 'inventory');
