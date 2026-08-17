use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Role {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Permission {
    pub id: i64,
    pub key: String,
    pub description: Option<String>,
    pub module_key: String,
}

#[derive(Debug, Clone, FromRow)]
struct KeyOnly {
    pub key: String,
}

#[derive(Debug, Clone, FromRow)]
struct IdOnly {
    pub id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoleWithPermissions {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub permissions: Vec<String>,
}

pub async fn list_roles(pool: &SqlitePool) -> Result<Vec<RoleWithPermissions>, sqlx::Error> {
    let roles = sqlx::query_as::<_, Role>(
        "SELECT id, name, description, created_at FROM roles ORDER BY id ASC"
    )
    .fetch_all(pool)
    .await?;

    let mut result = Vec::new();
    for role in roles {
        let perms = sqlx::query_as::<_, KeyOnly>(
            "SELECT p.key FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?"
        )
        .bind(role.id)
        .fetch_all(pool)
        .await?;

        let perm_keys = perms.into_iter().map(|p| p.key).collect();
        result.push(RoleWithPermissions {
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: perm_keys,
        });
    }

    Ok(result)
}

pub async fn list_permissions(pool: &SqlitePool) -> Result<Vec<Permission>, sqlx::Error> {
    let permissions = sqlx::query_as::<_, Permission>(
        "SELECT id, key, description, module_key FROM permissions ORDER BY module_key ASC, key ASC"
    )
    .fetch_all(pool)
    .await?;

    Ok(permissions)
}

pub async fn get_user_permissions(
    pool: &SqlitePool,
    user_id: i64,
) -> Result<Vec<String>, sqlx::Error> {
    let perms = sqlx::query_as::<_, KeyOnly>(
        "SELECT DISTINCT p.key FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id JOIN user_roles ur ON rp.role_id = ur.role_id WHERE ur.user_id = ?"
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(perms.into_iter().map(|r| r.key).collect())
}

pub async fn get_user_roles(
    pool: &SqlitePool,
    user_id: i64,
) -> Result<Vec<Role>, sqlx::Error> {
    let roles = sqlx::query_as::<_, Role>(
        "SELECT r.id, r.name, r.description, r.created_at FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?"
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(roles)
}

pub async fn assign_user_roles(
    pool: &SqlitePool,
    user_id: i64,
    role_ids: Vec<i64>,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM user_roles WHERE user_id = ?")
        .bind(user_id)
        .execute(pool)
        .await?;

    for role_id in role_ids {
        sqlx::query("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)")
            .bind(user_id)
            .bind(role_id)
            .execute(pool)
            .await?;
    }

    Ok(())
}

pub async fn assign_role_permissions(
    pool: &SqlitePool,
    role_id: i64,
    permission_keys: Vec<String>,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM role_permissions WHERE role_id = ?")
        .bind(role_id)
        .execute(pool)
        .await?;

    for key in permission_keys {
        if let Some(perm) = sqlx::query_as::<_, IdOnly>("SELECT id FROM permissions WHERE key = ?")
            .bind(&key)
            .fetch_optional(pool)
            .await?
        {
            sqlx::query("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)")
                .bind(role_id)
                .bind(perm.id)
                .execute(pool)
                .await?;
        }
    }

    Ok(())
}
