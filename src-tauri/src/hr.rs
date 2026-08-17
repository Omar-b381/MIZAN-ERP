use serde::{Deserialize, Serialize};
use sqlx::{Result, SqlitePool};
use chrono::Datelike;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Department {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub parent_id: Option<i64>,
    pub manager_id: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct JobPosition {
    pub id: i64,
    pub company_id: i64,
    pub name: String,
    pub department_id: Option<i64>,
    pub department_name: Option<String>,
    pub expected_employees: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Employee {
    pub id: i64,
    pub company_id: i64,
    pub partner_id: Option<i64>,
    pub name: String,
    pub work_email: Option<String>,
    pub work_phone: Option<String>,
    pub department_id: Option<i64>,
    pub department_name: Option<String>,
    pub job_id: Option<i64>,
    pub job_name: Option<String>,
    pub manager_id: Option<i64>,
    pub manager_name: Option<String>,
    pub hire_date: String,
    pub national_id: Option<String>,
    pub status: String, // 'active', 'on_leave', 'terminated'
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Contract {
    pub id: i64,
    pub company_id: i64,
    pub employee_id: i64,
    pub employee_name: Option<String>,
    pub name: String,
    pub wage_cents: i64,
    pub date_start: String,
    pub date_end: Option<String>,
    pub state: String, // 'draft', 'open', 'close', 'cancelled'
    pub working_hours_per_week: i64,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct LeaveRequest {
    pub id: i64,
    pub company_id: i64,
    pub employee_id: i64,
    pub employee_name: Option<String>,
    pub leave_type: String, // 'annual', 'sick', 'unpaid', 'emergency'
    pub date_from: String,
    pub date_to: String,
    pub duration_days_milli: i64,
    pub state: String, // 'draft', 'confirm', 'validate', 'refuse'
    pub reason: Option<String>,
    pub approved_by_id: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct AttendanceRecord {
    pub id: i64,
    pub company_id: i64,
    pub employee_id: i64,
    pub employee_name: Option<String>,
    pub date: String,
    pub check_in: String,
    pub check_out: Option<String>,
    pub worked_hours_milli: i64,
    pub status: String, // 'present', 'late', 'absent'
    pub notes: Option<String>,
    pub created_at: String,
}

// ----------------------------------------------------
// Inputs
// ----------------------------------------------------

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDepartmentInput {
    pub company_id: i64,
    pub name: String,
    pub parent_id: Option<i64>,
    pub manager_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateJobInput {
    pub company_id: i64,
    pub name: String,
    pub department_id: Option<i64>,
    pub expected_employees: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateEmployeeInput {
    pub company_id: i64,
    pub name: String,
    pub work_email: Option<String>,
    pub work_phone: Option<String>,
    pub department_id: Option<i64>,
    pub job_id: Option<i64>,
    pub manager_id: Option<i64>,
    pub hire_date: Option<String>,
    pub national_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateEmployeeInput {
    pub id: i64,
    pub name: String,
    pub work_email: Option<String>,
    pub work_phone: Option<String>,
    pub department_id: Option<i64>,
    pub job_id: Option<i64>,
    pub manager_id: Option<i64>,
    pub hire_date: Option<String>,
    pub national_id: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateContractInput {
    pub company_id: i64,
    pub employee_id: i64,
    pub wage_cents: i64,
    pub date_start: Option<String>,
    pub date_end: Option<String>,
    pub working_hours_per_week: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateLeaveInput {
    pub company_id: i64,
    pub employee_id: i64,
    pub leave_type: String,
    pub date_from: String,
    pub date_to: String,
    pub duration_days_milli: i64,
    pub reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecordAttendanceInput {
    pub company_id: i64,
    pub employee_id: i64,
    pub date: Option<String>,
    pub check_in: String,
    pub check_out: Option<String>,
    pub notes: Option<String>,
}

// ----------------------------------------------------
// Functions
// ----------------------------------------------------

pub async fn list_departments(pool: &SqlitePool, company_id: i64) -> Result<Vec<Department>> {
    sqlx::query_as::<_, Department>(
        "SELECT id, company_id, name, parent_id, manager_id, created_at FROM hr_departments WHERE company_id = ? ORDER BY id ASC",
    )
    .bind(company_id)
    .fetch_all(pool)
    .await
}

pub async fn create_department(pool: &SqlitePool, input: CreateDepartmentInput) -> Result<Department> {
    let id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO hr_departments (company_id, name, parent_id, manager_id)
        VALUES (?, ?, ?, ?)
        RETURNING id
        "#,
    )
    .bind(input.company_id)
    .bind(input.name)
    .bind(input.parent_id)
    .bind(input.manager_id)
    .fetch_one(pool)
    .await?;

    sqlx::query_as::<_, Department>("SELECT id, company_id, name, parent_id, manager_id, created_at FROM hr_departments WHERE id = ?")
        .bind(id)
        .fetch_one(pool)
        .await
}

pub async fn list_jobs(pool: &SqlitePool, company_id: i64) -> Result<Vec<JobPosition>> {
    sqlx::query_as::<_, JobPosition>(
        r#"
        SELECT 
            j.id, j.company_id, j.name, j.department_id,
            d.name as department_name,
            j.expected_employees, j.created_at
        FROM hr_jobs j
        LEFT JOIN hr_departments d ON j.department_id = d.id
        WHERE j.company_id = ?
        ORDER BY j.id ASC
        "#,
    )
    .bind(company_id)
    .fetch_all(pool)
    .await
}

pub async fn create_job(pool: &SqlitePool, input: CreateJobInput) -> Result<JobPosition> {
    let id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO hr_jobs (company_id, name, department_id, expected_employees)
        VALUES (?, ?, ?, ?)
        RETURNING id
        "#,
    )
    .bind(input.company_id)
    .bind(input.name)
    .bind(input.department_id)
    .bind(input.expected_employees.unwrap_or(1))
    .fetch_one(pool)
    .await?;

    sqlx::query_as::<_, JobPosition>(
        r#"
        SELECT 
            j.id, j.company_id, j.name, j.department_id,
            d.name as department_name,
            j.expected_employees, j.created_at
        FROM hr_jobs j
        LEFT JOIN hr_departments d ON j.department_id = d.id
        WHERE j.id = ?
        "#,
    )
    .bind(id)
    .fetch_one(pool)
    .await
}

pub async fn list_employees(
    pool: &SqlitePool,
    company_id: i64,
    department_id: Option<i64>,
    status_filter: Option<String>,
) -> Result<Vec<Employee>> {
    let mut query = String::from(
        r#"
        SELECT 
            e.id, e.company_id, e.partner_id, e.name, e.work_email, e.work_phone,
            e.department_id, d.name as department_name,
            e.job_id, j.name as job_name,
            e.manager_id, m.name as manager_name,
            e.hire_date, e.national_id, e.status,
            e.created_at, e.updated_at
        FROM hr_employees e
        LEFT JOIN hr_departments d ON e.department_id = d.id
        LEFT JOIN hr_jobs j ON e.job_id = j.id
        LEFT JOIN hr_employees m ON e.manager_id = m.id
        WHERE e.company_id = ?
        "#,
    );

    if let Some(did) = department_id {
        query.push_str(&format!(" AND e.department_id = {}", did));
    }

    if let Some(ref st) = status_filter {
        if st != "all" {
            query.push_str(&format!(" AND e.status = '{}'", st.replace('\'', "''")));
        }
    }

    query.push_str(" ORDER BY e.id ASC");

    sqlx::query_as::<_, Employee>(&query)
        .bind(company_id)
        .fetch_all(pool)
        .await
}

pub async fn get_employee(pool: &SqlitePool, employee_id: i64) -> Result<Option<Employee>> {
    sqlx::query_as::<_, Employee>(
        r#"
        SELECT 
            e.id, e.company_id, e.partner_id, e.name, e.work_email, e.work_phone,
            e.department_id, d.name as department_name,
            e.job_id, j.name as job_name,
            e.manager_id, m.name as manager_name,
            e.hire_date, e.national_id, e.status,
            e.created_at, e.updated_at
        FROM hr_employees e
        LEFT JOIN hr_departments d ON e.department_id = d.id
        LEFT JOIN hr_jobs j ON e.job_id = j.id
        LEFT JOIN hr_employees m ON e.manager_id = m.id
        WHERE e.id = ?
        "#,
    )
    .bind(employee_id)
    .fetch_optional(pool)
    .await
}

pub async fn create_employee(pool: &SqlitePool, input: CreateEmployeeInput) -> Result<Employee> {
    let id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO hr_employees (
            company_id, name, work_email, work_phone, department_id, job_id,
            manager_id, hire_date, national_id, status
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, COALESCE(?, CURRENT_DATE), ?, 'active'
        )
        RETURNING id
        "#,
    )
    .bind(input.company_id)
    .bind(input.name)
    .bind(input.work_email)
    .bind(input.work_phone)
    .bind(input.department_id)
    .bind(input.job_id)
    .bind(input.manager_id)
    .bind(input.hire_date)
    .bind(input.national_id)
    .fetch_one(pool)
    .await?;

    get_employee(pool, id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn update_employee(pool: &SqlitePool, input: UpdateEmployeeInput) -> Result<Employee> {
    sqlx::query(
        r#"
        UPDATE hr_employees
        SET name = ?, work_email = ?, work_phone = ?, department_id = ?, job_id = ?,
            manager_id = ?, hire_date = COALESCE(?, hire_date), national_id = ?,
            status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        "#,
    )
    .bind(input.name)
    .bind(input.work_email)
    .bind(input.work_phone)
    .bind(input.department_id)
    .bind(input.job_id)
    .bind(input.manager_id)
    .bind(input.hire_date)
    .bind(input.national_id)
    .bind(input.status)
    .bind(input.id)
    .execute(pool)
    .await?;

    get_employee(pool, input.id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn delete_employee(pool: &SqlitePool, employee_id: i64) -> Result<()> {
    sqlx::query("DELETE FROM hr_employees WHERE id = ?")
        .bind(employee_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn list_contracts(pool: &SqlitePool, company_id: i64, employee_id: Option<i64>) -> Result<Vec<Contract>> {
    let mut query = String::from(
        r#"
        SELECT 
            c.id, c.company_id, c.employee_id, e.name as employee_name,
            c.name, c.wage_cents, c.date_start, c.date_end,
            c.state, c.working_hours_per_week, c.notes, c.created_at
        FROM hr_contracts c
        JOIN hr_employees e ON c.employee_id = e.id
        WHERE c.company_id = ?
        "#,
    );

    if let Some(eid) = employee_id {
        query.push_str(&format!(" AND c.employee_id = {}", eid));
    }

    query.push_str(" ORDER BY c.id DESC");

    sqlx::query_as::<_, Contract>(&query)
        .bind(company_id)
        .fetch_all(pool)
        .await
}

pub async fn create_contract(pool: &SqlitePool, input: CreateContractInput) -> Result<Contract> {
    let current_year = chrono::Utc::now().year();
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM hr_contracts WHERE company_id = ? AND name LIKE 'CON/%'",
    )
    .bind(input.company_id)
    .fetch_one(pool)
    .await?;

    let con_name = format!("CON/{}/{:05}", current_year, count + 1);

    let id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO hr_contracts (
            company_id, employee_id, name, wage_cents, date_start, date_end,
            state, working_hours_per_week, notes
        ) VALUES (
            ?, ?, ?, ?, COALESCE(?, CURRENT_DATE), ?,
            'open', ?, ?
        )
        RETURNING id
        "#,
    )
    .bind(input.company_id)
    .bind(input.employee_id)
    .bind(&con_name)
    .bind(input.wage_cents)
    .bind(input.date_start)
    .bind(input.date_end)
    .bind(input.working_hours_per_week.unwrap_or(40))
    .bind(input.notes)
    .fetch_one(pool)
    .await?;

    sqlx::query_as::<_, Contract>(
        r#"
        SELECT 
            c.id, c.company_id, c.employee_id, e.name as employee_name,
            c.name, c.wage_cents, c.date_start, c.date_end,
            c.state, c.working_hours_per_week, c.notes, c.created_at
        FROM hr_contracts c
        JOIN hr_employees e ON c.employee_id = e.id
        WHERE c.id = ?
        "#,
    )
    .bind(id)
    .fetch_one(pool)
    .await
}

pub async fn list_leaves(
    pool: &SqlitePool,
    company_id: i64,
    employee_id: Option<i64>,
    state_filter: Option<String>,
) -> Result<Vec<LeaveRequest>> {
    let mut query = String::from(
        r#"
        SELECT 
            l.id, l.company_id, l.employee_id, e.name as employee_name,
            l.leave_type, l.date_from, l.date_to, l.duration_days_milli,
            l.state, l.reason, l.approved_by_id, l.created_at
        FROM hr_leaves l
        JOIN hr_employees e ON l.employee_id = e.id
        WHERE l.company_id = ?
        "#,
    );

    if let Some(eid) = employee_id {
        query.push_str(&format!(" AND l.employee_id = {}", eid));
    }

    if let Some(ref st) = state_filter {
        if st != "all" {
            query.push_str(&format!(" AND l.state = '{}'", st.replace('\'', "''")));
        }
    }

    query.push_str(" ORDER BY l.id DESC");

    sqlx::query_as::<_, LeaveRequest>(&query)
        .bind(company_id)
        .fetch_all(pool)
        .await
}

pub async fn create_leave(pool: &SqlitePool, input: CreateLeaveInput) -> Result<LeaveRequest> {
    let id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO hr_leaves (
            company_id, employee_id, leave_type, date_from, date_to,
            duration_days_milli, state, reason
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, 'confirm', ?
        )
        RETURNING id
        "#,
    )
    .bind(input.company_id)
    .bind(input.employee_id)
    .bind(input.leave_type)
    .bind(input.date_from)
    .bind(input.date_to)
    .bind(input.duration_days_milli)
    .bind(input.reason)
    .fetch_one(pool)
    .await?;

    sqlx::query_as::<_, LeaveRequest>(
        r#"
        SELECT 
            l.id, l.company_id, l.employee_id, e.name as employee_name,
            l.leave_type, l.date_from, l.date_to, l.duration_days_milli,
            l.state, l.reason, l.approved_by_id, l.created_at
        FROM hr_leaves l
        JOIN hr_employees e ON l.employee_id = e.id
        WHERE l.id = ?
        "#,
    )
    .bind(id)
    .fetch_one(pool)
    .await
}

pub async fn validate_leave(pool: &SqlitePool, leave_id: i64, approved_by_id: i64) -> Result<LeaveRequest> {
    sqlx::query("UPDATE hr_leaves SET state = 'validate', approved_by_id = ? WHERE id = ?")
        .bind(approved_by_id)
        .bind(leave_id)
        .execute(pool)
        .await?;

    sqlx::query_as::<_, LeaveRequest>(
        r#"
        SELECT 
            l.id, l.company_id, l.employee_id, e.name as employee_name,
            l.leave_type, l.date_from, l.date_to, l.duration_days_milli,
            l.state, l.reason, l.approved_by_id, l.created_at
        FROM hr_leaves l
        JOIN hr_employees e ON l.employee_id = e.id
        WHERE l.id = ?
        "#,
    )
    .bind(leave_id)
    .fetch_one(pool)
    .await
}

pub async fn refuse_leave(pool: &SqlitePool, leave_id: i64) -> Result<LeaveRequest> {
    sqlx::query("UPDATE hr_leaves SET state = 'refuse' WHERE id = ?")
        .bind(leave_id)
        .execute(pool)
        .await?;

    sqlx::query_as::<_, LeaveRequest>(
        r#"
        SELECT 
            l.id, l.company_id, l.employee_id, e.name as employee_name,
            l.leave_type, l.date_from, l.date_to, l.duration_days_milli,
            l.state, l.reason, l.approved_by_id, l.created_at
        FROM hr_leaves l
        JOIN hr_employees e ON l.employee_id = e.id
        WHERE l.id = ?
        "#,
    )
    .bind(leave_id)
    .fetch_one(pool)
    .await
}

pub async fn list_attendances(
    pool: &SqlitePool,
    company_id: i64,
    employee_id: Option<i64>,
    date_filter: Option<String>,
) -> Result<Vec<AttendanceRecord>> {
    let mut query = String::from(
        r#"
        SELECT 
            a.id, a.company_id, a.employee_id, e.name as employee_name,
            a.date, a.check_in, a.check_out, a.worked_hours_milli,
            a.status, a.notes, a.created_at
        FROM hr_attendances a
        JOIN hr_employees e ON a.employee_id = e.id
        WHERE a.company_id = ?
        "#,
    );

    if let Some(eid) = employee_id {
        query.push_str(&format!(" AND a.employee_id = {}", eid));
    }

    if let Some(ref d) = date_filter {
        query.push_str(&format!(" AND a.date = '{}'", d.replace('\'', "''")));
    }

    query.push_str(" ORDER BY a.id DESC");

    sqlx::query_as::<_, AttendanceRecord>(&query)
        .bind(company_id)
        .fetch_all(pool)
        .await
}

pub async fn record_attendance(
    pool: &SqlitePool,
    input: RecordAttendanceInput,
) -> Result<AttendanceRecord> {
    // Calculate worked hours (milli) if check_out is provided
    let mut worked_milli: i64 = 8000; // default 8.000 hrs

    if let Some(ref co) = input.check_out {
        if let (Ok(ci_time), Ok(co_time)) = (
            chrono::NaiveDateTime::parse_from_str(&input.check_in, "%Y-%m-%d %H:%M:%S"),
            chrono::NaiveDateTime::parse_from_str(co, "%Y-%m-%d %H:%M:%S"),
        ) {
            let duration = co_time.signed_duration_since(ci_time);
            let mins = duration.num_minutes();
            if mins > 0 {
                worked_milli = (mins * 1000) / 60;
            }
        }
    }

    let id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO hr_attendances (
            company_id, employee_id, date, check_in, check_out,
            worked_hours_milli, status, notes
        ) VALUES (
            ?, ?, COALESCE(?, CURRENT_DATE), ?, ?,
            ?, 'present', ?
        )
        RETURNING id
        "#,
    )
    .bind(input.company_id)
    .bind(input.employee_id)
    .bind(input.date)
    .bind(input.check_in)
    .bind(input.check_out)
    .bind(worked_milli)
    .bind(input.notes)
    .fetch_one(pool)
    .await?;

    sqlx::query_as::<_, AttendanceRecord>(
        r#"
        SELECT 
            a.id, a.company_id, a.employee_id, e.name as employee_name,
            a.date, a.check_in, a.check_out, a.worked_hours_milli,
            a.status, a.notes, a.created_at
        FROM hr_attendances a
        JOIN hr_employees e ON a.employee_id = e.id
        WHERE a.id = ?
        "#,
    )
    .bind(id)
    .fetch_one(pool)
    .await
}
