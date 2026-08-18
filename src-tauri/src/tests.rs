use crate::{
    accounting, activity, auth, backup, companies, dashboard, db, diagnostics, export, hr, inventory, licensing, modules, partners, products, purchases, rbac, reports, sales, settings,
};
use sqlx::SqlitePool;

async fn setup_test_db() -> SqlitePool {
    let pool = db::init_db("sqlite::memory:")
        .await
        .expect("Failed to initialize in-memory test database");
    pool
}

#[tokio::test]
async fn test_db_initialization_and_migrations() {
    let pool = setup_test_db().await;

    // Check modules loaded
    let mods = modules::get_all_modules(&pool).await.unwrap();
    assert!(mods.len() >= 12);
    let core_mod = mods.iter().find(|m| m.key == "core").unwrap();
    assert!(core_mod.is_active);

    // Check companies
    let comps = companies::list_companies(&pool).await.unwrap();
    assert!(!comps.is_empty());
    assert_eq!(comps[0].currency, "EGP");
}

#[tokio::test]
async fn test_module_activation_and_deactivation() {
    let pool = setup_test_db().await;

    // Try deactivating core (should fail)
    let res = modules::set_module_status(&pool, "core", false).await;
    assert!(res.is_err());

    // Activate sales
    let res = modules::set_module_status(&pool, "sales", true).await.unwrap();
    assert!(res.is_active);

    let mods = modules::get_all_modules(&pool).await.unwrap();
    let sales = mods.iter().find(|m| m.key == "sales").unwrap();
    assert!(sales.is_active);
}

#[tokio::test]
async fn test_companies_and_branch_hierarchy() {
    let pool = setup_test_db().await;

    // Create a branch under default company 1
    let branch = companies::create_company(
        &pool,
        companies::CreateCompanyInput {
            name: "فرع الإسكندرية".to_string(),
            parent_id: Some(1),
            currency: Some("EGP".to_string()),
            timezone: Some("Africa/Cairo".to_string()),
            tax_id: Some("123-456-789".to_string()),
            commercial_registry: Some("98765".to_string()),
            phone: Some("034567890".to_string()),
            email: Some("alex@mizan.local".to_string()),
            website: None,
            street: Some("طريق الجيش".to_string()),
            city: Some("الإسكندرية".to_string()),
            state: Some("الإسكندرية".to_string()),
            zip: None,
            country: Some("EG".to_string()),
        },
    )
    .await
    .unwrap();

    assert_eq!(branch.parent_id, Some(1));
    assert_eq!(branch.city.as_deref(), Some("الإسكندرية"));

    let list = companies::list_companies(&pool).await.unwrap();
    assert!(list.iter().any(|c| c.name == "فرع الإسكندرية"));
}

#[tokio::test]
async fn test_auth_and_user_creation() {
    let pool = setup_test_db().await;

    // Test default admin login
    let session = auth::login(
        &pool,
        auth::LoginInput {
            username: "admin".to_string(),
            password: "admin".to_string(),
        },
    )
    .await
    .unwrap();

    assert!(session.is_some());
    let user = session.unwrap();
    assert_eq!(user.username, "admin");
    assert!(user.roles.iter().any(|r| r.name == "Admin"));

    // Create a new accountant user
    let new_user = auth::create_user(
        &pool,
        auth::CreateUserInput {
            company_id: 1,
            username: "accountant1".to_string(),
            email: Some("acc@mizan.local".to_string()),
            password: "SecurePass123!".to_string(),
            full_name: "أحمد المحاسب".to_string(),
            role_ids: vec![3], // Staff
        },
    )
    .await
    .unwrap();

    assert_eq!(new_user.username, "accountant1");

    // Login with new user
    let acc_session = auth::login(
        &pool,
        auth::LoginInput {
            username: "accountant1".to_string(),
            password: "SecurePass123!".to_string(),
        },
    )
    .await
    .unwrap();

    assert!(acc_session.is_some());
}

#[tokio::test]
async fn test_rbac_roles_and_permissions() {
    let pool = setup_test_db().await;

    let roles = rbac::list_roles(&pool).await.unwrap();
    assert!(roles.len() >= 3);

    let perms = rbac::list_permissions(&pool).await.unwrap();
    assert!(!perms.is_empty());

    // Admin should have all permissions
    let admin_perms = rbac::get_user_permissions(&pool, 1).await.unwrap();
    assert!(!admin_perms.is_empty());
}

#[tokio::test]
async fn test_partners_unified_crud_and_filters() {
    let pool = setup_test_db().await;

    // Create a customer
    let customer = partners::create_partner(
        &pool,
        partners::CreatePartnerInput {
            company_id: 1,
            parent_id: None,
            name: "شركة الأمل للتجارة والتوزيع".to_string(),
            sub_type: "customer".to_string(),
            is_company: true,
            email: Some("info@alamal.eg".to_string()),
            phone: Some("+201001234567".to_string()),
            mobile: None,
            tax_id: Some("111-222-333".to_string()),
            commercial_registry: Some("12345".to_string()),
            street: Some("شارع الهرم".to_string()),
            city: Some("الجيزة".to_string()),
            state: Some("الجيزة".to_string()),
            country: Some("EG".to_string()),
            credit_limit_cents: Some(5000000), // 50,000.00 EGP
            notes: Some("عميل مميز".to_string()),
        },
    )
    .await
    .unwrap();

    assert_eq!(customer.name, "شركة الأمل للتجارة والتوزيع");
    assert_eq!(customer.credit_limit_cents, 5000000);

    // List with filter
    let customers = partners::list_partners(
        &pool,
        partners::PartnerFilter {
            company_id: Some(1),
            sub_type: Some("customer".to_string()),
            is_active: Some(true),
            search: Some("الأمل".to_string()),
        },
    )
    .await
    .unwrap();

    assert_eq!(customers.len(), 1);
    assert_eq!(customers[0].id, customer.id);
}

#[tokio::test]
async fn test_settings_and_activity_logs() {
    let pool = setup_test_db().await;

    // Update VAT setting
    settings::set_setting(
        &pool,
        settings::UpdateSettingInput {
            key: "vat_rate".to_string(),
            company_id: 1,
            value: "14".to_string(),
        },
    )
    .await
    .unwrap();

    let all_settings = settings::get_company_settings(&pool, 1).await.unwrap();
    assert_eq!(all_settings.get("vat_rate").map(|s| s.as_str()), Some("14"));

    // Activity log
    let log_id = activity::log_activity(
        &pool,
        activity::LogActivityInput {
            company_id: 1,
            entity_type: "partner".to_string(),
            entity_id: 1,
            user_id: Some(1),
            action: "created".to_string(),
            summary: "Contact created in test".to_string(),
            details_json: None,
        },
    )
    .await
    .unwrap();

    assert!(log_id > 0);

    let recent = activity::get_recent_activities(&pool, 1, 10).await.unwrap();
    assert!(!recent.is_empty());
}

// ====================================================
// Phase 2: Products & Inventory Integration Tests
// ====================================================

