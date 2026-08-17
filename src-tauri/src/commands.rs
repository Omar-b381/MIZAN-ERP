use std::collections::HashMap;
use tauri::State;
use crate::{accounting, activity, auth, companies, dashboard, hr, inventory, modules, partners, products, purchases, rbac, sales, settings, AppState};

// ----------------------------------------------------
// Modules Commands
// ----------------------------------------------------
#[tauri::command]
pub async fn cmd_get_modules(state: State<'_, AppState>) -> Result<Vec<modules::ModuleRecord>, String> {
    modules::get_all_modules(&state.pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_toggle_module(
    state: State<'_, AppState>,
    key: String,
    active: bool,
) -> Result<modules::ModuleToggleResult, String> {
    let result = modules::set_module_status(&state.pool, &key, active)
        .await
        .map_err(|e| e.to_string())?;

    let _ = activity::log_activity(
        &state.pool,
        activity::LogActivityInput {
            company_id: 1,
            entity_type: "module".to_string(),
            entity_id: 0,
            user_id: None,
            action: if active { "activated" } else { "deactivated" }.to_string(),
            summary: format!("Module '{}' was {}", key, if active { "activated" } else { "deactivated" }),
            details_json: None,
        },
    )
    .await;

    Ok(result)
}

// ----------------------------------------------------
// Auth & Users Commands
// ----------------------------------------------------
#[tauri::command]
pub async fn cmd_login_user(
    state: State<'_, AppState>,
    input: auth::LoginInput,
) -> Result<Option<auth::SessionUser>, String> {
    auth::login(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_users(
    state: State<'_, AppState>,
    company_id: Option<i64>,
) -> Result<Vec<auth::User>, String> {
    auth::list_users(&state.pool, company_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_user(
    state: State<'_, AppState>,
    input: auth::CreateUserInput,
) -> Result<auth::User, String> {
    let company_id = input.company_id;
    let username = input.username.clone();
    let user = auth::create_user(&state.pool, input)
        .await
        .map_err(|e| e.to_string())?;

    let _ = activity::log_activity(
        &state.pool,
        activity::LogActivityInput {
            company_id,
            entity_type: "user".to_string(),
            entity_id: user.id,
            user_id: None,
            action: "created".to_string(),
            summary: format!("User '{}' created", username),
            details_json: None,
        },
    )
    .await;

    Ok(user)
}

#[tauri::command]
pub async fn cmd_update_user(
    state: State<'_, AppState>,
    input: auth::UpdateUserInput,
) -> Result<auth::User, String> {
    let user = auth::update_user(&state.pool, input)
        .await
        .map_err(|e| e.to_string())?;

    let _ = activity::log_activity(
        &state.pool,
        activity::LogActivityInput {
            company_id: user.company_id,
            entity_type: "user".to_string(),
            entity_id: user.id,
            user_id: None,
            action: "updated".to_string(),
            summary: format!("User '{}' updated", user.username),
            details_json: None,
        },
    )
    .await;

    Ok(user)
}

// ----------------------------------------------------
// RBAC Commands
// ----------------------------------------------------
#[tauri::command]
pub async fn cmd_list_roles(
    state: State<'_, AppState>,
) -> Result<Vec<rbac::RoleWithPermissions>, String> {
    rbac::list_roles(&state.pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_permissions(
    state: State<'_, AppState>,
) -> Result<Vec<rbac::Permission>, String> {
    rbac::list_permissions(&state.pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_assign_role_permissions(
    state: State<'_, AppState>,
    role_id: i64,
    permissions: Vec<String>,
) -> Result<(), String> {
    rbac::assign_role_permissions(&state.pool, role_id, permissions)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_assign_user_roles(
    state: State<'_, AppState>,
    user_id: i64,
    role_ids: Vec<i64>,
) -> Result<(), String> {
    rbac::assign_user_roles(&state.pool, user_id, role_ids)
        .await
        .map_err(|e| e.to_string())
}

// ----------------------------------------------------
// Companies Commands
// ----------------------------------------------------
#[tauri::command]
pub async fn cmd_list_companies(
    state: State<'_, AppState>,
) -> Result<Vec<companies::Company>, String> {
    companies::list_companies(&state.pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_company(
    state: State<'_, AppState>,
    id: i64,
) -> Result<Option<companies::Company>, String> {
    companies::get_company(&state.pool, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_company(
    state: State<'_, AppState>,
    input: companies::CreateCompanyInput,
) -> Result<companies::Company, String> {
    let company = companies::create_company(&state.pool, input)
        .await
        .map_err(|e| e.to_string())?;

    let _ = activity::log_activity(
        &state.pool,
        activity::LogActivityInput {
            company_id: company.id,
            entity_type: "company".to_string(),
            entity_id: company.id,
            user_id: None,
            action: "created".to_string(),
            summary: format!("Company/Branch '{}' created", company.name),
            details_json: None,
        },
    )
    .await;

    Ok(company)
}

#[tauri::command]
pub async fn cmd_update_company(
    state: State<'_, AppState>,
    input: companies::UpdateCompanyInput,
) -> Result<companies::Company, String> {
    let company = companies::update_company(&state.pool, input)
        .await
        .map_err(|e| e.to_string())?;

    let _ = activity::log_activity(
        &state.pool,
        activity::LogActivityInput {
            company_id: company.id,
            entity_type: "company".to_string(),
            entity_id: company.id,
            user_id: None,
            action: "updated".to_string(),
            summary: format!("Company/Branch '{}' updated", company.name),
            details_json: None,
        },
    )
    .await;

    Ok(company)
}

// ----------------------------------------------------
// Partners / Unified Contacts Commands
// ----------------------------------------------------
#[tauri::command]
pub async fn cmd_list_partners(
    state: State<'_, AppState>,
    filter: partners::PartnerFilter,
) -> Result<Vec<partners::Partner>, String> {
    partners::list_partners(&state.pool, filter)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_partner(
    state: State<'_, AppState>,
    id: i64,
) -> Result<Option<partners::Partner>, String> {
    partners::get_partner_by_id(&state.pool, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_partner(
    state: State<'_, AppState>,
    input: partners::CreatePartnerInput,
) -> Result<partners::Partner, String> {
    let company_id = input.company_id;
    let partner = partners::create_partner(&state.pool, input)
        .await
        .map_err(|e| e.to_string())?;

    let _ = activity::log_activity(
        &state.pool,
        activity::LogActivityInput {
            company_id,
            entity_type: "partner".to_string(),
            entity_id: partner.id,
            user_id: None,
            action: "created".to_string(),
            summary: format!("Contact '{}' created ({})", partner.name, partner.sub_type),
            details_json: None,
        },
    )
    .await;

    Ok(partner)
}

#[tauri::command]
pub async fn cmd_update_partner(
    state: State<'_, AppState>,
    input: partners::UpdatePartnerInput,
) -> Result<partners::Partner, String> {
    let partner = partners::update_partner(&state.pool, input)
        .await
        .map_err(|e| e.to_string())?;

    let _ = activity::log_activity(
        &state.pool,
        activity::LogActivityInput {
            company_id: partner.company_id,
            entity_type: "partner".to_string(),
            entity_id: partner.id,
            user_id: None,
            action: "updated".to_string(),
            summary: format!("Contact '{}' updated", partner.name),
            details_json: None,
        },
    )
    .await;

    Ok(partner)
}

#[tauri::command]
pub async fn cmd_delete_partner(
    state: State<'_, AppState>,
    id: i64,
) -> Result<(), String> {
    partners::delete_partner(&state.pool, id)
        .await
        .map_err(|e| e.to_string())
}

// ----------------------------------------------------
// Settings Commands
// ----------------------------------------------------
#[tauri::command]
pub async fn cmd_get_settings(
    state: State<'_, AppState>,
    company_id: i64,
) -> Result<HashMap<String, String>, String> {
    settings::get_company_settings(&state.pool, company_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_set_setting(
    state: State<'_, AppState>,
    input: settings::UpdateSettingInput,
) -> Result<(), String> {
    settings::set_setting(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

// ----------------------------------------------------
// Activity Logs Commands
// ----------------------------------------------------
#[tauri::command]
pub async fn cmd_get_recent_activities(
    state: State<'_, AppState>,
    company_id: i64,
    limit: i64,
) -> Result<Vec<activity::ActivityLog>, String> {
    activity::get_recent_activities(&state.pool, company_id, limit)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_entity_activities(
    state: State<'_, AppState>,
    entity_type: String,
    entity_id: i64,
) -> Result<Vec<activity::ActivityLog>, String> {
    activity::get_entity_activities(&state.pool, &entity_type, entity_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_log_activity(
    state: State<'_, AppState>,
    input: activity::LogActivityInput,
) -> Result<i64, String> {
    activity::log_activity(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

// ----------------------------------------------------
// Products & Catalog Commands (Phase 2)
// ----------------------------------------------------
#[tauri::command]
pub async fn cmd_list_uoms(state: State<'_, AppState>) -> Result<Vec<products::Uom>, String> {
    products::list_uoms(&state.pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_product_categories(
    state: State<'_, AppState>,
    company_id: i64,
) -> Result<Vec<products::ProductCategory>, String> {
    products::list_product_categories(&state.pool, company_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_product_category(
    state: State<'_, AppState>,
    company_id: i64,
    name: String,
    parent_id: Option<i64>,
) -> Result<products::ProductCategory, String> {
    products::create_product_category(&state.pool, company_id, name, parent_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_products(
    state: State<'_, AppState>,
    filter: products::ProductFilter,
) -> Result<Vec<products::ProductWithStock>, String> {
    products::list_products(&state.pool, filter)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_product(
    state: State<'_, AppState>,
    id: i64,
) -> Result<Option<products::Product>, String> {
    products::get_product_by_id(&state.pool, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_product(
    state: State<'_, AppState>,
    input: products::CreateProductInput,
) -> Result<products::Product, String> {
    let company_id = input.company_id;
    let name = input.name.clone();
    let product = products::create_product(&state.pool, input)
        .await
        .map_err(|e| e.to_string())?;

    let _ = activity::log_activity(
        &state.pool,
        activity::LogActivityInput {
            company_id,
            entity_type: "product".to_string(),
            entity_id: product.id,
            user_id: None,
            action: "created".to_string(),
            summary: format!("Product '{}' created ({})", name, product.sku),
            details_json: None,
        },
    )
    .await;

    Ok(product)
}

#[tauri::command]
pub async fn cmd_update_product(
    state: State<'_, AppState>,
    input: products::UpdateProductInput,
) -> Result<products::Product, String> {
    let product = products::update_product(&state.pool, input)
        .await
        .map_err(|e| e.to_string())?;

    let _ = activity::log_activity(
        &state.pool,
        activity::LogActivityInput {
            company_id: product.company_id,
            entity_type: "product".to_string(),
            entity_id: product.id,
            user_id: None,
            action: "updated".to_string(),
            summary: format!("Product '{}' updated", product.name),
            details_json: None,
        },
    )
    .await;

    Ok(product)
}

#[tauri::command]
pub async fn cmd_delete_product(
    state: State<'_, AppState>,
    id: i64,
) -> Result<(), String> {
    products::delete_product(&state.pool, id)
        .await
        .map_err(|e| e.to_string())
}

// ----------------------------------------------------
// Inventory & Locations Commands (Phase 2)
// ----------------------------------------------------
#[tauri::command]
pub async fn cmd_list_locations(
    state: State<'_, AppState>,
    company_id: i64,
) -> Result<Vec<inventory::StockLocation>, String> {
    inventory::list_locations(&state.pool, company_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_location(
    state: State<'_, AppState>,
    input: inventory::CreateLocationInput,
) -> Result<inventory::StockLocation, String> {
    inventory::create_location(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_warehouses(
    state: State<'_, AppState>,
    company_id: i64,
) -> Result<Vec<inventory::StockWarehouse>, String> {
    inventory::list_warehouses(&state.pool, company_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_picking_types(
    state: State<'_, AppState>,
    company_id: i64,
) -> Result<Vec<inventory::StockPickingType>, String> {
    inventory::list_picking_types(&state.pool, company_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_stock_quantities(
    state: State<'_, AppState>,
    company_id: i64,
    location_id: Option<i64>,
    product_id: Option<i64>,
) -> Result<Vec<inventory::StockQuantityDetail>, String> {
    inventory::list_stock_quantities(&state.pool, company_id, location_id, product_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_pickings(
    state: State<'_, AppState>,
    company_id: i64,
    state_filter: Option<String>,
) -> Result<Vec<inventory::StockPicking>, String> {
    inventory::list_pickings(&state.pool, company_id, state_filter)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_picking(
    state: State<'_, AppState>,
    id: i64,
) -> Result<Option<inventory::StockPicking>, String> {
    inventory::get_picking_by_id(&state.pool, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_picking_moves(
    state: State<'_, AppState>,
    picking_id: i64,
) -> Result<Vec<inventory::StockMove>, String> {
    inventory::get_picking_moves(&state.pool, picking_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_picking(
    state: State<'_, AppState>,
    input: inventory::CreatePickingInput,
) -> Result<inventory::StockPicking, String> {
    inventory::create_picking(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_confirm_picking(
    state: State<'_, AppState>,
    id: i64,
) -> Result<inventory::StockPicking, String> {
    inventory::confirm_and_validate_picking(&state.pool, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_cancel_picking(
    state: State<'_, AppState>,
    id: i64,
) -> Result<inventory::StockPicking, String> {
    inventory::cancel_picking(&state.pool, id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_inventory_adjustments(
    state: State<'_, AppState>,
    company_id: i64,
) -> Result<Vec<inventory::StockInventoryAdjustment>, String> {
    inventory::list_inventory_adjustments(&state.pool, company_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_adjustment_lines(
    state: State<'_, AppState>,
    adjustment_id: i64,
) -> Result<Vec<inventory::StockInventoryAdjustmentLineDetail>, String> {
    inventory::get_adjustment_lines(&state.pool, adjustment_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_inventory_adjustment(
    state: State<'_, AppState>,
    input: inventory::CreateInventoryAdjustmentInput,
) -> Result<inventory::StockInventoryAdjustment, String> {
    inventory::create_inventory_adjustment(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_update_adjustment_line_count(
    state: State<'_, AppState>,
    input: inventory::UpdateAdjustmentLineCountInput,
) -> Result<(), String> {
    inventory::update_adjustment_line_count(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_validate_inventory_adjustment(
    state: State<'_, AppState>,
    adjustment_id: i64,
) -> Result<inventory::StockInventoryAdjustment, String> {
    inventory::validate_inventory_adjustment(&state.pool, adjustment_id)
        .await
        .map_err(|e| e.to_string())
}

// ----------------------------------------------------
// Sales & Quotations Commands (Phase 3)
// ----------------------------------------------------
#[tauri::command]
pub async fn cmd_list_sale_orders(
    state: State<'_, AppState>,
    company_id: i64,
    state_filter: Option<String>,
    partner_id: Option<i64>,
) -> Result<Vec<sales::SaleOrder>, String> {
    sales::list_sale_orders(&state.pool, company_id, state_filter, partner_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_sale_order(
    state: State<'_, AppState>,
    order_id: i64,
) -> Result<Option<sales::SaleOrderDetail>, String> {
    sales::get_sale_order(&state.pool, order_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_sale_order(
    state: State<'_, AppState>,
    input: sales::CreateSaleOrderInput,
) -> Result<sales::SaleOrderDetail, String> {
    sales::create_sale_order(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_update_sale_order(
    state: State<'_, AppState>,
    input: sales::UpdateSaleOrderInput,
) -> Result<sales::SaleOrderDetail, String> {
    sales::update_sale_order(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_confirm_sale_order(
    state: State<'_, AppState>,
    order_id: i64,
) -> Result<sales::SaleOrderDetail, String> {
    sales::confirm_sale_order(&state.pool, order_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_cancel_sale_order(
    state: State<'_, AppState>,
    order_id: i64,
) -> Result<sales::SaleOrderDetail, String> {
    sales::cancel_sale_order(&state.pool, order_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_delete_sale_order(
    state: State<'_, AppState>,
    order_id: i64,
) -> Result<(), String> {
    sales::delete_sale_order(&state.pool, order_id)
        .await
        .map_err(|e| e.to_string())
}

// ----------------------------------------------------
// Purchases & Vendor Orders Commands (Phase 4)
// ----------------------------------------------------
#[tauri::command]
pub async fn cmd_list_purchase_orders(
    state: State<'_, AppState>,
    company_id: i64,
    state_filter: Option<String>,
    partner_id: Option<i64>,
) -> Result<Vec<purchases::PurchaseOrder>, String> {
    purchases::list_purchase_orders(&state.pool, company_id, state_filter, partner_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_purchase_order(
    state: State<'_, AppState>,
    order_id: i64,
) -> Result<Option<purchases::PurchaseOrderDetail>, String> {
    purchases::get_purchase_order(&state.pool, order_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_purchase_order(
    state: State<'_, AppState>,
    input: purchases::CreatePurchaseOrderInput,
) -> Result<purchases::PurchaseOrderDetail, String> {
    purchases::create_purchase_order(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_update_purchase_order(
    state: State<'_, AppState>,
    input: purchases::UpdatePurchaseOrderInput,
) -> Result<purchases::PurchaseOrderDetail, String> {
    purchases::update_purchase_order(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_confirm_purchase_order(
    state: State<'_, AppState>,
    order_id: i64,
) -> Result<purchases::PurchaseOrderDetail, String> {
    purchases::confirm_purchase_order(&state.pool, order_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_cancel_purchase_order(
    state: State<'_, AppState>,
    order_id: i64,
) -> Result<purchases::PurchaseOrderDetail, String> {
    purchases::cancel_purchase_order(&state.pool, order_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_delete_purchase_order(
    state: State<'_, AppState>,
    order_id: i64,
) -> Result<(), String> {
    purchases::delete_purchase_order(&state.pool, order_id)
        .await
        .map_err(|e| e.to_string())
}

// ----------------------------------------------------
// Accounting, Invoicing & Payments Commands (Phase 5)
// ----------------------------------------------------
#[tauri::command]
pub async fn cmd_list_accounts(
    state: State<'_, AppState>,
    company_id: i64,
) -> Result<Vec<accounting::Account>, String> {
    accounting::list_accounts(&state.pool, company_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_account(
    state: State<'_, AppState>,
    input: accounting::CreateAccountInput,
) -> Result<accounting::Account, String> {
    accounting::create_account(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_journals(
    state: State<'_, AppState>,
    company_id: i64,
) -> Result<Vec<accounting::AccountJournal>, String> {
    accounting::list_journals(&state.pool, company_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_moves(
    state: State<'_, AppState>,
    company_id: i64,
    move_type: Option<String>,
    state_filter: Option<String>,
    partner_id: Option<i64>,
) -> Result<Vec<accounting::AccountMove>, String> {
    accounting::list_moves(&state.pool, company_id, move_type, state_filter, partner_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_move(
    state: State<'_, AppState>,
    move_id: i64,
) -> Result<Option<accounting::AccountMoveDetail>, String> {
    accounting::get_move(&state.pool, move_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_invoice(
    state: State<'_, AppState>,
    input: accounting::CreateInvoiceInput,
) -> Result<accounting::AccountMoveDetail, String> {
    accounting::create_invoice(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_journal_entry(
    state: State<'_, AppState>,
    input: accounting::CreateJournalEntryInput,
) -> Result<accounting::AccountMoveDetail, String> {
    accounting::create_journal_entry(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_post_move(
    state: State<'_, AppState>,
    move_id: i64,
) -> Result<accounting::AccountMoveDetail, String> {
    accounting::post_move(&state.pool, move_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_cancel_move(
    state: State<'_, AppState>,
    move_id: i64,
) -> Result<accounting::AccountMoveDetail, String> {
    accounting::cancel_move(&state.pool, move_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_reverse_move(
    state: State<'_, AppState>,
    move_id: i64,
) -> Result<accounting::AccountMoveDetail, String> {
    accounting::reverse_move(&state.pool, move_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_payments(
    state: State<'_, AppState>,
    company_id: i64,
    partner_id: Option<i64>,
) -> Result<Vec<accounting::AccountPayment>, String> {
    accounting::list_payments(&state.pool, company_id, partner_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_and_post_payment(
    state: State<'_, AppState>,
    input: accounting::CreatePaymentInput,
) -> Result<accounting::AccountPayment, String> {
    accounting::create_and_post_payment(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_trial_balance(
    state: State<'_, AppState>,
    company_id: i64,
) -> Result<Vec<accounting::TrialBalanceRow>, String> {
    accounting::get_trial_balance(&state.pool, company_id)
        .await
        .map_err(|e| e.to_string())
}

// ----------------------------------------------------
// Human Resources (HR) Commands (Phase 6)
// ----------------------------------------------------
#[tauri::command]
pub async fn cmd_list_departments(
    state: State<'_, AppState>,
    company_id: i64,
) -> Result<Vec<hr::Department>, String> {
    hr::list_departments(&state.pool, company_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_department(
    state: State<'_, AppState>,
    input: hr::CreateDepartmentInput,
) -> Result<hr::Department, String> {
    hr::create_department(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_jobs(
    state: State<'_, AppState>,
    company_id: i64,
) -> Result<Vec<hr::JobPosition>, String> {
    hr::list_jobs(&state.pool, company_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_job(
    state: State<'_, AppState>,
    input: hr::CreateJobInput,
) -> Result<hr::JobPosition, String> {
    hr::create_job(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_employees(
    state: State<'_, AppState>,
    company_id: i64,
    department_id: Option<i64>,
    status_filter: Option<String>,
) -> Result<Vec<hr::Employee>, String> {
    hr::list_employees(&state.pool, company_id, department_id, status_filter)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_employee(
    state: State<'_, AppState>,
    employee_id: i64,
) -> Result<Option<hr::Employee>, String> {
    hr::get_employee(&state.pool, employee_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_employee(
    state: State<'_, AppState>,
    input: hr::CreateEmployeeInput,
) -> Result<hr::Employee, String> {
    hr::create_employee(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_update_employee(
    state: State<'_, AppState>,
    input: hr::UpdateEmployeeInput,
) -> Result<hr::Employee, String> {
    hr::update_employee(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_delete_employee(
    state: State<'_, AppState>,
    employee_id: i64,
) -> Result<(), String> {
    hr::delete_employee(&state.pool, employee_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_contracts(
    state: State<'_, AppState>,
    company_id: i64,
    employee_id: Option<i64>,
) -> Result<Vec<hr::Contract>, String> {
    hr::list_contracts(&state.pool, company_id, employee_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_contract(
    state: State<'_, AppState>,
    input: hr::CreateContractInput,
) -> Result<hr::Contract, String> {
    hr::create_contract(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_leaves(
    state: State<'_, AppState>,
    company_id: i64,
    employee_id: Option<i64>,
    state_filter: Option<String>,
) -> Result<Vec<hr::LeaveRequest>, String> {
    hr::list_leaves(&state.pool, company_id, employee_id, state_filter)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_create_leave(
    state: State<'_, AppState>,
    input: hr::CreateLeaveInput,
) -> Result<hr::LeaveRequest, String> {
    hr::create_leave(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_validate_leave(
    state: State<'_, AppState>,
    leave_id: i64,
    approved_by_id: i64,
) -> Result<hr::LeaveRequest, String> {
    hr::validate_leave(&state.pool, leave_id, approved_by_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_refuse_leave(
    state: State<'_, AppState>,
    leave_id: i64,
) -> Result<hr::LeaveRequest, String> {
    hr::refuse_leave(&state.pool, leave_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_list_attendances(
    state: State<'_, AppState>,
    company_id: i64,
    employee_id: Option<i64>,
    date_filter: Option<String>,
) -> Result<Vec<hr::AttendanceRecord>, String> {
    hr::list_attendances(&state.pool, company_id, employee_id, date_filter)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_record_attendance(
    state: State<'_, AppState>,
    input: hr::RecordAttendanceInput,
) -> Result<hr::AttendanceRecord, String> {
    hr::record_attendance(&state.pool, input)
        .await
        .map_err(|e| e.to_string())
}

// ----------------------------------------------------
// Dashboard & Executive Reporting Commands (Phase 7)
// ----------------------------------------------------
#[tauri::command]
pub async fn cmd_get_dashboard_metrics(
    state: State<'_, AppState>,
    company_id: i64,
) -> Result<dashboard::DashboardMetrics, String> {
    dashboard::get_dashboard_metrics(&state.pool, company_id)
        .await
        .map_err(|e| e.to_string())
}
