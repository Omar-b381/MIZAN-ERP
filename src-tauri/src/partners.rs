use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Partner {
    pub id: i64,
    pub company_id: i64,
    pub parent_id: Option<i64>,
    pub name: String,
    pub sub_type: String, // 'customer', 'vendor', 'partner', 'contact'
    pub is_company: i64,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub mobile: Option<String>,
    pub tax_id: Option<String>,
    pub commercial_registry: Option<String>,
    pub street: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: String,
    pub credit_limit_cents: i64,
    pub notes: Option<String>,
    pub is_active: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePartnerInput {
    pub company_id: i64,
    pub parent_id: Option<i64>,
    pub name: String,
    pub sub_type: String,
    pub is_company: bool,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub mobile: Option<String>,
    pub tax_id: Option<String>,
    pub commercial_registry: Option<String>,
    pub street: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub credit_limit_cents: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePartnerInput {
    pub id: i64,
    pub company_id: i64,
    pub parent_id: Option<i64>,
    pub name: String,
    pub sub_type: String,
    pub is_company: bool,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub mobile: Option<String>,
    pub tax_id: Option<String>,
    pub commercial_registry: Option<String>,
    pub street: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: String,
    pub credit_limit_cents: i64,
    pub notes: Option<String>,
    pub is_active: i64,
}

#[derive(Debug, Deserialize, Default)]
pub struct PartnerFilter {
    pub company_id: Option<i64>,
    pub sub_type: Option<String>,
    pub is_active: Option<bool>,
    pub search: Option<String>,
}

pub async fn list_partners(
    pool: &SqlitePool,
    filter: PartnerFilter,
) -> Result<Vec<Partner>, sqlx::Error> {
    let mut query = "SELECT id, company_id, parent_id, name, sub_type, is_company, email, phone, mobile, tax_id, commercial_registry, street, city, state, country, credit_limit_cents, notes, is_active, created_at, updated_at FROM partners WHERE 1=1".to_string();

    if let Some(cid) = filter.company_id {
        query.push_str(&format!(" AND company_id = {}", cid));
    }

    if let Some(sub) = &filter.sub_type {
        if sub != "all" && !sub.is_empty() {
            query.push_str(&format!(" AND sub_type = '{}'", sub.replace('\'', "''")));
        }
    }

    if let Some(active) = filter.is_active {
        query.push_str(&format!(" AND is_active = {}", if active { 1 } else { 0 }));
    }

    if let Some(search) = &filter.search {
        if !search.trim().is_empty() {
            let s = format!("%{}%", search.trim().replace('\'', "''"));
            query.push_str(&format!(
                " AND (name LIKE '{}' OR email LIKE '{}' OR phone LIKE '{}' OR tax_id LIKE '{}')",
                s, s, s, s
            ));
        }
    }

    query.push_str(" ORDER BY id DESC");

    let partners = sqlx::query_as::<_, Partner>(&query)
        .fetch_all(pool)
        .await?;

    Ok(partners)
}

pub async fn get_partner_by_id(pool: &SqlitePool, id: i64) -> Result<Option<Partner>, sqlx::Error> {
    let partner = sqlx::query_as::<_, Partner>(
        "SELECT id, company_id, parent_id, name, sub_type, is_company, email, phone, mobile, tax_id, commercial_registry, street, city, state, country, credit_limit_cents, notes, is_active, created_at, updated_at FROM partners WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(partner)
}

pub async fn create_partner(
    pool: &SqlitePool,
    input: CreatePartnerInput,
) -> Result<Partner, sqlx::Error> {
    let country = input.country.unwrap_or_else(|| "EG".to_string());
    let credit_limit = input.credit_limit_cents.unwrap_or(0);
    let is_comp = if input.is_company { 1 } else { 0 };

    let result = sqlx::query(
        "INSERT INTO partners (company_id, parent_id, name, sub_type, is_company, email, phone, mobile, tax_id, commercial_registry, street, city, state, country, credit_limit_cents, notes, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)"
    )
    .bind(input.company_id)
    .bind(input.parent_id)
    .bind(input.name)
    .bind(input.sub_type)
    .bind(is_comp)
    .bind(input.email)
    .bind(input.phone)
    .bind(input.mobile)
    .bind(input.tax_id)
    .bind(input.commercial_registry)
    .bind(input.street)
    .bind(input.city)
    .bind(input.state)
    .bind(country)
    .bind(credit_limit)
    .bind(input.notes)
    .execute(pool)
    .await?;

    let new_id = result.last_insert_rowid();
    let partner = get_partner_by_id(pool, new_id).await?.unwrap();
    Ok(partner)
}

pub async fn update_partner(
    pool: &SqlitePool,
    input: UpdatePartnerInput,
) -> Result<Partner, sqlx::Error> {
    let is_comp = if input.is_company { 1 } else { 0 };

    sqlx::query(
        "UPDATE partners SET company_id = ?, parent_id = ?, name = ?, sub_type = ?, is_company = ?, email = ?, phone = ?, mobile = ?, tax_id = ?, commercial_registry = ?, street = ?, city = ?, state = ?, country = ?, credit_limit_cents = ?, notes = ?, is_active = ?, updated_at = DATETIME('now') WHERE id = ?"
    )
    .bind(input.company_id)
    .bind(input.parent_id)
    .bind(input.name)
    .bind(input.sub_type)
    .bind(is_comp)
    .bind(input.email)
    .bind(input.phone)
    .bind(input.mobile)
    .bind(input.tax_id)
    .bind(input.commercial_registry)
    .bind(input.street)
    .bind(input.city)
    .bind(input.state)
    .bind(input.country)
    .bind(input.credit_limit_cents)
    .bind(input.notes)
    .bind(input.is_active)
    .bind(input.id)
    .execute(pool)
    .await?;

    let partner = get_partner_by_id(pool, input.id).await?.unwrap();
    Ok(partner)
}

pub async fn delete_partner(pool: &SqlitePool, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE partners SET is_active = 0, updated_at = DATETIME('now') WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}
