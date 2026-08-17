# Architecture Notes & AureusERP Translation Reference

## 1. Overview & System Philosophy

**Mizan ERP** is a modular, offline-first desktop business management platform built for Egyptian and Arab small-to-medium enterprises (SMEs). 

It is architecturally informed by **AureusERP** (`github.com/aureuserp/aureuserp`), a mature open-source ERP built on Laravel 11/12 and FilamentPHP 3/4. 

While AureusERP provides battle-tested domain models, state machines, and relational structures, **Mizan ERP is a native compiled desktop application** running:
- **Desktop Shell:** Tauri 2.x
- **Core Backend:** Rust (2021 edition) + SQLite (WAL mode, via `sqlx`)
- **Frontend UI:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **State & Data Layer:** TanStack Query + Zustand
- **Internationalization:** `react-i18next` with Arabic (RTL) as primary default and English (LTR) as secondary
- **Financial Rigor:** Strict integer minor-currency units (piastres/cents), immutability of posted ledger moves, append-only reversals, and atomic double-entry balance constraints.

---

## 2. AureusERP Concept to Native Stack Translation Table

| Domain / Concept | AureusERP (Laravel / Filament) | Mizan ERP (Rust / SQLite / React) | Key Architectural Decision |
|---|---|---|---|
| **Plugin / Modularity** | Dynamic Composer packages, runtime migration running & hard table dropping on uninstall | **Modular Monolith**: All tables created in baseline migration. `modules` table tracks `is_active`. Activation triggers seeds only; deactivation hides UI and guards commands without data loss. | No runtime dynamic binary loading needed; safer local SQLite data retention. |
| **Multi-Tenancy / Hierarchy** | `Webkul\Support\Models\Company` with `parent_id` & `BelongsToCompany` trait | `companies` table with `parent_id` self-referencing FK. `company_id` on every transactional table. | Branch hierarchy from day 1. |
| **Contacts / Partners** | Unified `partners` table with `sub_type` discriminator (`customer`, `vendor`, `partner`, `contact`) | Unified `partners` table with `sub_type` text discriminator (`customer`, `vendor`, `partner`, `contact`) + `is_company` boolean. | Avoids split customer/vendor tables; enables multi-role partners. |
| **Accounting Documents** | Unified `accounts_account_moves` (`AccountMove`) with `move_type` enum | Unified `account_moves` table with `move_type` enum (`journal_entry`, `customer_invoice`, `vendor_bill`, `customer_refund`, `vendor_refund`, `payment_receipt`, `payment_voucher`) | One financial ledger model for all transactions; simplifies balance sheet and reporting. |
| **Journal Lines** | `accounts_account_move_lines` (`AccountMoveLine`) with `debit`, `credit`, `balance` | `account_move_lines` table with integer `debit_cents`, `credit_cents`. Validated `SUM(debit) == SUM(credit)`. | Double-entry constraint enforced in Rust transaction before commit. |
| **Accounting Corrections** | `accounts_move_reversals` (`MoveReversal`) | `move_reversals` link table (`move_id`, `reversal_move_id`, `reason`, `date`). | Posted entries are **strictly immutable**. Edits forbidden; adjustments done solely via reversal moves. |
| **Stock Grain** | `inventories_product_quantities` with `(product_id, location_id, lot_id, package_id)` | `stock_quantities` table with unique constraint `(product_id, location_id, lot_id, package_id, company_id)` | Precise multi-dimensional stock tracking grain. |
| **Stock Ledger** | `inventories_stock_moves` with demand vs done quantity | `stock_moves` table: append-only ledger of stock movements. | Stock quantities are deterministic projections of completed moves. |
| **Product Tracking** | `ProductTracking` enum (`none`, `lot`, `serial`) on Product | `tracking_mode` enum (`qty`, `lot`, `serial`) on `products` table | Enforces lot/serial selection during inventory operations. |
| **Inventory Operations** | `inventories_stock_pickings` + `picking_types` (Receipts, Deliveries, Internal Transfers) | `stock_operations` + `stock_operation_lines` (Receipt, Delivery, Transfer) | Uniform warehouse movement workflow. |
| **Sales Orders** | `sales_orders` + `sales_order_lines` (states: `draft`, `sent`, `sale`, `done`, `cancel`) | `sale_orders` + `sale_order_lines` (states: `draft`, `sent`, `confirmed`, `done`, `cancelled`) | Quotation -> Order state machine; auto-creates stock delivery reservation and customer invoice. |
| **Purchase Orders & Requisitions** | `purchase_requisitions` + `purchase_orders` (states: `draft`, `sent`, `to_approve`, `purchase`, `done`, `cancel`) | `purchase_requisitions` + `purchase_orders` (states: `draft`, `sent`, `confirmed`, `done`, `cancelled`) | Requisition-to-PO line copy pattern with source traceability. |
| **Permissions & RBAC** | Spatie Laravel-Permission + FilamentShield (`PermissionManager` prefixing `module.resource.action`) | `roles`, `permissions`, `role_permissions`, `user_roles` with `module.resource.action` dot keys | Granular authorization checks duplicated in Rust command handlers. |
| **Activity Log / Chatter** | Polymorphic `chatter_messages` & `chatter_activities` | Unified `activity_logs` table (`entity_type`, `entity_id`, `user_id`, `action`, `details_json`, `created_at`) | Audit trail and change tracking for business records. |

