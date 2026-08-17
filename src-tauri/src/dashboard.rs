use serde::{Deserialize, Serialize};
use sqlx::{Result, SqlitePool};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardMetrics {
    pub company_id: i64,
    // Sales & Customers
    pub total_sales_cents: i64,
    pub sales_orders_count: i64,
    pub top_customers_count: i64,
    // Purchases & Suppliers
    pub total_purchases_cents: i64,
    pub purchase_orders_count: i64,
    // Inventory & Warehouses
    pub inventory_valuation_cents: i64,
    pub total_products_count: i64,
    pub pending_deliveries_count: i64,
    pub pending_receipts_count: i64,
    // Accounting & Cash Flow
    pub accounts_receivable_cents: i64,
    pub accounts_payable_cents: i64,
    pub cash_bank_balance_cents: i64,
    pub net_vat_liability_cents: i64,
    // Human Resources
    pub active_employees_count: i64,
    pub monthly_payroll_cents: i64,
    pub pending_leaves_count: i64,
}

pub async fn get_dashboard_metrics(pool: &SqlitePool, company_id: i64) -> Result<DashboardMetrics> {
    // 1. Sales metrics
    let total_sales_cents: i64 = sqlx::query_scalar(
        r#"
        SELECT COALESCE(SUM(amount_total_cents), 0)
        FROM sale_orders
        WHERE company_id = ? AND state IN ('sale', 'done')
        "#,
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    let sales_orders_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM sale_orders WHERE company_id = ?",
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    let top_customers_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(DISTINCT partner_id) FROM sale_orders WHERE company_id = ?",
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    // 2. Purchases metrics
    let total_purchases_cents: i64 = sqlx::query_scalar(
        r#"
        SELECT COALESCE(SUM(amount_total_cents), 0)
        FROM purchase_orders
        WHERE company_id = ? AND state IN ('purchase', 'done')
        "#,
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    let purchase_orders_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM purchase_orders WHERE company_id = ?",
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    // 3. Inventory metrics
    let total_products_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM products WHERE company_id = ? AND is_active = 1",
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    let inventory_valuation_cents: i64 = sqlx::query_scalar(
        r#"
        SELECT COALESCE(SUM(sq.quantity_milli * p.cost_price_cents / 1000), 0)
        FROM stock_quantities sq
        JOIN products p ON sq.product_id = p.id
        JOIN stock_locations sl ON sq.location_id = sl.id
        WHERE sq.company_id = ? AND sl.usage = 'internal'
        "#,
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    let pending_deliveries_count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM stock_pickings sp
        JOIN stock_picking_types spt ON sp.picking_type_id = spt.id
        WHERE sp.company_id = ? AND spt.code = 'outgoing' AND sp.state IN ('draft', 'waiting', 'confirmed')
        "#,
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    let pending_receipts_count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM stock_pickings sp
        JOIN stock_picking_types spt ON sp.picking_type_id = spt.id
        WHERE sp.company_id = ? AND spt.code = 'incoming' AND sp.state IN ('draft', 'waiting', 'confirmed')
        "#,
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    // 4. Accounting & Cash Flow metrics (from posted account_move_lines)
    // A/R (Account code '1030')
    let accounts_receivable_cents: i64 = sqlx::query_scalar(
        r#"
        SELECT COALESCE(SUM(aml.debit_cents - aml.credit_cents), 0)
        FROM account_move_lines aml
        JOIN account_accounts aa ON aml.account_id = aa.id
        JOIN account_moves am ON aml.move_id = am.id
        WHERE aml.company_id = ? AND aa.code = '1030' AND am.state = 'posted'
        "#,
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    // A/P (Account code '2010')
    let accounts_payable_cents: i64 = sqlx::query_scalar(
        r#"
        SELECT COALESCE(SUM(aml.credit_cents - aml.debit_cents), 0)
        FROM account_move_lines aml
        JOIN account_accounts aa ON aml.account_id = aa.id
        JOIN account_moves am ON aml.move_id = am.id
        WHERE aml.company_id = ? AND aa.code = '2010' AND am.state = 'posted'
        "#,
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    // Cash & Bank (Codes '1010', '1020')
    let cash_bank_balance_cents: i64 = sqlx::query_scalar(
        r#"
        SELECT COALESCE(SUM(aml.debit_cents - aml.credit_cents), 0)
        FROM account_move_lines aml
        JOIN account_accounts aa ON aml.account_id = aa.id
        JOIN account_moves am ON aml.move_id = am.id
        WHERE aml.company_id = ? AND aa.code IN ('1010', '1020') AND am.state = 'posted'
        "#,
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    // VAT Output ('2020') minus VAT Input ('2025')
    let vat_output_cents: i64 = sqlx::query_scalar(
        r#"
        SELECT COALESCE(SUM(aml.credit_cents - aml.debit_cents), 0)
        FROM account_move_lines aml
        JOIN account_accounts aa ON aml.account_id = aa.id
        JOIN account_moves am ON aml.move_id = am.id
        WHERE aml.company_id = ? AND aa.code = '2020' AND am.state = 'posted'
        "#,
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    let vat_input_cents: i64 = sqlx::query_scalar(
        r#"
        SELECT COALESCE(SUM(aml.debit_cents - aml.credit_cents), 0)
        FROM account_move_lines aml
        JOIN account_accounts aa ON aml.account_id = aa.id
        JOIN account_moves am ON aml.move_id = am.id
        WHERE aml.company_id = ? AND aa.code = '2025' AND am.state = 'posted'
        "#,
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    let net_vat_liability_cents = vat_output_cents - vat_input_cents;

    // 5. Human Resources metrics
    let active_employees_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM hr_employees WHERE company_id = ? AND status = 'active'",
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    let monthly_payroll_cents: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(wage_cents), 0) FROM hr_contracts WHERE company_id = ? AND state = 'open'",
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    let pending_leaves_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM hr_leaves WHERE company_id = ? AND state = 'confirm'",
    )
    .bind(company_id)
    .fetch_one(pool)
    .await?;

    Ok(DashboardMetrics {
        company_id,
        total_sales_cents,
        sales_orders_count,
        top_customers_count,
        total_purchases_cents,
        purchase_orders_count,
        inventory_valuation_cents,
        total_products_count,
        pending_deliveries_count,
        pending_receipts_count,
        accounts_receivable_cents,
        accounts_payable_cents,
        cash_bank_balance_cents,
        net_vat_liability_cents,
        active_employees_count,
        monthly_payroll_cents,
        pending_leaves_count,
    })
}
