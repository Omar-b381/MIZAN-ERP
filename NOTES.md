# Project Notes & §13 Open Questions Log

This document records ongoing architectural decisions, operational assumptions, and questions logged for review with the product owner.

---

## 1. Open Questions (§13)

| ID | Topic | Question / Issue | Default MVP Assumption | Status |
|---|---|---|---|---|
| **OQ-01** | **Multi-branch UI** | Is interactive branch-switching with consolidated cross-branch reporting needed at MVP, or is Phase 1 schema-only support (`company_id` on all tables, default main company) sufficient? | **Schema-only support in Phase 1**, with single active company context, ready for multi-branch switcher UI in subsequent iteration. | Logged |
| **OQ-02** | **ETA E-Invoicing** | Is direct Egyptian Tax Authority (ETA) e-invoicing API integration in scope for MVP accounting, or deferred to v2? | **Deferred to v2 / post-MVP**. Accounting module generates standard compliant electronic invoices (QR code, tax breakdown) locally. | Logged |
| **OQ-03** | **Hardware Peripherals** | Are POS thermal receipt printers and hardware barcode scanners required for MVP Sales & Inventory? | **Standard desktop input & print handling**. Barcode input handled via standard keyboard-wedge scanners (instant text input); printing via system print dialog / PDF. | Logged |
| **OQ-04** | **Cross-Device Sync** | How should future multi-device or multi-branch synchronization be architected? | **MVP is 100% offline local-first SQLite**. Future sync will be an optional synchronization extension (e.g. CRDTs / server replication) bolted onto the local core without rewriting business logic. | Logged |
| **OQ-05** | **Commercial Licensing** | At what phase does licensing / software activation key infrastructure get integrated? | **Deferred to release packaging (Phase 7 or post-MVP)**. Development proceeds with unencumbered local execution. | Logged |
| **OQ-06** | **PDF Generation Engine** | What PDF engine should be utilized for printing invoices, receipts, and reports in Phase 5? | **Decide in Phase 5**: Evaluating Rust native headless PDF generator vs Tauri webview print-to-PDF. Decision and benchmarks to be documented in Phase 5. | Open (Scheduled for Phase 5) |

---

## 2. Technical Defaults & Guardrails

- **Database:** SQLite in WAL (Write-Ahead Logging) mode, `PRAGMA foreign_keys = ON`, `PRAGMA busy_timeout = 5000`.
- **Currency Storage:** All monetary fields stored in integer minor units (`amount_cents INTEGER`).
- **Accounting Immutability:** Posted entries (`account_moves.state = 'posted'`) cannot be edited or deleted. Corrections must occur via `move_reversals`.
- **Double-Entry Validation:** Every posted journal entry must satisfy $\sum \text{debit} = \sum \text{credit}$.
- **Stock Negative Balance Guard:** Stock quantities cannot decrease below zero unless backorders are enabled.
- **Module Authorization Defense:** Every Tauri backend command validates `modules.is_active` for its parent module in addition to user permission checks.