#[tokio::test]
async fn test_product_catalog_and_uom_conversions() {
    let pool = setup_test_db().await;

    // 1. Verify UOMs seeded
    let uoms = products::list_uoms(&pool).await.unwrap();
    assert!(uoms.len() >= 8);
    let kg = uoms.iter().find(|u| u.name.contains("kg")).unwrap();
    assert_eq!(kg.ratio, 1.0);

    // 2. Create product category tree
    let parent_cat = products::create_product_category(&pool, 1, "إلكترونيات".to_string(), None).await.unwrap();
    let child_cat = products::create_product_category(&pool, 1, "هواتف ذكية".to_string(), Some(parent_cat.id)).await.unwrap();
    assert_eq!(child_cat.complete_name.as_deref(), Some("إلكترونيات / هواتف ذكية"));

    // 3. Create a product with minor integer cents
    let prod = products::create_product(
        &pool,
        products::CreateProductInput {
            company_id: 1,
            name: "هاتف شاومي ريدمي نوت 13".to_string(),
            sku: "PH-XIAOMI-RN13".to_string(),
            barcode: Some("6901234567890".to_string()),
            description: Some("8GB RAM, 256GB Storage".to_string()),
            r#type: Some("storable".to_string()),
            category_id: Some(child_cat.id),
            uom_id: 1, // Unit
            purchase_uom_id: Some(1),
            sale_price_cents: Some(950000), // 9,500.00 EGP
            cost_price_cents: Some(780000), // 7,800.00 EGP
            tracking_mode: Some("serial".to_string()),
            min_stock_milli: Some(5000),
            max_stock_milli: Some(50000),
        },
    )
    .await
    .unwrap();

    assert_eq!(prod.sku, "PH-XIAOMI-RN13");
    assert_eq!(prod.sale_price_cents, 950000);
    assert_eq!(prod.tracking_mode, "serial");

    // 4. List and filter products
    let list = products::list_products(
        &pool,
        products::ProductFilter {
            company_id: Some(1),
            category_id: Some(child_cat.id),
            r#type: None,
            tracking_mode: None,
            is_active: Some(true),
            search: Some("شاومي".to_string()),
        },
    )
    .await
    .unwrap();

    assert_eq!(list.len(), 1);
    assert_eq!(list[0].product.sku, "PH-XIAOMI-RN13");
}

#[tokio::test]
async fn test_location_hierarchy_and_warehouses() {
    let pool = setup_test_db().await;

    // Check default locations
    let locs = inventory::list_locations(&pool, 1).await.unwrap();
    assert!(locs.len() >= 11);

    // Create a new sub-location (Shelf A-1) inside Main Stock (id 5)
    let shelf = inventory::create_location(
        &pool,
        inventory::CreateLocationInput {
            company_id: 1,
            name: "رف أ-1 / Shelf A-1".to_string(),
            parent_id: Some(5),
            location_type: "internal".to_string(),
        },
    )
    .await
    .unwrap();

    assert!(shelf.complete_name.contains("المخزن الرئيسي (Stock) / رف أ-1"));
    assert_eq!(shelf.location_type, "internal");

    // Check warehouses
    let whs = inventory::list_warehouses(&pool, 1).await.unwrap();
    assert_eq!(whs.len(), 1);
    assert_eq!(whs[0].code, "WH");
}

#[tokio::test]
async fn test_stock_receipt_incoming_move() {
    let pool = setup_test_db().await;

    // Create an incoming receipt: 10 laptops from Vendor (id 8) into Stock (id 5)
    let picking = inventory::create_picking(
        &pool,
        inventory::CreatePickingInput {
            company_id: 1,
            picking_type_id: 1, // Receipts (Vendor -> Stock)
            partner_id: Some(1),
            src_location_id: Some(8),
            dest_location_id: Some(5),
            scheduled_date: Some("2026-08-18".to_string()),
            origin: Some("PO-2026-001".to_string()),
            note: Some("Receipt of Dell laptops".to_string()),
            moves: vec![inventory::CreatePickingMoveInput {
                product_id: 1,             // Dell Latitude
                quantity_milli: 10000,     // 10 units
                uom_id: 1,
                lot_serial_number: None,
            }],
        },
    )
    .await
    .unwrap();

    assert_eq!(picking.state, "draft");
    assert!(picking.name.starts_with("WH/IN/"));

    // Confirm and validate picking
    let done_picking = inventory::confirm_and_validate_picking(&pool, picking.id).await.unwrap();
    assert_eq!(done_picking.state, "done");

    // Verify stock_quantities on-hand in Stock (id 5) is now 10 units (10000 milli)
    let stock = inventory::list_stock_quantities(&pool, 1, Some(5), Some(1)).await.unwrap();
    assert_eq!(stock.len(), 1);
    assert_eq!(stock[0].quantity_milli, 10000);
}

#[tokio::test]
async fn test_stock_delivery_outgoing_move() {
    let pool = setup_test_db().await;

    // 1. Initial receipt: 20 units into Stock (id 5)
    let rec = inventory::create_picking(
        &pool,
        inventory::CreatePickingInput {
            company_id: 1,
            picking_type_id: 1,
            partner_id: Some(1),
            src_location_id: Some(8),
            dest_location_id: Some(5),
            scheduled_date: None,
            origin: None,
            note: None,
            moves: vec![inventory::CreatePickingMoveInput {
                product_id: 2,         // Samsung 27 Monitor
                quantity_milli: 20000, // 20 units
                uom_id: 1,
                lot_serial_number: None,
            }],
        },
    )
    .await
    .unwrap();
    inventory::confirm_and_validate_picking(&pool, rec.id).await.unwrap();

    // 2. Outgoing delivery: 5 units from Stock (id 5) to Customer (id 9)
    let del = inventory::create_picking(
        &pool,
        inventory::CreatePickingInput {
            company_id: 1,
            picking_type_id: 2, // Delivery Orders
            partner_id: Some(1),
            src_location_id: Some(5),
            dest_location_id: Some(9),
            scheduled_date: None,
            origin: Some("SO-2026-001".to_string()),
            note: None,
            moves: vec![inventory::CreatePickingMoveInput {
                product_id: 2,
                quantity_milli: 5000, // 5 units
                uom_id: 1,
                lot_serial_number: None,
            }],
        },
    )
    .await
    .unwrap();
    assert!(del.name.starts_with("WH/OUT/"));

    inventory::confirm_and_validate_picking(&pool, del.id).await.unwrap();

    // 3. Verify on-hand in Stock is now 15 units (15000 milli)
    let stock = inventory::list_stock_quantities(&pool, 1, Some(5), Some(2)).await.unwrap();
    assert_eq!(stock.len(), 1);
    assert_eq!(stock[0].quantity_milli, 15000);
}

#[tokio::test]
async fn test_internal_stock_transfer() {
    let pool = setup_test_db().await;

    // 1. Initial receipt: 10 units in Stock (id 5)
    let rec = inventory::create_picking(
        &pool,
        inventory::CreatePickingInput {
            company_id: 1,
            picking_type_id: 1,
            partner_id: None,
            src_location_id: Some(8),
            dest_location_id: Some(5),
            scheduled_date: None,
            origin: None,
            note: None,
            moves: vec![inventory::CreatePickingMoveInput {
                product_id: 3,         // Cat6 Cable
                quantity_milli: 10000,
                uom_id: 1,
                lot_serial_number: None,
            }],
        },
    )
    .await
    .unwrap();
    inventory::confirm_and_validate_picking(&pool, rec.id).await.unwrap();

    // 2. Internal Transfer: 4 units from Stock (id 5) to Input (id 6)
    let transfer = inventory::create_picking(
        &pool,
        inventory::CreatePickingInput {
            company_id: 1,
            picking_type_id: 3, // Internal
            partner_id: None,
            src_location_id: Some(5),
            dest_location_id: Some(6),
            scheduled_date: None,
            origin: None,
            note: None,
            moves: vec![inventory::CreatePickingMoveInput {
                product_id: 3,
                quantity_milli: 4000,
                uom_id: 1,
                lot_serial_number: None,
            }],
        },
    )
    .await
    .unwrap();
    inventory::confirm_and_validate_picking(&pool, transfer.id).await.unwrap();

    // Verify Stock (id 5) has 6 units, Input (id 6) has 4 units
    let stock5 = inventory::list_stock_quantities(&pool, 1, Some(5), Some(3)).await.unwrap();
    let stock6 = inventory::list_stock_quantities(&pool, 1, Some(6), Some(3)).await.unwrap();

    assert_eq!(stock5[0].quantity_milli, 6000);
    assert_eq!(stock6[0].quantity_milli, 4000);
}

