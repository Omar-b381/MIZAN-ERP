use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};

// ============================================================================
// Data Types & Structures
// ============================================================================

pub type SaleOrderState = String; // 'draft', 'sent', 'sale', 'done', 'cancelled'

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SaleOrder {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub partner_id: i64,
    #[sqlx(default)]
    pub partner_name: Option<String>,
    pub date_order: String,
    pub validity_date: Option<String>,
    pub state: String,
    pub currency: String,
    pub amount_untaxed_cents: i64,
    pub amount_tax_cents: i64,
    pub amount_total_cents: i64,
    pub delivery_status: String,
    pub invoice_status: String,
    pub picking_id: Option<i64>,
    pub note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SaleOrderLine {
    pub id: i64,
    pub order_id: i64,
    pub product_id: i64,
    pub product_name: Option<String>,
    pub product_sku: Option<String>,
    pub name: String,
    pub product_uom_qty_milli: i64,
    pub product_uom_id: i64,
    pub uom_name: Option<String>,
    pub price_unit_cents: i64,
    pub discount_percent_milli: i64,
    pub tax_rate_milli: i64,
    pub price_subtotal_cents: i64,
    pub price_total_cents: i64,
    pub qty_delivered_milli: i64,
    pub qty_invoiced_milli: i64,
    pub sequence: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaleOrderDetail {
    pub order: SaleOrder,
    pub lines: Vec<SaleOrderLine>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSaleOrderLineInput {
    pub product_id: i64,
    pub name: Option<String>,
    pub product_uom_qty_milli: i64,
    pub product_uom_id: i64,
    pub price_unit_cents: i64,
    pub discount_percent_milli: Option<i64>,
    pub tax_rate_milli: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSaleOrderInput {
    pub company_id: i64,
    pub partner_id: i64,
    pub validity_date: Option<String>,
    pub currency: Option<String>,
    pub note: Option<String>,
    pub lines: Vec<CreateSaleOrderLineInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSaleOrderInput {
    pub id: i64,
    pub partner_id: i64,
    pub validity_date: Option<String>,
    pub note: Option<String>,
    pub lines: Vec<CreateSaleOrderLineInput>,
}

// ============================================================================
// Financial Calculations Helper
// ============================================================================

pub struct LineCalculations {
    pub subtotal_cents: i64,
    pub tax_cents: i64,
    pub total_cents: i64,
}

pub fn calculate_line_amounts(
    qty_milli: i64,
    unit_price_cents: i64,
    discount_milli: i64,
    tax_rate_milli: i64,
) -> LineCalculations {
    let base_cents = (qty_milli * unit_price_cents) / 1000;
    let discount_cents = (base_cents * discount_milli) / 100_000;
    let subtotal_cents = base_cents - discount_cents;
    let tax_cents = (subtotal_cents * tax_rate_milli) / 100_000;
    let total_cents = subtotal_cents + tax_cents;

    LineCalculations {
        subtotal_cents,
        tax_cents,
        total_cents,
    }
}

// ============================================================================
// Service Operations
// ============================================================================

pub async fn list_sale_orders(
    pool: &SqlitePool,
    company_id: i64,
    state_filter: Option<String>,
    partner_id: Option<i64>,
) -> Result<Vec<SaleOrder>, sqlx::Error> {
    let mut sql = String::from(
        r#"
        SELECT 
            so.id, so.company_id, so.name, so.partner_id,
            p.name as partner_name,
            so.date_order, so.validity_date, so.state, so.currency,
            so.amount_untaxed_cents, so.amount_tax_cents, so.amount_total_cents,
            so.delivery_status, so.invoice_status, so.picking_id, so.note,
            so.created_at, so.updated_at
        FROM sale_orders so
        LEFT JOIN partners p ON so.partner_id = p.id
        WHERE so.company_id = ?
        "#,
    );

    if let Some(ref st) = state_filter {
        if st != "all" {
            sql.push_str(&format!(" AND so.state = '{}'", st));
        }
    }

    if let Some(pid) = partner_id {
        sql.push_str(&format!(" AND so.partner_id = {}", pid));
    }

    sql.push_str(" ORDER BY so.id DESC");

    let rows = sqlx::query(&sql)
        .bind(company_id)
        .fetch_all(pool)
        .await?;

    let mut orders = Vec::new();
    for r in rows {
        orders.push(SaleOrder {
            id: r.get("id"),
            company_id: r.get("company_id"),
            name: r.get("name"),
            partner_id: r.get("partner_id"),
            partner_name: r.get("partner_name"),
            date_order: r.get("date_order"),
            validity_date: r.get("validity_date"),
            state: r.get("state"),
            currency: r.get("currency"),
            amount_untaxed_cents: r.get("amount_untaxed_cents"),
            amount_tax_cents: r.get("amount_tax_cents"),
            amount_total_cents: r.get("amount_total_cents"),
            delivery_status: r.get("delivery_status"),
            invoice_status: r.get("invoice_status"),
            picking_id: r.get("picking_id"),
            note: r.get("note"),
            created_at: r.get("created_at"),
            updated_at: r.get("updated_at"),
        });
    }

    Ok(orders)
}

pub async fn get_sale_order(
    pool: &SqlitePool,
    order_id: i64,
) -> Result<Option<SaleOrderDetail>, sqlx::Error> {
    let order_row = sqlx::query(
        r#"
        SELECT 
            so.id, so.company_id, so.name, so.partner_id,
            p.name as partner_name,
            so.date_order, so.validity_date, so.state, so.currency,
            so.amount_untaxed_cents, so.amount_tax_cents, so.amount_total_cents,
            so.delivery_status, so.invoice_status, so.picking_id, so.note,
            so.created_at, so.updated_at
        FROM sale_orders so
        LEFT JOIN partners p ON so.partner_id = p.id
        WHERE so.id = ?
        "#,
    )
    .bind(order_id)
    .fetch_optional(pool)
    .await?;

    if order_row.is_none() {
        return Ok(None);
    }
    let r = order_row.unwrap();
    let order = SaleOrder {
        id: r.get("id"),
        company_id: r.get("company_id"),
        name: r.get("name"),
        partner_id: r.get("partner_id"),
        partner_name: r.get("partner_name"),
        date_order: r.get("date_order"),
        validity_date: r.get("validity_date"),
        state: r.get("state"),
        currency: r.get("currency"),
        amount_untaxed_cents: r.get("amount_untaxed_cents"),
        amount_tax_cents: r.get("amount_tax_cents"),
        amount_total_cents: r.get("amount_total_cents"),
        delivery_status: r.get("delivery_status"),
        invoice_status: r.get("invoice_status"),
        picking_id: r.get("picking_id"),
        note: r.get("note"),
        created_at: r.get("created_at"),
        updated_at: r.get("updated_at"),
    };

    let line_rows = sqlx::query(
        r#"
        SELECT 
            sol.id, sol.order_id, sol.product_id,
            p.name as product_name, p.sku as product_sku,
            sol.name, sol.product_uom_qty_milli, sol.product_uom_id,
            u.name as uom_name,
            sol.price_unit_cents, sol.discount_percent_milli, sol.tax_rate_milli,
            sol.price_subtotal_cents, sol.price_total_cents,
            sol.qty_delivered_milli, sol.qty_invoiced_milli, sol.sequence,
            sol.created_at
        FROM sale_order_lines sol
        LEFT JOIN products p ON sol.product_id = p.id
        LEFT JOIN uoms u ON sol.product_uom_id = u.id
        WHERE sol.order_id = ?
        ORDER BY sol.sequence ASC, sol.id ASC
        "#,
    )
    .bind(order_id)
    .fetch_all(pool)
    .await?;

    let mut lines = Vec::new();
    for lr in line_rows {
        lines.push(SaleOrderLine {
            id: lr.get("id"),
            order_id: lr.get("order_id"),
            product_id: lr.get("product_id"),
            product_name: lr.get("product_name"),
            product_sku: lr.get("product_sku"),
            name: lr.get("name"),
            product_uom_qty_milli: lr.get("product_uom_qty_milli"),
            product_uom_id: lr.get("product_uom_id"),
            uom_name: lr.get("uom_name"),
            price_unit_cents: lr.get("price_unit_cents"),
            discount_percent_milli: lr.get("discount_percent_milli"),
            tax_rate_milli: lr.get("tax_rate_milli"),
            price_subtotal_cents: lr.get("price_subtotal_cents"),
            price_total_cents: lr.get("price_total_cents"),
            qty_delivered_milli: lr.get("qty_delivered_milli"),
            qty_invoiced_milli: lr.get("qty_invoiced_milli"),
            sequence: lr.get("sequence"),
            created_at: lr.get("created_at"),
        });
    }

    Ok(Some(SaleOrderDetail { order, lines }))
}

pub async fn create_sale_order(
    pool: &SqlitePool,
    input: CreateSaleOrderInput,
) -> Result<SaleOrderDetail, sqlx::Error> {
    let mut tx = pool.begin().await?;

    let current_year = Utc::now().format("%Y").to_string();
    let count_row = sqlx::query(
        "SELECT COUNT(*) as count FROM sale_orders WHERE company_id = ?",
    )
    .bind(input.company_id)
    .fetch_one(&mut *tx)
    .await?;
    let count: i64 = count_row.get("count");
    let sequence_num = count + 1;
    let order_name = format!("SO/{}/{:05}", current_year, sequence_num);

    let currency = input.currency.unwrap_or_else(|| "EGP".to_string());

    let res = sqlx::query(
        r#"
        INSERT INTO sale_orders (
            company_id, name, partner_id, validity_date, state,
            currency, amount_untaxed_cents, amount_tax_cents, amount_total_cents,
            delivery_status, invoice_status, note
        ) VALUES (?, ?, ?, ?, 'draft', ?, 0, 0, 0, 'no', 'no', ?)
        "#,
    )
    .bind(input.company_id)
    .bind(&order_name)
    .bind(input.partner_id)
    .bind(&input.validity_date)
    .bind(&currency)
    .bind(&input.note)
    .execute(&mut *tx)
    .await?;

    let order_id = res.last_insert_rowid();

    let mut total_untaxed = 0i64;
    let mut total_tax = 0i64;
    let mut total_amount = 0i64;

    for (idx, line) in input.lines.iter().enumerate() {
        let disc_milli = line.discount_percent_milli.unwrap_or(0);
        let tax_milli = line.tax_rate_milli.unwrap_or(14000); // Egyptian standard VAT 14%
        let calcs = calculate_line_amounts(
            line.product_uom_qty_milli,
            line.price_unit_cents,
            disc_milli,
            tax_milli,
        );

        let line_name = line.name.clone().unwrap_or_else(|| {
            format!("Product #{}", line.product_id)
        });

        sqlx::query(
            r#"
            INSERT INTO sale_order_lines (
                order_id, product_id, name, product_uom_qty_milli, product_uom_id,
                price_unit_cents, discount_percent_milli, tax_rate_milli,
                price_subtotal_cents, price_total_cents, sequence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(order_id)
        .bind(line.product_id)
        .bind(&line_name)
        .bind(line.product_uom_qty_milli)
        .bind(line.product_uom_id)
        .bind(line.price_unit_cents)
        .bind(disc_milli)
        .bind(tax_milli)
        .bind(calcs.subtotal_cents)
        .bind(calcs.total_cents)
        .bind((idx as i64 + 1) * 10)
        .execute(&mut *tx)
        .await?;

        total_untaxed += calcs.subtotal_cents;
        total_tax += calcs.tax_cents;
        total_amount += calcs.total_cents;
    }

    sqlx::query(
        r#"
        UPDATE sale_orders
        SET amount_untaxed_cents = ?, amount_tax_cents = ?, amount_total_cents = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        "#,
    )
    .bind(total_untaxed)
    .bind(total_tax)
    .bind(total_amount)
    .bind(order_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    let detail = get_sale_order(pool, order_id).await?.unwrap();
    Ok(detail)
}

pub async fn update_sale_order(
    pool: &SqlitePool,
    input: UpdateSaleOrderInput,
) -> Result<SaleOrderDetail, sqlx::Error> {
    let mut tx = pool.begin().await?;

    // Check if order is in editable state (draft or sent)
    let state_row = sqlx::query("SELECT state FROM sale_orders WHERE id = ?")
        .bind(input.id)
        .fetch_one(&mut *tx)
        .await?;
    let state: String = state_row.get("state");
    if state != "draft" && state != "sent" {
        return Err(sqlx::Error::Protocol(
            "Cannot modify confirmed or cancelled sales order".into(),
        ));
    }

    // Delete existing lines and re-insert
    sqlx::query("DELETE FROM sale_order_lines WHERE order_id = ?")
        .bind(input.id)
        .execute(&mut *tx)
        .await?;

    let mut total_untaxed = 0i64;
    let mut total_tax = 0i64;
    let mut total_amount = 0i64;

    for (idx, line) in input.lines.iter().enumerate() {
        let disc_milli = line.discount_percent_milli.unwrap_or(0);
        let tax_milli = line.tax_rate_milli.unwrap_or(14000);
        let calcs = calculate_line_amounts(
            line.product_uom_qty_milli,
            line.price_unit_cents,
            disc_milli,
            tax_milli,
        );

        let line_name = line.name.clone().unwrap_or_else(|| {
            format!("Product #{}", line.product_id)
        });

        sqlx::query(
            r#"
            INSERT INTO sale_order_lines (
                order_id, product_id, name, product_uom_qty_milli, product_uom_id,
                price_unit_cents, discount_percent_milli, tax_rate_milli,
                price_subtotal_cents, price_total_cents, sequence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(input.id)
        .bind(line.product_id)
        .bind(&line_name)
        .bind(line.product_uom_qty_milli)
        .bind(line.product_uom_id)
        .bind(line.price_unit_cents)
        .bind(disc_milli)
        .bind(tax_milli)
        .bind(calcs.subtotal_cents)
        .bind(calcs.total_cents)
        .bind((idx as i64 + 1) * 10)
        .execute(&mut *tx)
        .await?;

        total_untaxed += calcs.subtotal_cents;
        total_tax += calcs.tax_cents;
        total_amount += calcs.total_cents;
    }

    sqlx::query(
        r#"
        UPDATE sale_orders
        SET partner_id = ?, validity_date = ?, note = ?,
            amount_untaxed_cents = ?, amount_tax_cents = ?, amount_total_cents = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        "#,
    )
    .bind(input.partner_id)
    .bind(&input.validity_date)
    .bind(&input.note)
    .bind(total_untaxed)
    .bind(total_tax)
    .bind(total_amount)
    .bind(input.id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    let detail = get_sale_order(pool, input.id).await?.unwrap();
    Ok(detail)
}

pub async fn confirm_sale_order(
    pool: &SqlitePool,
    order_id: i64,
) -> Result<SaleOrderDetail, sqlx::Error> {
    let mut tx = pool.begin().await?;

    let order_row = sqlx::query(
        "SELECT id, company_id, name, partner_id, state FROM sale_orders WHERE id = ?",
    )
    .bind(order_id)
    .fetch_one(&mut *tx)
    .await?;

    let state: String = order_row.get("state");
    if state != "draft" && state != "sent" {
        return Err(sqlx::Error::Protocol(
            "Sales order is not in draft or sent state".into(),
        ));
    }

    let company_id: i64 = order_row.get("company_id");
    let order_name: String = order_row.get("name");
    let partner_id: i64 = order_row.get("partner_id");

    // 1. Locate Outgoing Picking Type (Delivery Orders / WH/OUT)
    let pt_row = sqlx::query(
        r#"
        SELECT id, sequence_prefix, next_number, default_src_location_id, default_dest_location_id 
        FROM stock_picking_types 
        WHERE company_id = ? AND code = 'outgoing'
        LIMIT 1
        "#,
    )
    .bind(company_id)
    .fetch_optional(&mut *tx)
    .await?;

    let (pt_id, picking_name, src_loc_id, dest_loc_id) = if let Some(pt) = pt_row {
        let id: i64 = pt.get("id");
        let prefix: String = pt.get("sequence_prefix");
        let next_num: i64 = pt.get("next_number");
        let p_name = format!("{}{:05}", prefix, next_num);
        let src: i64 = pt.get("default_src_location_id");
        let dest: i64 = pt.get("default_dest_location_id");

        sqlx::query("UPDATE stock_picking_types SET next_number = next_number + 1 WHERE id = ?")
            .bind(id)
            .execute(&mut *tx)
            .await?;

        (id, p_name, src, dest)
    } else {
        (1i64, format!("WH/OUT/{:05}", order_id), 5i64, 9i64)
    };

    // 2. Create Outgoing Stock Picking
    let picking_res = sqlx::query(
        r#"
        INSERT INTO stock_pickings (
            company_id, name, picking_type_id, partner_id,
            src_location_id, dest_location_id, state, origin
        ) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?)
        "#,
    )
    .bind(company_id)
    .bind(&picking_name)
    .bind(pt_id)
    .bind(partner_id)
    .bind(src_loc_id)
    .bind(dest_loc_id)
    .bind(&order_name)
    .execute(&mut *tx)
    .await?;

    let picking_id = picking_res.last_insert_rowid();

    // 3. Fetch storable lines and create stock moves
    let lines = sqlx::query(
        r#"
        SELECT sol.product_id, sol.name, sol.product_uom_qty_milli, sol.product_uom_id, p.type as product_type
        FROM sale_order_lines sol
        JOIN products p ON sol.product_id = p.id
        WHERE sol.order_id = ?
        "#,
    )
    .bind(order_id)
    .fetch_all(&mut *tx)
    .await?;

    for line in lines {
        let p_type: String = line.get("product_type");
        if p_type == "storable" {
            let p_id: i64 = line.get("product_id");
            let p_name: String = line.get("name");
            let qty_milli: i64 = line.get("product_uom_qty_milli");
            let uom_id: i64 = line.get("product_uom_id");

            sqlx::query(
                r#"
                INSERT INTO stock_moves (
                    company_id, picking_id, product_id, name,
                    quantity_milli, uom_id,
                    src_location_id, dest_location_id, state, reference
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
                "#,
            )
            .bind(company_id)
            .bind(picking_id)
            .bind(p_id)
            .bind(&p_name)
            .bind(qty_milli)
            .bind(uom_id)
            .bind(src_loc_id)
            .bind(dest_loc_id)
            .bind(&picking_name)
            .execute(&mut *tx)
            .await?;
        }
    }

    // 4. Update Sales Order state and link picking
    sqlx::query(
        r#"
        UPDATE sale_orders 
        SET state = 'sale', delivery_status = 'to_deliver', invoice_status = 'to_invoice',
            picking_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        "#,
    )
    .bind(picking_id)
    .bind(order_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    let detail = get_sale_order(pool, order_id).await?.unwrap();
    Ok(detail)
}

pub async fn cancel_sale_order(
    pool: &SqlitePool,
    order_id: i64,
) -> Result<SaleOrderDetail, sqlx::Error> {
    let mut tx = pool.begin().await?;

    let order_row = sqlx::query(
        "SELECT state, picking_id FROM sale_orders WHERE id = ?",
    )
    .bind(order_id)
    .fetch_one(&mut *tx)
    .await?;

    let current_state: String = order_row.get("state");
    let picking_id: Option<i64> = order_row.get("picking_id");

    if current_state == "done" {
        return Err(sqlx::Error::Protocol(
            "Cannot cancel a locked / fully completed sales order".into(),
        ));
    }

    // Cancel linked picking if exists and not done
    if let Some(pid) = picking_id {
        sqlx::query(
            "UPDATE stock_pickings SET state = 'cancelled' WHERE id = ? AND state != 'done'",
        )
        .bind(pid)
        .execute(&mut *tx)
        .await?;

        sqlx::query(
            "UPDATE stock_moves SET state = 'cancelled' WHERE id IN (SELECT id FROM stock_moves WHERE picking_id = ?) AND state != 'done'",
        )
        .bind(pid)
        .execute(&mut *tx)
        .await?;
    }

    sqlx::query(
        r#"
        UPDATE sale_orders
        SET state = 'cancelled', delivery_status = 'cancelled', invoice_status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        "#,
    )
    .bind(order_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    let detail = get_sale_order(pool, order_id).await?.unwrap();
    Ok(detail)
}

pub async fn delete_sale_order(
    pool: &SqlitePool,
    order_id: i64,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    let state_row = sqlx::query("SELECT state FROM sale_orders WHERE id = ?")
        .bind(order_id)
        .fetch_one(&mut *tx)
        .await?;
    let state: String = state_row.get("state");

    if state != "draft" && state != "cancelled" {
        return Err(sqlx::Error::Protocol(
            "Can only delete draft or cancelled sales orders".into(),
        ));
    }

    sqlx::query("DELETE FROM sale_orders WHERE id = ?")
        .bind(order_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(())
}
