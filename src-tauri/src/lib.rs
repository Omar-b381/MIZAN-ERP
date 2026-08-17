pub mod activity;
pub mod auth;
pub mod commands;
pub mod companies;
pub mod db;
pub mod inventory;
pub mod modules;
pub mod partners;
pub mod products;
pub mod rbac;
pub mod settings;

#[cfg(test)]
mod tests;

use sqlx::SqlitePool;
use tauri::Manager;

pub struct AppState {
    pub pool: SqlitePool,
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::block_on(async move {
                let pool = db::init_app_db(&app_handle)
                    .await
                    .expect("Failed to initialize database");
                app_handle.manage(AppState { pool });
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Core
            commands::cmd_get_modules,
            commands::cmd_toggle_module,
            commands::cmd_login_user,
            commands::cmd_list_users,
            commands::cmd_create_user,
            commands::cmd_update_user,
            commands::cmd_list_roles,
            commands::cmd_list_permissions,
            commands::cmd_assign_role_permissions,
            commands::cmd_assign_user_roles,
            commands::cmd_list_companies,
            commands::cmd_get_company,
            commands::cmd_create_company,
            commands::cmd_update_company,
            commands::cmd_list_partners,
            commands::cmd_get_partner,
            commands::cmd_create_partner,
            commands::cmd_update_partner,
            commands::cmd_delete_partner,
            commands::cmd_get_settings,
            commands::cmd_set_setting,
            commands::cmd_get_recent_activities,
            commands::cmd_get_entity_activities,
            commands::cmd_log_activity,
            // Phase 2: Products
            commands::cmd_list_uoms,
            commands::cmd_list_product_categories,
            commands::cmd_create_product_category,
            commands::cmd_list_products,
            commands::cmd_get_product,
            commands::cmd_create_product,
            commands::cmd_update_product,
            commands::cmd_delete_product,
            // Phase 2: Inventory
            commands::cmd_list_locations,
            commands::cmd_create_location,
            commands::cmd_list_warehouses,
            commands::cmd_list_picking_types,
            commands::cmd_list_stock_quantities,
            commands::cmd_list_pickings,
            commands::cmd_get_picking,
            commands::cmd_get_picking_moves,
            commands::cmd_create_picking,
            commands::cmd_confirm_picking,
            commands::cmd_cancel_picking,
            commands::cmd_list_inventory_adjustments,
            commands::cmd_get_adjustment_lines,
            commands::cmd_create_inventory_adjustment,
            commands::cmd_update_adjustment_line_count,
            commands::cmd_validate_inventory_adjustment
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
