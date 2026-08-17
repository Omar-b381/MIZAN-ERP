use base64::Engine;
use chrono::{Duration, Utc};
use ed25519_dalek::{Signer, SigningKey};
use rand_core::OsRng;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{self, Write};

#[derive(Debug, Serialize, Deserialize)]
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

fn main() {
    println!("============================================================");
    println!("      🏛️ MIZAN ERP — Offline License Key Generator");
    println!("============================================================");

    let mut licensee = String::new();
    print!("1. Enter Licensee / Client Name: ");
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut licensee).unwrap();
    let licensee = licensee.trim().to_string();

    let mut machine_id = String::new();
    print!("2. Enter Target Machine ID (e.g. MIZAN-ABCD-1234 or * for any): ");
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut machine_id).unwrap();
    let machine_id = machine_id.trim().to_string();

    let mut tier = String::new();
    print!("3. Enter License Tier (standard / professional / enterprise) [default: enterprise]: ");
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut tier).unwrap();
    let tier = if tier.trim().is_empty() {
        "enterprise".to_string()
    } else {
        tier.trim().to_string()
    };

    let mut validity_days_str = String::new();
    print!("4. Validity in days (0 for Perpetual / Lifetime) [default: 0]: ");
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut validity_days_str).unwrap();
    let validity_days: i64 = validity_days_str.trim().parse().unwrap_or(0);

    let allowed_modules = match tier.as_str() {
        "standard" => vec!["inventory".to_string(), "sales".to_string(), "purchases".to_string()],
        "professional" => vec![
            "inventory".to_string(),
            "sales".to_string(),
            "purchases".to_string(),
            "accounting".to_string(),
            "reports".to_string(),
        ],
        _ => vec![
            "inventory".to_string(),
            "sales".to_string(),
            "purchases".to_string(),
            "accounting".to_string(),
            "hr".to_string(),
            "reports".to_string(),
            "multi_company".to_string(),
        ],
    };

    let now = Utc::now();
    let expires_at = if validity_days > 0 {
        Some((now + Duration::days(validity_days)).to_rfc3339())
    } else {
        None
    };

    let payload = LicensePayload {
        licensee: if licensee.is_empty() { "مؤسسة تجارية معتمدة".to_string() } else { licensee.clone() },
        machine_id: if machine_id.is_empty() { "*".to_string() } else { machine_id },
        tier,
        allowed_modules,
        issued_at: now.to_rfc3339(),
        expires_at,
    };

    let payload_json = serde_json::to_string(&payload).unwrap();

    // Generate or load Ed25519 keypair
    let signing_key = SigningKey::generate(&mut OsRng);
    let verifying_key = signing_key.verifying_key();

    let signature = signing_key.sign(payload_json.as_bytes());
    let signature_base64 = base64::engine::general_purpose::STANDARD.encode(signature.to_bytes());
    let public_key_hex = hex::encode(verifying_key.to_bytes());

    let signed_file = SignedLicenseFile {
        payload_json,
        signature_base64,
        public_key_hex,
    };

    let license_json = serde_json::to_string_pretty(&signed_file).unwrap();
    let filename = format!("license_{}.mizan", if licensee.is_empty() { "client" } else { &licensee });
    let clean_filename = filename.replace(' ', "_");

    fs::write(&clean_filename, &license_json).expect("Failed to write license file");

    println!("\n✅ License Generated Successfully!");
    println!("📁 File Saved: {}", clean_filename);
    println!("------------------------------------------------------------");
    println!("{}", license_json);
    println!("------------------------------------------------------------");
    println!("Press Enter to exit...");
    let mut exit_buf = String::new();
    let _ = io::stdin().read_line(&mut exit_buf);
}
