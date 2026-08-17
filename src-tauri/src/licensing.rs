use base64::Engine;
use chrono::{DateTime, Local, Utc};
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;
use std::env;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LicensePayload {
    pub licensee: String,
    pub machine_id: String,
    pub tier: String,
    pub allowed_modules: Vec<String>,
    pub issued_at: String,
    pub expires_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignedLicenseFile {
    pub payload_json: String,
    pub signature_base64: String,
    pub public_key_hex: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TrialStatus {
    pub is_activated: bool,
    pub is_trial_active: bool,
    pub is_expired: bool,
    pub trial_days_left: i64,
    pub machine_id: String,
    pub licensee_name: Option<String>,
    pub tier: String,
    pub allowed_modules: Vec<String>,
    pub message: String,
}

/// Computes a stable, deterministic hardware machine identifier for offline binding.
pub fn get_machine_id() -> String {
    let hostname = env::var("COMPUTERNAME")
        .or_else(|_| env::var("HOSTNAME"))
        .unwrap_or_else(|_| "MIZAN-DEVICE".to_string());

    let username = env::var("USERNAME")
        .or_else(|_| env::var("USER"))
        .unwrap_or_else(|_| "DEFAULT-USER".to_string());

    let os_info = format!("{}:{}:{}", hostname, username, env::consts::OS);
    let mut hasher = Sha256::new();
    hasher.update(os_info.as_bytes());
    let hash_hex = hex::encode(hasher.finalize());

    format!("MIZAN-{}-{}", &hash_hex[0..4].to_uppercase(), &hash_hex[4..8].to_uppercase())
}

/// Verifies Ed25519 digital signature and machine binding for a license file.
pub fn verify_license_content(
    license_content: &str,
    expected_machine_id: &str,
) -> Result<LicensePayload, String> {
    let signed_file: SignedLicenseFile = serde_json::from_str(license_content)
        .map_err(|e| format!("Invalid license JSON format: {}", e))?;

    // Parse public key from hex
    let pubkey_bytes = hex::decode(&signed_file.public_key_hex)
        .map_err(|e| format!("Invalid public key encoding: {}", e))?;
    if pubkey_bytes.len() != 32 {
        return Err("Invalid public key length (expected 32 bytes)".to_string());
    }

    let mut key_arr = [0u8; 32];
    key_arr.copy_from_slice(&pubkey_bytes);
    let verifying_key = VerifyingKey::from_bytes(&key_arr)
        .map_err(|e| format!("Invalid Ed25519 verifying key: {}", e))?;

    // Decode signature
    let sig_bytes = base64::engine::general_purpose::STANDARD
        .decode(&signed_file.signature_base64)
        .map_err(|e| format!("Invalid base64 signature: {}", e))?;
    if sig_bytes.len() != 64 {
        return Err("Invalid signature length (expected 64 bytes)".to_string());
    }

    let mut sig_arr = [0u8; 64];
    sig_arr.copy_from_slice(&sig_bytes);
    let signature = Signature::from_bytes(&sig_arr);

    // Verify cryptographic signature against payload
    verifying_key
        .verify(signed_file.payload_json.as_bytes(), &signature)
        .map_err(|_| "Signature verification failed — License file has been tampered with or is invalid".to_string())?;

    // Parse payload
    let payload: LicensePayload = serde_json::from_str(&signed_file.payload_json)
        .map_err(|e| format!("Failed to parse license payload: {}", e))?;

    // Machine binding validation
    if payload.machine_id != expected_machine_id && payload.machine_id != "*" {
        return Err(format!(
            "Machine ID mismatch: License is bound to '{}', but current machine is '{}'",
            payload.machine_id, expected_machine_id
        ));
    }

    // Expiration check (if any)
    if let Some(exp_str) = &payload.expires_at {
        if let Ok(exp_date) = DateTime::parse_from_rfc3339(exp_str) {
            if Utc::now() > exp_date {
                return Err("License has expired".to_string());
            }
        }
    }

    Ok(payload)
}

/// Evaluates current license and 7-day evaluation trial status from SQLite.
pub async fn get_license_and_trial_status(pool: &SqlitePool) -> Result<TrialStatus, sqlx::Error> {
    let current_machine_id = get_machine_id();

    // 1. Check if an active license is installed in settings
    let stored_license: Option<String> = sqlx::query_scalar(
        "SELECT value FROM settings WHERE key = 'license_payload' AND company_id = 1"
    )
    .fetch_optional(pool)
    .await?;

    if let Some(lic_json) = stored_license {
        if let Ok(payload) = verify_license_content(&lic_json, &current_machine_id) {
            return Ok(TrialStatus {
                is_activated: true,
                is_trial_active: false,
                is_expired: false,
                trial_days_left: 0,
                machine_id: current_machine_id,
                licensee_name: Some(payload.licensee),
                tier: payload.tier,
                allowed_modules: payload.allowed_modules,
                message: "الترخيص التجاري نشط ودائم (Perpetual)".to_string(),
            });
        }
    }

    // 2. Evaluation Trial Engine (7 Days)
    let trial_started_str: Option<String> = sqlx::query_scalar(
        "SELECT value FROM settings WHERE key = 'trial_started_at' AND company_id = 1"
    )
    .fetch_optional(pool)
    .await?;

    let trial_started_at = match trial_started_str {
        Some(s) => s,
        None => {
            let now_str = Local::now().to_rfc3339();
            sqlx::query(
                "INSERT INTO settings (key, company_id, value, updated_at) VALUES ('trial_started_at', 1, ?, DATETIME('now'))"
            )
            .bind(&now_str)
            .execute(pool)
            .await?;
            now_str
        }
    };

    let all_modules = vec![
        "core".to_string(),
        "inventory".to_string(),
        "sales".to_string(),
        "purchases".to_string(),
        "accounting".to_string(),
        "employees".to_string(),
    ];

    if let Ok(started_dt) = DateTime::parse_from_rfc3339(&trial_started_at) {
        let now = Local::now();
        
        // Clock rollback tamper protection
        if now < started_dt {
            return Ok(TrialStatus {
                is_activated: false,
                is_trial_active: false,
                is_expired: true,
                trial_days_left: 0,
                machine_id: current_machine_id,
                licensee_name: None,
                tier: "trial".to_string(),
                allowed_modules: vec!["core".to_string()],
                message: "تم اكتشاف تلاعب في ساعة النظام. يرجى تفعيل الترخيص التجاري للمتابعة.".to_string(),
            });
        }

        let elapsed = now.signed_duration_since(started_dt).num_days();
        if elapsed < 7 {
            let days_left = 7 - elapsed;
            return Ok(TrialStatus {
                is_activated: false,
                is_trial_active: true,
                is_expired: false,
                trial_days_left: days_left.max(1),
                machine_id: current_machine_id,
                licensee_name: None,
                tier: "trial_all_unlocked".to_string(),
                allowed_modules: all_modules,
                message: format!("الفترة التجريبية نشطة (متبقي {} أيام)", days_left.max(1)),
            });
        } else {
            return Ok(TrialStatus {
                is_activated: false,
                is_trial_active: false,
                is_expired: true,
                trial_days_left: 0,
                machine_id: current_machine_id,
                licensee_name: None,
                tier: "expired".to_string(),
                allowed_modules: vec!["core".to_string()],
                message: "انتهت الفترة التجريبية (7 أيام). يرجى تفعيل الترخيص لمتابعة استخدام النظام.".to_string(),
            });
        }
    }

    Ok(TrialStatus {
        is_activated: false,
        is_trial_active: true,
        is_expired: false,
        trial_days_left: 7,
        machine_id: current_machine_id,
        licensee_name: None,
        tier: "trial_all_unlocked".to_string(),
        allowed_modules: all_modules,
        message: "الفترة التجريبية نشطة (متبقي 7 أيام)".to_string(),
    })
}

/// Activates a signed license file and stores it in SQLite.
pub async fn activate_license(
    pool: &SqlitePool,
    license_content: &str,
) -> Result<TrialStatus, String> {
    let machine_id = get_machine_id();
    let payload = verify_license_content(license_content, &machine_id)?;

    // Store in settings
    sqlx::query(
        "INSERT INTO settings (key, company_id, value, updated_at) VALUES ('license_payload', 1, ?, DATETIME('now'))
         ON CONFLICT(key, company_id) DO UPDATE SET value = excluded.value, updated_at = DATETIME('now')"
    )
    .bind(license_content)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(TrialStatus {
        is_activated: true,
        is_trial_active: false,
        is_expired: false,
        trial_days_left: 0,
        machine_id,
        licensee_name: Some(payload.licensee),
        tier: payload.tier,
        allowed_modules: payload.allowed_modules,
        message: "تم تفعيل الترخيص بنجاح!".to_string(),
    })
}
