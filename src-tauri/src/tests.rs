use crate::db::init_db;
use crate::modules::{get_all_modules, is_module_active, set_module_status};
use tempfile::NamedTempFile;

#[tokio::test]
async fn test_db_initialization_and_migrations() {
    let temp_file = NamedTempFile::new().expect("Failed to create temp file");
    let db_url = format!("sqlite://{}", temp_file.path().to_string_lossy());

    let pool = init_db(&db_url).await.expect("Failed to init db");

    // Assert PRAGMA journal_mode is WAL
    let journal_mode: String = sqlx::query_scalar("PRAGMA journal_mode")
        .fetch_one(&pool)
        .await
        .expect("Failed to query journal_mode");
    assert_eq!(journal_mode.to_lowercase(), "wal");

    // Assert modules table is seeded
    let modules = get_all_modules(&pool).await.expect("Failed to get modules");
    assert!(!modules.is_empty(), "Modules catalog should not be empty");

    // Assert Core is active by default
    let core_active = is_module_active(&pool, "core").await.expect("Failed to check core status");
    assert!(core_active, "Core module must be active by default");

    // Assert Operations modules (e.g., sales, inventory) are inactive by default
    let sales_active = is_module_active(&pool, "sales").await.expect("Failed to check sales status");
    assert!(!sales_active, "Sales module must be inactive by default");
}

#[tokio::test]
async fn test_module_activation_and_deactivation() {
    let temp_file = NamedTempFile::new().expect("Failed to create temp file");
    let db_url = format!("sqlite://{}", temp_file.path().to_string_lossy());
    let pool = init_db(&db_url).await.expect("Failed to init db");

    // Activate Sales
    let result = set_module_status(&pool, "sales", true)
        .await
        .expect("Failed to activate sales");
    assert!(result.is_active);
    assert!(is_module_active(&pool, "sales").await.unwrap());

    // Deactivate Sales without data loss
    let result = set_module_status(&pool, "sales", false)
        .await
        .expect("Failed to deactivate sales");
    assert!(!result.is_active);
    assert!(!is_module_active(&pool, "sales").await.unwrap());

    // Guard: Core cannot be deactivated
    let result = set_module_status(&pool, "core", false)
        .await
        .expect("Failed to process core toggle");
    assert!(result.is_active, "Core module should remain active");
    assert!(is_module_active(&pool, "core").await.unwrap());
}
