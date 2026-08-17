use chrono::Local;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::fs;
use std::path::{Path, PathBuf};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum BackupError {
    #[error("Database error: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Invalid backup file: {0}")]
    InvalidBackup(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub filename: String,
    pub file_path: String,
    pub size_bytes: u64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RestoreResult {
    pub success: bool,
    pub message: String,
    pub safety_snapshot_path: String,
}

/// Executes a WAL truncate checkpoint, then copies the database file to a timestamped backup.
pub async fn create_backup(
    pool: &SqlitePool,
    db_path: &Path,
    backup_dir: &Path,
    max_retention: usize,
) -> Result<BackupInfo, BackupError> {
    if !backup_dir.exists() {
        fs::create_dir_all(backup_dir)?;
    }

    // Step 1: Ensure WAL file is fully synced into the main database file
    sqlx::query("PRAGMA wal_checkpoint(TRUNCATE);")
        .execute(pool)
        .await?;

    let now_str = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let filename = format!("mizan_backup_{}.db", now_str);
    let dest_path = backup_dir.join(&filename);

    // Step 2: Copy SQLite DB file to backup location
    fs::copy(db_path, &dest_path)?;

    let metadata = fs::metadata(&dest_path)?;
    let backup_info = BackupInfo {
        filename,
        file_path: dest_path.to_string_lossy().to_string(),
        size_bytes: metadata.len(),
        created_at: Local::now().to_rfc3339(),
    };

    // Step 3: Retention pruning
    prune_old_backups(backup_dir, max_retention)?;

    Ok(backup_info)
}

/// Lists all valid backups in the specified backup directory, sorted newest first.
pub fn list_backups(backup_dir: &Path) -> Result<Vec<BackupInfo>, BackupError> {
    if !backup_dir.exists() {
        return Ok(Vec::new());
    }

    let mut backups = Vec::new();
    for entry in fs::read_dir(backup_dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_file() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if name.starts_with("mizan_backup_") && name.ends_with(".db") {
                    let metadata = entry.metadata()?;
                    let created_at = metadata
                        .created()
                        .or_else(|_| metadata.modified())
                        .map(|t| chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339())
                        .unwrap_or_else(|_| Local::now().to_rfc3339());

                    backups.push(BackupInfo {
                        filename: name.to_string(),
                        file_path: path.to_string_lossy().to_string(),
                        size_bytes: metadata.len(),
                        created_at,
                    });
                }
            }
        }
    }

    backups.sort_by(|a, b| b.filename.cmp(&a.filename));
    Ok(backups)
}

/// Restores database from backup file after verifying SQLite header and creating safety snapshot.
pub async fn restore_backup(
    pool: &SqlitePool,
    db_path: &Path,
    backup_file: &Path,
    backup_dir: &Path,
) -> Result<RestoreResult, BackupError> {
    if !backup_file.exists() {
        return Err(BackupError::InvalidBackup("Backup file does not exist".to_string()));
    }

    // Step 1: Validate SQLite header (First 16 bytes: "SQLite format 3\0")
    let header_bytes = fs::read(backup_file)?;
    if header_bytes.len() < 16 || &header_bytes[0..16] != b"SQLite format 3\0" {
        return Err(BackupError::InvalidBackup("Corrupted or non-SQLite backup file".to_string()));
    }

    // Step 2: Checkpoint current DB and create safety pre-restore snapshot
    sqlx::query("PRAGMA wal_checkpoint(TRUNCATE);")
        .execute(pool)
        .await?;

    let now_str = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let safety_filename = format!("mizan_pre_restore_{}.db", now_str);
    let safety_path = backup_dir.join(&safety_filename);
    if db_path.exists() {
        fs::copy(db_path, &safety_path)?;
    }

    // Step 3: Replace current database file with backup
    fs::copy(backup_file, db_path)?;

    // Step 4: Remove stale WAL and SHM files to ensure clean startup
    let wal_path = PathBuf::from(format!("{}-wal", db_path.to_string_lossy()));
    let shm_path = PathBuf::from(format!("{}-shm", db_path.to_string_lossy()));
    if wal_path.exists() {
        let _ = fs::remove_file(wal_path);
    }
    if shm_path.exists() {
        let _ = fs::remove_file(shm_path);
    }

    Ok(RestoreResult {
        success: true,
        message: "تم استعادة قاعدة البيانات بنجاح. يرجى إعادة تشغيل التطبيق لتحديث الجلسة.".to_string(),
        safety_snapshot_path: safety_path.to_string_lossy().to_string(),
    })
}

/// Prunes backups to retain only the most recent `max_retention` copies.
fn prune_old_backups(backup_dir: &Path, max_retention: usize) -> Result<(), BackupError> {
    let mut backups = list_backups(backup_dir)?;
    if backups.len() > max_retention {
        for old in backups.drain(max_retention..) {
            let p = Path::new(&old.file_path);
            if p.exists() {
                let _ = fs::remove_file(p);
            }
        }
    }
    Ok(())
}
