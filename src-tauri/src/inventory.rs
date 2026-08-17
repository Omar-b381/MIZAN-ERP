use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct StockLocation {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub parent_id: Option<i64>,
    pub complete_name: String,
    pub location_type: String, // 'view', 'internal', 'customer', 'supplier', 'inventory_loss', 'production'
    pub is_active: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct StockWarehouse {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub code: String,
    pub view_location_id: i64,
    pub lot_stock_location_id: i64,
    pub is_active: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct StockPickingType {
    pub id: i64,
    pub company_id: i64,
    pub warehouse_id: Option<i64>,
    pub name: String,
    pub code: String, // 'incoming', 'outgoing', 'internal', 'adjustment'
    pub sequence_prefix: String,
    pub next_number: i64,
    pub default_src_location_id: Option<i64>,
    pub default_dest_location_id: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct StockPicking {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub picking_type_id: i64,
    pub partner_id: Option<i64>,
    pub src_location_id: i64,
    pub dest_location_id: i64,
    pub scheduled_date: Option<String>,
    pub date_done: Option<String>,
    pub origin: Option<String>,
    pub state: String, // 'draft', 'waiting', 'confirmed', 'done', 'cancelled'
    pub note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct StockMove {
    pub id: i64,
    pub company_id: i64,
    pub picking_id: Option<i64>,
    pub product_id: i64,
    pub name: String,
    pub src_location_id: i64,
    pub dest_location_id: i64,
    pub quantity_milli: i64,
    pub uom_id: i64,
    pub state: String, // 'draft', 'confirmed', 'done', 'cancelled'
    pub reference: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct StockMoveLine {
    pub id: i64,
    pub move_id: i64,
    pub product_id: i64,
    pub src_location_id: i64,
    pub dest_location_id: i64,
    pub lot_serial_number: Option<String>,
    pub quantity_milli: i64,
    pub state: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct StockQuantity {
    pub id: i64,
    pub company_id: i64,
    pub product_id: i64,
    pub location_id: i64,
    pub lot_serial_number: String,
    pub quantity_milli: i64,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockQuantityDetail {
    pub id: i64,
    pub company_id: i64,
    pub product_id: i64,
    pub product_name: String,
    pub sku: String,
    pub location_id: i64,
    pub location_name: String,
    pub location_type: String,
    pub lot_serial_number: String,
    pub quantity_milli: i64,
    pub uom_name: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct StockInventoryAdjustment {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub location_id: i64,
    pub state: String, // 'draft', 'in_progress', 'done', 'cancelled'
    pub accounting_date: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct StockInventoryAdjustmentLine {
    pub id: i64,
    pub adjustment_id: i64,
    pub product_id: i64,
    pub lot_serial_number: String,
    pub theoretical_qty_milli: i64,
    pub counted_qty_milli: i64,
    pub difference_qty_milli: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockInventoryAdjustmentLineDetail {
    pub id: i64,
    pub adjustment_id: i64,
    pub product_id: i64,
    pub product_name: String,
    pub sku: String,
    pub lot_serial_number: String,
    pub theoretical_qty_milli: i64,
    pub counted_qty_milli: i64,
    pub difference_qty_milli: i64,
    pub uom_name: String,
}

// ----------------------------------------------------
// Inputs
// ----------------------------------------------------
#[derive(Debug, Deserialize)]
pub struct CreateLocationInput {
    pub company_id: i64,
    pub name: String,
    pub parent_id: Option<i64>,
    pub location_type: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePickingMoveInput {
    pub product_id: i64,
    pub quantity_milli: i64,
    pub uom_id: i64,
    pub lot_serial_number: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePickingInput {
    pub company_id: i64,
    pub picking_type_id: i64,
    pub partner_id: Option<i64>,
    pub src_location_id: Option<i64>,
    pub dest_location_id: Option<i64>,
    pub scheduled_date: Option<String>,
    pub origin: Option<String>,
    pub note: Option<String>,
    pub moves: Vec<CreatePickingMoveInput>,
}

#[derive(Debug, Deserialize)]
pub struct CreateInventoryAdjustmentInput {
    pub company_id: i64,
    pub name: String,
    pub location_id: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAdjustmentLineCountInput {
    pub line_id: i64,
    pub counted_qty_milli: i64,
}

// ----------------------------------------------------
// Locations & Warehouses Service
// ----------------------------------------------------
pub async fn list_locations(
    pool: &SqlitePool,
    company_id: i64,
) -> Result<Vec<StockLocation>, sqlx::Error> {
    let rows = sqlx::query_as::<_, StockLocation>(
        "SELECT id, company_id, name, parent_id, complete_name, location_type, is_active, created_at FROM stock_locations WHERE company_id = ? AND is_active = 1 ORDER BY id ASC"
    )
    .bind(company_id)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

pub async fn get_location_by_id(
    pool: &SqlitePool,
    id: i64,
) -> Result<Option<StockLocation>, sqlx::Error> {
    let row = sqlx::query_as::<_, StockLocation>(
        "SELECT id, company_id, name, parent_id, complete_name, location_type, is_active, created_at FROM stock_locations WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(row)
}

pub async fn create_location(
    pool: &SqlitePool,
    input: CreateLocationInput,
) -> Result<StockLocation, sqlx::Error> {
    let complete_name = if let Some(pid) = input.parent_id {
        let parent = get_location_by_id(pool, pid).await?;
        if let Some(p) = parent {
            format!("{} / {}", p.complete_name, input.name)
        } else {
            input.name.clone()
        }
    } else {
        input.name.clone()
    };

    let result = sqlx::query(
        "INSERT INTO stock_locations (company_id, name, parent_id, complete_name, location_type, is_active) VALUES (?, ?, ?, ?, ?, 1)"
    )
    .bind(input.company_id)
    .bind(&input.name)
    .bind(input.parent_id)
    .bind(&complete_name)
    .bind(&input.location_type)
    .execute(pool)
    .await?;

    let new_id = result.last_insert_rowid();
    let location = get_location_by_id(pool, new_id).await?.unwrap();
    Ok(location)
}

pub async fn list_warehouses(
    pool: &SqlitePool,
    company_id: i64,
) -> Result<Vec<StockWarehouse>, sqlx::Error> {
    let rows = sqlx::query_as::<_, StockWarehouse>(
        "SELECT id, company_id, name, code, view_location_id, lot_stock_location_id, is_active, created_at FROM stock_warehouses WHERE company_id = ? AND is_active = 1 ORDER BY id ASC"
    )
    .bind(company_id)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

pub async fn list_picking_types(
    pool: &SqlitePool,
    company_id: i64,
) -> Result<Vec<StockPickingType>, sqlx::Error> {
    let rows = sqlx::query_as::<_, StockPickingType>(
        "SELECT id, company_id, warehouse_id, name, code, sequence_prefix, next_number, default_src_location_id, default_dest_location_id, created_at FROM stock_picking_types WHERE company_id = ? ORDER BY id ASC"
    )
    .bind(company_id)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

// ----------------------------------------------------
// Stock Quantities Service
// ----------------------------------------------------
pub async fn list_stock_quantities(
    pool: &SqlitePool,
    company_id: i64,
    location_id: Option<i64>,
    product_id: Option<i64>,
) -> Result<Vec<StockQuantityDetail>, sqlx::Error> {
    let mut query = r#"
        SELECT 
            q.id, q.company_id, q.product_id, p.name as product_name, p.sku,
            q.location_id, loc.name as location_name, loc.location_type,
            q.lot_serial_number, q.quantity_milli, u.name as uom_name, q.updated_at
        FROM stock_quantities q
        JOIN products p ON q.product_id = p.id
        JOIN stock_locations loc ON q.location_id = loc.id
        JOIN uoms u ON p.uom_id = u.id
        WHERE q.company_id = ? AND q.quantity_milli > 0
    "#.to_string();

    if let Some(lid) = location_id {
        query.push_str(&format!(" AND q.location_id = {}", lid));
    }

    if let Some(pid) = product_id {
        query.push_str(&format!(" AND q.product_id = {}", pid));
    }

    query.push_str(" ORDER BY loc.name ASC, p.name ASC");

    #[derive(FromRow)]
    struct QRow {
        id: i64,
        company_id: i64,
        product_id: i64,
        product_name: String,
        sku: String,
        location_id: i64,
        location_name: String,
        location_type: String,
        lot_serial_number: String,
        quantity_milli: i64,
        uom_name: String,
        updated_at: String,
    }

    let rows = sqlx::query_as::<_, QRow>(&query)
        .bind(company_id)
        .fetch_all(pool)
        .await?;

    let details = rows
        .into_iter()
        .map(|r| StockQuantityDetail {
            id: r.id,
            company_id: r.company_id,
            product_id: r.product_id,
            product_name: r.product_name,
            sku: r.sku,
            location_id: r.location_id,
            location_name: r.location_name,
            location_type: r.location_type,
            lot_serial_number: r.lot_serial_number,
            quantity_milli: r.quantity_milli,
            uom_name: r.uom_name,
            updated_at: r.updated_at,
        })
        .collect();

    Ok(details)
}

// ----------------------------------------------------
// Stock Pickings & Moves Service
// ----------------------------------------------------
pub async fn list_pickings(
    pool: &SqlitePool,
    company_id: i64,
    state: Option<String>,
) -> Result<Vec<StockPicking>, sqlx::Error> {
    let mut query = "SELECT id, company_id, name, picking_type_id, partner_id, src_location_id, dest_location_id, scheduled_date, date_done, origin, state, note, created_at, updated_at FROM stock_pickings WHERE company_id = ?".to_string();

    if let Some(s) = state {
        if s != "all" && !s.is_empty() {
            query.push_str(&format!(" AND state = '{}'", s.replace('\'', "''")));
        }
    }

    query.push_str(" ORDER BY id DESC");

    let rows = sqlx::query_as::<_, StockPicking>(&query)
        .bind(company_id)
        .fetch_all(pool)
        .await?;

    Ok(rows)
}

pub async fn get_picking_by_id(
    pool: &SqlitePool,
    id: i64,
) -> Result<Option<StockPicking>, sqlx::Error> {
    let row = sqlx::query_as::<_, StockPicking>(
        "SELECT id, company_id, name, picking_type_id, partner_id, src_location_id, dest_location_id, scheduled_date, date_done, origin, state, note, created_at, updated_at FROM stock_pickings WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(row)
}

pub async fn get_picking_moves(
    pool: &SqlitePool,
    picking_id: i64,
) -> Result<Vec<StockMove>, sqlx::Error> {
    let rows = sqlx::query_as::<_, StockMove>(
        "SELECT id, company_id, picking_id, product_id, name, src_location_id, dest_location_id, quantity_milli, uom_id, state, reference, created_at, updated_at FROM stock_moves WHERE picking_id = ? ORDER BY id ASC"
    )
    .bind(picking_id)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

pub async fn create_picking(
    pool: &SqlitePool,
    input: CreatePickingInput,
) -> Result<StockPicking, sqlx::Error> {
    let p_type = sqlx::query_as::<_, StockPickingType>(
        "SELECT id, company_id, warehouse_id, name, code, sequence_prefix, next_number, default_src_location_id, default_dest_location_id, created_at FROM stock_picking_types WHERE id = ?"
    )
    .bind(input.picking_type_id)
    .fetch_one(pool)
    .await?;

    let picking_name = format!("{}{:05}", p_type.sequence_prefix, p_type.next_number);

    sqlx::query("UPDATE stock_picking_types SET next_number = next_number + 1 WHERE id = ?")
        .bind(input.picking_type_id)
        .execute(pool)
        .await?;

    let src_loc = input
        .src_location_id
        .or(p_type.default_src_location_id)
        .unwrap_or(5);
    let dest_loc = input
        .dest_location_id
        .or(p_type.default_dest_location_id)
        .unwrap_or(5);

    let result = sqlx::query(
        r#"
        INSERT INTO stock_pickings (
            company_id, name, picking_type_id, partner_id, src_location_id, 
            dest_location_id, scheduled_date, origin, state, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
        "#
    )
    .bind(input.company_id)
    .bind(&picking_name)
    .bind(input.picking_type_id)
    .bind(input.partner_id)
    .bind(src_loc)
    .bind(dest_loc)
    .bind(input.scheduled_date)
    .bind(input.origin)
    .bind(input.note)
    .execute(pool)
    .await?;

    let picking_id = result.last_insert_rowid();

    for m in input.moves {
        let p_name = sqlx::query_as::<_, (String,)>("SELECT name FROM products WHERE id = ?")
            .bind(m.product_id)
            .fetch_one(pool)
            .await?;

        let move_result = sqlx::query(
            r#"
            INSERT INTO stock_moves (
                company_id, picking_id, product_id, name, src_location_id, 
                dest_location_id, quantity_milli, uom_id, state, reference
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
            "#
        )
        .bind(input.company_id)
        .bind(picking_id)
        .bind(m.product_id)
        .bind(&p_name.0)
        .bind(src_loc)
        .bind(dest_loc)
        .bind(m.quantity_milli)
        .bind(m.uom_id)
        .bind(&picking_name)
        .execute(pool)
        .await?;

        let move_id = move_result.last_insert_rowid();

        if let Some(lot) = m.lot_serial_number {
            if !lot.trim().is_empty() {
                sqlx::query(
                    r#"
                    INSERT INTO stock_move_lines (
                        move_id, product_id, src_location_id, dest_location_id, 
                        lot_serial_number, quantity_milli, state
                    ) VALUES (?, ?, ?, ?, ?, ?, 'draft')
                    "#
                )
                .bind(move_id)
                .bind(m.product_id)
                .bind(src_loc)
                .bind(dest_loc)
                .bind(lot)
                .bind(m.quantity_milli)
                .execute(pool)
                .await?;
            }
        }
    }

    let picking = get_picking_by_id(pool, picking_id).await?.unwrap();
    Ok(picking)
}

pub async fn confirm_and_validate_picking(
    pool: &SqlitePool,
    picking_id: i64,
) -> Result<StockPicking, sqlx::Error> {
    let _picking = get_picking_by_id(pool, picking_id).await?.unwrap();

    let moves = get_picking_moves(pool, picking_id).await?;

    for m in moves {
        let move_lines = sqlx::query_as::<_, StockMoveLine>(
            "SELECT id, move_id, product_id, src_location_id, dest_location_id, lot_serial_number, quantity_milli, state, created_at FROM stock_move_lines WHERE move_id = ?"
        )
        .bind(m.id)
        .fetch_all(pool)
        .await?;

        if move_lines.is_empty() {
            // Apply single move line without lot
            apply_stock_quantity_delta(pool, m.company_id, m.product_id, m.src_location_id, -m.quantity_milli, "").await?;
            apply_stock_quantity_delta(pool, m.company_id, m.product_id, m.dest_location_id, m.quantity_milli, "").await?;
        } else {
            // Apply per lot/serial line
            for line in move_lines {
                let lot = line.lot_serial_number.unwrap_or_default();
                apply_stock_quantity_delta(pool, m.company_id, line.product_id, line.src_location_id, -line.quantity_milli, &lot).await?;
                apply_stock_quantity_delta(pool, m.company_id, line.product_id, line.dest_location_id, line.quantity_milli, &lot).await?;
            }
        }

        sqlx::query("UPDATE stock_moves SET state = 'done', updated_at = DATETIME('now') WHERE id = ?")
            .bind(m.id)
            .execute(pool)
            .await?;

        sqlx::query("UPDATE stock_move_lines SET state = 'done' WHERE move_id = ?")
            .bind(m.id)
            .execute(pool)
            .await?;
    }

    sqlx::query(
        "UPDATE stock_pickings SET state = 'done', date_done = DATETIME('now'), updated_at = DATETIME('now') WHERE id = ?"
    )
    .bind(picking_id)
    .execute(pool)
    .await?;

    let updated = get_picking_by_id(pool, picking_id).await?.unwrap();
    Ok(updated)
}

pub async fn cancel_picking(
    pool: &SqlitePool,
    picking_id: i64,
) -> Result<StockPicking, sqlx::Error> {
    sqlx::query(
        "UPDATE stock_pickings SET state = 'cancelled', updated_at = DATETIME('now') WHERE id = ?"
    )
    .bind(picking_id)
    .execute(pool)
    .await?;

    sqlx::query(
        "UPDATE stock_moves SET state = 'cancelled', updated_at = DATETIME('now') WHERE picking_id = ?"
    )
    .bind(picking_id)
    .execute(pool)
    .await?;

    let updated = get_picking_by_id(pool, picking_id).await?.unwrap();
    Ok(updated)
}

async fn apply_stock_quantity_delta(
    pool: &SqlitePool,
    company_id: i64,
    product_id: i64,
    location_id: i64,
    delta_milli: i64,
    lot_serial_number: &str,
) -> Result<(), sqlx::Error> {
    let loc = get_location_by_id(pool, location_id).await?;
    if let Some(l) = loc {
        // Virtual / external locations do not track positive on-hand inventory levels
        if l.location_type != "internal" {
            return Ok(());
        }
    }

    sqlx::query(
        r#"
        INSERT INTO stock_quantities (company_id, product_id, location_id, lot_serial_number, quantity_milli, updated_at)
        VALUES (?, ?, ?, ?, ?, DATETIME('now'))
        ON CONFLICT(company_id, product_id, location_id, lot_serial_number) DO UPDATE SET
            quantity_milli = MAX(0, stock_quantities.quantity_milli + excluded.quantity_milli),
            updated_at = DATETIME('now')
        "#
    )
    .bind(company_id)
    .bind(product_id)
    .bind(location_id)
    .bind(lot_serial_number)
    .bind(delta_milli)
    .execute(pool)
    .await?;

    Ok(())
}

// ----------------------------------------------------
// Physical Inventory Adjustments Service
// ----------------------------------------------------
pub async fn list_inventory_adjustments(
    pool: &SqlitePool,
    company_id: i64,
) -> Result<Vec<StockInventoryAdjustment>, sqlx::Error> {
    let rows = sqlx::query_as::<_, StockInventoryAdjustment>(
        "SELECT id, company_id, name, location_id, state, accounting_date, created_at, updated_at FROM stock_inventory_adjustments WHERE company_id = ? ORDER BY id DESC"
    )
    .bind(company_id)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

pub async fn get_inventory_adjustment_by_id(
    pool: &SqlitePool,
    id: i64,
) -> Result<Option<StockInventoryAdjustment>, sqlx::Error> {
    let row = sqlx::query_as::<_, StockInventoryAdjustment>(
        "SELECT id, company_id, name, location_id, state, accounting_date, created_at, updated_at FROM stock_inventory_adjustments WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(row)
}

pub async fn create_inventory_adjustment(
    pool: &SqlitePool,
    input: CreateInventoryAdjustmentInput,
) -> Result<StockInventoryAdjustment, sqlx::Error> {
    let result = sqlx::query(
        "INSERT INTO stock_inventory_adjustments (company_id, name, location_id, state) VALUES (?, ?, ?, 'in_progress')"
    )
    .bind(input.company_id)
    .bind(&input.name)
    .bind(input.location_id)
    .execute(pool)
    .await?;

    let adj_id = result.last_insert_rowid();

    // Populate lines with existing theoretical quantities from stock_quantities and all storable products
    let storable_products = sqlx::query_as::<_, (i64,)>(
        "SELECT id FROM products WHERE company_id = ? AND type = 'storable' AND is_active = 1"
    )
    .bind(input.company_id)
    .fetch_all(pool)
    .await?;

    for (p_id,) in storable_products {
        let existing_qty: Option<(i64, String)> = sqlx::query_as(
            "SELECT quantity_milli, lot_serial_number FROM stock_quantities WHERE company_id = ? AND product_id = ? AND location_id = ?"
        )
        .bind(input.company_id)
        .bind(p_id)
        .bind(input.location_id)
        .fetch_optional(pool)
        .await?;

        let (theory, lot) = existing_qty.unwrap_or((0, "".to_string()));

        sqlx::query(
            r#"
            INSERT INTO stock_inventory_adjustment_lines (
                adjustment_id, product_id, lot_serial_number, theoretical_qty_milli, 
                counted_qty_milli, difference_qty_milli
            ) VALUES (?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(adj_id)
        .bind(p_id)
        .bind(&lot)
        .bind(theory)
        .bind(theory) // Default counted = theoretical
        .bind(0) // difference = 0
        .execute(pool)
        .await?;
    }

    let adj = get_inventory_adjustment_by_id(pool, adj_id).await?.unwrap();
    Ok(adj)
}

pub async fn get_adjustment_lines(
    pool: &SqlitePool,
    adjustment_id: i64,
) -> Result<Vec<StockInventoryAdjustmentLineDetail>, sqlx::Error> {
    let query = r#"
        SELECT 
            al.id, al.adjustment_id, al.product_id, p.name as product_name, p.sku,
            al.lot_serial_number, al.theoretical_qty_milli, al.counted_qty_milli, 
            al.difference_qty_milli, u.name as uom_name
        FROM stock_inventory_adjustment_lines al
        JOIN products p ON al.product_id = p.id
        JOIN uoms u ON p.uom_id = u.id
        WHERE al.adjustment_id = ?
        ORDER BY p.name ASC
    "#;

    #[derive(FromRow)]
    struct LineRow {
        id: i64,
        adjustment_id: i64,
        product_id: i64,
        product_name: String,
        sku: String,
        lot_serial_number: String,
        theoretical_qty_milli: i64,
        counted_qty_milli: i64,
        difference_qty_milli: i64,
        uom_name: String,
    }

    let rows = sqlx::query_as::<_, LineRow>(query)
        .bind(adjustment_id)
        .fetch_all(pool)
        .await?;

    let details = rows
        .into_iter()
        .map(|r| StockInventoryAdjustmentLineDetail {
            id: r.id,
            adjustment_id: r.adjustment_id,
            product_id: r.product_id,
            product_name: r.product_name,
            sku: r.sku,
            lot_serial_number: r.lot_serial_number,
            theoretical_qty_milli: r.theoretical_qty_milli,
            counted_qty_milli: r.counted_qty_milli,
            difference_qty_milli: r.difference_qty_milli,
            uom_name: r.uom_name,
        })
        .collect();

    Ok(details)
}

pub async fn update_adjustment_line_count(
    pool: &SqlitePool,
    input: UpdateAdjustmentLineCountInput,
) -> Result<(), sqlx::Error> {
    let line: (i64,) = sqlx::query_as("SELECT theoretical_qty_milli FROM stock_inventory_adjustment_lines WHERE id = ?")
        .bind(input.line_id)
        .fetch_one(pool)
        .await?;

    let diff = input.counted_qty_milli - line.0;

    sqlx::query(
        "UPDATE stock_inventory_adjustment_lines SET counted_qty_milli = ?, difference_qty_milli = ? WHERE id = ?"
    )
    .bind(input.counted_qty_milli)
    .bind(diff)
    .bind(input.line_id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn validate_inventory_adjustment(
    pool: &SqlitePool,
    adjustment_id: i64,
) -> Result<StockInventoryAdjustment, sqlx::Error> {
    let adj = get_inventory_adjustment_by_id(pool, adjustment_id).await?.unwrap();
    let lines = get_adjustment_lines(pool, adjustment_id).await?;

    // Find Virtual Loss location (id 10)
    let loss_loc_id = 10;

    for line in lines {
        if line.difference_qty_milli != 0 {
            let (src_id, dest_id, qty) = if line.difference_qty_milli > 0 {
                // Real count is greater -> goods gained from virtual loss into location
                (loss_loc_id, adj.location_id, line.difference_qty_milli)
            } else {
                // Real count is lower -> goods lost from location into virtual loss
                (adj.location_id, loss_loc_id, -line.difference_qty_milli)
            };

            let p_uom: (i64,) = sqlx::query_as("SELECT uom_id FROM products WHERE id = ?")
                .bind(line.product_id)
                .fetch_one(pool)
                .await?;

            let move_res = sqlx::query(
                r#"
                INSERT INTO stock_moves (
                    company_id, picking_id, product_id, name, src_location_id, 
                    dest_location_id, quantity_milli, uom_id, state, reference
                ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 'done', ?)
                "#
            )
            .bind(adj.company_id)
            .bind(line.product_id)
            .bind(format!("INV-ADJ: {}", adj.name))
            .bind(src_id)
            .bind(dest_id)
            .bind(qty)
            .bind(p_uom.0)
            .bind(&adj.name)
            .execute(pool)
            .await?;

            let move_id = move_res.last_insert_rowid();

            if !line.lot_serial_number.is_empty() {
                sqlx::query(
                    r#"
                    INSERT INTO stock_move_lines (
                        move_id, product_id, src_location_id, dest_location_id, 
                        lot_serial_number, quantity_milli, state
                    ) VALUES (?, ?, ?, ?, ?, ?, 'done')
                    "#
                )
                .bind(move_id)
                .bind(line.product_id)
                .bind(src_id)
                .bind(dest_id)
                .bind(&line.lot_serial_number)
                .bind(qty)
                .execute(pool)
                .await?;
            }

            // Update materialized stock_quantities directly
            apply_stock_quantity_delta(pool, adj.company_id, line.product_id, src_id, -qty, &line.lot_serial_number).await?;
            apply_stock_quantity_delta(pool, adj.company_id, line.product_id, dest_id, qty, &line.lot_serial_number).await?;
        }
    }

    sqlx::query(
        "UPDATE stock_inventory_adjustments SET state = 'done', updated_at = DATETIME('now') WHERE id = ?"
    )
    .bind(adjustment_id)
    .execute(pool)
    .await?;

    let updated = get_inventory_adjustment_by_id(pool, adjustment_id).await?.unwrap();
    Ok(updated)
}
