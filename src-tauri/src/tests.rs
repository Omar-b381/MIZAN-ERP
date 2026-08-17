use crate::{
    accounting, activity, auth, companies, db, hr, inventory, modules, partners, products, purchases, rbac, sales, settings,
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

