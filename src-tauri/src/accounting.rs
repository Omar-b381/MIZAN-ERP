use serde::{Deserialize, Serialize};
use sqlx::{Result, SqlitePool, Row};
use chrono::Datelike;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Account {
    pub id: i64,
    pub company_id: i64,
    pub code: String,
    pub name: String,
    pub r#type: String, // 'asset', 'liability', 'equity', 'income', 'expense'
    pub is_reconciled: i64,
    pub is_active: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct AccountJournal {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub code: String, // 'INV', 'BILL', 'BNK', 'CSH', 'MISC'
    pub r#type: String, // 'sale', 'purchase', 'bank', 'cash', 'general'
    pub default_account_id: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct AccountMove {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub date: String,
    pub journal_id: i64,
    #[sqlx(default)]
    pub journal_name: Option<String>,
    pub partner_id: Option<i64>,
    #[sqlx(default)]
    pub partner_name: Option<String>,
    pub move_type: String, // 'entry', 'out_invoice', 'in_invoice', 'out_refund', 'in_refund'
    pub state: String,     // 'draft', 'posted', 'cancelled'
    pub amount_untaxed_cents: i64,
    pub amount_tax_cents: i64,
    pub amount_total_cents: i64,
    pub currency: String,
    pub invoice_date_due: Option<String>,
    pub payment_state: String, // 'not_paid', 'in_payment', 'paid', 'partial', 'reversed'
    pub origin: Option<String>,
    pub note: Option<String>,
    pub reversed_entry_id: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct AccountMoveLine {
    pub id: i64,
    pub move_id: i64,
    pub account_id: i64,
    pub account_code: Option<String>,
    pub account_name: Option<String>,
    pub partner_id: Option<i64>,
    pub name: String,
    pub debit_cents: i64,
    pub credit_cents: i64,
    pub balance_cents: i64,
    pub product_id: Option<i64>,
    pub product_name: Option<String>,
    pub quantity_milli: Option<i64>,
    pub price_unit_cents: Option<i64>,
    pub discount_percent_milli: Option<i64>,
    pub tax_rate_milli: Option<i64>,
    pub sequence: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AccountMoveDetail {
    pub r#move: AccountMove,
    pub lines: Vec<AccountMoveLine>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct AccountPayment {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub partner_id: i64,
    pub partner_name: Option<String>,
    pub payment_type: String, // 'inbound', 'outbound'
    pub amount_cents: i64,
    pub date: String,
    pub journal_id: i64,
    pub journal_name: Option<String>,
    pub payment_method: String, // 'cash', 'bank_transfer', 'cheque'
    pub state: String,          // 'draft', 'posted', 'cancelled'
    pub move_id: Option<i64>,
    pub invoice_id: Option<i64>,
    pub note: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct TrialBalanceRow {
    pub account_id: i64,
    pub account_code: String,
    pub account_name: String,
    pub account_type: String,
    pub debit_sum_cents: i64,
    pub credit_sum_cents: i64,
    pub net_balance_cents: i64,
}

// ----------------------------------------------------
// Inputs
// ----------------------------------------------------

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateAccountInput {
    pub company_id: i64,
    pub code: String,
    pub name: String,
    pub r#type: String,
    pub is_reconciled: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateInvoiceLineInput {
    pub product_id: Option<i64>,
    pub account_id: Option<i64>,
    pub name: String,
    pub quantity_milli: i64,
    pub price_unit_cents: i64,
    pub discount_percent_milli: Option<i64>,
    pub tax_rate_milli: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateInvoiceInput {
    pub company_id: i64,
    pub partner_id: i64,
    pub move_type: String, // 'out_invoice' (customer), 'in_invoice' (vendor bill)
    pub date: Option<String>,
    pub invoice_date_due: Option<String>,
    pub currency: Option<String>,
    pub origin: Option<String>,
    pub note: Option<String>,
    pub lines: Vec<CreateInvoiceLineInput>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateJournalEntryLineInput {
    pub account_id: i64,
    pub partner_id: Option<i64>,
    pub name: String,
    pub debit_cents: i64,
    pub credit_cents: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateJournalEntryInput {
    pub company_id: i64,
    pub journal_id: i64,
    pub date: Option<String>,
    pub origin: Option<String>,
    pub note: Option<String>,
    pub lines: Vec<CreateJournalEntryLineInput>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePaymentInput {
    pub company_id: i64,
    pub partner_id: i64,
    pub payment_type: String, // 'inbound', 'outbound'
    pub amount_cents: i64,
    pub date: Option<String>,
    pub journal_id: i64,
    pub payment_method: Option<String>,
    pub invoice_id: Option<i64>,
    pub note: Option<String>,
}

// ----------------------------------------------------
// Functions & Queries
// ----------------------------------------------------

pub async fn list_accounts(pool: &SqlitePool, company_id: i64) -> Result<Vec<Account>> {
    sqlx::query_as::<_, Account>(
        "SELECT id, company_id, code, name, type, is_reconciled, is_active, created_at FROM account_accounts WHERE company_id = ? AND is_active = 1 ORDER BY code ASC",
    )
    .bind(company_id)
    .fetch_all(pool)
    .await
}

pub async fn create_account(pool: &SqlitePool, input: CreateAccountInput) -> Result<Account> {
    let id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO account_accounts (company_id, code, name, type, is_reconciled, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
        RETURNING id
        "#,
    )
    .bind(input.company_id)
    .bind(input.code)
    .bind(input.name)
    .bind(input.r#type)
    .bind(input.is_reconciled.unwrap_or(0))
    .fetch_one(pool)
    .await?;

    sqlx::query_as::<_, Account>("SELECT id, company_id, code, name, type, is_reconciled, is_active, created_at FROM account_accounts WHERE id = ?")
        .bind(id)
        .fetch_one(pool)
        .await
}

pub async fn list_journals(pool: &SqlitePool, company_id: i64) -> Result<Vec<AccountJournal>> {
    sqlx::query_as::<_, AccountJournal>(
        "SELECT id, company_id, name, code, type, default_account_id, created_at FROM account_journals WHERE company_id = ? ORDER BY id ASC",
    )
    .bind(company_id)
    .fetch_all(pool)
    .await
}

pub async fn list_moves(
    pool: &SqlitePool,
    company_id: i64,
    move_type: Option<String>,
    state_filter: Option<String>,
    partner_id: Option<i64>,
) -> Result<Vec<AccountMove>> {
    let mut query = String::from(
        r#"
        SELECT 
            m.id, m.company_id, m.name, m.date, m.journal_id,
            j.name as journal_name,
            m.partner_id, p.name as partner_name,
            m.move_type, m.state,
            m.amount_untaxed_cents, m.amount_tax_cents, m.amount_total_cents,
            m.currency, m.invoice_date_due, m.payment_state,
            m.origin, m.note, m.reversed_entry_id,
            m.created_at, m.updated_at
        FROM account_moves m
        JOIN account_journals j ON m.journal_id = j.id
        LEFT JOIN partners p ON m.partner_id = p.id
        WHERE m.company_id = ?
        "#,
    );

    if let Some(ref mt) = move_type {
        if mt != "all" {
            query.push_str(&format!(" AND m.move_type = '{}'", mt.replace('\'', "''")));
        }
    }

    if let Some(ref st) = state_filter {
        if st != "all" {
            query.push_str(&format!(" AND m.state = '{}'", st.replace('\'', "''")));
        }
    }

    if let Some(pid) = partner_id {
        query.push_str(&format!(" AND m.partner_id = {}", pid));
    }

    query.push_str(" ORDER BY m.id DESC");

    sqlx::query_as::<_, AccountMove>(&query)
        .bind(company_id)
        .fetch_all(pool)
        .await
}

pub async fn get_move(pool: &SqlitePool, move_id: i64) -> Result<Option<AccountMoveDetail>> {
    let move_opt = sqlx::query_as::<_, AccountMove>(
        r#"
        SELECT 
            m.id, m.company_id, m.name, m.date, m.journal_id,
            j.name as journal_name,
            m.partner_id, p.name as partner_name,
            m.move_type, m.state,
            m.amount_untaxed_cents, m.amount_tax_cents, m.amount_total_cents,
            m.currency, m.invoice_date_due, m.payment_state,
            m.origin, m.note, m.reversed_entry_id,
            m.created_at, m.updated_at
        FROM account_moves m
        JOIN account_journals j ON m.journal_id = j.id
        LEFT JOIN partners p ON m.partner_id = p.id
        WHERE m.id = ?
        "#,
    )
    .bind(move_id)
    .fetch_optional(pool)
    .await?;

    let r#move = match move_opt {
        Some(m) => m,
        None => return Ok(None),
    };

    let lines = sqlx::query_as::<_, AccountMoveLine>(
        r#"
        SELECT 
            aml.id, aml.move_id, aml.account_id,
            acc.code as account_code, acc.name as account_name,
            aml.partner_id, aml.name,
            aml.debit_cents, aml.credit_cents, aml.balance_cents,
            aml.product_id, prod.name as product_name,
            aml.quantity_milli, aml.price_unit_cents,
            aml.discount_percent_milli, aml.tax_rate_milli,
            aml.sequence, aml.created_at
        FROM account_move_lines aml
        JOIN account_accounts acc ON aml.account_id = acc.id
        LEFT JOIN products prod ON aml.product_id = prod.id
        WHERE aml.move_id = ?
        ORDER BY aml.sequence ASC, aml.id ASC
        "#,
    )
    .bind(move_id)
    .fetch_all(pool)
    .await?;

    Ok(Some(AccountMoveDetail { r#move, lines }))
}

pub async fn create_invoice(
    pool: &SqlitePool,
    input: CreateInvoiceInput,
) -> Result<AccountMoveDetail> {
    let mut tx = pool.begin().await?;

    let is_out = input.move_type == "out_invoice";
    let journal_code = if is_out { "INV" } else { "BILL" };

    let journal = sqlx::query_as::<_, (i64, Option<i64>)>(
        "SELECT id, default_account_id FROM account_journals WHERE company_id = ? AND code = ? LIMIT 1",
    )
    .bind(input.company_id)
    .bind(journal_code)
    .fetch_one(&mut *tx)
    .await?;

    let journal_id = journal.0;
    let current_year = chrono::Utc::now().year();
    let prefix = if is_out { "INV" } else { "BILL" };

    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM account_moves WHERE company_id = ? AND name LIKE ?",
    )
    .bind(input.company_id)
    .bind(format!("{}/{}/%", prefix, current_year))
    .fetch_one(&mut *tx)
    .await?;

    let move_name = format!("{}/{}/{:05}", prefix, current_year, count + 1);
    let currency = input.currency.unwrap_or_else(|| "EGP".to_string());

    // Calculate totals
    let mut untaxed_sum: i64 = 0;
    let mut tax_sum: i64 = 0;

    struct ComputedLine {
        product_id: Option<i64>,
        account_id: i64,
        name: String,
        qty_milli: i64,
        price_unit_cents: i64,
        discount_milli: i64,
        tax_milli: i64,
        subtotal_cents: i64,
    }

    let mut computed_lines = Vec::new();
    let default_income_or_expense_acc = if is_out { 10 } else { 11 }; // 10: Sales Revenue, 11: COGS / Purchases

    for line in &input.lines {
        let disc = line.discount_percent_milli.unwrap_or(0);
        let tax = line.tax_rate_milli.unwrap_or(14000); // 14% Egyptian VAT
        let base = (line.quantity_milli * line.price_unit_cents) / 1000;
        let disc_amt = (base * disc) / 100_000;
        let sub = base - disc_amt;
        let t_amt = (sub * tax) / 100_000;

        untaxed_sum += sub;
        tax_sum += t_amt;

        computed_lines.push(ComputedLine {
            product_id: line.product_id,
            account_id: line.account_id.unwrap_or(default_income_or_expense_acc),
            name: line.name.clone(),
            qty_milli: line.quantity_milli,
            price_unit_cents: line.price_unit_cents,
            discount_milli: disc,
            tax_milli: tax,
            subtotal_cents: sub,
        });
    }

    let total_sum = untaxed_sum + tax_sum;

    let move_id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO account_moves (
            company_id, name, date, journal_id, partner_id, move_type, state,
            amount_untaxed_cents, amount_tax_cents, amount_total_cents,
            currency, invoice_date_due, payment_state, origin, note
        ) VALUES (
            ?, ?, COALESCE(?, CURRENT_DATE), ?, ?, ?, 'draft',
            ?, ?, ?,
            ?, ?, 'not_paid', ?, ?
        )
        RETURNING id
        "#,
    )
    .bind(input.company_id)
    .bind(&move_name)
    .bind(&input.date)
    .bind(journal_id)
    .bind(input.partner_id)
    .bind(&input.move_type)
    .bind(untaxed_sum)
    .bind(tax_sum)
    .bind(total_sum)
    .bind(&currency)
    .bind(&input.invoice_date_due)
    .bind(&input.origin)
    .bind(&input.note)
    .fetch_one(&mut *tx)
    .await?;

    // Build Double-Entry Balancing Lines
    // Customer Invoice (out_invoice):
    // Line 1: Debit A/R (acc 3) = total_sum
    // Line 2..N: Credit Sales Revenue (acc 10) = subtotal
    // Tax Line: Credit VAT Output (acc 6) = tax_sum
    //
    // Vendor Bill (in_invoice):
    // Line 1: Credit A/P (acc 5) = total_sum
    // Line 2..N: Debit Expense/Purchases (acc 11) = subtotal
    // Tax Line: Debit VAT Input (acc 7) = tax_sum
    let ar_or_ap_acc = if is_out { 3 } else { 5 };
    let vat_acc = if is_out { 6 } else { 7 };

    let partner_name: String = sqlx::query_scalar("SELECT name FROM partners WHERE id = ?")
        .bind(input.partner_id)
        .fetch_one(&mut *tx)
        .await?;

    // 1. A/R or A/P line
    let (head_debit, head_credit) = if is_out {
        (total_sum, 0)
    } else {
        (0, total_sum)
    };

    sqlx::query(
        r#"
        INSERT INTO account_move_lines (
            move_id, account_id, partner_id, name,
            debit_cents, credit_cents, balance_cents, sequence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 10)
        "#,
    )
    .bind(move_id)
    .bind(ar_or_ap_acc)
    .bind(input.partner_id)
    .bind(format!("{}: {}", if is_out { "العميل" } else { "المورد" }, partner_name))
    .bind(head_debit)
    .bind(head_credit)
    .bind(head_debit - head_credit)
    .execute(&mut *tx)
    .await?;

    // 2. Revenue / Expense line items
    let mut seq = 20;
    for l in computed_lines {
        let (item_debit, item_credit) = if is_out {
            (0, l.subtotal_cents)
        } else {
            (l.subtotal_cents, 0)
        };

        sqlx::query(
            r#"
            INSERT INTO account_move_lines (
                move_id, account_id, partner_id, name,
                debit_cents, credit_cents, balance_cents,
                product_id, quantity_milli, price_unit_cents,
                discount_percent_milli, tax_rate_milli, sequence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(move_id)
        .bind(l.account_id)
        .bind(input.partner_id)
        .bind(&l.name)
        .bind(item_debit)
        .bind(item_credit)
        .bind(item_debit - item_credit)
        .bind(l.product_id)
        .bind(l.qty_milli)
        .bind(l.price_unit_cents)
        .bind(l.discount_milli)
        .bind(l.tax_milli)
        .bind(seq)
        .execute(&mut *tx)
        .await?;

        seq += 10;
    }

    // 3. Tax balancing line (if tax > 0)
    if tax_sum > 0 {
        let (tax_debit, tax_credit) = if is_out {
            (0, tax_sum)
        } else {
            (tax_sum, 0)
        };

        sqlx::query(
            r#"
            INSERT INTO account_move_lines (
                move_id, account_id, partner_id, name,
                debit_cents, credit_cents, balance_cents, sequence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(move_id)
        .bind(vat_acc)
        .bind(input.partner_id)
        .bind("ضريبة القيمة المضافة 14% (Egyptian VAT)")
        .bind(tax_debit)
        .bind(tax_credit)
        .bind(tax_debit - tax_credit)
        .bind(seq)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    get_move(pool, move_id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn create_journal_entry(
    pool: &SqlitePool,
    input: CreateJournalEntryInput,
) -> Result<AccountMoveDetail> {
    let mut tx = pool.begin().await?;

    let current_year = chrono::Utc::now().year();
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM account_moves WHERE company_id = ? AND name LIKE 'MISC/%'",
    )
    .bind(input.company_id)
    .fetch_one(&mut *tx)
    .await?;

    let move_name = format!("MISC/{}/{:05}", current_year, count + 1);

    let mut total_debit: i64 = 0;
    let mut total_credit: i64 = 0;

    for l in &input.lines {
        total_debit += l.debit_cents;
        total_credit += l.credit_cents;
    }

    let total_amount = total_debit.max(total_credit);

    let move_id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO account_moves (
            company_id, name, date, journal_id, move_type, state,
            amount_untaxed_cents, amount_tax_cents, amount_total_cents,
            origin, note
        ) VALUES (
            ?, ?, COALESCE(?, CURRENT_DATE), ?, 'entry', 'draft',
            ?, 0, ?,
            ?, ?
        )
        RETURNING id
        "#,
    )
    .bind(input.company_id)
    .bind(&move_name)
    .bind(&input.date)
    .bind(input.journal_id)
    .bind(total_amount)
    .bind(total_amount)
    .bind(&input.origin)
    .bind(&input.note)
    .fetch_one(&mut *tx)
    .await?;

    let mut seq = 10;
    for l in input.lines {
        sqlx::query(
            r#"
            INSERT INTO account_move_lines (
                move_id, account_id, partner_id, name,
                debit_cents, credit_cents, balance_cents, sequence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(move_id)
        .bind(l.account_id)
        .bind(l.partner_id)
        .bind(&l.name)
        .bind(l.debit_cents)
        .bind(l.credit_cents)
        .bind(l.debit_cents - l.credit_cents)
        .bind(seq)
        .execute(&mut *tx)
        .await?;

        seq += 10;
    }

    tx.commit().await?;

    get_move(pool, move_id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn post_move(pool: &SqlitePool, move_id: i64) -> Result<AccountMoveDetail> {
    let mut tx = pool.begin().await?;

    let r#move = sqlx::query_as::<_, AccountMove>("SELECT * FROM account_moves WHERE id = ?")
        .bind(move_id)
        .fetch_one(&mut *tx)
        .await?;

    if r#move.state == "posted" {
        return Err(sqlx::Error::Protocol("Move is already posted".into()));
    }

    // HARD INVARIANT: Validate SUM(debit_cents) == SUM(credit_cents)
    let sums_row = sqlx::query(
        "SELECT COALESCE(SUM(debit_cents), 0) as total_debit, COALESCE(SUM(credit_cents), 0) as total_credit FROM account_move_lines WHERE move_id = ?",
    )
    .bind(move_id)
    .fetch_one(&mut *tx)
    .await?;

    let total_debit: i64 = sums_row.try_get("total_debit").unwrap_or(0);
    let total_credit: i64 = sums_row.try_get("total_credit").unwrap_or(0);

    if total_debit != total_credit {
        return Err(sqlx::Error::Protocol(format!(
            "Double-entry invariant violated: Total Debits ({}) != Total Credits ({})",
            total_debit, total_credit
        )));
    }

    sqlx::query("UPDATE account_moves SET state = 'posted', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(move_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    get_move(pool, move_id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn cancel_move(pool: &SqlitePool, move_id: i64) -> Result<AccountMoveDetail> {
    sqlx::query("UPDATE account_moves SET state = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(move_id)
        .execute(pool)
        .await?;

    get_move(pool, move_id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn reverse_move(pool: &SqlitePool, move_id: i64) -> Result<AccountMoveDetail> {
    let mut tx = pool.begin().await?;

    let original = get_move(pool, move_id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)?;

    if original.r#move.state != "posted" {
        return Err(sqlx::Error::Protocol("Only posted entries can be reversed".into()));
    }

    let current_year = chrono::Utc::now().year();
    let rev_name = format!("REV/{}/{}", current_year, original.r#move.name);

    let rev_move_id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO account_moves (
            company_id, name, date, journal_id, partner_id, move_type, state,
            amount_untaxed_cents, amount_tax_cents, amount_total_cents,
            currency, payment_state, origin, note, reversed_entry_id
        ) VALUES (
            ?, ?, CURRENT_DATE, ?, ?, ?, 'posted',
            ?, ?, ?,
            ?, 'reversed', ?, ?, ?
        )
        RETURNING id
        "#,
    )
    .bind(original.r#move.company_id)
    .bind(&rev_name)
    .bind(original.r#move.journal_id)
    .bind(original.r#move.partner_id)
    .bind(&original.r#move.move_type)
    .bind(original.r#move.amount_untaxed_cents)
    .bind(original.r#move.amount_tax_cents)
    .bind(original.r#move.amount_total_cents)
    .bind(&original.r#move.currency)
    .bind(format!("عكس القيد {}", original.r#move.name))
    .bind(format!("Reversal of {}", original.r#move.name))
    .bind(move_id)
    .fetch_one(&mut *tx)
    .await?;

    for l in original.lines {
        // Swap debit and credit
        let new_debit = l.credit_cents;
        let new_credit = l.debit_cents;

        sqlx::query(
            r#"
            INSERT INTO account_move_lines (
                move_id, account_id, partner_id, name,
                debit_cents, credit_cents, balance_cents, sequence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(rev_move_id)
        .bind(l.account_id)
        .bind(l.partner_id)
        .bind(format!("Reversal: {}", l.name))
        .bind(new_debit)
        .bind(new_credit)
        .bind(new_debit - new_credit)
        .bind(l.sequence)
        .execute(&mut *tx)
        .await?;
    }

    sqlx::query("UPDATE account_moves SET payment_state = 'reversed' WHERE id = ?")
        .bind(move_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    get_move(pool, rev_move_id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn list_payments(
    pool: &SqlitePool,
    company_id: i64,
    partner_id: Option<i64>,
) -> Result<Vec<AccountPayment>> {
    let mut query = String::from(
        r#"
        SELECT 
            p.id, p.company_id, p.name, p.partner_id,
            part.name as partner_name,
            p.payment_type, p.amount_cents, p.date,
            p.journal_id, j.name as journal_name,
            p.payment_method, p.state, p.move_id, p.invoice_id,
            p.note, p.created_at
        FROM account_payments p
        JOIN account_journals j ON p.journal_id = j.id
        JOIN partners part ON p.partner_id = part.id
        WHERE p.company_id = ?
        "#,
    );

    if let Some(pid) = partner_id {
        query.push_str(&format!(" AND p.partner_id = {}", pid));
    }

    query.push_str(" ORDER BY p.id DESC");

    sqlx::query_as::<_, AccountPayment>(&query)
        .bind(company_id)
        .fetch_all(pool)
        .await
}

pub async fn create_and_post_payment(
    pool: &SqlitePool,
    input: CreatePaymentInput,
) -> Result<AccountPayment> {
    let mut tx = pool.begin().await?;

    let current_year = chrono::Utc::now().year();
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM account_payments WHERE company_id = ? AND name LIKE 'PAY/%'",
    )
    .bind(input.company_id)
    .fetch_one(&mut *tx)
    .await?;

    let payment_name = format!("PAY/{}/{:05}", current_year, count + 1);
    let is_inbound = input.payment_type == "inbound";

    // 1. Determine accounts:
    // Journal default account (Cash: 1 or Bank: 2)
    let journal_acc_id: i64 = sqlx::query_scalar(
        "SELECT COALESCE(default_account_id, 1) FROM account_journals WHERE id = ?",
    )
    .bind(input.journal_id)
    .fetch_one(&mut *tx)
    .await?;

    // AR (3) or AP (5)
    let partner_acc_id = if is_inbound { 3 } else { 5 };

    // 2. Create and Post balancing journal move for payment
    // Inbound (Customer Receipt): Debit Cash/Bank, Credit A/R
    // Outbound (Vendor Payment): Debit A/P, Credit Cash/Bank
    let (cash_debit, cash_credit) = if is_inbound {
        (input.amount_cents, 0)
    } else {
        (0, input.amount_cents)
    };

    let (part_debit, part_credit) = if is_inbound {
        (0, input.amount_cents)
    } else {
        (input.amount_cents, 0)
    };

    let move_name = format!("BNK-PAY/{}/{:05}", current_year, count + 1);
    let move_id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO account_moves (
            company_id, name, date, journal_id, partner_id, move_type, state,
            amount_untaxed_cents, amount_tax_cents, amount_total_cents,
            payment_state, origin, note
        ) VALUES (
            ?, ?, COALESCE(?, CURRENT_DATE), ?, ?, 'entry', 'posted',
            ?, 0, ?,
            'paid', ?, ?
        )
        RETURNING id
        "#,
    )
    .bind(input.company_id)
    .bind(&move_name)
    .bind(&input.date)
    .bind(input.journal_id)
    .bind(input.partner_id)
    .bind(input.amount_cents)
    .bind(input.amount_cents)
    .bind(&payment_name)
    .bind(&input.note)
    .fetch_one(&mut *tx)
    .await?;

    // Move line 1: Cash/Bank
    sqlx::query(
        r#"
        INSERT INTO account_move_lines (
            move_id, account_id, partner_id, name,
            debit_cents, credit_cents, balance_cents, sequence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 10)
        "#,
    )
    .bind(move_id)
    .bind(journal_acc_id)
    .bind(input.partner_id)
    .bind(format!("Payment {}", payment_name))
    .bind(cash_debit)
    .bind(cash_credit)
    .bind(cash_debit - cash_credit)
    .execute(&mut *tx)
    .await?;

    // Move line 2: Partner AR/AP
    sqlx::query(
        r#"
        INSERT INTO account_move_lines (
            move_id, account_id, partner_id, name,
            debit_cents, credit_cents, balance_cents, sequence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 20)
        "#,
    )
    .bind(move_id)
    .bind(partner_acc_id)
    .bind(input.partner_id)
    .bind(format!("Partner reconciliation {}", payment_name))
    .bind(part_debit)
    .bind(part_credit)
    .bind(part_debit - part_credit)
    .execute(&mut *tx)
    .await?;

    // 3. Create account_payment
    let payment_id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO account_payments (
            company_id, name, partner_id, payment_type, amount_cents,
            date, journal_id, payment_method, state, move_id, invoice_id, note
        ) VALUES (
            ?, ?, ?, ?, ?,
            COALESCE(?, CURRENT_DATE), ?, ?, 'posted', ?, ?, ?
        )
        RETURNING id
        "#,
    )
    .bind(input.company_id)
    .bind(&payment_name)
    .bind(input.partner_id)
    .bind(&input.payment_type)
    .bind(input.amount_cents)
    .bind(&input.date)
    .bind(input.journal_id)
    .bind(input.payment_method.unwrap_or_else(|| "cash".to_string()))
    .bind(move_id)
    .bind(input.invoice_id)
    .bind(&input.note)
    .fetch_one(&mut *tx)
    .await?;

    // 4. Update linked invoice if provided
    if let Some(inv_id) = input.invoice_id {
        sqlx::query("UPDATE account_moves SET payment_state = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(inv_id)
            .execute(&mut *tx)
            .await?;
    }

    tx.commit().await?;

    let p = sqlx::query_as::<_, AccountPayment>(
        r#"
        SELECT 
            p.id, p.company_id, p.name, p.partner_id,
            part.name as partner_name,
            p.payment_type, p.amount_cents, p.date,
            p.journal_id, j.name as journal_name,
            p.payment_method, p.state, p.move_id, p.invoice_id,
            p.note, p.created_at
        FROM account_payments p
        JOIN account_journals j ON p.journal_id = j.id
        JOIN partners part ON p.partner_id = part.id
        WHERE p.id = ?
        "#,
    )
    .bind(payment_id)
    .fetch_one(pool)
    .await?;

    Ok(p)
}

pub async fn get_trial_balance(
    pool: &SqlitePool,
    company_id: i64,
) -> Result<Vec<TrialBalanceRow>> {
    let rows = sqlx::query_as::<_, TrialBalanceRow>(
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
        GROUP BY acc.id
        ORDER BY acc.code ASC
        "#,
    )
    .bind(company_id)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}