---

## 3. Financial & Currency Representation

- **Zero Floating-Point Currencies:** In AureusERP, amounts use decimal database columns (`Decimal(15,4)`). In Mizan ERP, all monetary amounts are stored as **integer minor units** (e.g. `amount_cents INTEGER` for EGP/USD/EUR).
- **Frontend Formatting:** Integers are transmitted across the Tauri IPC bridge and formatted as decimal currency representations strictly in the React presentation layer using `Intl.NumberFormat`.
- **Balancing Invariant:** Before committing any `account_moves` with state `posted`, Rust validates:
  $$\sum \text{debit\_cents} = \sum \text{credit\_cents}$$

---

## 4. State Machines Comparison

### 4.1 Sales Order Lifecycle
- **AureusERP:** `draft` -> `sent` -> `sale` -> `done` (or `cancel`)
- **Mizan ERP:** `draft` -> `sent` -> `confirmed` -> `done` (or `cancelled`)
  - *Draft / Sent:* Editable quotation with dynamic line tax & discount computation.
  - *Confirmed:* Locks prices, provisions outgoing `stock_operation` (Delivery Order), and enables invoice generation.
  - *Done:* Fully delivered and fully invoiced.
  - *Cancelled:* Allowed from Draft/Sent or if all dependent deliveries/invoices are cancelled/reversed.

### 4.2 Purchase Order Lifecycle
- **AureusERP:** `draft` -> `sent` -> `to_approve` -> `purchase` -> `done` (or `cancel`)
- **Mizan ERP:** `draft` -> `sent` -> `confirmed` -> `done` (or `cancelled`)
  - *Requisition to PO Flow:* Requisition lines copy to PO lines cleanly while preserving original requisition line linkage.
  - *Confirmed:* Provisions incoming `stock_operation` (Goods Receipt) and enables vendor bill generation.

### 4.3 Accounting Move Lifecycle
- **AureusERP:** `draft` -> `posted` -> `cancel`
- **Mizan ERP:** `draft` -> `posted` -> `reversed`
  - *Draft:* Freely editable lines, accounts, and amounts.
  - *Posted:* Immutable. Database triggers and Rust handler reject updates/deletions.
  - *Reversal:* Created via `move_reversals` generating an offsetting move with inverted debits/credits.

---

## 5. Design System & Palette Mapping

AureusERP configures its Filament theme with primary `Color::hex('#1E40AF')` (Deep Blue 800) alongside default Blue scales and standard semantic tones.

Mizan ERP maps this into a CSS Variable-driven Tailwind theme:

