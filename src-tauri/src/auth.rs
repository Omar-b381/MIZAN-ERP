use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::{FromRow, SqlitePool};
use uuid::Uuid;

use crate::rbac::{get_user_permissions, get_user_roles, Role};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: i64,
    pub company_id: i64,
    pub username: String,
    pub email: Option<String>,
    pub full_name: String,
    pub is_active: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, FromRow)]
#[allow(dead_code)]
struct UserAuthRecord {
    pub id: i64,
    pub company_id: i64,
    pub username: String,
    pub email: Option<String>,
    pub password_hash: String,
    pub salt: String,
    pub full_name: String,
    pub is_active: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionUser {
    pub id: i64,
    pub company_id: i64,
    pub username: String,
    pub email: Option<String>,
    pub full_name: String,
    pub roles: Vec<Role>,
    pub permissions: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginInput {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserInput {
    pub company_id: i64,
    pub username: String,
    pub email: Option<String>,
    pub password: String,
    pub full_name: String,
    pub role_ids: Vec<i64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserInput {
    pub id: i64,
    pub company_id: i64,
    pub email: Option<String>,
    pub full_name: String,
    pub is_active: i64,
    pub role_ids: Option<Vec<i64>>,
    pub new_password: Option<String>,
}

pub fn hash_password(password: &str, salt: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    hasher.update(salt.as_bytes());
    hex::encode(hasher.finalize())
}

pub async fn list_users(pool: &SqlitePool, company_id: Option<i64>) -> Result<Vec<User>, sqlx::Error> {
    let users = if let Some(cid) = company_id {
        sqlx::query_as::<_, User>(
            "SELECT id, company_id, username, email, full_name, is_active, created_at, updated_at FROM users WHERE company_id = ? ORDER BY id ASC"
        )
        .bind(cid)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, User>(
            "SELECT id, company_id, username, email, full_name, is_active, created_at, updated_at FROM users ORDER BY id ASC"
        )
        .fetch_all(pool)
        .await?
    };

    Ok(users)
}

pub async fn get_user_by_id(pool: &SqlitePool, id: i64) -> Result<Option<User>, sqlx::Error> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, company_id, username, email, full_name, is_active, created_at, updated_at FROM users WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

pub async fn login(pool: &SqlitePool, input: LoginInput) -> Result<Option<SessionUser>, sqlx::Error> {
    let row = sqlx::query_as::<_, UserAuthRecord>(
        "SELECT id, company_id, username, email, password_hash, salt, full_name, is_active FROM users WHERE username = ? AND is_active = 1"
    )
    .bind(input.username)
    .fetch_optional(pool)
    .await?;

    if let Some(user) = row {
        let computed_hash = hash_password(&input.password, &user.salt);
        if computed_hash == user.password_hash {
            let roles = get_user_roles(pool, user.id).await?;
            let permissions = get_user_permissions(pool, user.id).await?;

            return Ok(Some(SessionUser {
                id: user.id,
                company_id: user.company_id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                roles,
                permissions,
            }));
        }
    }

    Ok(None)
}

pub async fn create_user(pool: &SqlitePool, input: CreateUserInput) -> Result<User, sqlx::Error> {
    let salt = Uuid::new_v4().to_string();
    let password_hash = hash_password(&input.password, &salt);

    let result = sqlx::query(
        "INSERT INTO users (company_id, username, email, password_hash, salt, full_name, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)"
    )
    .bind(input.company_id)
    .bind(input.username)
    .bind(input.email)
    .bind(password_hash)
    .bind(salt)
    .bind(input.full_name)
    .execute(pool)
    .await?;

    let user_id = result.last_insert_rowid();

    for role_id in input.role_ids {
        sqlx::query("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)")
            .bind(user_id)
            .bind(role_id)
            .execute(pool)
            .await?;
    }

    let created = get_user_by_id(pool, user_id).await?.unwrap();
    Ok(created)
}

pub async fn update_user(pool: &SqlitePool, input: UpdateUserInput) -> Result<User, sqlx::Error> {
    if let Some(new_pwd) = input.new_password {
        if !new_pwd.trim().is_empty() {
            let salt = Uuid::new_v4().to_string();
            let password_hash = hash_password(&new_pwd, &salt);
            sqlx::query("UPDATE users SET password_hash = ?, salt = ?, updated_at = DATETIME('now') WHERE id = ?")
                .bind(password_hash)
                .bind(salt)
                .bind(input.id)
                .execute(pool)
                .await?;
        }
    }

    sqlx::query("UPDATE users SET company_id = ?, email = ?, full_name = ?, is_active = ?, updated_at = DATETIME('now') WHERE id = ?")
        .bind(input.company_id)
        .bind(input.email)
        .bind(input.full_name)
        .bind(input.is_active)
        .bind(input.id)
        .execute(pool)
        .await?;

    if let Some(role_ids) = input.role_ids {
        crate::rbac::assign_user_roles(pool, input.id, role_ids).await?;
    }

    let updated = get_user_by_id(pool, input.id).await?.unwrap();
    Ok(updated)
}
