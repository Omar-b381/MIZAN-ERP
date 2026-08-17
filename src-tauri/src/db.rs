use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePool, SqlitePoolOptions, SqliteSynchronous};
use std::fs;
use std::str::FromStr;
use std::time::Duration;
use tauri::Manager;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DbError {
    #[error("Database error: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("Migration error: {0}")]
    Migrate(#[from] sqlx::migrate::MigrateError),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Tauri path error: {0}")]
    Tauri(String),
}

pub type DbPool = SqlitePool;

/// Initializes a SQLite connection pool with WAL mode, foreign keys, and executes migrations.
pub async fn init_db(database_url: &str) -> Result<DbPool, DbError> {
    let connect_options = SqliteConnectOptions::from_str(database_url)?
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal)
        .busy_timeout(Duration::from_secs(5))
        .foreign_keys(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .min_connections(1)
        .acquire_timeout(Duration::from_secs(5))
        .connect_with(connect_options)
        .await?;

    // Run embedded migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    Ok(pool)
}

pub async fn init_app_db(app: &tauri::AppHandle) -> Result<DbPool, DbError> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| DbError::Tauri(e.to_string()))?;

    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)?;
    }

    let db_path = app_dir.join("mizan_erp.db");
    let db_url = format!("sqlite://{}", db_path.to_string_lossy());

    init_db(&db_url).await
}
