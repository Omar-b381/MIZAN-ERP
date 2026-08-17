use crate::activity::{get_recent_activities, log_activity, LogActivityInput};
use crate::auth::{create_user, login, CreateUserInput, LoginInput};
use crate::companies::{create_company, get_company, list_companies, CreateCompanyInput};
use crate::db::init_db;
use crate::modules::{get_all_modules, is_module_active, set_module_status};
use crate::partners::{
    create_partner, delete_partner, get_partner_by_id, list_partners, update_partner,
    CreatePartnerInput, PartnerFilter, UpdatePartnerInput,
};
use crate::rbac::{
    assign_role_permissions, get_user_permissions,
    list_permissions, list_roles,
};
use crate::settings::{get_company_settings, set_setting, UpdateSettingInput};
use tempfile::NamedTempFile;

#[tokio::test]
async fn test_db_initialization_and_migrations() {
    let temp_file = NamedTempFile::new().expect("Failed to create temp file");
    let db_url = format!("sqlite://{}", temp_file.path().to_string_lossy());
    let pool = init_db(&db_url).await.expect("Failed to init db");

    let journal_mode: String = sqlx::query_scalar("PRAGMA journal_mode")
        .fetch_one(&pool)
        .await
        .expect("Failed to query journal_mode");
    assert_eq!(journal_mode.to_lowercase(), "wal");

    let modules = get_all_modules(&pool).await.expect("Failed to get modules");
    assert!(!modules.is_empty(), "Modules catalog should not be empty");

    let core_active = is_module_active(&pool, "core").await.expect("Failed to check core status");
    assert!(core_active, "Core module must be active by default");
}

#[tokio::test]
async fn test_module_activation_and_deactivation() {
    let temp_file = NamedTempFile::new().expect("Failed to create temp file");
    let db_url = format!("sqlite://{}", temp_file.path().to_string_lossy());
    let pool = init_db(&db_url).await.expect("Failed to init db");

    let result = set_module_status(&pool, "sales", true)
        .await
        .expect("Failed to activate sales");
    assert!(result.is_active);
    assert!(is_module_active(&pool, "sales").await.unwrap());

    let result = set_module_status(&pool, "sales", false)
        .await
        .expect("Failed to deactivate sales");
    assert!(!result.is_active);
    assert!(!is_module_active(&pool, "sales").await.unwrap());

    // Core cannot be deactivated
    let result = set_module_status(&pool, "core", false)
        .await
        .expect("Failed to process core toggle");
    assert!(result.is_active, "Core module should remain active");
}

#[tokio::test]
async fn test_companies_and_branch_hierarchy() {
    let temp_file = NamedTempFile::new().expect("Failed to create temp file");
    let db_url = format!("sqlite://{}", temp_file.path().to_string_lossy());
    let pool = init_db(&db_url).await.expect("Failed to init db");

    // Check seeded default company
    let companies = list_companies(&pool).await.expect("Failed to list companies");
    assert_eq!(companies.len(), 1);
    assert_eq!(companies[0].currency, "EGP");
    assert_eq!(companies[0].timezone, "Africa/Cairo");

    // Create a branch referencing the headquarter
    let branch = create_company(
        &pool,
        CreateCompanyInput {
            name: "فرع الإسكندرية".to_string(),
            parent_id: Some(companies[0].id),
            currency: Some("EGP".to_string()),
            timezone: Some("Africa/Cairo".to_string()),
            tax_id: Some("100-200-301".to_string()),
            commercial_registry: Some("45893".to_string()),
            phone: Some("01200000000".to_string()),
            email: Some("alex@mizan-erp.local".to_string()),
            website: None,
            street: Some("شارع كورنيش الإسكندرية".to_string()),
            city: Some("الإسكندرية".to_string()),
            state: Some("الإسكندرية".to_string()),
            zip: Some("21500".to_string()),
            country: Some("EG".to_string()),
        },
    )
    .await
    .expect("Failed to create branch");

    assert_eq!(branch.parent_id, Some(companies[0].id));

    let fetched_branch = get_company(&pool, branch.id).await.expect("Failed to fetch").unwrap();
    assert_eq!(fetched_branch.name, "فرع الإسكندرية");
}

#[tokio::test]
async fn test_auth_and_user_creation() {
    let temp_file = NamedTempFile::new().expect("Failed to create temp file");
    let db_url = format!("sqlite://{}", temp_file.path().to_string_lossy());
    let pool = init_db(&db_url).await.expect("Failed to init db");

    // Test default admin login
    let login_res = login(
        &pool,
        LoginInput {
            username: "admin".to_string(),
            password: "wrong_password".to_string(),
        },
    )
    .await
    .expect("Login execution failed");
    assert!(login_res.is_none(), "Wrong password must fail");

    // Create new staff user
    let new_user = create_user(
        &pool,
        CreateUserInput {
            company_id: 1,
            username: "sarah_sales".to_string(),
            email: Some("sarah@mizan.local".to_string()),
            password: "SecretPassword123".to_string(),
            full_name: "سارة محمد".to_string(),
            role_ids: vec![2], // Manager
        },
    )
    .await
    .expect("Failed to create user");

    assert_eq!(new_user.username, "sarah_sales");

    // Login with new user
    let session = login(
        &pool,
        LoginInput {
            username: "sarah_sales".to_string(),
            password: "SecretPassword123".to_string(),
        },
    )
    .await
    .expect("Login failed")
    .expect("User session expected");

    assert_eq!(session.username, "sarah_sales");
    assert!(session.permissions.contains(&"contacts.view".to_string()));
}