#[tokio::test]
async fn test_lot_serial_tracking() {
    let pool = setup_test_db().await;

    // Receipt with specific serial number
    let rec = inventory::create_picking(
        &pool,
        inventory::CreatePickingInput {
            company_id: 1,
            picking_type_id: 1,
            partner_id: None,
            src_location_id: Some(8),
            dest_location_id: Some(5),
            scheduled_date: None,
            origin: None,
            note: None,
            moves: vec![inventory::CreatePickingMoveInput {
                product_id: 1,        // Dell Laptop (serial tracked)
                quantity_milli: 1000, // 1 unit
                uom_id: 1,
                lot_serial_number: Some("SN-DELL-2026-0099".to_string()),
            }],
        },
    )
    .await
    .unwrap();

    inventory::confirm_and_validate_picking(&pool, rec.id).await.unwrap();

    let stock = inventory::list_stock_quantities(&pool, 1, Some(5), Some(1)).await.unwrap();
    let serial_item = stock.iter().find(|s| s.lot_serial_number == "SN-DELL-2026-0099");
    assert!(serial_item.is_some());
    assert_eq!(serial_item.unwrap().quantity_milli, 1000);
}

#[tokio::test]
async fn test_inventory_adjustment_reconciliation() {
    let pool = setup_test_db().await;

    // 1. Initial receipt of 10 monitors into Stock (id 5)
    let rec = inventory::create_picking(
        &pool,
        inventory::CreatePickingInput {
            company_id: 1,
            picking_type_id: 1,
            partner_id: None,
            src_location_id: Some(8),
            dest_location_id: Some(5),
            scheduled_date: None,
            origin: None,
            note: None,
            moves: vec![inventory::CreatePickingMoveInput {
                product_id: 2,
                quantity_milli: 10000, // 10 units theoretical
                uom_id: 1,
                lot_serial_number: None,
            }],
        },
    )
    .await
    .unwrap();
    inventory::confirm_and_validate_picking(&pool, rec.id).await.unwrap();

    // 2. Start physical inventory adjustment session for Stock (id 5)
    let adj = inventory::create_inventory_adjustment(
        &pool,
        inventory::CreateInventoryAdjustmentInput {
            company_id: 1,
            name: "جرد نهاية الربع الأول 2026".to_string(),
            location_id: 5,
        },
    )
    .await
    .unwrap();

    let lines = inventory::get_adjustment_lines(&pool, adj.id).await.unwrap();
    let monitor_line = lines.iter().find(|l| l.product_id == 2).unwrap();
    assert_eq!(monitor_line.theoretical_qty_milli, 10000);

    // 3. User counts 8 units (2 units missing / damaged)
    inventory::update_adjustment_line_count(
        &pool,
        inventory::UpdateAdjustmentLineCountInput {
            line_id: monitor_line.id,
            counted_qty_milli: 8000,
        },
    )
    .await
    .unwrap();

    // 4. Validate adjustment
    let done_adj = inventory::validate_inventory_adjustment(&pool, adj.id).await.unwrap();
    assert_eq!(done_adj.state, "done");

    // 5. Verify on-hand stock is now reconciled to exactly 8 units (8000 milli)
    let stock = inventory::list_stock_quantities(&pool, 1, Some(5), Some(2)).await.unwrap();
    assert_eq!(stock[0].quantity_milli, 8000);
}

#[tokio::test]
async fn test_quotation_creation_and_financial_calculations() {
    let pool = setup_test_db().await;

    // Line 1: 2x Laptop @ 35,000 EGP (3,500,000 cents) with 10% discount (10,000 milli) and 14% VAT (14,000 milli)
    // Base: 70,000 EGP = 7,000,000 cents. Discount: 7,000 EGP = 700,000 cents. Subtotal: 63,000 EGP = 6,300,000 cents.
    // Tax: 63,000 * 14% = 8,820 EGP = 882,000 cents. Total: 71,820 EGP = 7,182,000 cents.
    // Line 2: 1x Monitor @ 6,000 EGP (600,000 cents) with 0% discount and 14% VAT
    // Base & Subtotal: 6,000 EGP = 600,000 cents. Tax: 6,000 * 14% = 840 EGP = 84,000 cents. Total: 6,840 EGP = 684,000 cents.
    // Grand totals:
    // Untaxed: 6,300,000 + 600,000 = 6,900,000 cents (69,000 EGP)
    // Tax: 882,000 + 84,000 = 966,000 cents (9,660 EGP)
    // Total: 7,182,000 + 684,000 = 7,866,000 cents (78,660 EGP)
    let quote = sales::create_sale_order(
        &pool,
        sales::CreateSaleOrderInput {
            company_id: 1,
            partner_id: 2,
            validity_date: Some("2026-10-31".to_string()),
            currency: Some("EGP".to_string()),
            note: Some("عرض أسعار للأجهزة المكتبية".to_string()),
            lines: vec![
                sales::CreateSaleOrderLineInput {
                    product_id: 1,
                    name: Some("Dell Latitude 5530".to_string()),
                    product_uom_qty_milli: 2000,
                    product_uom_id: 1,
                    price_unit_cents: 3500000,
                    discount_percent_milli: Some(10000), // 10%
                    tax_rate_milli: Some(14000),          // 14%
                },
                sales::CreateSaleOrderLineInput {
                    product_id: 2,
                    name: Some("Samsung 27 inch IPS".to_string()),
                    product_uom_qty_milli: 1000,
                    product_uom_id: 1,
                    price_unit_cents: 600000,
                    discount_percent_milli: Some(0),
                    tax_rate_milli: Some(14000), // 14%
                },
            ],
        },
    )
    .await
    .unwrap();

    assert_eq!(quote.order.state, "draft");
    assert_eq!(quote.order.amount_untaxed_cents, 6900000);
    assert_eq!(quote.order.amount_tax_cents, 966000);
    assert_eq!(quote.order.amount_total_cents, 7866000);
    assert_eq!(quote.lines.len(), 2);
    assert_eq!(quote.lines[0].price_subtotal_cents, 6300000);
    assert_eq!(quote.lines[0].price_total_cents, 7182000);
    assert_eq!(quote.lines[1].price_subtotal_cents, 600000);
    assert_eq!(quote.lines[1].price_total_cents, 684000);
}

