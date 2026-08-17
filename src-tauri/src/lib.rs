pub mod db;
pub mod modules;

#[cfg(test)]
mod tests;

use db::{init_db, DbPool};
use modules::{get_all_modules, set_module_status, ModuleRecord, ModuleToggleResult};
use std::sync::Arc;
use tauri::{Manager, State};

pub struct AppState {
    pub db: DbPool,
}

#[tauri::command]
async fn list_modules(state: State<'_, Arc<AppState>>) -> Result<Vec<ModuleRecord>, String> {
    get_all_modules(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn toggle_module(
    key: String,
    active: bool,
    state: State<'_, Arc<AppState>>,
) -> Result<ModuleToggleResult, String> {
    set_module_status(&state.db, &key, active)
        .await
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle();
            
            // Resolve local app data directory for SQLite database
            let app_data_dir = app_handle
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));
            
            std::fs::create_dir_all(&app_data_dir).ok();
            let db_path = app_data_dir.join("mizan_erp.db");
            let database_url = format!("sqlite://{}", db_path.to_string_lossy());

            // Initialize database asynchronously in tokio runtime
            let pool = tokio::task::block_in_place(|| {
                tokio::runtime::Handle::current().block_on(async {
                    init_db(&database_url)
                        .await
                        .expect("Failed to initialize SQLite database and migrations")
                })
            });

            let state = Arc::new(AppState { db: pool });
            app.manage(state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![list_modules, toggle_module])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