| Token | Hex Value | Purpose |
|---|---|---|
| `--primary-50` | `#eff6ff` | Subtle background tints / zebra striping |
| `--primary-100` | `#dbeafe` | Hover backgrounds / active badge fills |
| `--primary-200` | `#bfdbfe` | Selected item borders |
| `--primary-300` | `#93c5fd` | Secondary border accents |
| `--primary-400` | `#60a5fa` | Interactive icons |
| `--primary-500` | `#3b82f6` | Secondary interactive elements |
| `--primary-600` | `#2563eb` | **Default brand button / active primary action** |
| `--primary-700` | `#1d4ed8` | Button hover state |
| `--primary-800` | `#1e40af` | Deep primary accent / AureusERP brand blue |
| `--primary-900` | `#1e3a8a` | Dark text on light blue surfaces |
| `--primary-950` | `#172554` | Dark mode surface background |

**Semantic Colors:**
- **Success (Green):** `#16a34a` (Emerald / Green)
- **Danger (Red):** `#dc2626` (Rose / Red)
- **Warning (Amber):** `#f59e0b` (Amber)
- **Info (Sky):** `#0ea5e9` (Sky Blue)

**Typography:**
- Primary Arabic Font: **Cairo** / **Tajawal** (RTL)
- Latin Fallback: **Inter** (LTR)
- Directional layout using CSS Logical Properties (`margin-inline-start`, `padding-inline-end`, `border-inline-start`).

---

## 6. Intentional Simplifications for MVP

| Feature Area | AureusERP Full Feature | Mizan ERP MVP Simplification | Rationale |
|---|---|---|---|
| **Plugin Loading** | Dynamic Composer package discovery at runtime | Compile-time monolithic binary with module activation flags | Dynamic shared library loading across OSes is brittle for desktop SQLite apps. |
| **Custom Fields Engine** | Runtime dynamic schema-less custom field generator | Fixed schema + JSON `metadata` column on main entities | Avoids complex EAV (Entity-Attribute-Value) query overhead and maintains compile-time Rust type safety. |
| **Manufacturing (BOM / Work Orders)** | Multi-level Bill of Materials and work center routings | Deferred (Out of Scope for MVP) | Targeted at retail/wholesale/distribution SMEs first. |
| **Website & E-Commerce** | Integrated CMS, blog, and online storefront | Deferred / Excluded | Standalone local desktop application does not serve web traffic. |
| **Multi-Currency Revaluation** | Automated Forex gain/loss revaluation journal batches | Manual exchange rates at document creation; default single base currency (EGP) | Revaluation introduces accounting complexity not required for local Egyptian retail/SMEs in MVP. |
| **Chatter / Mail System** | Polymorphic email threads, SMTP sync, follower subscriptions | Lightweight per-record append-only audit & comment log | Desktop offline app does not need full inbound SMTP email server integration. |
| **Complex Stock Routings** | 3-step push/pull rules, cross-docking, dropshipping routes | 1-step and 2-step direct stock operations (Receipt, Delivery, Internal Transfer) | Covers >95% of SME warehouse workflows without complex routing graph solvers. |

---

## 7. Next Steps & Phase Roadmap

1. **Phase 0:** Environment, Scaffold, Tooling Harness, and Architecture Alignment (Current).
2. **Phase 1:** Core Foundation (Companies, Users, RBAC, Partners, Settings, Module Manager).
3. **Phase 2:** Products & Inventory (Catalog, Locations, Stock Quantities, Stock Moves).
4. **Phase 3:** Sales (Quotations, Orders, Taxes, Stock Integration).
5. **Phase 4:** Purchases (Requisitions, POs, Vendor Goods Receipts).
6. **Phase 5:** Financials (Chart of Accounts, Journal Moves, Invoices, Payments, Reversals, PDF).
7. **Phase 6:** HR (Employees, Recruitment, Time-Off, Timesheets).
8. **Phase 7:** Analytics Dashboard, Module Manager Polish, Windows Installer Packaging.
