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
