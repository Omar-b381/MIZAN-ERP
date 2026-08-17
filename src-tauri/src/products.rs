use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UomCategory {
    pub id: i64,
    pub name: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Uom {
    pub id: i64,
    pub category_id: i64,
    pub name: String,
    pub uom_type: String, // 'reference', 'bigger', 'smaller'
    pub ratio: f64,
    pub rounding: f64,
    pub is_active: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProductCategory {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub parent_id: Option<i64>,
    pub complete_name: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Product {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub sku: String,
    pub barcode: Option<String>,
    pub description: Option<String>,
    pub r#type: String, // 'storable', 'consumable', 'service'
    pub category_id: Option<i64>,
    pub uom_id: i64,
    pub purchase_uom_id: i64,
    pub sale_price_cents: i64,
    pub cost_price_cents: i64,
    pub tracking_mode: String, // 'none', 'lot', 'serial'
    pub min_stock_milli: i64,
    pub max_stock_milli: i64,
    pub is_active: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductWithStock {
    pub product: Product,
    pub category_name: Option<String>,
    pub uom_name: String,
    pub qty_on_hand_milli: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateProductInput {
    pub company_id: i64,
    pub name: String,
    pub sku: String,
    pub barcode: Option<String>,
    pub description: Option<String>,
    pub r#type: Option<String>,
    pub category_id: Option<i64>,
    pub uom_id: i64,
    pub purchase_uom_id: Option<i64>,
    pub sale_price_cents: Option<i64>,
    pub cost_price_cents: Option<i64>,
    pub tracking_mode: Option<String>,
    pub min_stock_milli: Option<i64>,
    pub max_stock_milli: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProductInput {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub sku: String,
    pub barcode: Option<String>,
    pub description: Option<String>,
    pub r#type: String,
    pub category_id: Option<i64>,
    pub uom_id: i64,
    pub purchase_uom_id: i64,
    pub sale_price_cents: i64,
    pub cost_price_cents: i64,
    pub tracking_mode: String,
    pub min_stock_milli: i64,
    pub max_stock_milli: i64,
    pub is_active: i64,
}

#[derive(Debug, Deserialize, Default)]
pub struct ProductFilter {
    pub company_id: Option<i64>,
    pub category_id: Option<i64>,
    pub r#type: Option<String>,
    pub tracking_mode: Option<String>,
    pub is_active: Option<bool>,
    pub search: Option<String>,
}

pub async fn list_uoms(pool: &SqlitePool) -> Result<Vec<Uom>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Uom>(
        "SELECT id, category_id, name, uom_type, ratio, rounding, is_active, created_at FROM uoms WHERE is_active = 1 ORDER BY category_id ASC, id ASC"
    )
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

pub async fn list_uom_categories(pool: &SqlitePool) -> Result<Vec<UomCategory>, sqlx::Error> {
    let rows = sqlx::query_as::<_, UomCategory>(
        "SELECT id, name, created_at FROM uom_categories ORDER BY id ASC"
    )
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

pub async fn list_product_categories(
    pool: &SqlitePool,
    company_id: i64,
) -> Result<Vec<ProductCategory>, sqlx::Error> {
    let rows = sqlx::query_as::<_, ProductCategory>(
        "SELECT id, company_id, name, parent_id, complete_name, created_at FROM product_categories WHERE company_id = ? ORDER BY id ASC"
    )
    .bind(company_id)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

pub async fn create_product_category(
    pool: &SqlitePool,
    company_id: i64,
    name: String,
    parent_id: Option<i64>,
) -> Result<ProductCategory, sqlx::Error> {
    let complete_name = if let Some(pid) = parent_id {
        let parent: Option<(String,)> = sqlx::query_as("SELECT complete_name FROM product_categories WHERE id = ?")
            .bind(pid)
            .fetch_optional(pool)
            .await?;
        if let Some((p_name,)) = parent {
            format!("{} / {}", p_name, name)
        } else {
            name.clone()
        }
    } else {
        name.clone()
    };

    let result = sqlx::query(
        "INSERT INTO product_categories (company_id, name, parent_id, complete_name) VALUES (?, ?, ?, ?)"
    )
    .bind(company_id)
    .bind(&name)
    .bind(parent_id)
    .bind(&complete_name)
    .execute(pool)
    .await?;

    let new_id = result.last_insert_rowid();
    let row = sqlx::query_as::<_, ProductCategory>(
        "SELECT id, company_id, name, parent_id, complete_name, created_at FROM product_categories WHERE id = ?"
    )
    .bind(new_id)
    .fetch_one(pool)
    .await?;

    Ok(row)
}

pub async fn list_products(
    pool: &SqlitePool,
    filter: ProductFilter,
) -> Result<Vec<ProductWithStock>, sqlx::Error> {
    let mut query = r#"
        SELECT 
            p.id, p.company_id, p.name, p.sku, p.barcode, p.description, p.type, 
            p.category_id, p.uom_id, p.purchase_uom_id, p.sale_price_cents, p.cost_price_cents, 
            p.tracking_mode, p.min_stock_milli, p.max_stock_milli, p.is_active, p.created_at, p.updated_at,
            c.name as category_name,
            u.name as uom_name,
            COALESCE(
                (SELECT SUM(q.quantity_milli) 
                 FROM stock_quantities q 
                 JOIN stock_locations loc ON q.location_id = loc.id 
                 WHERE q.product_id = p.id AND loc.location_type = 'internal'), 
                0
            ) as qty_on_hand_milli
        FROM products p
        LEFT JOIN product_categories c ON p.category_id = c.id
        LEFT JOIN uoms u ON p.uom_id = u.id
        WHERE 1=1
    "#.to_string();

    if let Some(cid) = filter.company_id {
        query.push_str(&format!(" AND p.company_id = {}", cid));
    }

    if let Some(cat_id) = filter.category_id {
        query.push_str(&format!(" AND p.category_id = {}", cat_id));
    }

    if let Some(ptype) = &filter.r#type {
        if ptype != "all" && !ptype.is_empty() {
            query.push_str(&format!(" AND p.type = '{}'", ptype.replace('\'', "''")));
        }
    }

    if let Some(track) = &filter.tracking_mode {
        if track != "all" && !track.is_empty() {
            query.push_str(&format!(" AND p.tracking_mode = '{}'", track.replace('\'', "''")));
        }
    }

    if let Some(active) = filter.is_active {
        query.push_str(&format!(" AND p.is_active = {}", if active { 1 } else { 0 }));
    }

    if let Some(s) = &filter.search {
        if !s.trim().is_empty() {
            let term = format!("%{}%", s.trim().replace('\'', "''"));
            query.push_str(&format!(
                " AND (p.name LIKE '{}' OR p.sku LIKE '{}' OR p.barcode LIKE '{}')",
                term, term, term
            ));
        }
    }

    query.push_str(" ORDER BY p.id DESC");

    #[derive(FromRow)]
    struct ProductRow {
        id: i64,
        company_id: i64,
        name: String,
        sku: String,
        barcode: Option<String>,
        description: Option<String>,
        r#type: String,
        category_id: Option<i64>,
        uom_id: i64,
        purchase_uom_id: i64,
        sale_price_cents: i64,
        cost_price_cents: i64,
        tracking_mode: String,
        min_stock_milli: i64,
        max_stock_milli: i64,
        is_active: i64,
        created_at: String,
        updated_at: String,
        category_name: Option<String>,
        uom_name: Option<String>,
        qty_on_hand_milli: i64,
    }

    let rows = sqlx::query_as::<_, ProductRow>(&query)
        .fetch_all(pool)
        .await?;

    let products = rows
        .into_iter()
        .map(|r| ProductWithStock {
            product: Product {
                id: r.id,
                company_id: r.company_id,
                name: r.name,
                sku: r.sku,
                barcode: r.barcode,
                description: r.description,
                r#type: r.r#type,
                category_id: r.category_id,
                uom_id: r.uom_id,
                purchase_uom_id: r.purchase_uom_id,
                sale_price_cents: r.sale_price_cents,
                cost_price_cents: r.cost_price_cents,
                tracking_mode: r.tracking_mode,
                min_stock_milli: r.min_stock_milli,
                max_stock_milli: r.max_stock_milli,
                is_active: r.is_active,
                created_at: r.created_at,
                updated_at: r.updated_at,
            },
            category_name: r.category_name,
            uom_name: r.uom_name.unwrap_or_else(|| "Unit".to_string()),
            qty_on_hand_milli: r.qty_on_hand_milli,
        })
        .collect();

    Ok(products)
}

pub async fn get_product_by_id(
    pool: &SqlitePool,
    id: i64,
) -> Result<Option<Product>, sqlx::Error> {
    let row = sqlx::query_as::<_, Product>(
        "SELECT id, company_id, name, sku, barcode, description, type, category_id, uom_id, purchase_uom_id, sale_price_cents, cost_price_cents, tracking_mode, min_stock_milli, max_stock_milli, is_active, created_at, updated_at FROM products WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(row)
}

pub async fn create_product(
    pool: &SqlitePool,
    input: CreateProductInput,
) -> Result<Product, sqlx::Error> {
    let p_type = input.r#type.unwrap_or_else(|| "storable".to_string());
    let purchase_uom = input.purchase_uom_id.unwrap_or(input.uom_id);
    let sale_price = input.sale_price_cents.unwrap_or(0);
    let cost_price = input.cost_price_cents.unwrap_or(0);
    let tracking = input.tracking_mode.unwrap_or_else(|| "none".to_string());
    let min_stock = input.min_stock_milli.unwrap_or(0);
    let max_stock = input.max_stock_milli.unwrap_or(0);

    let result = sqlx::query(
        r#"
        INSERT INTO products (
            company_id, name, sku, barcode, description, type, category_id, 
            uom_id, purchase_uom_id, sale_price_cents, cost_price_cents, 
            tracking_mode, min_stock_milli, max_stock_milli, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        "#
    )
    .bind(input.company_id)
    .bind(input.name)
    .bind(input.sku)
    .bind(input.barcode)
    .bind(input.description)
    .bind(p_type)
    .bind(input.category_id)
    .bind(input.uom_id)
    .bind(purchase_uom)
    .bind(sale_price)
    .bind(cost_price)
    .bind(tracking)
    .bind(min_stock)
    .bind(max_stock)
    .execute(pool)
    .await?;

    let new_id = result.last_insert_rowid();
    let product = get_product_by_id(pool, new_id).await?.unwrap();
    Ok(product)
}

pub async fn update_product(
    pool: &SqlitePool,
    input: UpdateProductInput,
) -> Result<Product, sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE products SET 
            company_id = ?, name = ?, sku = ?, barcode = ?, description = ?, 
            type = ?, category_id = ?, uom_id = ?, purchase_uom_id = ?, 
            sale_price_cents = ?, cost_price_cents = ?, tracking_mode = ?, 
            min_stock_milli = ?, max_stock_milli = ?, is_active = ?, updated_at = DATETIME('now')
        WHERE id = ?
        "#
    )
    .bind(input.company_id)
    .bind(input.name)
    .bind(input.sku)
    .bind(input.barcode)
    .bind(input.description)
    .bind(input.r#type)
    .bind(input.category_id)
    .bind(input.uom_id)
    .bind(input.purchase_uom_id)
    .bind(input.sale_price_cents)
    .bind(input.cost_price_cents)
    .bind(input.tracking_mode)
    .bind(input.min_stock_milli)
    .bind(input.max_stock_milli)
    .bind(input.is_active)
    .bind(input.id)
    .execute(pool)
    .await?;

    let product = get_product_by_id(pool, input.id).await?.unwrap();
    Ok(product)
}

pub async fn delete_product(pool: &SqlitePool, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE products SET is_active = 0, updated_at = DATETIME('now') WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}