#[tokio::test]
async fn test_rbac_roles_and_permissions() {
    let temp_file = NamedTempFile::new().expect("Failed to create temp file");
    let db_url = format!("sqlite://{}", temp_file.path().to_string_lossy());
    let pool = init_db(&db_url).await.expect("Failed to init db");

    let roles = list_roles(&pool).await.expect("Failed to list roles");
    assert_eq!(roles.len(), 3); // Admin, Manager, Staff

    let perms = list_permissions(&pool).await.expect("Failed to list permissions");
    assert!(!perms.is_empty());

    // Assign custom permissions to Staff (role id 3)
    assign_role_permissions(
        &pool,
        3,
        vec!["contacts.view".to_string(), "contacts.create".to_string()],
    )
    .await
    .expect("Failed to assign role permissions");

    // Create test user and assign staff role
    let user = create_user(
        &pool,
        CreateUserInput {
            company_id: 1,
            username: "staff_member".to_string(),
            email: None,
            password: "password123".to_string(),
            full_name: "موظف مبيعات".to_string(),
            role_ids: vec![3],
        },
    )
    .await
    .expect("Failed to create staff");

    let user_perms = get_user_permissions(&pool, user.id).await.expect("Failed to get perms");
    assert!(user_perms.contains(&"contacts.view".to_string()));
    assert!(user_perms.contains(&"contacts.create".to_string()));
    assert!(!user_perms.contains(&"core.settings.manage".to_string()));
}

#[tokio::test]
async fn test_partners_unified_crud_and_filters() {
    let temp_file = NamedTempFile::new().expect("Failed to create temp file");
    let db_url = format!("sqlite://{}", temp_file.path().to_string_lossy());
    let pool = init_db(&db_url).await.expect("Failed to init db");

    // Check seeded partners
    let all_partners = list_partners(&pool, PartnerFilter::default()).await.unwrap();
    assert_eq!(all_partners.len(), 3);

    // Create a new Customer partner with minor unit credit limit
    let customer = create_partner(
        &pool,
        CreatePartnerInput {
            company_id: 1,
            parent_id: None,
            name: "مجموعة الأهرام التجارية".to_string(),
            sub_type: "customer".to_string(),
            is_company: true,
            email: Some("info@ahram-group.com".to_string()),
            phone: Some("022345678".to_string()),
            mobile: Some("01099887766".to_string()),
            tax_id: Some("987-654-321".to_string()),
            commercial_registry: Some("123456".to_string()),
            street: Some("شارع رمسيس".to_string()),
            city: Some("القاهرة".to_string()),
            state: Some("القاهرة".to_string()),
            country: Some("EG".to_string()),
            credit_limit_cents: Some(5000000), // 50,000.00 EGP in minor units
            notes: Some("عميل مميز بفترة سداد 30 يوم".to_string()),
        },
    )
    .await
    .expect("Failed to create customer");

    assert_eq!(customer.credit_limit_cents, 5000000);
    assert_eq!(customer.sub_type, "customer");

    // Filter by sub_type = 'customer'
    let customers = list_partners(
        &pool,
        PartnerFilter {
            sub_type: Some("customer".to_string()),
            ..Default::default()
        },
    )
    .await
    .unwrap();
    assert_eq!(customers.len(), 2);

    // Update partner
    let updated = update_partner(
        &pool,
        UpdatePartnerInput {
            id: customer.id,
            company_id: 1,
            parent_id: None,
            name: "مجموعة الأهرام للتجارة والتوريدات".to_string(),
            sub_type: "customer".to_string(),
            is_company: true,
            email: customer.email,
            phone: customer.phone,
            mobile: customer.mobile,
            tax_id: customer.tax_id,
            commercial_registry: customer.commercial_registry,
            street: customer.street,
            city: customer.city,
            state: customer.state,
            country: customer.country,
            credit_limit_cents: 7500000,
            notes: customer.notes,
            is_active: 1,
        },
    )
    .await
    .expect("Failed to update partner");

    assert_eq!(updated.name, "مجموعة الأهرام للتجارة والتوريدات");
    assert_eq!(updated.credit_limit_cents, 7500000);

    // Soft delete
    delete_partner(&pool, customer.id).await.expect("Failed to delete partner");
    let fetched = get_partner_by_id(&pool, customer.id).await.unwrap().unwrap();
    assert_eq!(fetched.is_active, 0);
}

#[tokio::test]
async fn test_settings_and_activity_logs() {
    let temp_file = NamedTempFile::new().expect("Failed to create temp file");
    let db_url = format!("sqlite://{}", temp_file.path().to_string_lossy());
    let pool = init_db(&db_url).await.expect("Failed to init db");

    // Settings
    let settings = get_company_settings(&pool, 1).await.unwrap();
    assert_eq!(settings.get("currency").unwrap(), "EGP");
    assert_eq!(settings.get("tax_rate_default").unwrap(), "14");

    set_setting(
        &pool,
        UpdateSettingInput {
            key: "tax_rate_default".to_string(),
            company_id: 1,
            value: "14.5".to_string(),
        },
    )
    .await
    .unwrap();

    let updated_settings = get_company_settings(&pool, 1).await.unwrap();
    assert_eq!(updated_settings.get("tax_rate_default").unwrap(), "14.5");

    // Activity Logs
    let log_id = log_activity(
        &pool,
        LogActivityInput {
            company_id: 1,
            entity_type: "partner".to_string(),
            entity_id: 10,
            user_id: Some(1),
            action: "created".to_string(),
            summary: "New partner created".to_string(),
            details_json: Some(r#"{"partner_name": "Test Partner"}"#.to_string()),
        },
    )
    .await
    .unwrap();

    assert!(log_id > 0);
    let activities = get_recent_activities(&pool, 1, 10).await.unwrap();
    assert_eq!(activities.len(), 1);
    assert_eq!(activities[0].entity_type, "partner");
    assert_eq!(activities[0].action, "created");
}