#[tokio::test]
async fn test_sales_order_confirmation_and_delivery_trigger() {
    let pool = setup_test_db().await;

    // 1. Create a quotation
    let quote = sales::create_sale_order(
        &pool,
        sales::CreateSaleOrderInput {
            company_id: 1,
            partner_id: 2,
            validity_date: Some("2026-12-31".to_string()),
            currency: Some("EGP".to_string()),
            note: Some("أمر بيع معتمد مع توصيل فوري".to_string()),
            lines: vec![sales::CreateSaleOrderLineInput {
                product_id: 1,
                name: Some("Dell Latitude 5530".to_string()),
                product_uom_qty_milli: 3000,
                product_uom_id: 1,
                price_unit_cents: 3500000,
                discount_percent_milli: None,
                tax_rate_milli: None,
            }],
        },
    )
    .await
    .unwrap();

    assert_eq!(quote.order.delivery_status, "no");
    assert!(quote.order.picking_id.is_none());

    // 2. Confirm the sales order
    let confirmed = sales::confirm_sale_order(&pool, quote.order.id).await.unwrap();

    assert_eq!(confirmed.order.state, "sale");
    assert_eq!(confirmed.order.delivery_status, "to_deliver");
    assert_eq!(confirmed.order.invoice_status, "to_invoice");
    assert!(confirmed.order.picking_id.is_some());

    // 3. Verify the generated delivery picking (WH/OUT)
    let picking_id = confirmed.order.picking_id.unwrap();
    let picking = inventory::get_picking_by_id(&pool, picking_id).await.unwrap().unwrap();

    assert_eq!(picking.partner_id, Some(2));
    assert_eq!(picking.origin, Some(confirmed.order.name));
    assert_eq!(picking.state, "confirmed");

    // 4. Verify the stock move lines
    let moves = inventory::get_picking_moves(&pool, picking_id).await.unwrap();
    assert_eq!(moves.len(), 1);
    assert_eq!(moves[0].product_id, 1);
    assert_eq!(moves[0].quantity_milli, 3000);
}

#[tokio::test]
async fn test_sales_order_cancellation_workflow() {
    let pool = setup_test_db().await;

    // 1. Create and confirm an order
    let order = sales::create_sale_order(
        &pool,
        sales::CreateSaleOrderInput {
            company_id: 1,
            partner_id: 2,
            validity_date: None,
            currency: Some("EGP".to_string()),
            note: None,
            lines: vec![sales::CreateSaleOrderLineInput {
                product_id: 2,
                name: Some("Samsung 27 Monitor".to_string()),
                product_uom_qty_milli: 1000,
                product_uom_id: 1,
                price_unit_cents: 600000,
                discount_percent_milli: None,
                tax_rate_milli: None,
            }],
        },
    )
    .await
    .unwrap();

    let confirmed = sales::confirm_sale_order(&pool, order.order.id).await.unwrap();
    let picking_id = confirmed.order.picking_id.unwrap();

    // 2. Cancel the sales order
    let cancelled = sales::cancel_sale_order(&pool, confirmed.order.id).await.unwrap();
    assert_eq!(cancelled.order.state, "cancelled");
    assert_eq!(cancelled.order.delivery_status, "cancelled");

    // 3. Verify the linked picking was also cancelled
    let picking = inventory::get_picking_by_id(&pool, picking_id).await.unwrap().unwrap();
    assert_eq!(picking.state, "cancelled");
}

#[tokio::test]
async fn test_purchase_order_creation_and_financial_calculations() {
    let pool = setup_test_db().await;

    // 10x Monitors @ 4,000 EGP (400,000 cents) with 5% discount (5,000 milli) and 14% VAT (14,000 milli)
    // Base: 40,000 EGP = 4,000,000 cents
    // Disc: 2,000 EGP = 200,000 cents
    // Subtotal: 38,000 EGP = 3,800,000 cents
    // Tax: 38,000 * 14% = 5,320 EGP = 532,000 cents
    // Total: 43,320 EGP = 4,332,000 cents
    let po = purchases::create_purchase_order(
        &pool,
        purchases::CreatePurchaseOrderInput {
            company_id: 1,
            partner_id: 3,
            date_planned: Some("2026-11-15".to_string()),
            currency: Some("EGP".to_string()),
            origin: Some("PR/2026/099".to_string()),
            note: Some("طلب شراء شاشات للمقر الرئيسي".to_string()),
            lines: vec![purchases::CreatePurchaseOrderLineInput {
                product_id: 2,
                name: Some("Samsung 27 Monitor".to_string()),
                product_uom_qty_milli: 10000,
                product_uom_id: 1,
                price_unit_cents: 400000,
                discount_percent_milli: Some(5000), // 5%
                tax_rate_milli: Some(14000),        // 14%
            }],
        },
    )
    .await
    .unwrap();

    assert_eq!(po.order.state, "draft");
    assert_eq!(po.order.amount_untaxed_cents, 3800000);
    assert_eq!(po.order.amount_tax_cents, 532000);
    assert_eq!(po.order.amount_total_cents, 4332000);
    assert_eq!(po.lines.len(), 1);
    assert_eq!(po.lines[0].price_subtotal_cents, 3800000);
    assert_eq!(po.lines[0].price_total_cents, 4332000);
}

#[tokio::test]
async fn test_purchase_order_confirmation_and_receipt_trigger() {
    let pool = setup_test_db().await;

    // 1. Create a PO
    let po = purchases::create_purchase_order(
        &pool,
        purchases::CreatePurchaseOrderInput {
            company_id: 1,
            partner_id: 3,
            date_planned: Some("2026-10-20".to_string()),
            currency: Some("EGP".to_string()),
            origin: Some("RFQ/2026/001".to_string()),
            note: Some("توريد فوري".to_string()),
            lines: vec![purchases::CreatePurchaseOrderLineInput {
                product_id: 1,
                name: Some("Dell Latitude 5530".to_string()),
                product_uom_qty_milli: 4000,
                product_uom_id: 1,
                price_unit_cents: 2800000,
                discount_percent_milli: None,
                tax_rate_milli: None,
            }],
        },
    )
    .await
    .unwrap();

    assert_eq!(po.order.receipt_status, "no");
    assert!(po.order.picking_id.is_none());

    // 2. Confirm the PO
    let confirmed = purchases::confirm_purchase_order(&pool, po.order.id).await.unwrap();

    assert_eq!(confirmed.order.state, "purchase");
    assert_eq!(confirmed.order.receipt_status, "to_receive");
    assert_eq!(confirmed.order.invoice_status, "to_bill");
    assert!(confirmed.order.picking_id.is_some());

    // 3. Verify the generated incoming receipt (WH/IN)
    let picking_id = confirmed.order.picking_id.unwrap();
    let picking = inventory::get_picking_by_id(&pool, picking_id).await.unwrap().unwrap();

    assert_eq!(picking.partner_id, Some(3));
    assert_eq!(picking.origin, Some(confirmed.order.name));
    assert_eq!(picking.state, "confirmed");

    // 4. Verify the stock move lines
    let moves = inventory::get_picking_moves(&pool, picking_id).await.unwrap();
    assert_eq!(moves.len(), 1);
    assert_eq!(moves[0].product_id, 1);
    assert_eq!(moves[0].quantity_milli, 4000);
}

#[tokio::test]
async fn test_purchase_order_cancellation_workflow() {
    let pool = setup_test_db().await;

    // 1. Create and confirm a PO
    let po = purchases::create_purchase_order(
        &pool,
        purchases::CreatePurchaseOrderInput {
            company_id: 1,
            partner_id: 3,
            date_planned: None,
            currency: Some("EGP".to_string()),
            origin: None,
            note: None,
            lines: vec![purchases::CreatePurchaseOrderLineInput {
                product_id: 2,
                name: Some("Samsung 27 Monitor".to_string()),
                product_uom_qty_milli: 2000,
                product_uom_id: 1,
                price_unit_cents: 400000,
                discount_percent_milli: None,
                tax_rate_milli: None,
            }],
        },
    )
    .await
    .unwrap();

    let confirmed = purchases::confirm_purchase_order(&pool, po.order.id).await.unwrap();
    let picking_id = confirmed.order.picking_id.unwrap();

    // 2. Cancel the PO
    let cancelled = purchases::cancel_purchase_order(&pool, confirmed.order.id).await.unwrap();
    assert_eq!(cancelled.order.state, "cancelled");
    assert_eq!(cancelled.order.receipt_status, "cancelled");

    // 3. Verify linked incoming picking is cancelled
    let picking = inventory::get_picking_by_id(&pool, picking_id).await.unwrap().unwrap();
    assert_eq!(picking.state, "cancelled");
}

