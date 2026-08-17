use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Setting {
    pub key: String,
    pub company_id: i64,
    pub value: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSettingInput {
    pub key: String,
    pub company_id: i64,
    pub value: String,
}

pub async fn get_company_settings(
    pool: &SqlitePool,
    company_id: i64,
) -> Result<HashMap<String, String>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Setting>(
        "SELECT key, company_id, value, created_at, updated_at FROM settings WHERE company_id = ?"
    )
    .bind(company_id)
    .fetch_all(pool)
    .await?;

    let mut map = HashMap::new();
    for row in rows {
        map.insert(row.key, row.value);
    }

    Ok(map)
}

pub async fn set_setting(
    pool: &SqlitePool,
    input: UpdateSettingInput,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO settings (key, company_id, value, updated_at) VALUES (?, ?, ?, DATETIME('now')) ON CONFLICT(key, company_id) DO UPDATE SET value = excluded.value, updated_at = DATETIME('now')"
    )
    .bind(input.key)
    .bind(input.company_id)
    .bind(input.value)
    .execute(pool)
    .await?;

    Ok(())
}
