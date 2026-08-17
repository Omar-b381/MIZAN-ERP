use serde::{Deserialize, Serialize};
use sqlx::{Result, SqlitePool};
use chrono::Datelike;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct PurchaseOrder {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub partner_id: i64,
    pub partner_name: Option<String>,
    pub date_order: String,
    pub date_planned: Option<String>,
    pub state: String, // 'draft', 'sent', 'purchase', 'done', 'cancelled'
    pub currency: String,
    pub amount_untaxed_cents: i64,
    pub amount_tax_cents: i64,
    pub amount_total_cents: i64,
    pub receipt_status: String, // 'no', 'to_receive', 'received', 'cancelled'
    pub invoice_status: String, // 'no', 'to_bill', 'billed', 'cancelled'
    pub picking_id: Option<i64>,
    pub origin: Option<String>,
    pub note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct PurchaseOrderLine {
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
    pub qty_received_milli: i64,
    pub qty_billed_milli: i64,
    pub sequence: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PurchaseOrderDetail {
    pub order: PurchaseOrder,
    pub lines: Vec<PurchaseOrderLine>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePurchaseOrderLineInput {
    pub product_id: i64,
    pub name: Option<String>,
    pub product_uom_qty_milli: i64,
    pub product_uom_id: i64,
    pub price_unit_cents: i64,
    pub discount_percent_milli: Option<i64>,
    pub tax_rate_milli: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePurchaseOrderInput {
    pub company_id: i64,
    pub partner_id: i64,
    pub date_planned: Option<String>,
    pub currency: Option<String>,
    pub origin: Option<String>,
    pub note: Option<String>,
    pub lines: Vec<CreatePurchaseOrderLineInput>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePurchaseOrderInput {
    pub id: i64,
    pub partner_id: i64,
    pub date_planned: Option<String>,
    pub origin: Option<String>,
    pub note: Option<String>,
    pub lines: Vec<CreatePurchaseOrderLineInput>,
}

// ----------------------------------------------------
// Calculations Helper
// ----------------------------------------------------
pub fn calculate_purchase_line_amounts(
    qty_milli: i64,
    unit_price_cents: i64,
    discount_milli: i64,
    tax_milli: i64,
) -> (i64, i64, i64) {
    let base_amount = (qty_milli * unit_price_cents) / 1000;
    let discount_amount = (base_amount * discount_milli) / 100_000;
    let subtotal_cents = base_amount - discount_amount;
    let tax_cents = (subtotal_cents * tax_milli) / 100_000;
    let total_cents = subtotal_cents + tax_cents;
    (subtotal_cents, tax_cents, total_cents)
}

// ----------------------------------------------------
// Database Query Operations
// ----------------------------------------------------

pub async fn list_purchase_orders(
    pool: &SqlitePool,
    company_id: i64,
    state_filter: Option<String>,
    partner_id: Option<i64>,
) -> Result<Vec<PurchaseOrder>> {
    let mut query = String::from(
        r#"
        SELECT 
            po.id, po.company_id, po.name, po.partner_id,
            p.name as partner_name,
            po.date_order, po.date_planned, po.state, po.currency,
            po.amount_untaxed_cents, po.amount_tax_cents, po.amount_total_cents,
            po.receipt_status, po.invoice_status, po.picking_id,
            po.origin, po.note, po.created_at, po.updated_at
        FROM purchase_orders po
        LEFT JOIN partners p ON po.partner_id = p.id
        WHERE po.company_id = ?
        "#,
    );

    if let Some(ref st) = state_filter {
        if st != "all" {
            query.push_str(&format!(" AND po.state = '{}'", st.replace('\'', "''")));
        }
    }

    if let Some(pid) = partner_id {
        query.push_str(&format!(" AND po.partner_id = {}", pid));
    }

    query.push_str(" ORDER BY po.id DESC");

    sqlx::query_as::<_, PurchaseOrder>(&query)
        .bind(company_id)
        .fetch_all(pool)
        .await
}

pub async fn get_purchase_order(
    pool: &SqlitePool,
    order_id: i64,
) -> Result<Option<PurchaseOrderDetail>> {
    let order_opt = sqlx::query_as::<_, PurchaseOrder>(
        r#"
        SELECT 
            po.id, po.company_id, po.name, po.partner_id,
            p.name as partner_name,
            po.date_order, po.date_planned, po.state, po.currency,
            po.amount_untaxed_cents, po.amount_tax_cents, po.amount_total_cents,
            po.receipt_status, po.invoice_status, po.picking_id,
            po.origin, po.note, po.created_at, po.updated_at
        FROM purchase_orders po
        LEFT JOIN partners p ON po.partner_id = p.id
        WHERE po.id = ?
        "#,
    )
    .bind(order_id)
    .fetch_optional(pool)
    .await?;

    let order = match order_opt {
        Some(o) => o,
        None => return Ok(None),
    };

    let lines = sqlx::query_as::<_, PurchaseOrderLine>(
        r#"
        SELECT 
            pol.id, pol.order_id, pol.product_id,
            prod.name as product_name, prod.sku as product_sku,
            pol.name, pol.product_uom_qty_milli, pol.product_uom_id,
            u.name as uom_name,
            pol.price_unit_cents, pol.discount_percent_milli, pol.tax_rate_milli,
            pol.price_subtotal_cents, pol.price_total_cents,
            pol.qty_received_milli, pol.qty_billed_milli,
            pol.sequence, pol.created_at
        FROM purchase_order_lines pol
        JOIN products prod ON pol.product_id = prod.id
        JOIN uoms u ON pol.product_uom_id = u.id
        WHERE pol.order_id = ?
        ORDER BY pol.sequence ASC, pol.id ASC
        "#,
    )
    .bind(order_id)
    .fetch_all(pool)
    .await?;

    Ok(Some(PurchaseOrderDetail { order, lines }))
}

pub async fn create_purchase_order(
    pool: &SqlitePool,
    input: CreatePurchaseOrderInput,
) -> Result<PurchaseOrderDetail> {
    let mut tx = pool.begin().await?;

    let current_year = chrono::Utc::now().year();
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM purchase_orders WHERE company_id = ? AND name LIKE ?",
    )
    .bind(input.company_id)
    .bind(format!("PO/{}/%", current_year))
    .fetch_one(&mut *tx)
    .await?;

    let order_name = format!("PO/{}/{:05}", current_year, count + 1);
    let currency = input.currency.unwrap_or_else(|| "EGP".to_string());

    // Calculate totals
    let mut untaxed_sum: i64 = 0;
    let mut tax_sum: i64 = 0;
    let mut total_sum: i64 = 0;

    for line in &input.lines {
        let disc = line.discount_percent_milli.unwrap_or(0);
        let tax = line.tax_rate_milli.unwrap_or(14000); // 14% Egyptian VAT
        let (sub, tx_amt, tot) = calculate_purchase_line_amounts(
            line.product_uom_qty_milli,
            line.price_unit_cents,
            disc,
            tax,
        );
        untaxed_sum += sub;
        tax_sum += tx_amt;
        total_sum += tot;
    }

    let order_id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO purchase_orders (
            company_id, name, partner_id, date_planned,
            state, currency, amount_untaxed_cents, amount_tax_cents, amount_total_cents,
            receipt_status, invoice_status, origin, note
        ) VALUES (
            ?, ?, ?, ?,
            'draft', ?, ?, ?, ?,
            'no', 'no', ?, ?
        )
        RETURNING id
        "#,
    )
    .bind(input.company_id)
    .bind(&order_name)
    .bind(input.partner_id)
    .bind(&input.date_planned)
    .bind(&currency)
    .bind(untaxed_sum)
    .bind(tax_sum)
    .bind(total_sum)
    .bind(&input.origin)
    .bind(&input.note)
    .fetch_one(&mut *tx)
    .await?;

    let mut sequence = 10;
    for line in input.lines {
        let disc = line.discount_percent_milli.unwrap_or(0);
        let tax = line.tax_rate_milli.unwrap_or(14000);
        let (sub, _, tot) = calculate_purchase_line_amounts(
            line.product_uom_qty_milli,
            line.price_unit_cents,
            disc,
            tax,
        );

        let line_name = match line.name {
            Some(n) if !n.trim().is_empty() => n,
            _ => {
                let p_name: String = sqlx::query_scalar("SELECT name FROM products WHERE id = ?")
                    .bind(line.product_id)
                    .fetch_one(&mut *tx)
                    .await?;
                p_name
            }
        };

        sqlx::query(
            r#"
            INSERT INTO purchase_order_lines (
                order_id, product_id, name,
                product_uom_qty_milli, product_uom_id, price_unit_cents,
                discount_percent_milli, tax_rate_milli,
                price_subtotal_cents, price_total_cents,
                qty_received_milli, qty_billed_milli, sequence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
            "#,
        )
        .bind(order_id)
        .bind(line.product_id)
        .bind(line_name)
        .bind(line.product_uom_qty_milli)
        .bind(line.product_uom_id)
        .bind(line.price_unit_cents)
        .bind(disc)
        .bind(tax)
        .bind(sub)
        .bind(tot)
        .bind(sequence)
        .execute(&mut *tx)
        .await?;

        sequence += 10;
    }

    tx.commit().await?;

    get_purchase_order(pool, order_id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn update_purchase_order(
    pool: &SqlitePool,
    input: UpdatePurchaseOrderInput,
) -> Result<PurchaseOrderDetail> {
    let mut tx = pool.begin().await?;

    let state: String = sqlx::query_scalar("SELECT state FROM purchase_orders WHERE id = ?")
        .bind(input.id)
        .fetch_one(&mut *tx)
        .await?;

    if state != "draft" && state != "sent" {
        return Err(sqlx::Error::Protocol(
            "Cannot modify a confirmed or cancelled purchase order".into(),
        ));
    }

    let mut untaxed_sum: i64 = 0;
    let mut tax_sum: i64 = 0;
    let mut total_sum: i64 = 0;

    for line in &input.lines {
        let disc = line.discount_percent_milli.unwrap_or(0);
        let tax = line.tax_rate_milli.unwrap_or(14000);
        let (sub, tx_amt, tot) = calculate_purchase_line_amounts(
            line.product_uom_qty_milli,
            line.price_unit_cents,
            disc,
            tax,
        );
        untaxed_sum += sub;
        tax_sum += tx_amt;
        total_sum += tot;
    }

    sqlx::query(
        r#"
        UPDATE purchase_orders
        SET partner_id = ?,
            date_planned = ?,
            origin = ?,
            note = ?,
            amount_untaxed_cents = ?,
            amount_tax_cents = ?,
            amount_total_cents = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        "#,
    )
    .bind(input.partner_id)
    .bind(&input.date_planned)
    .bind(&input.origin)
    .bind(&input.note)
    .bind(untaxed_sum)
    .bind(tax_sum)
    .bind(total_sum)
    .bind(input.id)
    .execute(&mut *tx)
    .await?;

    // Delete old lines
    sqlx::query("DELETE FROM purchase_order_lines WHERE order_id = ?")
        .bind(input.id)
        .execute(&mut *tx)
        .await?;

    let mut sequence = 10;
    for line in input.lines {
        let disc = line.discount_percent_milli.unwrap_or(0);
        let tax = line.tax_rate_milli.unwrap_or(14000);
        let (sub, _, tot) = calculate_purchase_line_amounts(
            line.product_uom_qty_milli,
            line.price_unit_cents,
            disc,
            tax,
        );

        let line_name = match line.name {
            Some(n) if !n.trim().is_empty() => n,
            _ => {
                let p_name: String = sqlx::query_scalar("SELECT name FROM products WHERE id = ?")
                    .bind(line.product_id)
                    .fetch_one(&mut *tx)
                    .await?;
                p_name
            }
        };

        sqlx::query(
            r#"
            INSERT INTO purchase_order_lines (
                order_id, product_id, name,
                product_uom_qty_milli, product_uom_id, price_unit_cents,
                discount_percent_milli, tax_rate_milli,
                price_subtotal_cents, price_total_cents,
                qty_received_milli, qty_billed_milli, sequence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
            "#,
        )
        .bind(input.id)
        .bind(line.product_id)
        .bind(line_name)
        .bind(line.product_uom_qty_milli)
        .bind(line.product_uom_id)
        .bind(line.price_unit_cents)
        .bind(disc)
        .bind(tax)
        .bind(sub)
        .bind(tot)
        .bind(sequence)
        .execute(&mut *tx)
        .await?;

        sequence += 10;
    }

    tx.commit().await?;

    get_purchase_order(pool, input.id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn confirm_purchase_order(
    pool: &SqlitePool,
    order_id: i64,
) -> Result<PurchaseOrderDetail> {
    let mut tx = pool.begin().await?;

    let order = sqlx::query_as::<_, PurchaseOrder>("SELECT * FROM purchase_orders WHERE id = ?")
        .bind(order_id)
        .fetch_one(&mut *tx)
        .await?;

    if order.state != "draft" && order.state != "sent" {
        return Err(sqlx::Error::Protocol(
            "Purchase order is already confirmed or cancelled".into(),
        ));
    }

    // 1. Fetch picking type for incoming receipts (code = 'incoming')
    let picking_type_row = sqlx::query_as::<_, (i64, Option<i64>, Option<i64>)>(
        "SELECT id, default_src_location_id, default_dest_location_id FROM stock_picking_types WHERE company_id = ? AND code = 'incoming' LIMIT 1",
    )
    .bind(order.company_id)
    .fetch_optional(&mut *tx)
    .await?;

    let (picking_type_id, src_loc_id, dest_loc_id) = match picking_type_row {
        Some((pt_id, s, d)) => (pt_id, s.unwrap_or(8), d.unwrap_or(5)),
        None => {
            let pt_id = sqlx::query_scalar::<_, i64>(
                "SELECT id FROM stock_picking_types WHERE company_id = ? LIMIT 1",
            )
            .bind(order.company_id)
            .fetch_one(&mut *tx)
            .await?;
            (pt_id, 8, 5)
        }
    };

    let current_year = chrono::Utc::now().year();
    let p_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM stock_pickings WHERE company_id = ? AND name LIKE ?",
    )
    .bind(order.company_id)
    .bind(format!("WH/IN/{}/%", current_year))
    .fetch_one(&mut *tx)
    .await?;

    let picking_name = format!("WH/IN/{}/{:05}", current_year, p_count + 1);

    // 2. Create incoming stock_picking
    let picking_id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO stock_pickings (
            company_id, name, picking_type_id, partner_id,
            src_location_id, dest_location_id, state,
            origin, scheduled_date, note
        ) VALUES (
            ?, ?, ?, ?,
            ?, ?, 'confirmed',
            ?, CURRENT_TIMESTAMP, ?
        )
        RETURNING id
        "#,
    )
    .bind(order.company_id)
    .bind(&picking_name)
    .bind(picking_type_id)
    .bind(order.partner_id)
    .bind(src_loc_id)
    .bind(dest_loc_id)
    .bind(&order.name)
    .bind(format!("إذن استلام مشتريات لأمر الشراء {}", order.name))
    .fetch_one(&mut *tx)
    .await?;

    // 3. Create stock_moves for storable items
    let lines = sqlx::query_as::<_, (i64, i64, String, i64, String)>(
        r#"
        SELECT pol.product_id, pol.product_uom_qty_milli, pol.name, pol.product_uom_id, prod.type
        FROM purchase_order_lines pol
        JOIN products prod ON pol.product_id = prod.id
        WHERE pol.order_id = ?
        "#,
    )
    .bind(order_id)
    .fetch_all(&mut *tx)
    .await?;

    for (product_id, qty_milli, line_name, uom_id, p_type) in lines {
        if p_type == "storable" {
            sqlx::query(
                r#"
                INSERT INTO stock_moves (
                    company_id, picking_id, product_id, product_uom_qty_milli,
                    product_uom_id, src_location_id, dest_location_id,
                    state, name, origin
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
                "#,
            )
            .bind(order.company_id)
            .bind(picking_id)
            .bind(product_id)
            .bind(qty_milli)
            .bind(uom_id)
            .bind(src_loc_id)
            .bind(dest_loc_id)
            .bind(line_name)
            .bind(&order.name)
            .execute(&mut *tx)
            .await?;
        }
    }

    // 4. Update purchase order to 'purchase' state
    sqlx::query(
        r#"
        UPDATE purchase_orders
        SET state = 'purchase',
            receipt_status = 'to_receive',
            invoice_status = 'to_bill',
            picking_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        "#,
    )
    .bind(picking_id)
    .bind(order_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    get_purchase_order(pool, order_id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn cancel_purchase_order(
    pool: &SqlitePool,
    order_id: i64,
) -> Result<PurchaseOrderDetail> {
    let mut tx = pool.begin().await?;

    let order = sqlx::query_as::<_, PurchaseOrder>("SELECT * FROM purchase_orders WHERE id = ?")
        .bind(order_id)
        .fetch_one(&mut *tx)
        .await?;

    if order.state == "done" {
        return Err(sqlx::Error::Protocol(
            "Cannot cancel a completed purchase order".into(),
        ));
    }

    // Cancel linked picking if not done
    if let Some(p_id) = order.picking_id {
        let p_state: String = sqlx::query_scalar("SELECT state FROM stock_pickings WHERE id = ?")
            .bind(p_id)
            .fetch_one(&mut *tx)
            .await?;

        if p_state != "done" {
            sqlx::query("UPDATE stock_pickings SET state = 'cancelled' WHERE id = ?")
                .bind(p_id)
                .execute(&mut *tx)
                .await?;

            sqlx::query("UPDATE stock_moves SET state = 'cancelled' WHERE picking_id = ?")
                .bind(p_id)
                .execute(&mut *tx)
                .await?;
        }
    }

    sqlx::query(
        "UPDATE purchase_orders SET state = 'cancelled', receipt_status = 'cancelled', invoice_status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(order_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    get_purchase_order(pool, order_id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn delete_purchase_order(pool: &SqlitePool, order_id: i64) -> Result<()> {
    let state: String = sqlx::query_scalar("SELECT state FROM purchase_orders WHERE id = ?")
        .bind(order_id)
        .fetch_one(pool)
        .await?;

    if state != "draft" && state != "cancelled" {
        return Err(sqlx::Error::Protocol(
            "Only draft or cancelled purchase orders can be deleted".into(),
        ));
    }

    sqlx::query("DELETE FROM purchase_orders WHERE id = ?")
        .bind(order_id)
        .execute(pool)
        .await?;

    Ok(())
}
