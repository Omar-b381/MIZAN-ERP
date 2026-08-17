export interface ModuleRecord {
  key: string;
  name: string;
  category: 'core' | 'operations' | 'finance' | 'hr';
  is_active: boolean;
  requires: string[];
  description: string;
}

export interface Company {
  id: number;
  name: string;
  parent_id?: number | null;
  currency: string;
  timezone: string;
  tax_id?: string | null;
  commercial_registry?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface Permission {
  id: number;
  key: string;
  description?: string | null;
  module_key: string;
}

export interface RoleWithPermissions {
  id: number;
  name: string;
  description?: string | null;
  permissions: string[];
}

export interface User {
  id: number;
  company_id: number;
  username: string;
  email?: string | null;
  full_name: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface SessionUser {
  id: number;
  company_id: number;
  username: string;
  email?: string | null;
  full_name: string;
  roles: Role[];
  permissions: string[];
}

export type PartnerSubType = 'customer' | 'vendor' | 'partner' | 'contact';

export interface Partner {
  id: number;
  company_id: number;
  parent_id?: number | null;
  name: string;
  sub_type: PartnerSubType;
  is_company: number;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  tax_id?: string | null;
  commercial_registry?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  credit_limit_cents: number;
  notes?: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePartnerInput {
  company_id: number;
  parent_id?: number | null;
  name: string;
  sub_type: PartnerSubType;
  is_company: boolean;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  tax_id?: string | null;
  commercial_registry?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  credit_limit_cents?: number | null;
  notes?: string | null;
}

export interface ActivityLog {
  id: number;
  company_id: number;
  entity_type: string;
  entity_id: number;
  user_id?: number | null;
  action: string;
  summary: string;
  details_json?: string | null;
  created_at: string;
}

// ----------------------------------------------------
// Phase 2: Products & Catalog Types
// ----------------------------------------------------
export interface UomCategory {
  id: number;
  name: string;
  created_at: string;
}

export interface Uom {
  id: number;
  category_id: number;
  name: string;
  uom_type: 'reference' | 'bigger' | 'smaller';
  ratio: number;
  rounding: number;
  is_active: number;
  created_at: string;
}

export interface ProductCategory {
  id: number;
  company_id: number;
  name: string;
  parent_id?: number | null;
  complete_name?: string | null;
  created_at: string;
}

export type ProductType = 'storable' | 'consumable' | 'service';
export type TrackingMode = 'none' | 'lot' | 'serial';

export interface Product {
  id: number;
  company_id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  type: ProductType;
  category_id?: number | null;
  uom_id: number;
  purchase_uom_id?: number | null;
  sale_price_cents: number;
  cost_price_cents: number;
  tracking_mode: TrackingMode;
  min_stock_milli?: number | null;
  max_stock_milli?: number | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithStock {
  product: Product;
  category_name?: string | null;
  uom_name: string;
  qty_on_hand_milli: number;
}

export interface CreateProductInput {
  company_id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  type?: ProductType;
  category_id?: number | null;
  uom_id: number;
  purchase_uom_id?: number | null;
  sale_price_cents?: number;
  cost_price_cents?: number;
  tracking_mode?: TrackingMode;
  min_stock_milli?: number;
  max_stock_milli?: number;
}

// ----------------------------------------------------
// Phase 2: Inventory & Operations Types
// ----------------------------------------------------
export type LocationType = 'view' | 'internal' | 'customer' | 'supplier' | 'inventory_loss' | 'production';

export interface CreateLocationInput {
  company_id: number;
  name: string;
  parent_id?: number | null;
  location_type: LocationType;
}

export interface StockLocation {
  id: number;
  company_id: number;
  name: string;
  parent_id?: number | null;
  complete_name: string;
  location_type: LocationType;
  is_active: number;
  created_at: string;
}

export interface StockWarehouse {
  id: number;
  company_id: number;
  name: string;
  code: string;
  view_location_id: number;
  lot_stock_location_id: number;
  is_active: number;
  created_at: string;
}

export interface StockPickingType {
  id: number;
  company_id: number;
  warehouse_id?: number | null;
  name: string;
  code: 'incoming' | 'outgoing' | 'internal' | 'adjustment';
  sequence_prefix: string;
  next_number: number;
  default_src_location_id?: number | null;
  default_dest_location_id?: number | null;
  created_at: string;
}

export type PickingState = 'draft' | 'waiting' | 'confirmed' | 'done' | 'cancelled';

export interface StockPicking {
  id: number;
  company_id: number;
  name: string;
  picking_type_id: number;
  partner_id?: number | null;
  src_location_id: number;
  dest_location_id: number;
  scheduled_date?: string | null;
  date_done?: string | null;
  origin?: string | null;
  state: PickingState;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockMove {
  id: number;
  company_id: number;
  picking_id?: number | null;
  product_id: number;
  name: string;
  src_location_id: number;
  dest_location_id: number;
  quantity_milli: number;
  uom_id: number;
  state: 'draft' | 'confirmed' | 'done' | 'cancelled';
  reference?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockQuantityDetail {
  id: number;
  company_id: number;
  product_id: number;
  product_name: string;
  sku: string;
  location_id: number;
  location_name: string;
  location_type: LocationType;
  lot_serial_number: string;
  quantity_milli: number;
  uom_name: string;
  updated_at: string;
}

export interface StockInventoryAdjustment {
  id: number;
  company_id: number;
  name: string;
  location_id: number;
  state: 'draft' | 'in_progress' | 'done' | 'cancelled';
  accounting_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockInventoryAdjustmentLineDetail {
  id: number;
  adjustment_id: number;
  product_id: number;
  product_name: string;
  sku: string;
  lot_serial_number: string;
  theoretical_qty_milli: number;
  counted_qty_milli: number;
  difference_qty_milli: number;
  uom_name: string;
}

export interface CreatePickingMoveInput {
  product_id: number;
  quantity_milli: number;
  uom_id: number;
  lot_serial_number?: string | null;
}

export interface CreatePickingInput {
  company_id: number;
  picking_type_id: number;
  partner_id?: number | null;
  src_location_id?: number | null;
  dest_location_id?: number | null;
  scheduled_date?: string | null;
  origin?: string | null;
  note?: string | null;
  moves: CreatePickingMoveInput[];
}

// ----------------------------------------------------
// Phase 3: Sales Types
// ----------------------------------------------------
export type SaleOrderState = 'draft' | 'sent' | 'sale' | 'done' | 'cancelled';
export type DeliveryStatus = 'no' | 'to_deliver' | 'delivered' | 'cancelled';
export type InvoiceStatus = 'no' | 'to_invoice' | 'invoiced' | 'cancelled';

export interface SaleOrder {
  id: number;
  company_id: number;
  name: string;
  partner_id: number;
  partner_name?: string | null;
  date_order: string;
  validity_date?: string | null;
  state: SaleOrderState;
  currency: string;
  amount_untaxed_cents: number;
  amount_tax_cents: number;
  amount_total_cents: number;
  delivery_status: DeliveryStatus;
  invoice_status: InvoiceStatus;
  picking_id?: number | null;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleOrderLine {
  id: number;
  order_id: number;
  product_id: number;
  product_name?: string | null;
  product_sku?: string | null;
  name: string;
  product_uom_qty_milli: number;
  product_uom_id: number;
  uom_name?: string | null;
  price_unit_cents: number;
  discount_percent_milli: number;
  tax_rate_milli: number;
  price_subtotal_cents: number;
  price_total_cents: number;
  qty_delivered_milli: number;
  qty_invoiced_milli: number;
  sequence: number;
  created_at: string;
}

export interface SaleOrderDetail {
  order: SaleOrder;
  lines: SaleOrderLine[];
}

export interface CreateSaleOrderLineInput {
  product_id: number;
  name?: string;
  product_uom_qty_milli: number;
  product_uom_id: number;
  price_unit_cents: number;
  discount_percent_milli?: number;
  tax_rate_milli?: number;
}

export interface CreateSaleOrderInput {
  company_id: number;
  partner_id: number;
  validity_date?: string | null;
  currency?: string;
  note?: string | null;
  lines: CreateSaleOrderLineInput[];
}

export interface UpdateSaleOrderInput {
  id: number;
  partner_id: number;
  validity_date?: string | null;
  note?: string | null;
  lines: CreateSaleOrderLineInput[];
}

// ----------------------------------------------------
// Phase 4: Purchases Types
// ----------------------------------------------------
export type PurchaseOrderState = 'draft' | 'sent' | 'purchase' | 'done' | 'cancelled';
export type ReceiptStatus = 'no' | 'to_receive' | 'received' | 'cancelled';
export type BillStatus = 'no' | 'to_bill' | 'billed' | 'cancelled';

export interface PurchaseOrder {
  id: number;
  company_id: number;
  name: string;
  partner_id: number;
  partner_name?: string | null;
  date_order: string;
  date_planned?: string | null;
  state: PurchaseOrderState;
  currency: string;
  amount_untaxed_cents: number;
  amount_tax_cents: number;
  amount_total_cents: number;
  receipt_status: ReceiptStatus;
  invoice_status: BillStatus;
  picking_id?: number | null;
  origin?: string | null;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderLine {
  id: number;
  order_id: number;
  product_id: number;
  product_name?: string | null;
  product_sku?: string | null;
  name: string;
  product_uom_qty_milli: number;
  product_uom_id: number;
  uom_name?: string | null;
  price_unit_cents: number;
  discount_percent_milli: number;
  tax_rate_milli: number;
  price_subtotal_cents: number;
  price_total_cents: number;
  qty_received_milli: number;
  qty_billed_milli: number;
  sequence: number;
  created_at: string;
}

export interface PurchaseOrderDetail {
  order: PurchaseOrder;
  lines: PurchaseOrderLine[];
}

export interface CreatePurchaseOrderLineInput {
  product_id: number;
  name?: string;
  product_uom_qty_milli: number;
  product_uom_id: number;
  price_unit_cents: number;
  discount_percent_milli?: number;
  tax_rate_milli?: number;
}

export interface CreatePurchaseOrderInput {
  company_id: number;
  partner_id: number;
  date_planned?: string | null;
  currency?: string;
  origin?: string | null;
  note?: string | null;
  lines: CreatePurchaseOrderLineInput[];
}

export interface UpdatePurchaseOrderInput {
  id: number;
  partner_id: number;
  date_planned?: string | null;
  origin?: string | null;
  note?: string | null;
  lines: CreatePurchaseOrderLineInput[];
}

// ----------------------------------------------------
// Phase 5: Accounting, Invoices & Payments Types
// ----------------------------------------------------
export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';
export type JournalType = 'sale' | 'purchase' | 'bank' | 'cash' | 'general';
export type MoveType = 'entry' | 'out_invoice' | 'in_invoice' | 'out_refund' | 'in_refund';
export type MoveState = 'draft' | 'posted' | 'cancelled';
export type PaymentState = 'not_paid' | 'in_payment' | 'paid' | 'partial' | 'reversed';
export type PaymentType = 'inbound' | 'outbound';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque';

export interface Account {
  id: number;
  company_id: number;
  code: string;
  name: string;
  type: AccountType;
  is_reconciled: number;
  is_active: number;
  created_at: string;
}

export interface AccountJournal {
  id: number;
  company_id: number;
  name: string;
  code: string;
  type: JournalType;
  default_account_id?: number | null;
  created_at: string;
}

export interface AccountMove {
  id: number;
  company_id: number;
  name: string;
  date: string;
  journal_id: number;
  journal_name?: string | null;
  partner_id?: number | null;
  partner_name?: string | null;
  move_type: MoveType;
  state: MoveState;
  amount_untaxed_cents: number;
  amount_tax_cents: number;
  amount_total_cents: number;
  currency: string;
  invoice_date_due?: string | null;
  payment_state: PaymentState;
  origin?: string | null;
  note?: string | null;
  reversed_entry_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface AccountMoveLine {
  id: number;
  move_id: number;
  account_id: number;
  account_code?: string | null;
  account_name?: string | null;
  partner_id?: number | null;
  name: string;
  debit_cents: number;
  credit_cents: number;
  balance_cents: number;
  product_id?: number | null;
  product_name?: string | null;
  quantity_milli?: number | null;
  price_unit_cents?: number | null;
  discount_percent_milli?: number | null;
  tax_rate_milli?: number | null;
  sequence: number;
  created_at: string;
}

export interface AccountMoveDetail {
  move: AccountMove;
  lines: AccountMoveLine[];
}

export interface AccountPayment {
  id: number;
  company_id: number;
  name: string;
  partner_id: number;
  partner_name?: string | null;
  payment_type: PaymentType;
  amount_cents: number;
  date: string;
  journal_id: number;
  journal_name?: string | null;
  payment_method: PaymentMethod;
  state: string;
  move_id?: number | null;
  invoice_id?: number | null;
  note?: string | null;
  created_at: string;
}

export interface TrialBalanceRow {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  debit_sum_cents: number;
  credit_sum_cents: number;
  net_balance_cents: number;
}

export interface CreateAccountInput {
  company_id: number;
  code: string;
  name: string;
  type: AccountType;
  is_reconciled?: number;
}

export interface CreateInvoiceLineInput {
  product_id?: number | null;
  account_id?: number | null;
  name: string;
  quantity_milli: number;
  price_unit_cents: number;
  discount_percent_milli?: number;
  tax_rate_milli?: number;
}

export interface CreateInvoiceInput {
  company_id: number;
  partner_id: number;
  move_type: MoveType;
  date?: string | null;
  invoice_date_due?: string | null;
  currency?: string;
  origin?: string | null;
  note?: string | null;
  lines: CreateInvoiceLineInput[];
}

export interface CreateJournalEntryLineInput {
  account_id: number;
  partner_id?: number | null;
  name: string;
  debit_cents: number;
  credit_cents: number;
}

export interface CreateJournalEntryInput {
  company_id: number;
  journal_id: number;
  date?: string | null;
  origin?: string | null;
  note?: string | null;
  lines: CreateJournalEntryLineInput[];
}

export interface CreatePaymentInput {
  company_id: number;
  partner_id: number;
  payment_type: PaymentType;
  amount_cents: number;
  date?: string | null;
  journal_id: number;
  payment_method?: string;
  invoice_id?: number | null;
  note?: string | null;
}

// ----------------------------------------------------
// Phase 6: Human Resources (HR) Types
// ----------------------------------------------------
export interface Department {
  id: number;
  company_id: number;
  name: string;
  parent_id?: number | null;
  manager_id?: number | null;
  created_at: string;
}

export interface JobPosition {
  id: number;
  company_id: number;
  name: string;
  department_id?: number | null;
  department_name?: string | null;
  expected_employees: number;
  created_at: string;
}

export type EmployeeStatus = 'active' | 'on_leave' | 'terminated';

export interface Employee {
  id: number;
  company_id: number;
  partner_id?: number | null;
  name: string;
  work_email?: string | null;
  work_phone?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  job_id?: number | null;
  job_name?: string | null;
  manager_id?: number | null;
  manager_name?: string | null;
  hire_date: string;
  national_id?: string | null;
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
}

export type ContractState = 'draft' | 'open' | 'close' | 'cancelled';

export interface Contract {
  id: number;
  company_id: number;
  employee_id: number;
  employee_name?: string | null;
  name: string;
  wage_cents: number;
  date_start: string;
  date_end?: string | null;
  state: ContractState;
  working_hours_per_week: number;
  notes?: string | null;
  created_at: string;
}

export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'emergency';
export type LeaveState = 'draft' | 'confirm' | 'validate' | 'refuse';

export interface LeaveRequest {
  id: number;
  company_id: number;
  employee_id: number;
  employee_name?: string | null;
  leave_type: LeaveType;
  date_from: string;
  date_to: string;
  duration_days_milli: number;
  state: LeaveState;
  reason?: string | null;
  approved_by_id?: number | null;
  created_at: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface AttendanceRecord {
  id: number;
  company_id: number;
  employee_id: number;
  employee_name?: string | null;
  date: string;
  check_in: string;
  check_out?: string | null;
  worked_hours_milli: number;
  status: AttendanceStatus;
  notes?: string | null;
  created_at: string;
}

export interface CreateDepartmentInput {
  company_id: number;
  name: string;
  parent_id?: number | null;
  manager_id?: number | null;
}

export interface CreateJobInput {
  company_id: number;
  name: string;
  department_id?: number | null;
  expected_employees?: number | null;
}

export interface CreateEmployeeInput {
  company_id: number;
  name: string;
  work_email?: string | null;
  work_phone?: string | null;
  department_id?: number | null;
  job_id?: number | null;
  manager_id?: number | null;
  hire_date?: string | null;
  national_id?: string | null;
}

export interface UpdateEmployeeInput {
  id: number;
  name: string;
  work_email?: string | null;
  work_phone?: string | null;
  department_id?: number | null;
  job_id?: number | null;
  manager_id?: number | null;
  hire_date?: string | null;
  national_id?: string | null;
  status?: string | null;
}

export interface CreateContractInput {
  company_id: number;
  employee_id: number;
  wage_cents: number;
  date_start?: string | null;
  date_end?: string | null;
  working_hours_per_week?: number | null;
  notes?: string | null;
}

export interface CreateLeaveInput {
  company_id: number;
  employee_id: number;
  leave_type: LeaveType;
  date_from: string;
  date_to: string;
  duration_days_milli: number;
  reason?: string | null;
}

export interface RecordAttendanceInput {
  company_id: number;
  employee_id: number;
  date?: string | null;
  check_in: string;
  check_out?: string | null;
  notes?: string | null;
}

// ----------------------------------------------------
// Phase 7: Dashboard & Executive Reporting Types
// ----------------------------------------------------
export interface DashboardMetrics {
  company_id: number;
  total_sales_cents: number;
  sales_orders_count: number;
  top_customers_count: number;
  total_purchases_cents: number;
  purchase_orders_count: number;
  inventory_valuation_cents: number;
  total_products_count: number;
  pending_deliveries_count: number;
  pending_receipts_count: number;
  accounts_receivable_cents: number;
  accounts_payable_cents: number;
  cash_bank_balance_cents: number;
  net_vat_liability_cents: number;
  active_employees_count: number;
  monthly_payroll_cents: number;
  pending_leaves_count: number;
}

// ----------------------------------------------------
// Phase 8: Hardening, Licensing & Trial Types
// ----------------------------------------------------
export interface TrialStatus {
  is_activated: boolean;
  is_trial_active: boolean;
  is_expired: boolean;
  trial_days_left: number;
  machine_id: string;
  licensee_name?: string | null;
  tier: string;
  allowed_modules: string[];
  message: string;
}

export interface BackupInfo {
  filename: string;
  file_path: string;
  size_bytes: number;
  created_at: string;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  safety_snapshot_path: string;
}

export interface DiagnosticExportResult {
  export_path: string;
  total_entries: number;
}

// ----------------------------------------------------
// Phase 9: Reports & Data Export Types
// ----------------------------------------------------

export interface TrialBalanceItem {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  debit_sum_cents: number;
  credit_sum_cents: number;
  net_balance_cents: number;
}

export interface PnLLineItem {
  account_id: number;
  code: string;
  name: string;
  amount_cents: number;
}

export interface ProfitAndLossReport {
  start_date: string;
  end_date: string;
  revenues: PnLLineItem[];
  total_revenue_cents: number;
  cogs: PnLLineItem[];
  total_cogs_cents: number;
  gross_profit_cents: number;
  operating_expenses: PnLLineItem[];
  total_operating_expenses_cents: number;
  net_profit_cents: number;
}

export interface GeneralLedgerLine {
  move_id: number;
  move_name: string;
  date: string;
  account_id: number;
  account_code: string;
  account_name: string;
  partner_id?: number | null;
  partner_name?: string | null;
  label: string;
  debit_cents: number;
  credit_cents: number;
  balance_cents: number;
}

export interface GeneralLedgerAccount {
  account_id: number;
  account_code: string;
  account_name: string;
  opening_balance_cents: number;
  lines: GeneralLedgerLine[];
  total_debit_cents: number;
  total_credit_cents: number;
  closing_balance_cents: number;
}

export interface SalesReportRow {
  period_group: string;
  partner_id?: number | null;
  partner_name?: string | null;
  product_id?: number | null;
  product_name?: string | null;
  product_sku?: string | null;
  qty_sold_milli: number;
  amount_untaxed_cents: number;
  amount_tax_cents: number;
  amount_total_cents: number;
  orders_count: number;
}

export interface PurchasesReportRow {
  period_group: string;
  partner_id?: number | null;
  partner_name?: string | null;
  product_id?: number | null;
  product_name?: string | null;
  product_sku?: string | null;
  qty_purchased_milli: number;
  amount_untaxed_cents: number;
  amount_tax_cents: number;
  amount_total_cents: number;
  orders_count: number;
}

export interface PartnerStatementLine {
  date: string;
  doc_type: string;
  reference: string;
  description: string;
  debit_cents: number;
  credit_cents: number;
  running_balance_cents: number;
}

export interface PartnerStatementReport {
  partner_id: number;
  partner_name: string;
  partner_type: string;
  tax_id?: string | null;
  start_date: string;
  end_date: string;
  opening_balance_cents: number;
  total_debit_cents: number;
  total_credit_cents: number;
  closing_balance_cents: number;
  lines: PartnerStatementLine[];
}

export interface PartnerAgingItem {
  partner_id: number;
  partner_name: string;
  phone?: string | null;
  bucket_0_30_cents: number;
  bucket_31_60_cents: number;
  bucket_61_90_cents: number;
  bucket_90_plus_cents: number;
  total_outstanding_cents: number;
}

export interface StockOnHandReportItem {
  product_id: number;
  default_code: string;
  product_name: string;
  category_name: string;
  location_id: number;
  location_name: string;
  warehouse_name: string;
  quantity_on_hand_milli: number;
  uom_name: string;
  cost_price_cents: number;
  total_valuation_cents: number;
}

export interface StockMovementReportItem {
  move_id: number;
  reference: string;
  date: string;
  product_id: number;
  default_code: string;
  product_name: string;
  src_location_name: string;
  dest_location_name: string;
  quantity_milli: number;
  uom_name: string;
  state: string;
}

export interface LowStockReportItem {
  product_id: number;
  default_code: string;
  product_name: string;
  category_name: string;
  current_stock_milli: number;
  min_stock_milli: number;
  max_stock_milli: number;
  reorder_qty_milli: number;
  uom_name: string;
}

export interface ExportColumn {
  key: string;
  title: string;
  data_type: 'text' | 'number' | 'currency' | 'date' | 'percent';
  width?: number | null;
}

export interface ExportReportRequest {
  title: string;
  subtitle?: string | null;
  company_name: string;
  date_range?: string | null;
  columns: ExportColumn[];
  rows: Record<string, any>[];
  is_rtl: boolean;
}

export interface BatchZipFileItem {
  filename: string;
  content_base64?: string | null;
  content_text?: string | null;
}

export interface BatchZipExportRequest {
  zip_filename: string;
  files: BatchZipFileItem[];
}

