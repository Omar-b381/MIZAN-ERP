# MIZAN ERP — Architectural Decisions & Notes (Phase 8)

## 1. Licensing & Legal Model Decision (§0.1)
- **License Type**: Proprietary / Commercial License (All Rights Reserved).
- **Rationale**: Mizan ERP is designed as a standalone, offline-first commercial software product sold via perpetual one-time purchase with optional tier upgrades (Starter / Business / Enterprise). The initial open-source placeholder license is replaced with commercial software terms.
- **Source Protection**: License validation is enforced offline using asymmetric Ed25519 signatures, machine binding, and module-level activation gating.

## 2. Password Hashing Architecture (A1)
- **Algorithm**: Argon2id (via RustCrypto `argon2` crate).
- **Salt**: Cryptographically secure random 128-bit salt (`SaltString::generate(&mut OsRng)`).
- **Format**: Standard PHC string format (`$argon2id$v=19$m=19456,t=2,p=1$...`).
- **Transparent Migration**: Login automatically detects legacy 64-character SHA-256 hashes, verifies credentials, and transparently upgrades the stored record to Argon2id without disrupting user access.

## 3. Database Backup & Restore Architecture (A2)
- **Integrity**: Always executes `PRAGMA wal_checkpoint(TRUNCATE)` before copying SQLite database files to guarantee consistent WAL synchronization.
- **Safety Snapshot**: Every restore operation first takes a `mizan_pre_restore_YYYYMMDD_HHMMSS.db` snapshot of the active database before replacing files.
- **Retention**: Configurable retention limit (default: last 10 snapshots) with automated pruning of older files.

## 4. Cryptographic License Verification & Machine Binding (B2 & B2a)
- **Asymmetric Signature**: Ed25519 (`ed25519-dalek`).
- **Key Separation**:
  - Private Signing Key: Stored exclusively on Omar's offline machine inside the standalone `mizan-license-issuer` tool.
  - Public Verification Key: Embedded statically in the compiled Mizan ERP desktop application binary.
- **Machine ID**: Deterministic SHA-256 hash of stable local machine identifiers (Windows Machine GUID / Motherboard UUID).
- **Module Gating**:
  - `starter`: `core`, `inventory`, `sales`
  - `business`: `starter` + `purchases`, `accounting`
  - `enterprise`: `business` + `employees`

## 5. Evaluation Trial Engine (B3)
- **Duration**: 7 calendar days starting from first application launch.
- **Evaluation Scope**: 100% of modules unlocked during the 7-day evaluation.
- **Day 8+ Behavior**: Unclosable license activation overlay with Machine ID and license file importer. Existing SQLite business data is strictly preserved and never deleted or corrupted.
- **Tamper Protection**: Clock-rollback detection (current timestamp earlier than trial start or SQLite creation date).