#[tokio::test]
async fn test_chart_of_accounts_and_double_entry_balance_invariant() {
    let pool = setup_test_db().await;

    // 1. Verify COA seeded
    let accounts = accounting::list_accounts(&pool, 1).await.unwrap();
    assert!(accounts.len() >= 12);

    // 2. Create an unbalanced entry (Debit: 100,000 cents, Credit: 80,000 cents)
    let unbalanced = accounting::create_journal_entry(
        &pool,
        accounting::CreateJournalEntryInput {
            company_id: 1,
            journal_id: 5, // MISC
            date: None,
            origin: Some("TEST/UNBALANCED".to_string()),
            note: Some("Unbalanced test entry".to_string()),
            lines: vec![
                accounting::CreateJournalEntryLineInput {
                    account_id: 1, // Cash
                    partner_id: None,
                    name: "Unbalanced Debit".to_string(),
                    debit_cents: 100000,
                    credit_cents: 0,
                },
                accounting::CreateJournalEntryLineInput {
                    account_id: 8, // Capital
                    partner_id: None,
                    name: "Unbalanced Credit".to_string(),
                    debit_cents: 0,
                    credit_cents: 80000,
                },
            ],
        },
    )
    .await
    .unwrap();

    // 3. Posting unbalanced entry MUST fail with invariant violation error
    let post_result = accounting::post_move(&pool, unbalanced.r#move.id).await;
    assert!(post_result.is_err());
    let err_msg = post_result.unwrap_err().to_string();
    assert!(err_msg.contains("Double-entry invariant violated"));

    // 4. Create and post a balanced entry (Debit Cash: 100,000 EGP, Credit Capital: 100,000 EGP)
    let balanced = accounting::create_journal_entry(
        &pool,
        accounting::CreateJournalEntryInput {
            company_id: 1,
            journal_id: 5,
            date: None,
            origin: Some("CAPITAL/001".to_string()),
            note: Some("إيداع رأس مال نقدي".to_string()),
            lines: vec![
                accounting::CreateJournalEntryLineInput {
                    account_id: 1,
                    partner_id: None,
                    name: "إيداع نقدي بالخزينة".to_string(),
                    debit_cents: 10000000,
                    credit_cents: 0,
                },
                accounting::CreateJournalEntryLineInput {
                    account_id: 8,
                    partner_id: None,
                    name: "حساب رأس المال".to_string(),
                    debit_cents: 0,
                    credit_cents: 10000000,
                },
            ],
        },
    )
    .await
    .unwrap();

    let posted = accounting::post_move(&pool, balanced.r#move.id).await.unwrap();
    assert_eq!(posted.r#move.state, "posted");
}

#[tokio::test]
async fn test_customer_invoice_creation_and_reversal() {
    let pool = setup_test_db().await;

    // 1. Create a customer invoice
    // 1x Laptop @ 35,000 EGP (3,500,000 cents) + 14% VAT (490,000 cents) = 3,990,000 cents
    let inv = accounting::create_invoice(
        &pool,
        accounting::CreateInvoiceInput {
            company_id: 1,
            partner_id: 2,
            move_type: "out_invoice".to_string(),
            date: None,
            invoice_date_due: Some("2026-10-31".to_string()),
            currency: Some("EGP".to_string()),
            origin: Some("SO/2026/00001".to_string()),
            note: Some("فاتورة مبيعات معتمدة".to_string()),
            lines: vec![accounting::CreateInvoiceLineInput {
                product_id: Some(1),
                account_id: Some(10), // Sales
                name: "Dell Latitude 5530".to_string(),
                quantity_milli: 1000,
                price_unit_cents: 3500000,
                discount_percent_milli: Some(0),
                tax_rate_milli: Some(14000),
            }],
        },
    )
    .await
    .unwrap();

    assert_eq!(inv.r#move.amount_untaxed_cents, 3500000);
    assert_eq!(inv.r#move.amount_tax_cents, 490000);
    assert_eq!(inv.r#move.amount_total_cents, 3990000);

    // 2. Post the invoice
    let posted = accounting::post_move(&pool, inv.r#move.id).await.unwrap();
    assert_eq!(posted.r#move.state, "posted");

    // 3. Reverse the invoice
    let rev = accounting::reverse_move(&pool, posted.r#move.id).await.unwrap();
    assert_eq!(rev.r#move.state, "posted");
    assert_eq!(rev.r#move.reversed_entry_id, Some(posted.r#move.id));
}

#[tokio::test]
async fn test_payment_recording_and_invoice_reconciliation() {
    let pool = setup_test_db().await;

    // Seeded invoice INV/2026/00001 has id 1, total 7,980,000 cents (79,800 EGP)
    let inv = accounting::get_move(&pool, 1).await.unwrap().unwrap();
    assert_eq!(inv.r#move.payment_state, "not_paid");

    // Record full payment receipt from Customer 2
    let payment = accounting::create_and_post_payment(
        &pool,
        accounting::CreatePaymentInput {
            company_id: 1,
            partner_id: 2,
            payment_type: "inbound".to_string(),
            amount_cents: 7980000,
            date: None,
            journal_id: 3, // Cash
            payment_method: Some("cash".to_string()),
            invoice_id: Some(1),
            note: Some("سداد نقدي كامل للفاتورة INV/2026/00001".to_string()),
        },
    )
    .await
    .unwrap();

    assert_eq!(payment.state, "posted");

    // Verify invoice payment state is updated to 'paid'
    let updated_inv = accounting::get_move(&pool, 1).await.unwrap().unwrap();
    assert_eq!(updated_inv.r#move.payment_state, "paid");
}

#[tokio::test]
async fn test_trial_balance_generation() {
    let pool = setup_test_db().await;

    // Record capital injection
    let balanced = accounting::create_journal_entry(
        &pool,
        accounting::CreateJournalEntryInput {
            company_id: 1,
            journal_id: 5,
            date: None,
            origin: Some("INIT".to_string()),
            note: None,
            lines: vec![
                accounting::CreateJournalEntryLineInput {
                    account_id: 1,
                    partner_id: None,
                    name: "Cash".to_string(),
                    debit_cents: 5000000,
                    credit_cents: 0,
                },
                accounting::CreateJournalEntryLineInput {
                    account_id: 8,
                    partner_id: None,
                    name: "Capital".to_string(),
                    debit_cents: 0,
                    credit_cents: 5000000,
                },
            ],
        },
    )
    .await
    .unwrap();
    accounting::post_move(&pool, balanced.r#move.id).await.unwrap();

    let tb = accounting::get_trial_balance(&pool, 1).await.unwrap();
    assert!(!tb.is_empty());

    let total_debits: i64 = tb.iter().map(|r| r.debit_sum_cents).sum();
    let total_credits: i64 = tb.iter().map(|r| r.credit_sum_cents).sum();

    // Sum of all debits must equal sum of all credits in trial balance
    assert_eq!(total_debits, total_credits);
}

#[tokio::test]
async fn test_hr_departments_and_jobs_creation() {
    let pool = setup_test_db().await;

    // 1. Verify seeded departments
    let depts = hr::list_departments(&pool, 1).await.unwrap();
    assert!(depts.len() >= 4);

    // 2. Create sub-department
    let new_dept = hr::create_department(
        &pool,
        hr::CreateDepartmentInput {
            company_id: 1,
            name: "قسم ضمان الجودة (QA)".to_string(),
            parent_id: Some(2), // Under IT
            manager_id: None,
        },
    )
    .await
    .unwrap();

    assert_eq!(new_dept.parent_id, Some(2));

    // 3. Create job position
    let job = hr::create_job(
        &pool,
        hr::CreateJobInput {
            company_id: 1,
            name: "مهندس جودة برمجيات (QA Engineer)".to_string(),
            department_id: Some(new_dept.id),
            expected_employees: Some(2),
        },
    )
    .await
    .unwrap();

    assert_eq!(job.department_id, Some(new_dept.id));
}

#[tokio::test]
async fn test_hr_employee_lifecycle_and_contract() {
    let pool = setup_test_db().await;

    // 1. Create new employee
    let emp = hr::create_employee(
        &pool,
        hr::CreateEmployeeInput {
            company_id: 1,
            name: "خالد سعيد حسان".to_string(),
            work_email: Some("khaled.saeed@mizan.local".to_string()),
            work_phone: Some("+201099887766".to_string()),
            department_id: Some(2),
            job_id: Some(1),
            manager_id: Some(1),
            hire_date: Some("2026-08-01".to_string()),
            national_id: Some("29505051234567".to_string()),
        },
    )
    .await
    .unwrap();

    assert_eq!(emp.status, "active");

    // 2. Create employment contract (30,000 EGP = 3,000,000 cents)
    let contract = hr::create_contract(
        &pool,
        hr::CreateContractInput {
            company_id: 1,
            employee_id: emp.id,
            wage_cents: 3000000,
            date_start: Some("2026-08-01".to_string()),
            date_end: None,
            working_hours_per_week: Some(40),
            notes: Some("عقد دوام كامل".to_string()),
        },
    )
    .await
    .unwrap();

    assert_eq!(contract.state, "open");
    assert_eq!(contract.wage_cents, 3000000);

    // 3. Update employee
    let updated = hr::update_employee(
        &pool,
        hr::UpdateEmployeeInput {
            id: emp.id,
            name: "خالد سعيد حسان - مدير تقني".to_string(),
            work_email: emp.work_email,
            work_phone: emp.work_phone,
            department_id: emp.department_id,
            job_id: emp.job_id,
            manager_id: emp.manager_id,
            hire_date: Some(emp.hire_date),
            national_id: emp.national_id,
            status: Some("active".to_string()),
        },
    )
    .await
    .unwrap();

    assert_eq!(updated.name, "خالد سعيد حسان - مدير تقني");
}

#[tokio::test]
async fn test_hr_leave_request_and_approval_workflow() {
    let pool = setup_test_db().await;

    // 1. Submit leave request
    let leave = hr::create_leave(
        &pool,
        hr::CreateLeaveInput {
            company_id: 1,
            employee_id: 2,
            leave_type: "annual".to_string(),
            date_from: "2026-10-01".to_string(),
            date_to: "2026-10-05".to_string(),
            duration_days_milli: 5000, // 5 days
            reason: Some("إجازة سنوية".to_string()),
        },
    )
    .await
    .unwrap();

    assert_eq!(leave.state, "confirm");

    // 2. Validate / Approve leave
    let validated = hr::validate_leave(&pool, leave.id, 1).await.unwrap();
    assert_eq!(validated.state, "validate");
    assert_eq!(validated.approved_by_id, Some(1));

    // 3. Refuse leave
    let refused = hr::refuse_leave(&pool, leave.id).await.unwrap();
    assert_eq!(refused.state, "refuse");
}

#[tokio::test]
async fn test_hr_attendance_recording_and_worked_hours_calculation() {
    let pool = setup_test_db().await;

    // Record attendance with check-in 09:00:00 and check-out 17:30:00 (8.5 hrs = 510 mins = 8500 milli-hours)
    let att = hr::record_attendance(
        &pool,
        hr::RecordAttendanceInput {
            company_id: 1,
            employee_id: 1,
            date: Some("2026-08-17".to_string()),
            check_in: "2026-08-17 09:00:00".to_string(),
            check_out: Some("2026-08-17 17:30:00".to_string()),
            notes: Some("يوم عمل مكتمل مع نصف ساعة إضافية".to_string()),
        },
    )
    .await
    .unwrap();

    assert_eq!(att.status, "present");
    assert_eq!(att.worked_hours_milli, 8500);
}

#[tokio::test]
async fn test_dashboard_metrics_aggregation() {
    let pool = setup_test_db().await;

    // Fetch consolidated dashboard metrics for company 1
    let metrics = dashboard::get_dashboard_metrics(&pool, 1).await.unwrap();

    // Verify company ID
    assert_eq!(metrics.company_id, 1);

    // Verify product count >= 2 (seeded Laptop and Office Chair)
    assert!(metrics.total_products_count >= 2);

    // Verify active employees count >= 3
    assert!(metrics.active_employees_count >= 3);

    // Verify monthly payroll >= 35,000 + 25,000 + 20,000 = 80,000 EGP = 8,000,000 cents
    assert!(metrics.monthly_payroll_cents >= 8000000);
}

// ----------------------------------------------------
// Phase 8 Track A Integration Tests
// ----------------------------------------------------
#[tokio::test]
async fn test_argon2id_password_hashing_and_legacy_sha256_upgrade() {
    let pool = setup_test_db().await;

    // 1. Verify Argon2id hashing produces valid PHC string
    let raw_pwd = "AdminSecurePass123!";
    let argon2_hash = auth::hash_password_argon2(raw_pwd);
    assert!(argon2_hash.starts_with("$argon2id$"));
    assert!(auth::verify_password_argon2(raw_pwd, &argon2_hash));
    assert!(!auth::verify_password_argon2("WrongPassword", &argon2_hash));

    // 2. Create user with legacy SHA-256 hash in DB
    let legacy_salt = "legacy_salt_123";
    let legacy_hash = auth::hash_password_legacy(raw_pwd, legacy_salt);

    sqlx::query(
        "INSERT INTO users (company_id, username, email, password_hash, salt, full_name, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)"
    )
    .bind(1)
    .bind("legacy_user")
    .bind("legacy@mizan.erp")
    .bind(&legacy_hash)
    .bind(legacy_salt)
    .bind("Legacy User")
    .execute(&pool)
    .await
    .unwrap();

    // 3. Login with legacy user -> should authenticate successfully and silently upgrade hash to Argon2id
    let session = auth::login(
        &pool,
        auth::LoginInput {
            username: "legacy_user".to_string(),
            password: raw_pwd.to_string(),
        },
    )
    .await
    .unwrap();

    assert!(session.is_some());
    assert_eq!(session.unwrap().username, "legacy_user");

    // 4. Verify that stored hash was upgraded to Argon2id
    let updated_hash: String = sqlx::query_scalar("SELECT password_hash FROM users WHERE username = 'legacy_user'")
        .fetch_one(&pool)
        .await
        .unwrap();

    assert!(updated_hash.starts_with("$argon2id$"));
    assert!(auth::verify_password_argon2(raw_pwd, &updated_hash));
}

#[tokio::test]
async fn test_database_backup_and_restore_integrity() {
    let temp_dir = tempfile::tempdir().unwrap();
    let db_path = temp_dir.path().join("test_mizan.db");
    let backup_dir = temp_dir.path().join("backups");

    // Initialize physical SQLite file DB
    let db_url = format!("sqlite://{}", db_path.to_string_lossy());
    let pool = db::init_db(&db_url).await.unwrap();

    // Insert test company
    sqlx::query("INSERT INTO companies (id, name, currency, timezone, country) VALUES (99, 'Backup Test Co', 'EGP', 'Africa/Cairo', 'Egypt')")
        .execute(&pool)
        .await
        .unwrap();

    // Create Backup
    let backup_info = backup::create_backup(&pool, &db_path, &backup_dir, 5)
        .await
        .unwrap();

    assert!(std::path::Path::new(&backup_info.file_path).exists());
    assert!(backup_info.size_bytes > 0);

    // Corrupt / delete data in live DB
    sqlx::query("DELETE FROM companies WHERE id = 99")
        .execute(&pool)
        .await
        .unwrap();

    let count_deleted: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM companies WHERE id = 99")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(count_deleted, 0);

    // Restore Backup
    let restore_result = backup::restore_backup(&pool, &db_path, std::path::Path::new(&backup_info.file_path), &backup_dir)
        .await
        .unwrap();

    assert!(restore_result.success);
    assert!(std::path::Path::new(&restore_result.safety_snapshot_path).exists());

    // Reconnect and verify data is fully restored
    let pool_restored = db::init_db(&db_url).await.unwrap();
    let count_restored: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM companies WHERE id = 99")
        .fetch_one(&pool_restored)
        .await
        .unwrap();

    assert_eq!(count_restored, 1);
}

#[tokio::test]
async fn test_diagnostics_logging_and_export() {
    let temp_dir = tempfile::tempdir().unwrap();
    let app_dir = temp_dir.path();
    let export_file = app_dir.join("mizan_diagnostic_export.json");

    // Log diagnostic errors
    diagnostics::log_diagnostic_error(app_dir, "auth", "login", "Invalid credentials entered").unwrap();
    diagnostics::log_diagnostic_error(app_dir, "inventory", "stock_move", "Location not found").unwrap();

    // Read recent logs
    let logs = diagnostics::read_recent_diagnostics(app_dir, 10).unwrap();
    assert_eq!(logs.len(), 2);
    assert_eq!(logs[0].module, "inventory");
    assert_eq!(logs[1].module, "auth");

    // Export report
    let result = diagnostics::export_diagnostic_report(app_dir, &export_file).unwrap();
    assert_eq!(result.total_entries, 2);
    assert!(export_file.exists());
}

#[test]
fn test_single_instance_lockfile_guard() {
    let temp_dir = tempfile::tempdir().unwrap();
    let lock_path = temp_dir.path().join("mizan.lock");

    // First process acquires lock
    let lock1 = db::acquire_db_lock(&lock_path);
    assert!(lock1.is_ok());

    // Second process attempting same lock is rejected with clear error
    let lock2 = db::acquire_db_lock(&lock_path);
    assert!(lock2.is_err());
    let err_msg = lock2.unwrap_err().to_string();
    assert!(err_msg.contains("مفتوح بالفعل"));
}

// ----------------------------------------------------
// Phase 8 Track B Licensing & Trial Integration Tests
// ----------------------------------------------------
#[tokio::test]
async fn test_ed25519_offline_license_signing_and_verification() {
    use base64::Engine;
    use ed25519_dalek::{Signer, SigningKey};
    use rand_core::OsRng;

    let mut csprng = OsRng;
    let signing_key = SigningKey::generate(&mut csprng);
    let verifying_key = signing_key.verifying_key();
    let pubkey_hex = hex::encode(verifying_key.to_bytes());

    let payload = licensing::LicensePayload {
        licensee: "شركة الشرق للتجارة".to_string(),
        machine_id: "MIZAN-TEST-0001".to_string(),
        tier: "business".to_string(),
        allowed_modules: vec![
            "core".to_string(),
            "inventory".to_string(),
            "sales".to_string(),
            "purchases".to_string(),
            "accounting".to_string(),
        ],
        issued_at: chrono::Utc::now().to_rfc3339(),
        expires_at: None,
    };

    let payload_json = serde_json::to_string(&payload).unwrap();
    let signature = signing_key.sign(payload_json.as_bytes());
    let sig_b64 = base64::engine::general_purpose::STANDARD.encode(signature.to_bytes());

    let signed_file = licensing::SignedLicenseFile {
        payload_json,
        signature_base64: sig_b64,
        public_key_hex: pubkey_hex,
    };
    let file_content = serde_json::to_string(&signed_file).unwrap();

    // 1. Verify valid license on matching machine
    let verified = licensing::verify_license_content(&file_content, "MIZAN-TEST-0001");
    assert!(verified.is_ok());
    let lic = verified.unwrap();
    assert_eq!(lic.licensee, "شركة الشرق للتجارة");
    assert_eq!(lic.tier, "business");
    assert_eq!(lic.allowed_modules.len(), 5);

    // 2. Reject when machine ID differs
    let mismatch = licensing::verify_license_content(&file_content, "MIZAN-DIFF-9999");
    assert!(mismatch.is_err());
    assert!(mismatch.unwrap_err().contains("Machine ID mismatch"));

    // 3. Reject when signature is tampered
    let mut tampered_file = signed_file;
    tampered_file.payload_json = tampered_file.payload_json.replace("business", "enterprise");
    let tampered_content = serde_json::to_string(&tampered_file).unwrap();
    let tampered_result = licensing::verify_license_content(&tampered_content, "MIZAN-TEST-0001");
    assert!(tampered_result.is_err());
    assert!(tampered_result.unwrap_err().contains("Signature verification failed"));
}

#[tokio::test]
async fn test_evaluation_trial_lifecycle() {
    let pool = setup_test_db().await;

    // 1. First run: should auto-initialize 7-day trial with all modules unlocked
    let status = licensing::get_license_and_trial_status(&pool).await.unwrap();
    assert!(!status.is_activated);
    assert!(status.is_trial_active);
    assert!(!status.is_expired);
    assert_eq!(status.trial_days_left, 7);
    assert!(status.allowed_modules.len() >= 6);
    assert!(status.allowed_modules.contains(&"sales".to_string()));
    assert!(status.allowed_modules.contains(&"products".to_string()));

    // 2. Simulate trial expiry (set trial_started_at to 10 days ago)
    let past_date = (chrono::Local::now() - chrono::Duration::days(10)).to_rfc3339();
    sqlx::query("UPDATE settings SET value = ? WHERE key = 'trial_started_at' AND company_id = 1")
        .bind(past_date)
        .execute(&pool)
        .await
        .unwrap();

    let expired_status = licensing::get_license_and_trial_status(&pool).await.unwrap();
    assert!(!expired_status.is_activated);
    assert!(!expired_status.is_trial_active);
    assert!(expired_status.is_expired);
    assert_eq!(expired_status.trial_days_left, 0);

    // 3. Attempting to activate non-core module when trial expired should be blocked by set_module_status
    let toggle_res = modules::set_module_status(&pool, "sales", true).await.unwrap();
    assert!(!toggle_res.is_active);
    assert!(toggle_res.message.contains("غير متاحة"));
}

// ----------------------------------------------------
// Phase 9 Reports & Data Export Integration Tests
// ----------------------------------------------------

#[tokio::test]
async fn test_financial_reports_trial_balance_and_pnl() {
    let pool = setup_test_db().await;

    // 1. Post a Customer Invoice (Debit AR: 114,000 cents, Credit Sales: 100,000 cents, Credit VAT: 14,000 cents)
    let invoice = accounting::create_invoice(
        &pool,
        accounting::CreateInvoiceInput {
            company_id: 1,
            partner_id: 2,
            move_type: "out_invoice".to_string(),
            date: Some("2026-08-10".to_string()),
            invoice_date_due: Some("2026-09-10".to_string()),
            currency: Some("EGP".to_string()),
            origin: None,
            note: Some("فاتورة مبيعات لاختبار التقارير".to_string()),
            lines: vec![accounting::CreateInvoiceLineInput {
                product_id: Some(1),
                account_id: Some(10), // 4010 Sales Revenue
                name: "Dell Latitude 5530".to_string(),
                quantity_milli: 1000,
                price_unit_cents: 100000,
                discount_percent_milli: None,
                tax_rate_milli: Some(14000), // 14%
            }],
        },
    )
    .await
    .unwrap();

    let posted_inv = accounting::post_move(&pool, invoice.r#move.id).await.unwrap();
    assert_eq!(posted_inv.r#move.state, "posted");

    // 2. Query Trial Balance Filtered
    let tb = reports::get_trial_balance_filtered(
        &pool,
        1,
        Some("2026-08-01".to_string()),
        Some("2026-08-31".to_string()),
    )
    .await
    .unwrap();
    assert!(!tb.is_empty());
    let ar_row = tb.iter().find(|r| r.account_code == "1030").unwrap();
    // Seed invoice 1 (7,980,000 cents) + new invoice (114,000 cents) = 8,094,000 cents
    assert_eq!(ar_row.debit_sum_cents, 8094000);
    assert_eq!(ar_row.net_balance_cents, 8094000);

    // 3. Query Profit & Loss (Seed 7,000,000 + new 100,000 = 7,100,000)
    let pnl = reports::get_profit_and_loss(&pool, 1, "2026-08-01", "2026-08-31").await.unwrap();
    assert_eq!(pnl.total_revenue_cents, 7100000);
    assert_eq!(pnl.net_profit_cents, 7100000);
}

#[tokio::test]
async fn test_general_ledger_running_balances() {
    let pool = setup_test_db().await;

    // Post an invoice
    let invoice = accounting::create_invoice(
        &pool,
        accounting::CreateInvoiceInput {
            company_id: 1,
            partner_id: 2,
            move_type: "out_invoice".to_string(),
            date: Some("2026-08-15".to_string()),
            invoice_date_due: Some("2026-09-15".to_string()),
            currency: Some("EGP".to_string()),
            origin: None,
            note: None,
            lines: vec![accounting::CreateInvoiceLineInput {
                product_id: Some(1),
                account_id: Some(10), // 4010 Sales Revenue
                name: "Test item".to_string(),
                quantity_milli: 1000,
                price_unit_cents: 50000,
                discount_percent_milli: None,
                tax_rate_milli: Some(14000),
            }],
        },
    )
    .await
    .unwrap();
    accounting::post_move(&pool, invoice.r#move.id).await.unwrap();

    // Query General Ledger for Revenue Account (id 10)
    let gl = reports::get_general_ledger(&pool, 1, Some(10), "2026-08-01", "2026-08-31").await.unwrap();
    assert_eq!(gl.len(), 1);
    assert_eq!(gl[0].account_code, "4010");
    assert!(!gl[0].lines.is_empty());
}

#[tokio::test]
async fn test_partner_statement_and_aging_buckets() {
    let pool = setup_test_db().await;

    // 1. Post Customer Invoice for partner 2 (due in past to test aging)
    let invoice = accounting::create_invoice(
        &pool,
        accounting::CreateInvoiceInput {
            company_id: 1,
            partner_id: 2,
            move_type: "out_invoice".to_string(),
            date: Some("2026-06-01".to_string()),
            invoice_date_due: Some("2026-06-15".to_string()),
            currency: Some("EGP".to_string()),
            origin: None,
            note: Some("فاتورة قديمة لاختبار أعمار الديون".to_string()),
            lines: vec![accounting::CreateInvoiceLineInput {
                product_id: Some(1),
                account_id: Some(10),
                name: "Dell Laptop".to_string(),
                quantity_milli: 1000,
                price_unit_cents: 100000,
                discount_percent_milli: None,
                tax_rate_milli: None,
            }],
        },
    )
    .await
    .unwrap();
    accounting::post_move(&pool, invoice.r#move.id).await.unwrap();

    // 2. Partner Statement
    let stmt = reports::get_partner_statement(&pool, 1, 2, "2026-01-01", "2026-12-31").await.unwrap();
    assert_eq!(stmt.partner_name, "مؤسسة النور للتجزئة");
    assert!(stmt.closing_balance_cents > 0);

    // 3. Partner Aging Report as of 2026-08-17 (63 days past due date 2026-06-15 -> bucket 61_90)
    let aging = reports::get_partner_aging(&pool, 1, "customer", "2026-08-17").await.unwrap();
    assert!(!aging.is_empty());
    let p_row = aging.iter().find(|r| r.partner_id == 2).unwrap();
    assert!(p_row.total_outstanding_cents > 0);
    assert_eq!(p_row.bucket_61_90_cents, 114000);
}

#[tokio::test]
async fn test_native_excel_and_zip_export() {
    // 1. Test Excel Generation
    let req = export::ExportReportRequest {
        title: "تقرير ميزان المراجعة التجريبي".to_string(),
        subtitle: Some("للفترة من 2026-01-01 إلى 2026-12-31".to_string()),
        company_name: "شركة ميزان للتجارة".to_string(),
        date_range: Some("2026-01-01 - 2026-12-31".to_string()),
        columns: vec![
            export::ExportColumn {
                key: "code".to_string(),
                title: "رمز الحساب".to_string(),
                data_type: "text".to_string(),
                width: None,
            },
            export::ExportColumn {
                key: "name".to_string(),
                title: "اسم الحساب".to_string(),
                data_type: "text".to_string(),
                width: None,
            },
            export::ExportColumn {
                key: "debit".to_string(),
                title: "مدين (ج.م)".to_string(),
                data_type: "currency".to_string(),
                width: None,
            },
            export::ExportColumn {
                key: "credit".to_string(),
                title: "دائن (ج.م)".to_string(),
                data_type: "currency".to_string(),
                width: None,
            },
        ],
        rows: vec![
            serde_json::json!({
                "code": "1010",
                "name": "الخزينة الرئيسية",
                "debit": 50000.0,
                "credit": 0.0
            }),
            serde_json::json!({
                "code": "1030",
                "name": "العملاء والمدينون",
                "debit": 12500.50,
                "credit": 0.0
            }),
        ],
        is_rtl: true,
    };

    let xlsx_bytes = export::generate_xlsx(&req).unwrap();
    assert!(!xlsx_bytes.is_empty());
    // Verify PK zip header of .xlsx file
    assert_eq!(&xlsx_bytes[0..4], b"PK\x03\x04");

    // 2. Test ZIP Archiving
    let files = vec![
        ("INV-2026-00001.pdf".to_string(), b"%PDF-1.4 Mock Invoice".to_vec()),
        ("INV-2026-00002.pdf".to_string(), b"%PDF-1.4 Mock Invoice 2".to_vec()),
    ];

    let zip_bytes = export::create_zip_archive(&files).unwrap();
    assert!(!zip_bytes.is_empty());
    assert_eq!(&zip_bytes[0..4], b"PK\x03\x04");
}




