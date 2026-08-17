use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Company {
    pub id: i64,
    pub name: String,
    pub parent_id: Option<i64>,
    pub currency: String,
    pub timezone: String,
    pub tax_id: Option<String>,
    pub commercial_registry: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub website: Option<String>,
    pub street: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub zip: Option<String>,
    pub country: String,
    pub is_active: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCompanyInput {
    pub name: String,
    pub parent_id: Option<i64>,
    pub currency: Option<String>,
    pub timezone: Option<String>,
    pub tax_id: Option<String>,
    pub commercial_registry: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub website: Option<String>,
    pub street: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub zip: Option<String>,
    pub country: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCompanyInput {
    pub id: i64,
    pub name: String,
    pub parent_id: Option<i64>,
    pub currency: String,
    pub timezone: String,
    pub tax_id: Option<String>,
    pub commercial_registry: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub website: Option<String>,
    pub street: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub zip: Option<String>,
    pub country: String,
    pub is_active: i64,
}

pub async fn list_companies(pool: &SqlitePool) -> Result<Vec<Company>, sqlx::Error> {
    let companies = sqlx::query_as::<_, Company>(
        "SELECT id, name, parent_id, currency, timezone, tax_id, commercial_registry, phone, email, website, street, city, state, zip, country, is_active, created_at, updated_at FROM companies ORDER BY id ASC"
    )
    .fetch_all(pool)
    .await?;

    Ok(companies)
}

pub async fn get_company(pool: &SqlitePool, id: i64) -> Result<Option<Company>, sqlx::Error> {
    let company = sqlx::query_as::<_, Company>(
        "SELECT id, name, parent_id, currency, timezone, tax_id, commercial_registry, phone, email, website, street, city, state, zip, country, is_active, created_at, updated_at FROM companies WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(company)
}

pub async fn create_company(
    pool: &SqlitePool,
    input: CreateCompanyInput,
) -> Result<Company, sqlx::Error> {
    let currency = input.currency.unwrap_or_else(|| "EGP".to_string());
    let timezone = input.timezone.unwrap_or_else(|| "Africa/Cairo".to_string());
    let country = input.country.unwrap_or_else(|| "EG".to_string());

    let result = sqlx::query(
        "INSERT INTO companies (name, parent_id, currency, timezone, tax_id, commercial_registry, phone, email, website, street, city, state, zip, country, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)"
    )
    .bind(input.name)
    .bind(input.parent_id)
    .bind(currency)
    .bind(timezone)
    .bind(input.tax_id)
    .bind(input.commercial_registry)
    .bind(input.phone)
    .bind(input.email)
    .bind(input.website)
    .bind(input.street)
    .bind(input.city)
    .bind(input.state)
    .bind(input.zip)
    .bind(country)
    .execute(pool)
    .await?;

    let new_id = result.last_insert_rowid();
    let company = get_company(pool, new_id).await?.unwrap();
    Ok(company)
}

pub async fn update_company(
    pool: &SqlitePool,
    input: UpdateCompanyInput,
) -> Result<Company, sqlx::Error> {
    sqlx::query(
        "UPDATE companies SET name = ?, parent_id = ?, currency = ?, timezone = ?, tax_id = ?, commercial_registry = ?, phone = ?, email = ?, website = ?, street = ?, city = ?, state = ?, zip = ?, country = ?, is_active = ?, updated_at = DATETIME('now') WHERE id = ?"
    )
    .bind(input.name)
    .bind(input.parent_id)
    .bind(input.currency)
    .bind(input.timezone)
    .bind(input.tax_id)
    .bind(input.commercial_registry)
    .bind(input.phone)
    .bind(input.email)
    .bind(input.website)
    .bind(input.street)
    .bind(input.city)
    .bind(input.state)
    .bind(input.zip)
    .bind(input.country)
    .bind(input.is_active)
    .bind(input.id)
    .execute(pool)
    .await?;

    let company = get_company(pool, input.id).await?.unwrap();
    Ok(company)
}
