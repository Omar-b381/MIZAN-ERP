use serde::{Deserialize, Serialize};
use sqlx::{Result, SqlitePool, Row};
use chrono::NaiveDate;

// ============================================================================
// Data Transfer Objects (DTOs) for Reports
// ============================================================================

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct TrialBalanceItem {
    pub account_id: i64,
    pub account_code: String,
    pub account_name: String,
    pub account_type: String,
    pub debit_sum_cents: i64,
    pub credit_sum_cents: i64,
    pub net_balance_cents: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProfitAndLossAccountItem {
    pub account_id: i64,
    pub account_code: String,
    pub account_name: String,
    pub amount_cents: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProfitAndLossReport {
    pub start_date: String,
    pub end_date: String,
    pub revenues: Vec<ProfitAndLossAccountItem>,
    pub total_revenue_cents: i64,
    pub cogs: Vec<ProfitAndLossAccountItem>,
    pub total_cogs_cents: i64,
    pub gross_profit_cents: i64,
    pub operating_expenses: Vec<ProfitAndLossAccountItem>,
    pub total_expenses_cents: i64,
    pub net_profit_cents: i64,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct GeneralLedgerLine {
    pub move_id: i64,
    pub move_name: String,
    pub date: String,
    pub account_id: i64,
    pub account_code: String,
    pub account_name: String,
    pub partner_name: Option<String>,
    pub label: String,
    pub debit_cents: i64,
    pub credit_cents: i64,
    pub balance_cents: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GeneralLedgerAccountReport {
    pub account_id: i64,
    pub account_code: String,
    pub account_name: String,
    pub account_type: String,
    pub opening_balance_cents: i64,
    pub total_debit_cents: i64,
    pub total_credit_cents: i64,
    pub closing_balance_cents: i64,
    pub lines: Vec<GeneralLedgerLine>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct SalesPurchasesReportItem {
    pub group_key: String,
    pub group_label: String,
    pub count: i64,
    pub total_qty_milli: i64,
    pub amount_untaxed_cents: i64,
    pub amount_tax_cents: i64,
    pub amount_total_cents: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PartnerStatementLine {
    pub date: String,
    pub doc_type: String, // "invoice", "bill", "payment", "refund"
    pub reference: String,
    pub description: String,
    pub debit_cents: i64,
    pub credit_cents: i64,
    pub running_balance_cents: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PartnerStatementReport {
    pub partner_id: i64,
    pub partner_name: String,
    pub partner_type: String,
    pub tax_id: Option<String>,
    pub start_date: String,
    pub end_date: String,
    pub opening_balance_cents: i64,
    pub total_debit_cents: i64,
    pub total_credit_cents: i64,
    pub closing_balance_cents: i64,
    pub lines: Vec<PartnerStatementLine>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct PartnerAgingItem {
    pub partner_id: i64,
    pub partner_name: String,
    pub phone: Option<String>,
    pub bucket_0_30_cents: i64,
    pub bucket_31_60_cents: i64,
    pub bucket_61_90_cents: i64,
    pub bucket_90_plus_cents: i64,
    pub total_outstanding_cents: i64,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct StockOnHandReportItem {
    pub product_id: i64,
    pub default_code: String,
    pub product_name: String,
    pub category_name: String,
    pub location_id: i64,
    pub location_name: String,
    pub quantity_milli: i64,
    pub standard_price_cents: i64,
    pub valuation_cents: i64,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct StockMovementLedgerItem {
    pub id: i64,
    pub date: String,
    pub reference: String,
    pub product_id: i64,
    pub product_code: String,
    pub product_name: String,
    pub location_src_name: String,
    pub location_dest_name: String,
    pub quantity_milli: i64,
    pub state: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct LowStockReportItem {
    pub product_id: i64,
    pub default_code: String,
    pub product_name: String,
    pub category_name: String,
    pub current_qty_milli: i64,
    pub min_quantity_milli: i64,
    pub standard_price_cents: i64,
    pub reorder_shortage_milli: i64,
}

// Intermediate query helper structs
#[derive(sqlx::FromRow)]
struct PlAccountRow {
    account_id: i64,
    account_code: String,
    account_name: String,
    account_type: String,
    total_debit_cents: i64,
    total_credit_cents: i64,
}

#[derive(sqlx::FromRow)]
struct GlAccountRow {
    id: i64,
    code: String,
    name: String,
    r#type: String,
}

#[derive(sqlx::FromRow)]
struct GlLineRow {
    move_id: i64,
    move_name: String,
    move_date: String,
    partner_name: Option<String>,
    label: String,
    debit_cents: i64,
    credit_cents: i64,
}

#[allow(dead_code)]
#[derive(sqlx::FromRow)]
struct PartnerInfoRow {
    id: i64,
    name: String,
    is_customer: i64,
    is_supplier: i64,
    tax_id: Option<String>,
}

#[derive(sqlx::FromRow)]
struct StatementLineRow {
    move_date: String,
    move_name: String,
    move_type: String,
    label: String,
    debit_cents: i64,
    credit_cents: i64,
}

#[allow(dead_code)]
#[derive(sqlx::FromRow)]
struct OpenInvoiceRow {
    partner_id: i64,
    partner_name: String,
    partner_phone: Option<String>,
    move_id: i64,
    move_name: String,
    move_date: String,
    invoice_date_due: Option<String>,
    amount_total_cents: i64,
}

// ============================================================================
// Report Query Functions
// ============================================================================

/// 1. Trial Balance (ميزان المراجعة) with optional date filtering
pub async fn get_trial_balance_filtered(
    pool: &SqlitePool,
    company_id: i64,
    start_date: Option<String>,
    end_date: Option<String>,
) -> Result<Vec<TrialBalanceItem>> {
    let mut sql = String::from(
        r#"
        SELECT 
            acc.id as account_id,
            acc.code as account_code,
            acc.name as account_name,
            acc.type as account_type,
            COALESCE(SUM(aml.debit_cents), 0) as debit_sum_cents,
            COALESCE(SUM(aml.credit_cents), 0) as credit_sum_cents,
            COALESCE(SUM(aml.debit_cents - aml.credit_cents), 0) as net_balance_cents
        FROM account_accounts acc
        LEFT JOIN account_move_lines aml ON acc.id = aml.account_id
        LEFT JOIN account_moves m ON aml.move_id = m.id AND m.state = 'posted'
        WHERE acc.company_id = ? AND acc.is_active = 1
        "#,
    );

    if start_date.is_some() {
        sql.push_str(" AND (m.date IS NULL OR m.date >= ?) ");
    }
    if end_date.is_some() {
        sql.push_str(" AND (m.date IS NULL OR m.date <= ?) ");
    }

    sql.push_str(" GROUP BY acc.id ORDER BY acc.code ASC ");

    let mut query = sqlx::query_as::<_, TrialBalanceItem>(&sql).bind(company_id);

    if let Some(ref s) = start_date {
        query = query.bind(s);
    }
    if let Some(ref e) = end_date {
        query = query.bind(e);
    }

    query.fetch_all(pool).await
}

/// 2. Profit and Loss / Income Statement (قائمة الدخل والأرباح والخسائر)
pub async fn get_profit_and_loss(
    pool: &SqlitePool,
    company_id: i64,
    start_date: &str,
    end_date: &str,
) -> Result<ProfitAndLossReport> {
    let rows = sqlx::query_as::<_, PlAccountRow>(
        r#"
        SELECT 
            acc.id as account_id,
            acc.code as account_code,
            acc.name as account_name,
            acc.type as account_type,
            COALESCE(SUM(aml.debit_cents), 0) as total_debit_cents,
            COALESCE(SUM(aml.credit_cents), 0) as total_credit_cents
        FROM account_accounts acc
        JOIN account_move_lines aml ON acc.id = aml.account_id
        JOIN account_moves m ON aml.move_id = m.id
        WHERE acc.company_id = ? 
          AND acc.is_active = 1
          AND m.state = 'posted'
          AND m.date >= ? AND m.date <= ?
          AND acc.type IN ('income', 'expense')
        GROUP BY acc.id
        ORDER BY acc.code ASC
        "#,
    )
    .bind(company_id)
    .bind(start_date)
    .bind(end_date)
    .fetch_all(pool)
    .await?;

    let mut revenues = Vec::new();
    let mut cogs = Vec::new();
    let mut operating_expenses = Vec::new();

    let mut total_revenue_cents: i64 = 0;
    let mut total_cogs_cents: i64 = 0;
    let mut total_expenses_cents: i64 = 0;

    for r in rows {
        if r.account_type == "income" {
            let net_income = r.total_credit_cents - r.total_debit_cents;
            total_revenue_cents += net_income;
            revenues.push(ProfitAndLossAccountItem {
                account_id: r.account_id,
                account_code: r.account_code,
                account_name: r.account_name,
                amount_cents: net_income,
            });
        } else if r.account_type == "expense" {
            let net_expense = r.total_debit_cents - r.total_credit_cents;
            if r.account_code == "5010" || r.account_name.contains("تكلفة") || r.account_name.contains("COGS") {
                total_cogs_cents += net_expense;
                cogs.push(ProfitAndLossAccountItem {
                    account_id: r.account_id,
                    account_code: r.account_code,
                    account_name: r.account_name,
                    amount_cents: net_expense,
                });
            } else {
                total_expenses_cents += net_expense;
                operating_expenses.push(ProfitAndLossAccountItem {
                    account_id: r.account_id,
                    account_code: r.account_code,
                    account_name: r.account_name,
                    amount_cents: net_expense,
                });
            }
        }
    }

    let gross_profit_cents = total_revenue_cents - total_cogs_cents;
    let net_profit_cents = gross_profit_cents - total_expenses_cents;

    Ok(ProfitAndLossReport {
        start_date: start_date.to_string(),
        end_date: end_date.to_string(),
        revenues,
        total_revenue_cents,
        cogs,
        total_cogs_cents,
        gross_profit_cents,
        operating_expenses,
        total_expenses_cents,
        net_profit_cents,
    })
}

/// 3. General Ledger Detail (دفتر الأستاذ العام)
pub async fn get_general_ledger(
    pool: &SqlitePool,
    company_id: i64,
    account_id: Option<i64>,
    start_date: &str,
    end_date: &str,
) -> Result<Vec<GeneralLedgerAccountReport>> {
    let accounts = sqlx::query_as::<_, GlAccountRow>(
        r#"
        SELECT id, code, name, type 
        FROM account_accounts 
        WHERE company_id = ? AND is_active = 1 AND (? IS NULL OR id = ?)
        ORDER BY code ASC
        "#,
    )
    .bind(company_id)
    .bind(account_id)
    .bind(account_id)
    .fetch_all(pool)
    .await?;

    let mut result = Vec::new();

    for acc in accounts {
        let op_row = sqlx::query(
            r#"
            SELECT COALESCE(SUM(aml.debit_cents - aml.credit_cents), 0) as op_balance
            FROM account_move_lines aml
            JOIN account_moves m ON aml.move_id = m.id
            WHERE aml.account_id = ? AND m.state = 'posted' AND m.date < ?
            "#,
        )
        .bind(acc.id)
        .bind(start_date)
        .fetch_one(pool)
        .await?;

        let opening_balance_cents: i64 = op_row.try_get("op_balance").unwrap_or(0);

        let raw_lines = sqlx::query_as::<_, GlLineRow>(
            r#"
            SELECT 
                aml.move_id,
                m.name as move_name,
                m.date as move_date,
                p.name as partner_name,
                aml.name as label,
                aml.debit_cents,
                aml.credit_cents
            FROM account_move_lines aml
            JOIN account_moves m ON aml.move_id = m.id
            LEFT JOIN partners p ON aml.partner_id = p.id
            WHERE aml.account_id = ? 
              AND m.state = 'posted'
              AND m.date >= ? AND m.date <= ?
            ORDER BY m.date ASC, aml.id ASC
            "#,
        )
        .bind(acc.id)
        .bind(start_date)
        .bind(end_date)
        .fetch_all(pool)
        .await?;

        let mut lines = Vec::new();
        let mut running = opening_balance_cents;
        let mut total_debit = 0;
        let mut total_credit = 0;

        for l in raw_lines {
            total_debit += l.debit_cents;
            total_credit += l.credit_cents;
            running += l.debit_cents - l.credit_cents;

            lines.push(GeneralLedgerLine {
                move_id: l.move_id,
                move_name: l.move_name,
                date: l.move_date,
                account_id: acc.id,
                account_code: acc.code.clone(),
                account_name: acc.name.clone(),
                partner_name: l.partner_name,
                label: l.label,
                debit_cents: l.debit_cents,
                credit_cents: l.credit_cents,
                balance_cents: running,
            });
        }

        if opening_balance_cents != 0 || !lines.is_empty() {
            result.push(GeneralLedgerAccountReport {
                account_id: acc.id,
                account_code: acc.code,
                account_name: acc.name,
                account_type: acc.r#type,
                opening_balance_cents,
                total_debit_cents: total_debit,
                total_credit_cents: total_credit,
                closing_balance_cents: running,
                lines,
            });
        }
    }

    Ok(result)
}

/// 4. Sales Report (تقرير المبيعات)
pub async fn get_sales_report(
    pool: &SqlitePool,
    company_id: i64,
    group_by: &str, // "period", "product", "customer"
    start_date: &str,
    end_date: &str,
) -> Result<Vec<SalesPurchasesReportItem>> {
    match group_by {
        "product" => {
            let rows = sqlx::query_as::<_, SalesPurchasesReportItem>(
                r#"
                SELECT 
                    CAST(p.id AS TEXT) as group_key,
                    p.name as group_label,
                    COUNT(DISTINCT m.id) as count,
                    COALESCE(SUM(aml.quantity_milli), 0) as total_qty_milli,
                    COALESCE(SUM(aml.debit_cents + aml.credit_cents), 0) as amount_untaxed_cents,
                    0 as amount_tax_cents,
                    COALESCE(SUM(aml.debit_cents + aml.credit_cents), 0) as amount_total_cents
                FROM account_move_lines aml
                JOIN account_moves m ON aml.move_id = m.id
                JOIN products p ON aml.product_id = p.id
                WHERE m.company_id = ? 
                  AND m.move_type = 'out_invoice' 
                  AND m.state = 'posted'
                  AND m.date >= ? AND m.date <= ?
                GROUP BY p.id
                ORDER BY amount_total_cents DESC
                "#,
            )
            .bind(company_id)
            .bind(start_date)
            .bind(end_date)
            .fetch_all(pool)
            .await?;
            Ok(rows)
        }
        "customer" => {
            let rows = sqlx::query_as::<_, SalesPurchasesReportItem>(
                r#"
                SELECT 
                    CAST(p.id AS TEXT) as group_key,
                    p.name as group_label,
                    COUNT(m.id) as count,
                    0 as total_qty_milli,
                    COALESCE(SUM(m.amount_untaxed_cents), 0) as amount_untaxed_cents,
                    COALESCE(SUM(m.amount_tax_cents), 0) as amount_tax_cents,
                    COALESCE(SUM(m.amount_total_cents), 0) as amount_total_cents
                FROM account_moves m
                JOIN partners p ON m.partner_id = p.id
                WHERE m.company_id = ? 
                  AND m.move_type = 'out_invoice' 
                  AND m.state = 'posted'
                  AND m.date >= ? AND m.date <= ?
                GROUP BY p.id
                ORDER BY amount_total_cents DESC
                "#,
            )
            .bind(company_id)
            .bind(start_date)
            .bind(end_date)
            .fetch_all(pool)
            .await?;
            Ok(rows)
        }
        _ => {
            let rows = sqlx::query_as::<_, SalesPurchasesReportItem>(
                r#"
                SELECT 
                    SUBSTR(m.date, 1, 7) as group_key,
                    SUBSTR(m.date, 1, 7) as group_label,
                    COUNT(m.id) as count,
                    0 as total_qty_milli,
                    COALESCE(SUM(m.amount_untaxed_cents), 0) as amount_untaxed_cents,
                    COALESCE(SUM(m.amount_tax_cents), 0) as amount_tax_cents,
                    COALESCE(SUM(m.amount_total_cents), 0) as amount_total_cents
                FROM account_moves m
                WHERE m.company_id = ? 
                  AND m.move_type = 'out_invoice' 
                  AND m.state = 'posted'
                  AND m.date >= ? AND m.date <= ?
                GROUP BY SUBSTR(m.date, 1, 7)
                ORDER BY group_key ASC
                "#,
            )
            .bind(company_id)
            .bind(start_date)
            .bind(end_date)
            .fetch_all(pool)
            .await?;
            Ok(rows)
        }
    }
}

/// 5. Purchases Report (تقرير المشتريات)
pub async fn get_purchases_report(
    pool: &SqlitePool,
    company_id: i64,
    group_by: &str, // "period", "product", "supplier"
    start_date: &str,
    end_date: &str,
) -> Result<Vec<SalesPurchasesReportItem>> {
    match group_by {
        "product" => {
            let rows = sqlx::query_as::<_, SalesPurchasesReportItem>(
                r#"
                SELECT 
                    CAST(p.id AS TEXT) as group_key,
                    p.name as group_label,
                    COUNT(DISTINCT m.id) as count,
                    COALESCE(SUM(aml.quantity_milli), 0) as total_qty_milli,
                    COALESCE(SUM(aml.debit_cents + aml.credit_cents), 0) as amount_untaxed_cents,
                    0 as amount_tax_cents,
                    COALESCE(SUM(aml.debit_cents + aml.credit_cents), 0) as amount_total_cents
                FROM account_move_lines aml
                JOIN account_moves m ON aml.move_id = m.id
                JOIN products p ON aml.product_id = p.id
                WHERE m.company_id = ? 
                  AND m.move_type = 'in_invoice' 
                  AND m.state = 'posted'
                  AND m.date >= ? AND m.date <= ?
                GROUP BY p.id
                ORDER BY amount_total_cents DESC
                "#,
            )
            .bind(company_id)
            .bind(start_date)
            .bind(end_date)
            .fetch_all(pool)
            .await?;
            Ok(rows)
        }
        "supplier" => {
            let rows = sqlx::query_as::<_, SalesPurchasesReportItem>(
                r#"
                SELECT 
                    CAST(p.id AS TEXT) as group_key,
                    p.name as group_label,
                    COUNT(m.id) as count,
                    0 as total_qty_milli,
                    COALESCE(SUM(m.amount_untaxed_cents), 0) as amount_untaxed_cents,
                    COALESCE(SUM(m.amount_tax_cents), 0) as amount_tax_cents,
                    COALESCE(SUM(m.amount_total_cents), 0) as amount_total_cents
                FROM account_moves m
                JOIN partners p ON m.partner_id = p.id
                WHERE m.company_id = ? 
                  AND m.move_type = 'in_invoice' 
                  AND m.state = 'posted'
                  AND m.date >= ? AND m.date <= ?
                GROUP BY p.id
                ORDER BY amount_total_cents DESC
                "#,
            )
            .bind(company_id)
            .bind(start_date)
            .bind(end_date)
            .fetch_all(pool)
            .await?;
            Ok(rows)
        }
        _ => {
            let rows = sqlx::query_as::<_, SalesPurchasesReportItem>(
                r#"
                SELECT 
                    SUBSTR(m.date, 1, 7) as group_key,
                    SUBSTR(m.date, 1, 7) as group_label,
                    COUNT(m.id) as count,
                    0 as total_qty_milli,
                    COALESCE(SUM(m.amount_untaxed_cents), 0) as amount_untaxed_cents,
                    COALESCE(SUM(m.amount_tax_cents), 0) as amount_tax_cents,
                    COALESCE(SUM(m.amount_total_cents), 0) as amount_total_cents
                FROM account_moves m
                WHERE m.company_id = ? 
                  AND m.move_type = 'in_invoice' 
                  AND m.state = 'posted'
                  AND m.date >= ? AND m.date <= ?
                GROUP BY SUBSTR(m.date, 1, 7)
                ORDER BY group_key ASC
                "#,
            )
            .bind(company_id)
            .bind(start_date)
            .bind(end_date)
            .fetch_all(pool)
            .await?;
            Ok(rows)
        }
    }
}

/// 6. Partner Statement of Account (كشف حساب عميل أو مورد)
pub async fn get_partner_statement(
    pool: &SqlitePool,
    company_id: i64,
    partner_id: i64,
    start_date: &str,
    end_date: &str,
) -> Result<PartnerStatementReport> {
    let partner = sqlx::query_as::<_, PartnerInfoRow>(
        "SELECT id, name, (sub_type = 'customer') as is_customer, (sub_type = 'vendor') as is_supplier, tax_id FROM partners WHERE id = ?",
    )
    .bind(partner_id)
    .fetch_one(pool)
    .await?;

    let partner_type = if partner.is_customer == 1 {
        "customer"
    } else {
        "supplier"
    };

    let op_row = sqlx::query(
        r#"
        SELECT COALESCE(SUM(aml.debit_cents - aml.credit_cents), 0) as op_bal
        FROM account_move_lines aml
        JOIN account_moves m ON aml.move_id = m.id
        JOIN account_accounts aa ON aml.account_id = aa.id
        WHERE (aml.partner_id = ? OR m.partner_id = ?)
          AND m.company_id = ?
          AND (aa.is_reconciled = 1 OR aa.code IN ('1030', '2010'))
          AND m.state = 'posted'
          AND m.date < ?
        "#,
    )
    .bind(partner_id)
    .bind(partner_id)
    .bind(company_id)
    .bind(start_date)
    .fetch_one(pool)
    .await?;

    let opening_balance_cents: i64 = op_row.try_get("op_bal").unwrap_or(0);

    let raw_lines = sqlx::query_as::<_, StatementLineRow>(
        r#"
        SELECT 
            m.date as move_date,
            m.name as move_name,
            m.move_type,
            aml.name as label,
            aml.debit_cents,
            aml.credit_cents
        FROM account_move_lines aml
        JOIN account_moves m ON aml.move_id = m.id
        JOIN account_accounts aa ON aml.account_id = aa.id
        WHERE (aml.partner_id = ? OR m.partner_id = ?)
          AND m.company_id = ?
          AND (aa.is_reconciled = 1 OR aa.code IN ('1030', '2010'))
          AND m.state = 'posted'
          AND m.date >= ? AND m.date <= ?
        ORDER BY m.date ASC, aml.id ASC
        "#,
    )
    .bind(partner_id)
    .bind(partner_id)
    .bind(company_id)
    .bind(start_date)
    .bind(end_date)
    .fetch_all(pool)
    .await?;

    let mut lines = Vec::new();
    let mut running = opening_balance_cents;
    let mut total_debit = 0;
    let mut total_credit = 0;

    for l in raw_lines {
        total_debit += l.debit_cents;
        total_credit += l.credit_cents;
        running += l.debit_cents - l.credit_cents;

        let doc_type = match l.move_type.as_str() {
            "out_invoice" => "invoice",
            "in_invoice" => "bill",
            "out_refund" | "in_refund" => "refund",
            _ => "payment",
        };

        lines.push(PartnerStatementLine {
            date: l.move_date,
            doc_type: doc_type.to_string(),
            reference: l.move_name,
            description: l.label,
            debit_cents: l.debit_cents,
            credit_cents: l.credit_cents,
            running_balance_cents: running,
        });
    }

    Ok(PartnerStatementReport {
        partner_id: partner.id,
        partner_name: partner.name,
        partner_type: partner_type.to_string(),
        tax_id: partner.tax_id,
        start_date: start_date.to_string(),
        end_date: end_date.to_string(),
        opening_balance_cents,
        total_debit_cents: total_debit,
        total_credit_cents: total_credit,
        closing_balance_cents: running,
        lines,
    })
}

/// 7. Partner Aging Report (أعمار ديون العملاء والموردين)
pub async fn get_partner_aging(
    pool: &SqlitePool,
    company_id: i64,
    partner_type: &str, // "customer" or "supplier"
    as_of_date: &str,
) -> Result<Vec<PartnerAgingItem>> {
    let target_move_type = if partner_type == "customer" {
        "out_invoice"
    } else {
        "in_invoice"
    };

    let as_of = NaiveDate::parse_from_str(as_of_date, "%Y-%m-%d")
        .unwrap_or_else(|_| chrono::Local::now().date_naive());

    let open_invoices = sqlx::query_as::<_, OpenInvoiceRow>(
        r#"
        SELECT 
            p.id as partner_id,
            p.name as partner_name,
            p.phone as partner_phone,
            m.id as move_id,
            m.name as move_name,
            m.date as move_date,
            m.invoice_date_due,
            m.amount_total_cents
        FROM account_moves m
        JOIN partners p ON m.partner_id = p.id
        WHERE m.company_id = ?
          AND m.move_type = ?
          AND m.state = 'posted'
          AND m.payment_state != 'paid'
          AND m.date <= ?
        ORDER BY p.name ASC, m.date ASC
        "#,
    )
    .bind(company_id)
    .bind(target_move_type)
    .bind(as_of_date)
    .fetch_all(pool)
    .await?;

    use std::collections::HashMap;

    let mut partner_map: HashMap<i64, PartnerAgingItem> = HashMap::new();

    for inv in open_invoices {
        let inv_date_str = inv.invoice_date_due.unwrap_or(inv.move_date);
        let inv_date = NaiveDate::parse_from_str(&inv_date_str, "%Y-%m-%d")
            .unwrap_or(as_of);

        let days_diff = (as_of - inv_date).num_days();

        let entry = partner_map.entry(inv.partner_id).or_insert(PartnerAgingItem {
            partner_id: inv.partner_id,
            partner_name: inv.partner_name,
            phone: inv.partner_phone,
            bucket_0_30_cents: 0,
            bucket_31_60_cents: 0,
            bucket_61_90_cents: 0,
            bucket_90_plus_cents: 0,
            total_outstanding_cents: 0,
        });

        let amount = inv.amount_total_cents;
        entry.total_outstanding_cents += amount;

        if days_diff <= 30 {
            entry.bucket_0_30_cents += amount;
        } else if days_diff <= 60 {
            entry.bucket_31_60_cents += amount;
        } else if days_diff <= 90 {
            entry.bucket_61_90_cents += amount;
        } else {
            entry.bucket_90_plus_cents += amount;
        }
    }

    let mut list: Vec<PartnerAgingItem> = partner_map.into_values().collect();
    list.sort_by(|a, b| b.total_outstanding_cents.cmp(&a.total_outstanding_cents));

    Ok(list)
}

/// 8. Stock-on-Hand Report (تقرير جرد وتقييم المخزون الحالي)
pub async fn get_stock_on_hand_report(
    pool: &SqlitePool,
    company_id: i64,
    warehouse_id: Option<i64>,
) -> Result<Vec<StockOnHandReportItem>> {
    let rows = sqlx::query_as::<_, StockOnHandReportItem>(
        r#"
        SELECT 
            p.id as product_id,
            p.default_code,
            p.name as product_name,
            c.name as category_name,
            l.id as location_id,
            l.name as location_name,
            sq.quantity_milli,
            p.standard_price_cents,
            CAST((sq.quantity_milli * p.standard_price_cents) / 1000 AS INTEGER) as valuation_cents
        FROM stock_quants sq
        JOIN products p ON sq.product_id = p.id
        JOIN product_categories c ON p.category_id = c.id
        JOIN stock_locations l ON sq.location_id = l.id
        WHERE p.company_id = ? 
          AND p.is_active = 1
          AND l.usage = 'internal'
          AND (? IS NULL OR l.warehouse_id = ?)
        ORDER BY c.name ASC, p.name ASC
        "#,
    )
    .bind(company_id)
    .bind(warehouse_id)
    .bind(warehouse_id)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

/// 9. Stock Movement Ledger (سجل حركة المخزون)
pub async fn get_stock_movement_ledger(
    pool: &SqlitePool,
    company_id: i64,
    product_id: Option<i64>,
    start_date: &str,
    end_date: &str,
) -> Result<Vec<StockMovementLedgerItem>> {
    let rows = sqlx::query_as::<_, StockMovementLedgerItem>(
        r#"
        SELECT 
            sm.id,
            sm.date,
            sm.reference,
            p.id as product_id,
            p.default_code as product_code,
            p.name as product_name,
            loc_src.name as location_src_name,
            loc_dest.name as location_dest_name,
            sm.product_uom_qty_milli as quantity_milli,
            sm.state
        FROM stock_moves sm
        JOIN products p ON sm.product_id = p.id
        JOIN stock_locations loc_src ON sm.location_id = loc_src.id
        JOIN stock_locations loc_dest ON sm.location_dest_id = loc_dest.id
        WHERE p.company_id = ?
          AND sm.state = 'done'
          AND (? IS NULL OR sm.product_id = ?)
          AND sm.date >= ? AND sm.date <= ?
        ORDER BY sm.date DESC, sm.id DESC
        "#,
    )
    .bind(company_id)
    .bind(product_id)
    .bind(product_id)
    .bind(start_date)
    .bind(end_date)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

/// 10. Low-Stock & Reorder Alert Report (تقرير النواقص وحد الطلب)
pub async fn get_low_stock_report(
    pool: &SqlitePool,
    company_id: i64,
) -> Result<Vec<LowStockReportItem>> {
    let rows = sqlx::query_as::<_, LowStockReportItem>(
        r#"
        SELECT 
            p.id as product_id,
            p.default_code,
            p.name as product_name,
            c.name as category_name,
            COALESCE(SUM(sq.quantity_milli), 0) as current_qty_milli,
            p.min_quantity_milli,
            p.standard_price_cents,
            (p.min_quantity_milli - COALESCE(SUM(sq.quantity_milli), 0)) as reorder_shortage_milli
        FROM products p
        JOIN product_categories c ON p.category_id = c.id
        LEFT JOIN stock_quants sq ON p.id = sq.product_id
        LEFT JOIN stock_locations l ON sq.location_id = l.id AND l.usage = 'internal'
        WHERE p.company_id = ?
          AND p.is_active = 1
          AND p.type = 'storable'
        GROUP BY p.id
        HAVING COALESCE(SUM(sq.quantity_milli), 0) <= p.min_quantity_milli
        ORDER BY reorder_shortage_milli DESC
        "#,
    )
    .bind(company_id)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}
