use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use crate::licensing;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ModuleRecord {
    pub key: String,
    pub category: String,
    pub is_active: bool,
    pub activated_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModuleToggleResult {
    pub key: String,
    pub is_active: bool,
    pub message: String,
}

/// Retrieves all registered modules with their active status.
pub async fn get_all_modules(pool: &SqlitePool) -> Result<Vec<ModuleRecord>, sqlx::Error> {
    let rows = sqlx::query_as::<_, ModuleRecord>(
        "SELECT key, category, (is_active = 1) AS is_active, activated_at, created_at FROM modules ORDER BY category, key"
    )
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

/// Checks if a specific module is currently active.
pub async fn is_module_active(pool: &SqlitePool, module_key: &str) -> Result<bool, sqlx::Error> {
    let active: Option<bool> = sqlx::query_scalar(
        "SELECT (is_active = 1) FROM modules WHERE key = ?"
    )
    .bind(module_key)
    .fetch_optional(pool)
    .await?;

    Ok(active.unwrap_or(false))
}

fn is_module_entitled(allowed: &[String], key: &str) -> bool {
    if allowed.iter().any(|m| m == "*" || m == key) {
        return true;
    }
    match key {
        "core" => true,
        "products" => allowed.iter().any(|m| m == "inventory" || m == "products"),
        "invoices" | "payments" => allowed.iter().any(|m| m == "accounting" || m == key),
        "employees" | "recruitment" | "timeoff" | "timesheet" => {
            allowed.iter().any(|m| m == "hr" || m == "employees" || m == key)
        }
        _ => false,
    }
}

/// Toggles module activation. When activating, verifies license entitlement or active trial.
pub async fn set_module_status(
    pool: &SqlitePool,
    module_key: &str,
    active: bool,
) -> Result<ModuleToggleResult, sqlx::Error> {
    if module_key == "core" && !active {
        return Err(sqlx::Error::Protocol("الوحدة الأساسية (Core) لا يمكن تعطيلها".into()));
    }

    if active {
        let license_status = licensing::get_license_and_trial_status(pool).await?;
        if !is_module_entitled(&license_status.allowed_modules, module_key) {
            let current_tier = license_status.tier;
            return Ok(ModuleToggleResult {
                key: module_key.to_string(),
                is_active: false,
                message: format!(
                    "هذه الوحدة غير متاحة في باقتك الحالية ({}). يرجى ترقية الترخيص لتفعيلها.",
                    current_tier
                ),
            });
        }

        sqlx::query(
            "UPDATE modules SET is_active = 1, activated_at = DATETIME('now') WHERE key = ?"
        )
        .bind(module_key)
        .execute(pool)
        .await?;
    } else {
        sqlx::query(
            "UPDATE modules SET is_active = 0 WHERE key = ?"
        )
        .bind(module_key)
        .execute(pool)
        .await?;
    }

    Ok(ModuleToggleResult {
        key: module_key.to_string(),
        is_active: active,
        message: if active {
            format!("Module '{}' activated successfully", module_key)
        } else {
            format!("Module '{}' deactivated without data loss", module_key)
        },
    })
}
