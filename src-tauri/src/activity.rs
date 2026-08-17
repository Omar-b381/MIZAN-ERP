use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ActivityLog {
    pub id: i64,
    pub company_id: i64,
    pub entity_type: String,
    pub entity_id: i64,
    pub user_id: Option<i64>,
    pub action: String,
    pub summary: String,
    pub details_json: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct LogActivityInput {
    pub company_id: i64,
    pub entity_type: String,
    pub entity_id: i64,
    pub user_id: Option<i64>,
    pub action: String,
    pub summary: String,
    pub details_json: Option<String>,
}

pub async fn log_activity(pool: &SqlitePool, input: LogActivityInput) -> Result<i64, sqlx::Error> {
    let result = sqlx::query(
        "INSERT INTO activity_logs (company_id, entity_type, entity_id, user_id, action, summary, details_json) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(input.company_id)
    .bind(input.entity_type)
    .bind(input.entity_id)
    .bind(input.user_id)
    .bind(input.action)
    .bind(input.summary)
    .bind(input.details_json)
    .execute(pool)
    .await?;

    Ok(result.last_insert_rowid())
}

pub async fn get_entity_activities(
    pool: &SqlitePool,
    entity_type: &str,
    entity_id: i64,
) -> Result<Vec<ActivityLog>, sqlx::Error> {
    let logs = sqlx::query_as::<_, ActivityLog>(
        "SELECT id, company_id, entity_type, entity_id, user_id, action, summary, details_json, created_at FROM activity_logs WHERE entity_type = ? AND entity_id = ? ORDER BY id DESC"
    )
    .bind(entity_type)
    .bind(entity_id)
    .fetch_all(pool)
    .await?;

    Ok(logs)
}

pub async fn get_recent_activities(
    pool: &SqlitePool,
    company_id: i64,
    limit: i64,
) -> Result<Vec<ActivityLog>, sqlx::Error> {
    let logs = sqlx::query_as::<_, ActivityLog>(
        "SELECT id, company_id, entity_type, entity_id, user_id, action, summary, details_json, created_at FROM activity_logs WHERE company_id = ? ORDER BY id DESC LIMIT ?"
    )
    .bind(company_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(logs)
}
