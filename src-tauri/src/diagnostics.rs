use chrono::Local;
use serde::{Deserialize, Serialize};
use std::fs::{self, File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticEntry {
    pub timestamp: String,
    pub level: String,
    pub module: String,
    pub action: String,
    pub error_message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiagnosticExportResult {
    pub export_path: String,
    pub total_entries: usize,
}

pub fn get_diagnostics_log_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("logs").join("diagnostics.log")
}

/// Logs a structured error entry to the local diagnostics log file.
pub fn log_diagnostic_error(
    app_data_dir: &Path,
    module: &str,
    action: &str,
    error_msg: &str,
) -> io::Result<()> {
    let log_dir = app_data_dir.join("logs");
    if !log_dir.exists() {
        fs::create_dir_all(&log_dir)?;
    }

    let log_file = log_dir.join("diagnostics.log");
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_file)?;

    let timestamp = Local::now().to_rfc3339();
    let entry = DiagnosticEntry {
        timestamp,
        level: "ERROR".to_string(),
        module: module.to_string(),
        action: action.to_string(),
        error_message: error_msg.to_string(),
    };

    let line = serde_json::to_string(&entry)
        .unwrap_or_else(|_| format!("{{\"error\":\"serialization_failed\",\"msg\":\"{}\"}}", error_msg));

    writeln!(file, "{}", line)?;
    Ok(())
}

/// Reads recent diagnostic log entries (up to `limit`).
pub fn read_recent_diagnostics(app_data_dir: &Path, limit: usize) -> io::Result<Vec<DiagnosticEntry>> {
    let log_file = app_data_dir.join("logs").join("diagnostics.log");
    if !log_file.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(log_file)?;
    let mut entries = Vec::new();
    for line in content.lines().rev() {
        if let Ok(entry) = serde_json::from_str::<DiagnosticEntry>(line) {
            entries.push(entry);
            if entries.len() >= limit {
                break;
            }
        }
    }

    Ok(entries)
}

/// Exports a sanitized diagnostic bundle containing error logs and environment metadata (no customer business records).
pub fn export_diagnostic_report(
    app_data_dir: &Path,
    export_dest: &Path,
) -> io::Result<DiagnosticExportResult> {
    let entries = read_recent_diagnostics(app_data_dir, 500)?;
    
    let export_payload = serde_json::json!({
        "app_name": "Mizan ERP",
        "app_version": "1.1.0",
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "exported_at": Local::now().to_rfc3339(),
        "total_log_entries": entries.len(),
        "logs": entries,
    });

    let mut file = File::create(export_dest)?;
    let pretty_json = serde_json::to_string_pretty(&export_payload)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e.to_string()))?;
    file.write_all(pretty_json.as_bytes())?;

    Ok(DiagnosticExportResult {
        export_path: export_dest.to_string_lossy().to_string(),
        total_entries: entries.len(),
    })
}
