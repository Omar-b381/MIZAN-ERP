import {
  ModuleRecord,
  Company,
  User,
  SessionUser,
  RoleWithPermissions,
  Permission,
  Partner,
  CreatePartnerInput,
  ActivityLog,
  Product,
  ProductWithStock,
  CreateProductInput,
  ProductCategory,
  Uom,
  StockLocation,
  StockWarehouse,
  StockPickingType,
  StockPicking,
  StockMove,
  StockQuantityDetail,
  StockInventoryAdjustment,
  StockInventoryAdjustmentLineDetail,
  CreatePickingInput,
  CreateLocationInput,
  SaleOrder,
  SaleOrderLine,
  SaleOrderDetail,
  CreateSaleOrderInput,
  UpdateSaleOrderInput,
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderDetail,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  Account,
  AccountJournal,
  AccountMove,
  AccountMoveLine,
  AccountMoveDetail,
  AccountPayment,
  TrialBalanceRow,
  CreateAccountInput,
  CreateInvoiceInput,
  CreateJournalEntryInput,
  CreatePaymentInput,
  Department,
  JobPosition,
  Employee,
  Contract,
  LeaveRequest,
  AttendanceRecord,
  CreateDepartmentInput,
  CreateJobInput,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateContractInput,
  CreateLeaveInput,
  RecordAttendanceInput,
} from '../types';

let mockModules: ModuleRecord[] = [
  {
    key: 'core',
    name: 'النواة الأساسية (Core)',
    category: 'core',
    is_active: true,
    requires: [],
    description: 'إدارة الشركات، الفروع، المستخدمين، والصلاحيات',
  },
  {
    key: 'products',
    name: 'كتالوج المنتجات (Products)',
    category: 'operations',
    is_active: true,
    requires: ['core'],
    description: 'إدارة الأصناف، وحدات القياس، الأسعار، وأرقام التشغيل',
  },
  {
    key: 'inventory',
    name: 'إدارة المخزون (Inventory)',
    category: 'operations',
    is_active: true,
    requires: ['core', 'products'],
    description: 'حركات المخزون، المستودعات، أذون الاستلام والتسليم، والجرد الفعلي',
  },
  {
    key: 'sales',
    name: 'المبيعات (Sales)',
    category: 'operations',
    is_active: false,
    requires: ['core', 'products'],
    description: 'عروض الأسعار، أوامر البيع، وأوامر التسليم للعملاء',
  },
  {
    key: 'purchases',
    name: 'المشتريات (Purchases)',
    category: 'operations',
    is_active: false,
    requires: ['core', 'products'],
    description: 'طلبات عروض الأسعار، أوامر الشراء، وفواتير الموردين',
  },
  {
    key: 'accounting',
    name: 'الحسابات العامة (Accounting)',
    category: 'finance',
    is_active: false,
    requires: ['core'],
    description: 'شجرة الحسابات، قيود اليومية المزدوجة، ومراكز التكلفة',
  },
  {
    key: 'invoices',
    name: 'الفواتير والضرائب (Invoicing)',
    category: 'finance',
    is_active: false,
    requires: ['core', 'accounting'],
    description: 'فواتير المبيعات والمشتريات وإقرارات ضريبة القيمة المضافة',
  },
  {
    key: 'payments',
    name: 'المدفوعات والمقبوضات (Payments)',
    category: 'finance',
    is_active: false,
    requires: ['core', 'accounting'],
    description: 'سندات القبض والصرف وحسابات الخزينة والبنوك',
  },
  {
    key: 'employees',
    name: 'الموظفون (Employees)',
    category: 'hr',
    is_active: false,
    requires: ['core'],
    description: 'ملفات الموظفين، الهيكل التنظيمي، والبيانات الوظيفية',
  },
  {
    key: 'recruitment',
    name: 'التوظيف (Recruitment)',
    category: 'hr',
    is_active: false,
    requires: ['core', 'employees'],
    description: 'إدارة طلبات التوظيف، المقابلات، ومراحل القبول',
  },
  {
    key: 'timeoff',
    name: 'الإجازات (Time-Off)',
    category: 'hr',
    is_active: false,
    requires: ['core', 'employees'],
    description: 'أرصدة وطلبات الإجازات ومسارات الموافقة',
  },
  {
    key: 'timesheet',
    name: 'سجلات الحضور (Timesheet)',
    category: 'hr',
    is_active: false,
    requires: ['core', 'employees'],
    description: 'تسجيل ساعات العمل والمشاريع وحضور الموظفين',
  },
];

let mockCompanies: Company[] = [
  {
    id: 1,
    name: 'شركة ميزان الرئيسية',
    parent_id: null,
    currency: 'EGP',
    timezone: 'Africa/Cairo',
    tax_id: '100-200-300',
    commercial_registry: '45678',
    phone: '+20223456789',
    email: 'info@mizan.local',
    website: 'https://mizan.local',
    street: 'شارع التسعين الشمالي، التجمع الخامس',
    city: 'القاهرة الجديدة',
    state: 'القاهرة',
    zip: '11835',
    country: 'EG',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'فرع الإسكندرية',
    parent_id: 1,
    currency: 'EGP',
    timezone: 'Africa/Cairo',
    tax_id: '100-200-300',
    commercial_registry: '45678-1',
    phone: '+2034567890',
    email: 'alex@mizan.local',
    website: null,
    street: 'طريق الجيش، لوران',
    city: 'الإسكندرية',
    state: 'الإسكندرية',
    zip: '21500',
    country: 'EG',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockPartners: Partner[] = [
  {
    id: 1,
    company_id: 1,
    parent_id: null,
    name: 'شركة الأهرام للتوزيع والخدمات',
    sub_type: 'customer',
    is_company: 1,
    email: 'contact@ahram-dist.eg',
    phone: '+20223456789',
    mobile: '+201012345678',
    tax_id: '123-456-789',
    commercial_registry: '98765',
    street: 'شارع الجلاء',
    city: 'القاهرة',
    state: 'القاهرة',
    country: 'EG',
    credit_limit_cents: 10000000, // 100,000.00 EGP
    notes: 'عميل رئيسي للمشاريع التجارية',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    company_id: 1,
    parent_id: null,
    name: 'مؤسسة الدلتا لتوريدات الحاسب',
    sub_type: 'vendor',
    is_company: 1,
    email: 'sales@delta-supplies.eg',
    phone: '+20227654321',
    mobile: '+201223456789',
    tax_id: '987-654-321',
    commercial_registry: '54321',
    street: 'شارع مكرم عبيد',
    city: 'مدينة نصر',
    state: 'القاهرة',
    country: 'EG',
    credit_limit_cents: 0,
    notes: 'مورد معتمد للأجهزة والمعدات الشبكية',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockCategories: ProductCategory[] = [
  { id: 1, company_id: 1, name: 'الكل / All', parent_id: null, complete_name: 'الكل', created_at: '' },
  { id: 2, company_id: 1, name: 'أجهزة حاسب ومعدات', parent_id: 1, complete_name: 'الكل / أجهزة حاسب ومعدات', created_at: '' },
  { id: 3, company_id: 1, name: 'مستلزمات وشبكات', parent_id: 1, complete_name: 'الكل / مستلزمات وشبكات', created_at: '' },
];

let mockUoms: Uom[] = [
  { id: 1, category_id: 1, name: 'قطعة / Unit', uom_type: 'reference', ratio: 1.0, rounding: 1.0, is_active: 1, created_at: '' },
  { id: 2, category_id: 1, name: 'كرتونة (12 قطعة)', uom_type: 'bigger', ratio: 12.0, rounding: 1.0, is_active: 1, created_at: '' },
  { id: 3, category_id: 2, name: 'كيلوجرام / kg', uom_type: 'reference', ratio: 1.0, rounding: 0.001, is_active: 1, created_at: '' },
  { id: 4, category_id: 3, name: 'متر / Meter', uom_type: 'reference', ratio: 1.0, rounding: 0.01, is_active: 1, created_at: '' },
];

let mockProducts: Product[] = [
  {
    id: 1,
    company_id: 1,
    name: 'لابتوب ديل للأعمال Dell Latitude 5530',
    sku: 'PROD-DELL-5530',
    barcode: '622123456001',
    description: 'Core i7, 16GB RAM, 512GB SSD',
    type: 'storable',
    category_id: 2,
    uom_id: 1,
    purchase_uom_id: 1,
    sale_price_cents: 3500000,
    cost_price_cents: 2800000,
    tracking_mode: 'serial',
    min_stock_milli: 5000,
    max_stock_milli: 50000,
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    company_id: 1,
    name: 'شاشة سامسونج 27 بوصة IPS 75Hz',
    sku: 'PROD-SAM-27',
    barcode: '622123456002',
    description: 'Samsung Full HD IPS Monitor',
    type: 'storable',
    category_id: 2,
    uom_id: 1,
    purchase_uom_id: 1,
    sale_price_cents: 620000,
    cost_price_cents: 480000,
    tracking_mode: 'lot',
    min_stock_milli: 10000,
    max_stock_milli: 100000,
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockLocations: StockLocation[] = [
  { id: 1, company_id: 1, name: 'المواقع الافتراضية', parent_id: null, complete_name: 'المواقع الافتراضية', location_type: 'view', is_active: 1, created_at: '' },
  { id: 4, company_id: 1, name: 'المستودع الرئيسي (WH)', parent_id: 1, complete_name: 'المواقع الافتراضية / المستودع الرئيسي (WH)', location_type: 'view', is_active: 1, created_at: '' },
  { id: 5, company_id: 1, name: 'المخزن الرئيسي / Stock', parent_id: 4, complete_name: 'المواقع الافتراضية / المستودع الرئيسي (WH) / المخزن الرئيسي (Stock)', location_type: 'internal', is_active: 1, created_at: '' },
  { id: 6, company_id: 1, name: 'منطقة الاستلام / Input', parent_id: 4, complete_name: 'المواقع الافتراضية / المستودع الرئيسي (WH) / منطقة الاستلام (Input)', location_type: 'internal', is_active: 1, created_at: '' },
  { id: 8, company_id: 1, name: 'الموردون / Vendors', parent_id: null, complete_name: 'الموردون', location_type: 'supplier', is_active: 1, created_at: '' },
  { id: 9, company_id: 1, name: 'العملاء / Customers', parent_id: null, complete_name: 'العملاء', location_type: 'customer', is_active: 1, created_at: '' },
  { id: 10, company_id: 1, name: 'فروقات وتلفيات الجرد / Loss', parent_id: null, complete_name: 'فروقات وتلفيات الجرد', location_type: 'inventory_loss', is_active: 1, created_at: '' },
];

let mockStockQuantities: StockQuantityDetail[] = [
  {
    id: 1,
    company_id: 1,
    product_id: 1,
    product_name: 'لابتوب ديل للأعمال Dell Latitude 5530',
    sku: 'PROD-DELL-5530',
    location_id: 5,
    location_name: 'المخزن الرئيسي / Stock',
    location_type: 'internal',
    lot_serial_number: 'SN-DELL-001',
    quantity_milli: 15000,
    uom_name: 'قطعة / Unit',
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    company_id: 1,
    product_id: 2,
    product_name: 'شاشة سامسونج 27 بوصة IPS 75Hz',
    sku: 'PROD-SAM-27',
    location_id: 5,
    location_name: 'المخزن الرئيسي / Stock',
    location_type: 'internal',
    lot_serial_number: 'LOT-2026-A',
    quantity_milli: 40000,
    uom_name: 'قطعة / Unit',
    updated_at: new Date().toISOString(),
  },
];

let mockPickings: StockPicking[] = [
  {
    id: 1,
    company_id: 1,
    name: 'WH/IN/00001',
    picking_type_id: 1,
    partner_id: 2,
    src_location_id: 8,
    dest_location_id: 5,
    scheduled_date: '2026-08-18',
    date_done: null,
    origin: 'PO-2026-001',
    state: 'draft',
    note: 'شحنة أجهزة حاسب جديدة',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockAdjustments: StockInventoryAdjustment[] = [
  {
    id: 1,
    company_id: 1,
    name: 'جرد مستودع القاهرة - الربع الأول',
    location_id: 5,
    state: 'in_progress',
    accounting_date: '2026-08-17',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockSaleOrders: SaleOrder[] = [
  {
    id: 1,
    company_id: 1,
    name: 'SO/2026/00001',
    partner_id: 2,
    partner_name: 'شركة الأهرام للتجارة',
    date_order: new Date().toISOString(),
    validity_date: '2026-09-30',
    state: 'draft',
    currency: 'EGP',
    amount_untaxed_cents: 7000000,
    amount_tax_cents: 980000,
    amount_total_cents: 7980000,
    delivery_status: 'no',
    invoice_status: 'no',
    picking_id: null,
    note: 'عرض أسعار لتوريد أجهزة حاسوب مكتبية مع ضمان محلي معتمد',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockSaleOrderLines: SaleOrderLine[] = [
  {
    id: 1,
    order_id: 1,
    product_id: 1,
    product_name: 'لابتوب ديل للأعمال Dell Latitude 5530',
    product_sku: 'PROD-DELL-5530',
    name: 'لابتوب ديل للأعمال Dell Latitude 5530 - Core i7 16GB',
    product_uom_qty_milli: 2000,
    product_uom_id: 1,
    uom_name: 'قطعة / Unit',
    price_unit_cents: 3500000,
    discount_percent_milli: 0,
    tax_rate_milli: 14000,
    price_subtotal_cents: 7000000,
    price_total_cents: 7980000,
    qty_delivered_milli: 0,
    qty_invoiced_milli: 0,
    sequence: 10,
    created_at: new Date().toISOString(),
  },
];

let mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 1,
    company_id: 1,
    name: 'PO/2026/00001',
    partner_id: 3,
    partner_name: 'مؤسسة الأمل للتوريدات',
    date_order: new Date().toISOString(),
    date_planned: '2026-09-15',
    state: 'draft',
    currency: 'EGP',
    amount_untaxed_cents: 14000000,
    amount_tax_cents: 1960000,
    amount_total_cents: 15960000,
    receipt_status: 'no',
    invoice_status: 'no',
    picking_id: null,
    origin: 'PR/2026/001',
    note: 'طلب شراء أجهزة حاسوب من المورد مؤسسة الأمل',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockPurchaseOrderLines: PurchaseOrderLine[] = [
  {
    id: 1,
    order_id: 1,
    product_id: 1,
    product_name: 'لابتوب ديل للأعمال Dell Latitude 5530',
    product_sku: 'PROD-DELL-5530',
    name: 'لابتوب ديل للأعمال Dell Latitude 5530 - Core i7 16GB',
    product_uom_qty_milli: 5000,
    product_uom_id: 1,
    uom_name: 'قطعة / Unit',
    price_unit_cents: 2800000,
    discount_percent_milli: 0,
    tax_rate_milli: 14000,
    price_subtotal_cents: 14000000,
    price_total_cents: 15960000,
    qty_received_milli: 0,
    qty_billed_milli: 0,
    sequence: 10,
    created_at: new Date().toISOString(),
  },
];

let mockAccounts: Account[] = [
  { id: 1, company_id: 1, code: '1010', name: 'الخزينة الرئيسية (النقدية)', type: 'asset', is_reconciled: 0, is_active: 1, created_at: new Date().toISOString() },
  { id: 2, company_id: 1, code: '1020', name: 'البنك الأهلي المصري (حساب جاري)', type: 'asset', is_reconciled: 0, is_active: 1, created_at: new Date().toISOString() },
  { id: 3, company_id: 1, code: '1030', name: 'العملاء والمدينون (حسابات القبض)', type: 'asset', is_reconciled: 1, is_active: 1, created_at: new Date().toISOString() },
  { id: 4, company_id: 1, code: '1040', name: 'مخزون البضائع والمنتجات', type: 'asset', is_reconciled: 0, is_active: 1, created_at: new Date().toISOString() },
  { id: 5, company_id: 1, code: '2010', name: 'الموردون والدائنون (حسابات الدفع)', type: 'liability', is_reconciled: 1, is_active: 1, created_at: new Date().toISOString() },
  { id: 6, company_id: 1, code: '2020', name: 'ضريبة القيمة المضافة المحصلة (مبيعات 14%)', type: 'liability', is_reconciled: 0, is_active: 1, created_at: new Date().toISOString() },
  { id: 7, company_id: 1, code: '2025', name: 'ضريبة القيمة المضافة المدفوعة (مشتريات 14%)', type: 'liability', is_reconciled: 0, is_active: 1, created_at: new Date().toISOString() },
  { id: 8, company_id: 1, code: '3010', name: 'رأس المال المدفوع', type: 'equity', is_reconciled: 0, is_active: 1, created_at: new Date().toISOString() },
  { id: 9, company_id: 1, code: '3020', name: 'الأرباح والخسائر المبقاة', type: 'equity', is_reconciled: 0, is_active: 1, created_at: new Date().toISOString() },
  { id: 10, company_id: 1, code: '4010', name: 'إيرادات المبيعات والخدمات', type: 'income', is_reconciled: 0, is_active: 1, created_at: new Date().toISOString() },
  { id: 11, company_id: 1, code: '5010', name: 'تكلفة البضاعة المباعة (COGS)', type: 'expense', is_reconciled: 0, is_active: 1, created_at: new Date().toISOString() },
  { id: 12, company_id: 1, code: '5020', name: 'مصروفات عمومية وإدارية', type: 'expense', is_reconciled: 0, is_active: 1, created_at: new Date().toISOString() },
];

let mockJournals: AccountJournal[] = [
  { id: 1, company_id: 1, name: 'دفتر فواتير المبيعات', code: 'INV', type: 'sale', default_account_id: 10, created_at: new Date().toISOString() },
  { id: 2, company_id: 1, name: 'دفتر فواتير المشتريات', code: 'BILL', type: 'purchase', default_account_id: 11, created_at: new Date().toISOString() },
  { id: 3, company_id: 1, name: 'دفتر الخزينة والنقدية', code: 'CSH', type: 'cash', default_account_id: 1, created_at: new Date().toISOString() },
  { id: 4, company_id: 1, name: 'دفتر البنك والمعاملات المصرفية', code: 'BNK', type: 'bank', default_account_id: 2, created_at: new Date().toISOString() },
  { id: 5, company_id: 1, name: 'دفتر العمليات المتنوعة والقيود', code: 'MISC', type: 'general', default_account_id: null, created_at: new Date().toISOString() },
];

let mockMoves: AccountMove[] = [
  {
    id: 1,
    company_id: 1,
    name: 'INV/2026/00001',
    date: new Date().toISOString().split('T')[0],
    journal_id: 1,
    journal_name: 'دفتر فواتير المبيعات',
    partner_id: 2,
    partner_name: 'شركة الأهرام للتجارة',
    move_type: 'out_invoice',
    state: 'posted',
    amount_untaxed_cents: 7000000,
    amount_tax_cents: 980000,
    amount_total_cents: 7980000,
    currency: 'EGP',
    invoice_date_due: '2026-09-30',
    payment_state: 'not_paid',
    origin: 'SO/2026/00001',
    note: 'فاتورة مبيعات توريد حواسب مكتبية',
    reversed_entry_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockMoveLines: AccountMoveLine[] = [
  {
    id: 1,
    move_id: 1,
    account_id: 3,
    account_code: '1030',
    account_name: 'العملاء والمدينون (حسابات القبض)',
    partner_id: 2,
    name: 'العميل: شركة الأهرام للتجارة',
    debit_cents: 7980000,
    credit_cents: 0,
    balance_cents: 7980000,
    product_id: null,
    product_name: null,
    quantity_milli: null,
    price_unit_cents: null,
    discount_percent_milli: 0,
    tax_rate_milli: 0,
    sequence: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    move_id: 1,
    account_id: 10,
    account_code: '4010',
    account_name: 'إيرادات المبيعات والخدمات',
    partner_id: 2,
    name: 'لابتوب ديل للأعمال Dell Latitude 5530',
    debit_cents: 0,
    credit_cents: 7000000,
    balance_cents: -7000000,
    product_id: 1,
    product_name: 'لابتوب ديل للأعمال Dell Latitude 5530',
    quantity_milli: 2000,
    price_unit_cents: 3500000,
    discount_percent_milli: 0,
    tax_rate_milli: 14000,
    sequence: 20,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    move_id: 1,
    account_id: 6,
    account_code: '2020',
    account_name: 'ضريبة القيمة المضافة المحصلة (مبيعات 14%)',
    partner_id: 2,
    name: 'ضريبة القيمة المضافة 14% (Egyptian VAT)',
    debit_cents: 0,
    credit_cents: 980000,
    balance_cents: -980000,
    product_id: null,
    product_name: null,
    quantity_milli: null,
    price_unit_cents: null,
    discount_percent_milli: 0,
    tax_rate_milli: 0,
    sequence: 30,
    created_at: new Date().toISOString(),
  },
];

let mockPayments: AccountPayment[] = [];

let mockDepartments: Department[] = [
  { id: 1, company_id: 1, name: 'الإدارة العامة والمكتب التنفيذي', parent_id: null, manager_id: null, created_at: new Date().toISOString() },
  { id: 2, company_id: 1, name: 'إدارة تكنولوجيا المعلومات والهندسة', parent_id: 1, manager_id: 1, created_at: new Date().toISOString() },
  { id: 3, company_id: 1, name: 'إدارة المبيعات والتسويق', parent_id: 1, manager_id: 2, created_at: new Date().toISOString() },
  { id: 4, company_id: 1, name: 'إدارة الحسابات والمالية', parent_id: 1, manager_id: 3, created_at: new Date().toISOString() },
];

let mockJobs: JobPosition[] = [
  { id: 1, company_id: 1, name: 'كبير مهندسي البرمجيات (Lead Engineer)', department_id: 2, department_name: 'إدارة تكنولوجيا المعلومات والهندسة', expected_employees: 2, created_at: new Date().toISOString() },
  { id: 2, company_id: 1, name: 'مدير مبيعات أول (Senior Sales Exec)', department_id: 3, department_name: 'إدارة المبيعات والتسويق', expected_employees: 3, created_at: new Date().toISOString() },
  { id: 3, company_id: 1, name: 'محاسب مالي أول (Senior Accountant)', department_id: 4, department_name: 'إدارة الحسابات والمالية', expected_employees: 2, created_at: new Date().toISOString() },
];

let mockEmployees: Employee[] = [
  {
    id: 1,
    company_id: 1,
    partner_id: null,
    name: 'أحمد محمود القاضي',
    work_email: 'ahmed.kadi@mizan.local',
    work_phone: '+201011122233',
    department_id: 2,
    department_name: 'إدارة تكنولوجيا المعلومات والهندسة',
    job_id: 1,
    job_name: 'كبير مهندسي البرمجيات (Lead Engineer)',
    manager_id: null,
    manager_name: null,
    hire_date: '2025-01-01',
    national_id: '29001011234567',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    company_id: 1,
    partner_id: null,
    name: 'سارة إبراهيم حسن',
    work_email: 'sara.hassan@mizan.local',
    work_phone: '+201022233344',
    department_id: 3,
    department_name: 'إدارة المبيعات والتسويق',
    job_id: 2,
    job_name: 'مدير مبيعات أول (Senior Sales Exec)',
    manager_id: 1,
    manager_name: 'أحمد محمود القاضي',
    hire_date: '2025-03-15',
    national_id: '29205151234568',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    company_id: 1,
    partner_id: null,
    name: 'محمد طارق عبد الله',
    work_email: 'm.tarek@mizan.local',
    work_phone: '+201033344455',
    department_id: 4,
    department_name: 'إدارة الحسابات والمالية',
    job_id: 3,
    job_name: 'محاسب مالي أول (Senior Accountant)',
    manager_id: 1,
    manager_name: 'أحمد محمود القاضي',
    hire_date: '2025-06-01',
    national_id: '29408201234569',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockContracts: Contract[] = [
  {
    id: 1,
    company_id: 1,
    employee_id: 1,
    employee_name: 'أحمد محمود القاضي',
    name: 'CON/2026/00001',
    wage_cents: 3500000,
    date_start: '2025-01-01',
    date_end: null,
    state: 'open',
    working_hours_per_week: 40,
    notes: 'عقد عمل بدوام كامل - راتب شهري 35,000 ج.م',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    company_id: 1,
    employee_id: 2,
    employee_name: 'سارة إبراهيم حسن',
    name: 'CON/2026/00002',
    wage_cents: 2500000,
    date_start: '2025-03-15',
    date_end: null,
    state: 'open',
    working_hours_per_week: 40,
    notes: 'عقد عمل بدوام كامل - راتب شهري 25,000 ج.م + عمولة',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    company_id: 1,
    employee_id: 3,
    employee_name: 'محمد طارق عبد الله',
    name: 'CON/2026/00003',
    wage_cents: 2000000,
    date_start: '2025-06-01',
    date_end: null,
    state: 'open',
    working_hours_per_week: 40,
    notes: 'عقد عمل بدوام كامل - راتب شهري 20,000 ج.م',
    created_at: new Date().toISOString(),
  },
];

let mockLeaves: LeaveRequest[] = [
  {
    id: 1,
    company_id: 1,
    employee_id: 1,
    employee_name: 'أحمد محمود القاضي',
    leave_type: 'annual',
    date_from: '2026-09-01',
    date_to: '2026-09-05',
    duration_days_milli: 5000,
    state: 'validate',
    reason: 'إجازة سنوية اعتيادية',
    approved_by_id: 1,
    created_at: new Date().toISOString(),
  },
];

let mockAttendances: AttendanceRecord[] = [
  {
    id: 1,
    company_id: 1,
    employee_id: 1,
    employee_name: 'أحمد محمود القاضي',
    date: new Date().toISOString().split('T')[0],
    check_in: `${new Date().toISOString().split('T')[0]} 09:00:00`,
    check_out: `${new Date().toISOString().split('T')[0]} 17:00:00`,
    worked_hours_milli: 8000,
    status: 'present',
    notes: 'حضور مكتمل 8 ساعات',
    created_at: new Date().toISOString(),
  },
];

let mockActivities: ActivityLog[] = [
  {
    id: 1,
    company_id: 1,
    entity_type: 'system',
    entity_id: 0,
    user_id: 1,
    action: 'initialized',
    summary: 'System initialized with Egyptian localization and SQLite WAL mode.',
    details_json: null,
    created_at: new Date().toISOString(),
  },
];

const mockSettings: Record<string, string> = {
  default_currency: 'EGP',
  default_timezone: 'Africa/Cairo',
  vat_rate: '14',
  company_tax_id: '100-200-300',
};

let isTauriEnv = false;
try {
  isTauriEnv = !!(window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ || !!(window as unknown as { __TAURI__?: unknown }).__TAURI__;
} catch {
  isTauriEnv = false;
}

async function invokeTauri<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauriEnv) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<T>(cmd, args);
    } catch (e) {
      console.warn(`Tauri invoke failed for ${cmd}, falling back to mock:`, e);
    }
  }

  // In-Memory browser/test fallback
  switch (cmd) {
    case 'cmd_get_modules':
    case 'get_modules':
      return [...mockModules] as unknown as T;
    case 'cmd_toggle_module':
    case 'toggle_module': {
      const key = args?.key as string;
      const active = args?.active as boolean;
      mockModules = mockModules.map((m) => (m.key === key ? { ...m, is_active: active } : m));
      return undefined as unknown as T;
    }
    case 'cmd_login_user':
    case 'login_user': {
      const { username, password } = (args?.input as { username?: string; password?: string }) || {};
      if (username === 'admin' && (password === 'admin123' || password === 'admin')) {
        return {
          id: 1,
          company_id: 1,
          username: 'admin',
          email: 'admin@mizan.local',
          full_name: 'مدير النظام',
          roles: [{ id: 1, name: 'Admin', description: 'Super Administrator', created_at: new Date().toISOString() }],
          permissions: [
            'core.companies.view', 'core.companies.manage',
            'core.users.view', 'core.users.manage', 'core.rbac.manage',
            'core.settings.view', 'core.settings.manage', 'core.modules.manage',
            'contacts.view', 'contacts.create', 'contacts.edit', 'contacts.delete',
            'products.view', 'products.manage',
            'inventory.view', 'inventory.manage', 'inventory.adjust',
          ],
        } as unknown as T;
      }
      return null as unknown as T;
    }
    case 'cmd_list_companies':
    case 'list_companies':
      return [...mockCompanies] as unknown as T;
    case 'cmd_create_company':
    case 'create_company': {
      const newComp: Company = {
        id: mockCompanies.length + 1,
        ...(args?.input as Partial<Company>),
        is_active: 1,
        currency: 'EGP',
        timezone: 'Africa/Cairo',
        country: 'EG',
        name: (args?.input as { name?: string })?.name || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockCompanies.push(newComp);
      return newComp as unknown as T;
    }
    case 'cmd_list_partners':
    case 'list_partners': {
      const filter = args?.filter as { sub_type?: string; search?: string } | undefined;
      let result = [...mockPartners];
      if (filter?.sub_type && filter.sub_type !== 'all') {
        result = result.filter((p) => p.sub_type === filter.sub_type);
      }
      if (filter?.search) {
        const s = filter.search.toLowerCase();
        result = result.filter((p) => p.name.toLowerCase().includes(s) || (p.phone && p.phone.includes(s)));
      }
      return result as unknown as T;
    }
    case 'cmd_create_partner':
    case 'create_partner': {
      const input = args?.input as CreatePartnerInput;
      const newPartner: Partner = {
        id: mockPartners.length + 1,
        company_id: input.company_id,
        parent_id: input.parent_id,
        name: input.name,
        sub_type: input.sub_type,
        is_company: input.is_company ? 1 : 0,
        email: input.email,
        phone: input.phone,
        mobile: input.mobile,
        tax_id: input.tax_id,
        commercial_registry: input.commercial_registry,
        street: input.street,
        city: input.city,
        state: input.state,
        country: input.country || 'EG',
        credit_limit_cents: input.credit_limit_cents || 0,
        notes: input.notes,
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockPartners.unshift(newPartner);
      return newPartner as unknown as T;
    }
    case 'cmd_get_settings':
    case 'get_settings':
      return { ...mockSettings } as unknown as T;
    case 'cmd_set_setting':
    case 'set_setting': {
      const { key, value } = (args?.input as { key?: string; value?: string }) || {};
      if (key && value) mockSettings[key] = value;
      return undefined as unknown as T;
    }
    case 'cmd_get_recent_activities':
    case 'get_recent_activities':
      return [...mockActivities] as unknown as T;
    case 'cmd_list_roles':
    case 'list_roles':
      return [
        { id: 1, name: 'Admin', description: 'مدير النظام', permissions: ['all'] },
        { id: 2, name: 'Manager', description: 'مدير عمليات', permissions: ['contacts.view', 'products.view', 'inventory.view'] },
        { id: 3, name: 'Staff', description: 'موظف', permissions: ['contacts.view', 'products.view'] },
      ] as unknown as T;
    case 'cmd_list_users':
    case 'list_users':
      return [
        { id: 1, company_id: 1, username: 'admin', email: 'admin@mizan.local', full_name: 'مدير النظام', is_active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ] as unknown as T;

    // Phase 2: Catalog Mocks
    case 'cmd_list_uoms':
    case 'list_uoms':
      return [...mockUoms] as unknown as T;
    case 'cmd_list_product_categories':
    case 'list_product_categories':
      return [...mockCategories] as unknown as T;
    case 'cmd_create_product_category':
    case 'create_product_category': {
      const { name, parent_id, company_id } = args as { name: string; parent_id?: number | null; company_id: number };
      const newCat: ProductCategory = {
        id: mockCategories.length + 1,
        company_id,
        name,
        parent_id: parent_id || null,
        complete_name: name,
        created_at: new Date().toISOString(),
      };
      mockCategories.push(newCat);
      return newCat as unknown as T;
    }
    case 'cmd_list_products':
    case 'list_products': {
      const filter = args?.filter as { category_id?: number; search?: string } | undefined;
      let result = mockProducts.map((p) => {
        const cat = mockCategories.find((c) => c.id === p.category_id);
        const uom = mockUoms.find((u) => u.id === p.uom_id);
        const qOnHand = mockStockQuantities
          .filter((q) => q.product_id === p.id)
          .reduce((sum, q) => sum + q.quantity_milli, 0);
        return {
          product: p,
          category_name: cat?.name || null,
          uom_name: uom?.name || 'قطعة',
          qty_on_hand_milli: qOnHand,
        };
      });
      if (filter?.category_id) {
        result = result.filter((p) => p.product.category_id === filter.category_id);
      }
      if (filter?.search) {
        const s = filter.search.toLowerCase();
        result = result.filter((p) => p.product.name.toLowerCase().includes(s) || p.product.sku.toLowerCase().includes(s));
      }
      return result as unknown as T;
    }
    case 'cmd_create_product':
    case 'create_product': {
      const input = args?.input as CreateProductInput;
      const newProd: Product = {
        id: mockProducts.length + 1,
        company_id: input.company_id,
        name: input.name,
        sku: input.sku,
        barcode: input.barcode,
        description: input.description,
        type: input.type || 'storable',
        category_id: input.category_id,
        uom_id: input.uom_id,
        purchase_uom_id: input.purchase_uom_id || input.uom_id,
        sale_price_cents: input.sale_price_cents || 0,
        cost_price_cents: input.cost_price_cents || 0,
        tracking_mode: input.tracking_mode || 'none',
        min_stock_milli: input.min_stock_milli || 0,
        max_stock_milli: input.max_stock_milli || 0,
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockProducts.unshift(newProd);
      return newProd as unknown as T;
    }

    // Phase 2: Inventory Mocks
    case 'cmd_list_locations':
    case 'list_locations':
      return [...mockLocations] as unknown as T;
    case 'cmd_create_location':
    case 'create_location': {
      const input = args?.input as CreateLocationInput;
      const newLoc: StockLocation = {
        id: mockLocations.length + 1,
        company_id: input.company_id,
        name: input.name,
        parent_id: input.parent_id,
        complete_name: input.name,
        location_type: input.location_type as StockLocation['location_type'],
        is_active: 1,
        created_at: new Date().toISOString(),
      };
      mockLocations.push(newLoc);
      return newLoc as unknown as T;
    }
    case 'cmd_list_warehouses':
    case 'list_warehouses':
      return [
        {
          id: 1,
          company_id: 1,
          name: 'المستودع الرئيسي - القاهرة',
          code: 'WH',
          view_location_id: 4,
          lot_stock_location_id: 5,
          is_active: 1,
          created_at: '',
        },
      ] as unknown as T;
    case 'cmd_list_picking_types':
    case 'list_picking_types':
      return [
        {
          id: 1,
          company_id: 1,
          warehouse_id: 1,
          name: 'إيصالات الاستلام / Receipts',
          code: 'incoming' as const,
          sequence_prefix: 'WH/IN/',
          next_number: 2,
          default_src_location_id: 8,
          default_dest_location_id: 5,
          created_at: '',
        },
        {
          id: 2,
          company_id: 1,
          warehouse_id: 1,
          name: 'أوامر التوصيل / Delivery Orders',
          code: 'outgoing' as const,
          sequence_prefix: 'WH/OUT/',
          next_number: 1,
          default_src_location_id: 5,
          default_dest_location_id: 9,
          created_at: '',
        },
        {
          id: 3,
          company_id: 1,
          warehouse_id: 1,
          name: 'التحويلات الداخلية / Internal',
          code: 'internal' as const,
          sequence_prefix: 'WH/INT/',
          next_number: 1,
          default_src_location_id: 5,
          default_dest_location_id: 6,
          created_at: '',
        },
      ] as unknown as T;
    case 'cmd_list_stock_quantities':
    case 'list_stock_quantities':
      return [...mockStockQuantities] as unknown as T;
    case 'cmd_list_pickings':
    case 'list_pickings': {
      const s = args?.state_filter as string | undefined;
      let res = [...mockPickings];
      if (s && s !== 'all') res = res.filter((p) => p.state === s);
      return res as unknown as T;
    }
    case 'cmd_get_picking':
    case 'get_picking': {
      const id = args?.id as number;
      return (mockPickings.find((p) => p.id === id) || null) as unknown as T;
    }
    case 'cmd_get_picking_moves':
    case 'get_picking_moves':
      return [] as unknown as T;
    case 'cmd_create_picking':
    case 'create_picking': {
      const input = args?.input as CreatePickingInput;
      const newPick: StockPicking = {
        id: mockPickings.length + 1,
        company_id: input.company_id,
        name: `WH/IN/${String(mockPickings.length + 1).padStart(5, '0')}`,
        picking_type_id: input.picking_type_id,
        partner_id: input.partner_id,
        src_location_id: input.src_location_id || 8,
        dest_location_id: input.dest_location_id || 5,
        scheduled_date: input.scheduled_date,
        date_done: null,
        origin: input.origin,
        state: 'draft',
        note: input.note,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockPickings.unshift(newPick);
      return newPick as unknown as T;
    }
    case 'cmd_confirm_picking':
    case 'confirm_picking': {
      const id = args?.id as number;
      mockPickings = mockPickings.map((p) => (p.id === id ? { ...p, state: 'done' as const, date_done: new Date().toISOString() } : p));
      const p = mockPickings.find((x) => x.id === id)!;
      return p as unknown as T;
    }
    case 'cmd_cancel_picking':
    case 'cancel_picking': {
      const id = args?.id as number;
      mockPickings = mockPickings.map((p) => (p.id === id ? { ...p, state: 'cancelled' as const } : p));
      const p = mockPickings.find((x) => x.id === id)!;
      return p as unknown as T;
    }
    case 'cmd_list_inventory_adjustments':
    case 'list_inventory_adjustments':
      return [...mockAdjustments] as unknown as T;
    case 'cmd_get_adjustment_lines':
    case 'get_adjustment_lines':
      return [
        {
          id: 1,
          adjustment_id: 1,
          product_id: 1,
          product_name: 'لابتوب ديل للأعمال Dell Latitude 5530',
          sku: 'PROD-DELL-5530',
          lot_serial_number: 'SN-DELL-001',
          theoretical_qty_milli: 15000,
          counted_qty_milli: 15000,
          difference_qty_milli: 0,
          uom_name: 'قطعة / Unit',
        },
        {
          id: 2,
          adjustment_id: 1,
          product_id: 2,
          product_name: 'شاشة سامسونج 27 بوصة IPS 75Hz',
          sku: 'PROD-SAM-27',
          lot_serial_number: 'LOT-2026-A',
          theoretical_qty_milli: 40000,
          counted_qty_milli: 38000,
          difference_qty_milli: -2000,
          uom_name: 'قطعة / Unit',
        },
      ] as unknown as T;
    case 'cmd_create_inventory_adjustment':
    case 'create_inventory_adjustment': {
      const input = args?.input as { company_id: number; name: string; location_id: number };
      const newAdj: StockInventoryAdjustment = {
        id: mockAdjustments.length + 1,
        company_id: input.company_id,
        name: input.name,
        location_id: input.location_id,
        state: 'in_progress',
        accounting_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockAdjustments.unshift(newAdj);
      return newAdj as unknown as T;
    }
    case 'cmd_update_adjustment_line_count':
    case 'update_adjustment_line_count':
      return undefined as unknown as T;
    case 'cmd_validate_inventory_adjustment':
    case 'validate_inventory_adjustment': {
      const id = args?.adjustment_id as number;
      mockAdjustments = mockAdjustments.map((a) => (a.id === id ? { ...a, state: 'done' as const } : a));
      return mockAdjustments.find((a) => a.id === id) as unknown as T;
    }

    // Phase 3: Sales Mocks
    case 'cmd_list_sale_orders':
    case 'list_sale_orders': {
      const sf = args?.state_filter as string | undefined;
      const pid = args?.partner_id as number | undefined;
      let res = [...mockSaleOrders];
      if (sf && sf !== 'all') res = res.filter((o) => o.state === sf);
      if (pid) res = res.filter((o) => o.partner_id === pid);
      return res as unknown as T;
    }
    case 'cmd_get_sale_order':
    case 'get_sale_order': {
      const oid = args?.order_id as number;
      const order = mockSaleOrders.find((o) => o.id === oid);
      if (!order) return null as unknown as T;
      const lines = mockSaleOrderLines.filter((l) => l.order_id === oid);
      return { order, lines } as unknown as T;
    }
    case 'cmd_create_sale_order':
    case 'create_sale_order': {
      const input = args?.input as CreateSaleOrderInput;
      const newId = mockSaleOrders.length + 1;
      const partner = mockPartners.find((p) => p.id === input.partner_id);

      let untaxed = 0;
      let tax = 0;
      let total = 0;

      const lines: SaleOrderLine[] = input.lines.map((l, idx) => {
        const prod = mockProducts.find((p) => p.id === l.product_id);
        const base = (l.product_uom_qty_milli * l.price_unit_cents) / 1000;
        const disc = (base * (l.discount_percent_milli || 0)) / 100000;
        const sub = base - disc;
        const tVal = (sub * (l.tax_rate_milli || 14000)) / 100000;
        const tLine = sub + tVal;

        untaxed += sub;
        tax += tVal;
        total += tLine;

        return {
          id: mockSaleOrderLines.length + idx + 1,
          order_id: newId,
          product_id: l.product_id,
          product_name: prod?.name || `Product #${l.product_id}`,
          product_sku: prod?.sku || 'SKU',
          name: l.name || prod?.name || '',
          product_uom_qty_milli: l.product_uom_qty_milli,
          product_uom_id: l.product_uom_id,
          uom_name: 'قطعة',
          price_unit_cents: l.price_unit_cents,
          discount_percent_milli: l.discount_percent_milli || 0,
          tax_rate_milli: l.tax_rate_milli || 14000,
          price_subtotal_cents: sub,
          price_total_cents: tLine,
          qty_delivered_milli: 0,
          qty_invoiced_milli: 0,
          sequence: (idx + 1) * 10,
          created_at: new Date().toISOString(),
        };
      });

      const newOrder: SaleOrder = {
        id: newId,
        company_id: input.company_id,
        name: `SO/2026/${String(newId).padStart(5, '0')}`,
        partner_id: input.partner_id,
        partner_name: partner?.name || null,
        date_order: new Date().toISOString(),
        validity_date: input.validity_date || null,
        state: 'draft',
        currency: input.currency || 'EGP',
        amount_untaxed_cents: untaxed,
        amount_tax_cents: tax,
        amount_total_cents: total,
        delivery_status: 'no',
        invoice_status: 'no',
        picking_id: null,
        note: input.note || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSaleOrders.unshift(newOrder);
      mockSaleOrderLines.push(...lines);

      return { order: newOrder, lines } as unknown as T;
    }
    case 'cmd_update_sale_order':
    case 'update_sale_order': {
      const input = args?.input as UpdateSaleOrderInput;
      const order = mockSaleOrders.find((o) => o.id === input.id);
      if (!order) throw new Error('Order not found');

      mockSaleOrderLines = mockSaleOrderLines.filter((l) => l.order_id !== input.id);

      let untaxed = 0;
      let tax = 0;
      let total = 0;

      const lines: SaleOrderLine[] = input.lines.map((l, idx) => {
        const prod = mockProducts.find((p) => p.id === l.product_id);
        const base = (l.product_uom_qty_milli * l.price_unit_cents) / 1000;
        const disc = (base * (l.discount_percent_milli || 0)) / 100000;
        const sub = base - disc;
        const tVal = (sub * (l.tax_rate_milli || 14000)) / 100000;
        const tLine = sub + tVal;

        untaxed += sub;
        tax += tVal;
        total += tLine;

        return {
          id: mockSaleOrderLines.length + idx + 1,
          order_id: input.id,
          product_id: l.product_id,
          product_name: prod?.name || `Product #${l.product_id}`,
          product_sku: prod?.sku || 'SKU',
          name: l.name || prod?.name || '',
          product_uom_qty_milli: l.product_uom_qty_milli,
          product_uom_id: l.product_uom_id,
          uom_name: 'قطعة',
          price_unit_cents: l.price_unit_cents,
          discount_percent_milli: l.discount_percent_milli || 0,
          tax_rate_milli: l.tax_rate_milli || 14000,
          price_subtotal_cents: sub,
          price_total_cents: tLine,
          qty_delivered_milli: 0,
          qty_invoiced_milli: 0,
          sequence: (idx + 1) * 10,
          created_at: new Date().toISOString(),
        };
      });

      mockSaleOrderLines.push(...lines);
      order.partner_id = input.partner_id;
      order.validity_date = input.validity_date || null;
      order.note = input.note || null;
      order.amount_untaxed_cents = untaxed;
      order.amount_tax_cents = tax;
      order.amount_total_cents = total;

      return { order, lines } as unknown as T;
    }
    case 'cmd_confirm_sale_order':
    case 'confirm_sale_order': {
      const oid = args?.order_id as number;
      const order = mockSaleOrders.find((o) => o.id === oid);
      if (!order) throw new Error('Order not found');

      order.state = 'sale';
      order.delivery_status = 'to_deliver';
      order.invoice_status = 'to_invoice';
      order.picking_id = 99;

      const lines = mockSaleOrderLines.filter((l) => l.order_id === oid);
      return { order, lines } as unknown as T;
    }
    case 'cmd_cancel_sale_order':
    case 'cancel_sale_order': {
      const oid = args?.order_id as number;
      const order = mockSaleOrders.find((o) => o.id === oid);
      if (!order) throw new Error('Order not found');

      order.state = 'cancelled';
      order.delivery_status = 'cancelled';
      order.invoice_status = 'cancelled';

      const lines = mockSaleOrderLines.filter((l) => l.order_id === oid);
      return { order, lines } as unknown as T;
    }
    case 'cmd_delete_sale_order':
    case 'delete_sale_order': {
      const oid = args?.order_id as number;
      mockSaleOrders = mockSaleOrders.filter((o) => o.id !== oid);
      mockSaleOrderLines = mockSaleOrderLines.filter((l) => l.order_id !== oid);
      return undefined as unknown as T;
    }

    // Phase 4: Purchases Mocks
    case 'cmd_list_purchase_orders':
    case 'list_purchase_orders': {
      const sf = args?.state_filter as string | undefined;
      const pid = args?.partner_id as number | undefined;
      let res = [...mockPurchaseOrders];
      if (sf && sf !== 'all') res = res.filter((o) => o.state === sf);
      if (pid) res = res.filter((o) => o.partner_id === pid);
      return res as unknown as T;
    }
    case 'cmd_get_purchase_order':
    case 'get_purchase_order': {
      const oid = args?.order_id as number;
      const order = mockPurchaseOrders.find((o) => o.id === oid);
      if (!order) return null as unknown as T;
      const lines = mockPurchaseOrderLines.filter((l) => l.order_id === oid);
      return { order, lines } as unknown as T;
    }
    case 'cmd_create_purchase_order':
    case 'create_purchase_order': {
      const input = args?.input as CreatePurchaseOrderInput;
      const newId = mockPurchaseOrders.length + 1;
      const partner = mockPartners.find((p) => p.id === input.partner_id);

      let untaxed = 0;
      let tax = 0;
      let total = 0;

      const lines: PurchaseOrderLine[] = input.lines.map((l, idx) => {
        const prod = mockProducts.find((p) => p.id === l.product_id);
        const base = (l.product_uom_qty_milli * l.price_unit_cents) / 1000;
        const disc = (base * (l.discount_percent_milli || 0)) / 100000;
        const sub = base - disc;
        const tVal = (sub * (l.tax_rate_milli || 14000)) / 100000;
        const tLine = sub + tVal;

        untaxed += sub;
        tax += tVal;
        total += tLine;

        return {
          id: mockPurchaseOrderLines.length + idx + 1,
          order_id: newId,
          product_id: l.product_id,
          product_name: prod?.name || `Product #${l.product_id}`,
          product_sku: prod?.sku || 'SKU',
          name: l.name || prod?.name || '',
          product_uom_qty_milli: l.product_uom_qty_milli,
          product_uom_id: l.product_uom_id,
          uom_name: 'قطعة',
          price_unit_cents: l.price_unit_cents,
          discount_percent_milli: l.discount_percent_milli || 0,
          tax_rate_milli: l.tax_rate_milli || 14000,
          price_subtotal_cents: sub,
          price_total_cents: tLine,
          qty_received_milli: 0,
          qty_billed_milli: 0,
          sequence: (idx + 1) * 10,
          created_at: new Date().toISOString(),
        };
      });

      const newOrder: PurchaseOrder = {
        id: newId,
        company_id: input.company_id,
        name: `PO/2026/${String(newId).padStart(5, '0')}`,
        partner_id: input.partner_id,
        partner_name: partner?.name || null,
        date_order: new Date().toISOString(),
        date_planned: input.date_planned || null,
        state: 'draft',
        currency: input.currency || 'EGP',
        amount_untaxed_cents: untaxed,
        amount_tax_cents: tax,
        amount_total_cents: total,
        receipt_status: 'no',
        invoice_status: 'no',
        picking_id: null,
        origin: input.origin || null,
        note: input.note || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockPurchaseOrders.unshift(newOrder);
      mockPurchaseOrderLines.push(...lines);

      return { order: newOrder, lines } as unknown as T;
    }
    case 'cmd_update_purchase_order':
    case 'update_purchase_order': {
      const input = args?.input as UpdatePurchaseOrderInput;
      const order = mockPurchaseOrders.find((o) => o.id === input.id);
      if (!order) throw new Error('Order not found');

      mockPurchaseOrderLines = mockPurchaseOrderLines.filter((l) => l.order_id !== input.id);

      let untaxed = 0;
      let tax = 0;
      let total = 0;

      const lines: PurchaseOrderLine[] = input.lines.map((l, idx) => {
        const prod = mockProducts.find((p) => p.id === l.product_id);
        const base = (l.product_uom_qty_milli * l.price_unit_cents) / 1000;
        const disc = (base * (l.discount_percent_milli || 0)) / 100000;
        const sub = base - disc;
        const tVal = (sub * (l.tax_rate_milli || 14000)) / 100000;
        const tLine = sub + tVal;

        untaxed += sub;
        tax += tVal;
        total += tLine;

        return {
          id: mockPurchaseOrderLines.length + idx + 1,
          order_id: input.id,
          product_id: l.product_id,
          product_name: prod?.name || `Product #${l.product_id}`,
          product_sku: prod?.sku || 'SKU',
          name: l.name || prod?.name || '',
          product_uom_qty_milli: l.product_uom_qty_milli,
          product_uom_id: l.product_uom_id,
          uom_name: 'قطعة',
          price_unit_cents: l.price_unit_cents,
          discount_percent_milli: l.discount_percent_milli || 0,
          tax_rate_milli: l.tax_rate_milli || 14000,
          price_subtotal_cents: sub,
          price_total_cents: tLine,
          qty_received_milli: 0,
          qty_billed_milli: 0,
          sequence: (idx + 1) * 10,
          created_at: new Date().toISOString(),
        };
      });

      mockPurchaseOrderLines.push(...lines);
      order.partner_id = input.partner_id;
      order.date_planned = input.date_planned || null;
      order.origin = input.origin || null;
      order.note = input.note || null;
      order.amount_untaxed_cents = untaxed;
      order.amount_tax_cents = tax;
      order.amount_total_cents = total;

      return { order, lines } as unknown as T;
    }
    case 'cmd_confirm_purchase_order':
    case 'confirm_purchase_order': {
      const oid = args?.order_id as number;
      const order = mockPurchaseOrders.find((o) => o.id === oid);
      if (!order) throw new Error('Order not found');

      order.state = 'purchase';
      order.receipt_status = 'to_receive';
      order.invoice_status = 'to_bill';
      order.picking_id = 98;

      const lines = mockPurchaseOrderLines.filter((l) => l.order_id === oid);
      return { order, lines } as unknown as T;
    }
    case 'cmd_cancel_purchase_order':
    case 'cancel_purchase_order': {
      const oid = args?.order_id as number;
      const order = mockPurchaseOrders.find((o) => o.id === oid);
      if (!order) throw new Error('Order not found');

      order.state = 'cancelled';
      order.receipt_status = 'cancelled';
      order.invoice_status = 'cancelled';

      const lines = mockPurchaseOrderLines.filter((l) => l.order_id === oid);
      return { order, lines } as unknown as T;
    }
    case 'cmd_delete_purchase_order':
    case 'delete_purchase_order': {
      const oid = args?.order_id as number;
      mockPurchaseOrders = mockPurchaseOrders.filter((o) => o.id !== oid);
      mockPurchaseOrderLines = mockPurchaseOrderLines.filter((l) => l.order_id !== oid);
      return undefined as unknown as T;
    }

    // Phase 5: Accounting, Invoices & Payments Mocks
    case 'cmd_list_accounts':
    case 'list_accounts': {
      return [...mockAccounts] as unknown as T;
    }
    case 'cmd_create_account':
    case 'create_account': {
      const input = args?.input as CreateAccountInput;
      const newAcc: Account = {
        id: mockAccounts.length + 1,
        company_id: input.company_id,
        code: input.code,
        name: input.name,
        type: input.type,
        is_reconciled: input.is_reconciled || 0,
        is_active: 1,
        created_at: new Date().toISOString(),
      };
      mockAccounts.push(newAcc);
      return newAcc as unknown as T;
    }
    case 'cmd_list_journals':
    case 'list_journals': {
      return [...mockJournals] as unknown as T;
    }
    case 'cmd_list_moves':
    case 'list_moves': {
      const mt = args?.move_type as string | undefined;
      const sf = args?.state_filter as string | undefined;
      const pid = args?.partner_id as number | undefined;
      let res = [...mockMoves];
      if (mt && mt !== 'all') res = res.filter((m) => m.move_type === mt);
      if (sf && sf !== 'all') res = res.filter((m) => m.state === sf);
      if (pid) res = res.filter((m) => m.partner_id === pid);
      return res as unknown as T;
    }
    case 'cmd_get_move':
    case 'get_move': {
      const mid = args?.move_id as number;
      const move = mockMoves.find((m) => m.id === mid);
      if (!move) return null as unknown as T;
      const lines = mockMoveLines.filter((l) => l.move_id === mid);
      return { move, lines } as unknown as T;
    }
    case 'cmd_create_invoice':
    case 'create_invoice': {
      const input = args?.input as CreateInvoiceInput;
      const newId = mockMoves.length + 1;
      const isOut = input.move_type === 'out_invoice';
      const partner = mockPartners.find((p) => p.id === input.partner_id);

      let untaxed = 0;
      let tax = 0;

      const lines: AccountMoveLine[] = [];
      const arApAcc = isOut ? mockAccounts.find((a) => a.code === '1030') : mockAccounts.find((a) => a.code === '2010');
      const vatAcc = isOut ? mockAccounts.find((a) => a.code === '2020') : mockAccounts.find((a) => a.code === '2025');

      input.lines.forEach((l, idx) => {
        const prod = mockProducts.find((p) => p.id === l.product_id);
        const base = (l.quantity_milli * l.price_unit_cents) / 1000;
        const disc = (base * (l.discount_percent_milli || 0)) / 100000;
        const sub = base - disc;
        const tVal = (sub * (l.tax_rate_milli || 14000)) / 100000;

        untaxed += sub;
        tax += tVal;

        const revExpAcc = isOut ? mockAccounts.find((a) => a.code === '4010') : mockAccounts.find((a) => a.code === '5010');

        lines.push({
          id: mockMoveLines.length + idx + 2,
          move_id: newId,
          account_id: revExpAcc?.id || 10,
          account_code: revExpAcc?.code || '4010',
          account_name: revExpAcc?.name || 'إيرادات المبيعات',
          partner_id: input.partner_id,
          name: l.name || prod?.name || '',
          debit_cents: isOut ? 0 : sub,
          credit_cents: isOut ? sub : 0,
          balance_cents: isOut ? -sub : sub,
          product_id: l.product_id || null,
          product_name: prod?.name || null,
          quantity_milli: l.quantity_milli,
          price_unit_cents: l.price_unit_cents,
          discount_percent_milli: l.discount_percent_milli || 0,
          tax_rate_milli: l.tax_rate_milli || 14000,
          sequence: (idx + 2) * 10,
          created_at: new Date().toISOString(),
        });
      });

      const total = untaxed + tax;

      // Header AR/AP line
      lines.unshift({
        id: mockMoveLines.length + 1,
        move_id: newId,
        account_id: arApAcc?.id || 3,
        account_code: arApAcc?.code || '1030',
        account_name: arApAcc?.name || 'العملاء والمدينون',
        partner_id: input.partner_id,
        name: `${isOut ? 'العميل' : 'المورد'}: ${partner?.name || ''}`,
        debit_cents: isOut ? total : 0,
        credit_cents: isOut ? 0 : total,
        balance_cents: isOut ? total : -total,
        product_id: null,
        product_name: null,
        quantity_milli: null,
        price_unit_cents: null,
        discount_percent_milli: 0,
        tax_rate_milli: 0,
        sequence: 10,
        created_at: new Date().toISOString(),
      });

      // Tax line
      if (tax > 0) {
        lines.push({
          id: mockMoveLines.length + input.lines.length + 2,
          move_id: newId,
          account_id: vatAcc?.id || 6,
          account_code: vatAcc?.code || '2020',
          account_name: vatAcc?.name || 'ضريبة القيمة المضافة 14%',
          partner_id: input.partner_id,
          name: 'ضريبة القيمة المضافة 14% (Egyptian VAT)',
          debit_cents: isOut ? 0 : tax,
          credit_cents: isOut ? tax : 0,
          balance_cents: isOut ? -tax : tax,
          product_id: null,
          product_name: null,
          quantity_milli: null,
          price_unit_cents: null,
          discount_percent_milli: 0,
          tax_rate_milli: 0,
          sequence: (input.lines.length + 2) * 10,
          created_at: new Date().toISOString(),
        });
      }

      const prefix = isOut ? 'INV' : 'BILL';
      const newMove: AccountMove = {
        id: newId,
        company_id: input.company_id,
        name: `${prefix}/2026/${String(newId).padStart(5, '0')}`,
        date: input.date || new Date().toISOString().split('T')[0],
        journal_id: isOut ? 1 : 2,
        journal_name: isOut ? 'دفتر فواتير المبيعات' : 'دفتر فواتير المشتريات',
        partner_id: input.partner_id,
        partner_name: partner?.name || null,
        move_type: input.move_type,
        state: 'draft',
        amount_untaxed_cents: untaxed,
        amount_tax_cents: tax,
        amount_total_cents: total,
        currency: input.currency || 'EGP',
        invoice_date_due: input.invoice_date_due || null,
        payment_state: 'not_paid',
        origin: input.origin || null,
        note: input.note || null,
        reversed_entry_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockMoves.unshift(newMove);
      mockMoveLines.push(...lines);

      return { move: newMove, lines } as unknown as T;
    }
    case 'cmd_create_journal_entry':
    case 'create_journal_entry': {
      const input = args?.input as CreateJournalEntryInput;
      const newId = mockMoves.length + 1;
      const journal = mockJournals.find((j) => j.id === input.journal_id);

      let totDebit = 0;
      let totCredit = 0;

      const lines: AccountMoveLine[] = input.lines.map((l, idx) => {
        totDebit += l.debit_cents;
        totCredit += l.credit_cents;
        const acc = mockAccounts.find((a) => a.id === l.account_id);

        return {
          id: mockMoveLines.length + idx + 1,
          move_id: newId,
          account_id: l.account_id,
          account_code: acc?.code || '',
          account_name: acc?.name || '',
          partner_id: l.partner_id || null,
          name: l.name,
          debit_cents: l.debit_cents,
          credit_cents: l.credit_cents,
          balance_cents: l.debit_cents - l.credit_cents,
          product_id: null,
          product_name: null,
          quantity_milli: null,
          price_unit_cents: null,
          discount_percent_milli: 0,
          tax_rate_milli: 0,
          sequence: (idx + 1) * 10,
          created_at: new Date().toISOString(),
        };
      });

      const total = Math.max(totDebit, totCredit);

      const newMove: AccountMove = {
        id: newId,
        company_id: input.company_id,
        name: `MISC/2026/${String(newId).padStart(5, '0')}`,
        date: input.date || new Date().toISOString().split('T')[0],
        journal_id: input.journal_id,
        journal_name: journal?.name || 'دفتر العمليات المتنوعة',
        partner_id: null,
        partner_name: null,
        move_type: 'entry',
        state: 'draft',
        amount_untaxed_cents: total,
        amount_tax_cents: 0,
        amount_total_cents: total,
        currency: 'EGP',
        invoice_date_due: null,
        payment_state: 'not_paid',
        origin: input.origin || null,
        note: input.note || null,
        reversed_entry_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockMoves.unshift(newMove);
      mockMoveLines.push(...lines);

      return { move: newMove, lines } as unknown as T;
    }
    case 'cmd_post_move':
    case 'post_move': {
      const mid = args?.move_id as number;
      const move = mockMoves.find((m) => m.id === mid);
      if (!move) throw new Error('Move not found');

      const lines = mockMoveLines.filter((l) => l.move_id === mid);
      const totalDebit = lines.reduce((s, l) => s + l.debit_cents, 0);
      const totalCredit = lines.reduce((s, l) => s + l.credit_cents, 0);

      if (totalDebit !== totalCredit) {
        throw new Error(`Double-entry invariant violated: Total Debits (${totalDebit}) != Total Credits (${totalCredit})`);
      }

      move.state = 'posted';
      return { move, lines } as unknown as T;
    }
    case 'cmd_cancel_move':
    case 'cancel_move': {
      const mid = args?.move_id as number;
      const move = mockMoves.find((m) => m.id === mid);
      if (!move) throw new Error('Move not found');
      move.state = 'cancelled';
      const lines = mockMoveLines.filter((l) => l.move_id === mid);
      return { move, lines } as unknown as T;
    }
    case 'cmd_reverse_move':
    case 'reverse_move': {
      const mid = args?.move_id as number;
      const original = mockMoves.find((m) => m.id === mid);
      if (!original) throw new Error('Move not found');

      const origLines = mockMoveLines.filter((l) => l.move_id === mid);
      const newId = mockMoves.length + 1;

      const revLines: AccountMoveLine[] = origLines.map((l, idx) => ({
        ...l,
        id: mockMoveLines.length + idx + 1,
        move_id: newId,
        name: `Reversal: ${l.name}`,
        debit_cents: l.credit_cents,
        credit_cents: l.debit_cents,
        balance_cents: l.credit_cents - l.debit_cents,
      }));

      const revMove: AccountMove = {
        ...original,
        id: newId,
        name: `REV/2026/${original.name}`,
        state: 'posted',
        payment_state: 'reversed',
        origin: `Reversal of ${original.name}`,
        reversed_entry_id: original.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      original.payment_state = 'reversed';
      mockMoves.unshift(revMove);
      mockMoveLines.push(...revLines);

      return { move: revMove, lines: revLines } as unknown as T;
    }
    case 'cmd_list_payments':
    case 'list_payments': {
      const pid = args?.partner_id as number | undefined;
      let res = [...mockPayments];
      if (pid) res = res.filter((p) => p.partner_id === pid);
      return res as unknown as T;
    }
    case 'cmd_create_and_post_payment':
    case 'create_and_post_payment': {
      const input = args?.input as CreatePaymentInput;
      const newId = mockPayments.length + 1;
      const partner = mockPartners.find((p) => p.id === input.partner_id);
      const journal = mockJournals.find((j) => j.id === input.journal_id);

      const newPayment: AccountPayment = {
        id: newId,
        company_id: input.company_id,
        name: `PAY/2026/${String(newId).padStart(5, '0')}`,
        partner_id: input.partner_id,
        partner_name: partner?.name || null,
        payment_type: input.payment_type,
        amount_cents: input.amount_cents,
        date: input.date || new Date().toISOString().split('T')[0],
        journal_id: input.journal_id,
        journal_name: journal?.name || null,
        payment_method: (input.payment_method as any) || 'cash',
        state: 'posted',
        move_id: 999,
        invoice_id: input.invoice_id || null,
        note: input.note || null,
        created_at: new Date().toISOString(),
      };

      mockPayments.unshift(newPayment);

      if (input.invoice_id) {
        const inv = mockMoves.find((m) => m.id === input.invoice_id);
        if (inv) inv.payment_state = 'paid';
      }

      return newPayment as unknown as T;
    }
    case 'cmd_get_trial_balance':
    case 'get_trial_balance': {
      const tb: TrialBalanceRow[] = mockAccounts.map((acc) => {
        const postedMoves = new Set(mockMoves.filter((m) => m.state === 'posted').map((m) => m.id));
        const lines = mockMoveLines.filter((l) => l.account_id === acc.id && postedMoves.has(l.move_id));
        const debitSum = lines.reduce((s, l) => s + l.debit_cents, 0);
        const creditSum = lines.reduce((s, l) => s + l.credit_cents, 0);
        return {
          account_id: acc.id,
          account_code: acc.code,
          account_name: acc.name,
          account_type: acc.type,
          debit_sum_cents: debitSum,
          credit_sum_cents: creditSum,
          net_balance_cents: debitSum - creditSum,
        };
      });
      return tb as unknown as T;
    }

    // Phase 6: Human Resources (HR) Mocks
    case 'cmd_list_departments':
    case 'list_departments': {
      return [...mockDepartments] as unknown as T;
    }
    case 'cmd_create_department':
    case 'create_department': {
      const input = args?.input as CreateDepartmentInput;
      const newDept: Department = {
        id: mockDepartments.length + 1,
        company_id: input.company_id,
        name: input.name,
        parent_id: input.parent_id || null,
        manager_id: input.manager_id || null,
        created_at: new Date().toISOString(),
      };
      mockDepartments.push(newDept);
      return newDept as unknown as T;
    }
    case 'cmd_list_jobs':
    case 'list_jobs': {
      return [...mockJobs] as unknown as T;
    }
    case 'cmd_create_job':
    case 'create_job': {
      const input = args?.input as CreateJobInput;
      const dept = mockDepartments.find((d) => d.id === input.department_id);
      const newJob: JobPosition = {
        id: mockJobs.length + 1,
        company_id: input.company_id,
        name: input.name,
        department_id: input.department_id || null,
        department_name: dept?.name || null,
        expected_employees: input.expected_employees || 1,
        created_at: new Date().toISOString(),
      };
      mockJobs.push(newJob);
      return newJob as unknown as T;
    }
    case 'cmd_list_employees':
    case 'list_employees': {
      const did = args?.department_id as number | undefined;
      const sf = args?.status_filter as string | undefined;
      let res = [...mockEmployees];
      if (did) res = res.filter((e) => e.department_id === did);
      if (sf && sf !== 'all') res = res.filter((e) => e.status === sf);
      return res as unknown as T;
    }
    case 'cmd_get_employee':
    case 'get_employee': {
      const eid = args?.employee_id as number;
      const emp = mockEmployees.find((e) => e.id === eid) || null;
      return emp as unknown as T;
    }
    case 'cmd_create_employee':
    case 'create_employee': {
      const input = args?.input as CreateEmployeeInput;
      const dept = mockDepartments.find((d) => d.id === input.department_id);
      const job = mockJobs.find((j) => j.id === input.job_id);
      const mgr = mockEmployees.find((m) => m.id === input.manager_id);

      const newEmp: Employee = {
        id: mockEmployees.length + 1,
        company_id: input.company_id,
        partner_id: null,
        name: input.name,
        work_email: input.work_email || null,
        work_phone: input.work_phone || null,
        department_id: input.department_id || null,
        department_name: dept?.name || null,
        job_id: input.job_id || null,
        job_name: job?.name || null,
        manager_id: input.manager_id || null,
        manager_name: mgr?.name || null,
        hire_date: input.hire_date || new Date().toISOString().split('T')[0],
        national_id: input.national_id || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockEmployees.push(newEmp);
      return newEmp as unknown as T;
    }
    case 'cmd_update_employee':
    case 'update_employee': {
      const input = args?.input as UpdateEmployeeInput;
      const emp = mockEmployees.find((e) => e.id === input.id);
      if (!emp) throw new Error('Employee not found');

      const dept = mockDepartments.find((d) => d.id === input.department_id);
      const job = mockJobs.find((j) => j.id === input.job_id);
      const mgr = mockEmployees.find((m) => m.id === input.manager_id);

      emp.name = input.name;
      emp.work_email = input.work_email || null;
      emp.work_phone = input.work_phone || null;
      emp.department_id = input.department_id || null;
      emp.department_name = dept?.name || null;
      emp.job_id = input.job_id || null;
      emp.job_name = job?.name || null;
      emp.manager_id = input.manager_id || null;
      emp.manager_name = mgr?.name || null;
      if (input.hire_date) emp.hire_date = input.hire_date;
      emp.national_id = input.national_id || null;
      if (input.status) emp.status = input.status as any;
      emp.updated_at = new Date().toISOString();

      return emp as unknown as T;
    }
    case 'cmd_delete_employee':
    case 'delete_employee': {
      const eid = args?.employee_id as number;
      mockEmployees = mockEmployees.filter((e) => e.id !== eid);
      return undefined as unknown as T;
    }
    case 'cmd_list_contracts':
    case 'list_contracts': {
      const eid = args?.employee_id as number | undefined;
      let res = [...mockContracts];
      if (eid) res = res.filter((c) => c.employee_id === eid);
      return res as unknown as T;
    }
    case 'cmd_create_contract':
    case 'create_contract': {
      const input = args?.input as CreateContractInput;
      const emp = mockEmployees.find((e) => e.id === input.employee_id);
      const newId = mockContracts.length + 1;
      const newCon: Contract = {
        id: newId,
        company_id: input.company_id,
        employee_id: input.employee_id,
        employee_name: emp?.name || null,
        name: `CON/2026/${String(newId).padStart(5, '0')}`,
        wage_cents: input.wage_cents,
        date_start: input.date_start || new Date().toISOString().split('T')[0],
        date_end: input.date_end || null,
        state: 'open',
        working_hours_per_week: input.working_hours_per_week || 40,
        notes: input.notes || null,
        created_at: new Date().toISOString(),
      };
      mockContracts.push(newCon);
      return newCon as unknown as T;
    }
    case 'cmd_list_leaves':
    case 'list_leaves': {
      const eid = args?.employee_id as number | undefined;
      const sf = args?.state_filter as string | undefined;
      let res = [...mockLeaves];
      if (eid) res = res.filter((l) => l.employee_id === eid);
      if (sf && sf !== 'all') res = res.filter((l) => l.state === sf);
      return res as unknown as T;
    }
    case 'cmd_create_leave':
    case 'create_leave': {
      const input = args?.input as CreateLeaveInput;
      const emp = mockEmployees.find((e) => e.id === input.employee_id);
      const newLeave: LeaveRequest = {
        id: mockLeaves.length + 1,
        company_id: input.company_id,
        employee_id: input.employee_id,
        employee_name: emp?.name || null,
        leave_type: input.leave_type,
        date_from: input.date_from,
        date_to: input.date_to,
        duration_days_milli: input.duration_days_milli,
        state: 'confirm',
        reason: input.reason || null,
        approved_by_id: null,
        created_at: new Date().toISOString(),
      };
      mockLeaves.push(newLeave);
      return newLeave as unknown as T;
    }
    case 'cmd_validate_leave':
    case 'validate_leave': {
      const lid = args?.leave_id as number;
      const leave = mockLeaves.find((l) => l.id === lid);
      if (!leave) throw new Error('Leave not found');
      leave.state = 'validate';
      leave.approved_by_id = (args?.approved_by_id as number) || 1;
      return leave as unknown as T;
    }
    case 'cmd_refuse_leave':
    case 'refuse_leave': {
      const lid = args?.leave_id as number;
      const leave = mockLeaves.find((l) => l.id === lid);
      if (!leave) throw new Error('Leave not found');
      leave.state = 'refuse';
      return leave as unknown as T;
    }
    case 'cmd_list_attendances':
    case 'list_attendances': {
      const eid = args?.employee_id as number | undefined;
      const df = args?.date_filter as string | undefined;
      let res = [...mockAttendances];
      if (eid) res = res.filter((a) => a.employee_id === eid);
      if (df) res = res.filter((a) => a.date === df);
      return res as unknown as T;
    }
    case 'cmd_record_attendance':
    case 'record_attendance': {
      const input = args?.input as RecordAttendanceInput;
      const emp = mockEmployees.find((e) => e.id === input.employee_id);
      const newAtt: AttendanceRecord = {
        id: mockAttendances.length + 1,
        company_id: input.company_id,
        employee_id: input.employee_id,
        employee_name: emp?.name || null,
        date: input.date || new Date().toISOString().split('T')[0],
        check_in: input.check_in,
        check_out: input.check_out || null,
        worked_hours_milli: 8000,
        status: 'present',
        notes: input.notes || null,
        created_at: new Date().toISOString(),
      };
      mockAttendances.push(newAtt);
      return newAtt as unknown as T;
    }
    default:
      throw new Error(`Command ${cmd} not implemented in mock`);
  }
}

export const api = {
  // Core
  getModules: () => invokeTauri<ModuleRecord[]>('cmd_get_modules'),
  toggleModule: (key: string, active: boolean) => invokeTauri<void>('cmd_toggle_module', { key, active }),
  loginUser: (input: { username: string; password: string }) => invokeTauri<SessionUser | null>('cmd_login_user', { input }),
  login: (input: { username: string; password: string }) => invokeTauri<SessionUser | null>('cmd_login_user', { input }),
  listCompanies: () => invokeTauri<Company[]>('cmd_list_companies'),
  createCompany: (input: Partial<Company>) => invokeTauri<Company>('cmd_create_company', { input }),
  listUsers: (company_id?: number) => invokeTauri<User[]>('cmd_list_users', { company_id }),
  createUser: (input: { company_id: number; username: string; email?: string; password: string; full_name: string; role_ids: number[] }) =>
    invokeTauri<User>('cmd_create_user', { input }),
  listRoles: () => invokeTauri<RoleWithPermissions[]>('cmd_list_roles'),
  listPermissions: () => invokeTauri<Permission[]>('cmd_list_permissions'),
  listPartners: (filter: { company_id?: number; sub_type?: string; search?: string; is_active?: boolean }) =>
    invokeTauri<Partner[]>('cmd_list_partners', { filter }),
  createPartner: (input: CreatePartnerInput) => invokeTauri<Partner>('cmd_create_partner', { input }),
  updatePartner: (input: Partial<Partner> & { id: number }) => invokeTauri<Partner>('cmd_update_partner', { input }),
  deletePartner: (id: number) => invokeTauri<void>('cmd_delete_partner', { id }),
  getSettings: (company_id: number) => invokeTauri<Record<string, string>>('cmd_get_settings', { company_id }),
  setSetting: (input: { key: string; company_id: number; value: string }) => invokeTauri<void>('cmd_set_setting', { input }),
  getRecentActivities: (company_id: number, limit = 20) => invokeTauri<ActivityLog[]>('cmd_get_recent_activities', { company_id, limit }),
  getEntityActivities: (company_id: number, _entity_type?: string, _entity_id?: number) =>
    invokeTauri<ActivityLog[]>('cmd_get_recent_activities', { company_id, limit: 20 }),

  // Phase 2: Catalog
  listUoms: () => invokeTauri<Uom[]>('cmd_list_uoms'),
  listProductCategories: (company_id: number) => invokeTauri<ProductCategory[]>('cmd_list_product_categories', { company_id }),
  createProductCategory: (company_id: number, name: string, parent_id?: number | null) =>
    invokeTauri<ProductCategory>('cmd_create_product_category', { company_id, name, parent_id }),
  listProducts: (filter: { company_id?: number; category_id?: number; type?: string; tracking_mode?: string; is_active?: boolean; search?: string }) =>
    invokeTauri<ProductWithStock[]>('cmd_list_products', { filter }),
  getProduct: (id: number) => invokeTauri<Product | null>('cmd_get_product', { id }),
  createProduct: (input: CreateProductInput) => invokeTauri<Product>('cmd_create_product', { input }),
  updateProduct: (input: Partial<Product> & { id: number; company_id: number }) => invokeTauri<Product>('cmd_update_product', { input }),
  deleteProduct: (id: number) => invokeTauri<void>('cmd_delete_product', { id }),

  // Phase 2: Inventory & Stock
  listLocations: (company_id: number) => invokeTauri<StockLocation[]>('cmd_list_locations', { company_id }),
  createLocation: (input: CreateLocationInput) => invokeTauri<StockLocation>('cmd_create_location', { input }),
  listWarehouses: (company_id: number) => invokeTauri<StockWarehouse[]>('cmd_list_warehouses', { company_id }),
  listPickingTypes: (company_id: number) => invokeTauri<StockPickingType[]>('cmd_list_picking_types', { company_id }),
  listStockQuantities: (company_id: number, location_id?: number, product_id?: number) =>
    invokeTauri<StockQuantityDetail[]>('cmd_list_stock_quantities', { company_id, location_id, product_id }),
  listPickings: (company_id: number, state_filter?: string) => invokeTauri<StockPicking[]>('cmd_list_pickings', { company_id, state_filter }),
  getPicking: (id: number) => invokeTauri<StockPicking | null>('cmd_get_picking', { id }),
  getPickingMoves: (picking_id: number) => invokeTauri<StockMove[]>('cmd_get_picking_moves', { picking_id }),
  createPicking: (input: CreatePickingInput) => invokeTauri<StockPicking>('cmd_create_picking', { input }),
  confirmPicking: (id: number) => invokeTauri<StockPicking>('cmd_confirm_picking', { id }),
  cancelPicking: (id: number) => invokeTauri<StockPicking>('cmd_cancel_picking', { id }),
  listInventoryAdjustments: (company_id: number) => invokeTauri<StockInventoryAdjustment[]>('cmd_list_inventory_adjustments', { company_id }),
  getAdjustmentLines: (adjustment_id: number) => invokeTauri<StockInventoryAdjustmentLineDetail[]>('cmd_get_adjustment_lines', { adjustment_id }),
  createInventoryAdjustment: (input: { company_id: number; name: string; location_id: number }) =>
    invokeTauri<StockInventoryAdjustment>('cmd_create_inventory_adjustment', { input }),
  updateAdjustmentLineCount: (input: { line_id: number; counted_qty_milli: number }) =>
    invokeTauri<void>('cmd_update_adjustment_line_count', { input }),
  validateInventoryAdjustment: (adjustment_id: number) =>
    invokeTauri<StockInventoryAdjustment>('cmd_validate_inventory_adjustment', { adjustment_id }),

  // Phase 3: Sales
  listSaleOrders: (company_id: number, state_filter?: string, partner_id?: number) =>
    invokeTauri<SaleOrder[]>('cmd_list_sale_orders', { company_id, state_filter, partner_id }),
  getSaleOrder: (order_id: number) => invokeTauri<SaleOrderDetail | null>('cmd_get_sale_order', { order_id }),
  createSaleOrder: (input: CreateSaleOrderInput) => invokeTauri<SaleOrderDetail>('cmd_create_sale_order', { input }),
  updateSaleOrder: (input: UpdateSaleOrderInput) => invokeTauri<SaleOrderDetail>('cmd_update_sale_order', { input }),
  confirmSaleOrder: (order_id: number) => invokeTauri<SaleOrderDetail>('cmd_confirm_sale_order', { order_id }),
  cancelSaleOrder: (order_id: number) => invokeTauri<SaleOrderDetail>('cmd_cancel_sale_order', { order_id }),
  deleteSaleOrder: (order_id: number) => invokeTauri<void>('cmd_delete_sale_order', { order_id }),

  // Phase 4: Purchases
  listPurchaseOrders: (company_id: number, state_filter?: string, partner_id?: number) =>
    invokeTauri<PurchaseOrder[]>('cmd_list_purchase_orders', { company_id, state_filter, partner_id }),
  getPurchaseOrder: (order_id: number) => invokeTauri<PurchaseOrderDetail | null>('cmd_get_purchase_order', { order_id }),
  createPurchaseOrder: (input: CreatePurchaseOrderInput) => invokeTauri<PurchaseOrderDetail>('cmd_create_purchase_order', { input }),
  updatePurchaseOrder: (input: UpdatePurchaseOrderInput) => invokeTauri<PurchaseOrderDetail>('cmd_update_purchase_order', { input }),
  confirmPurchaseOrder: (order_id: number) => invokeTauri<PurchaseOrderDetail>('cmd_confirm_purchase_order', { order_id }),
  cancelPurchaseOrder: (order_id: number) => invokeTauri<PurchaseOrderDetail>('cmd_cancel_purchase_order', { order_id }),
  deletePurchaseOrder: (order_id: number) => invokeTauri<void>('cmd_delete_purchase_order', { order_id }),

  // Phase 5: Accounting, Invoices & Payments
  listAccounts: (company_id: number) => invokeTauri<Account[]>('cmd_list_accounts', { company_id }),
  createAccount: (input: CreateAccountInput) => invokeTauri<Account>('cmd_create_account', { input }),
  listJournals: (company_id: number) => invokeTauri<AccountJournal[]>('cmd_list_journals', { company_id }),
  listMoves: (company_id: number, move_type?: string, state_filter?: string, partner_id?: number) =>
    invokeTauri<AccountMove[]>('cmd_list_moves', { company_id, move_type, state_filter, partner_id }),
  getMove: (move_id: number) => invokeTauri<AccountMoveDetail | null>('cmd_get_move', { move_id }),
  createInvoice: (input: CreateInvoiceInput) => invokeTauri<AccountMoveDetail>('cmd_create_invoice', { input }),
  createJournalEntry: (input: CreateJournalEntryInput) => invokeTauri<AccountMoveDetail>('cmd_create_journal_entry', { input }),
  postMove: (move_id: number) => invokeTauri<AccountMoveDetail>('cmd_post_move', { move_id }),
  cancelMove: (move_id: number) => invokeTauri<AccountMoveDetail>('cmd_cancel_move', { move_id }),
  reverseMove: (move_id: number) => invokeTauri<AccountMoveDetail>('cmd_reverse_move', { move_id }),
  listPayments: (company_id: number, partner_id?: number) => invokeTauri<AccountPayment[]>('cmd_list_payments', { company_id, partner_id }),
  createAndPostPayment: (input: CreatePaymentInput) => invokeTauri<AccountPayment>('cmd_create_and_post_payment', { input }),
  getTrialBalance: (company_id: number) => invokeTauri<TrialBalanceRow[]>('cmd_get_trial_balance', { company_id }),

  // Phase 6: Human Resources (HR)
  listDepartments: (company_id: number) => invokeTauri<Department[]>('cmd_list_departments', { company_id }),
  createDepartment: (input: CreateDepartmentInput) => invokeTauri<Department>('cmd_create_department', { input }),
  listJobs: (company_id: number) => invokeTauri<JobPosition[]>('cmd_list_jobs', { company_id }),
  createJob: (input: CreateJobInput) => invokeTauri<JobPosition>('cmd_create_job', { input }),
  listEmployees: (company_id: number, department_id?: number, status_filter?: string) =>
    invokeTauri<Employee[]>('cmd_list_employees', { company_id, department_id, status_filter }),
  getEmployee: (employee_id: number) => invokeTauri<Employee | null>('cmd_get_employee', { employee_id }),
  createEmployee: (input: CreateEmployeeInput) => invokeTauri<Employee>('cmd_create_employee', { input }),
  updateEmployee: (input: UpdateEmployeeInput) => invokeTauri<Employee>('cmd_update_employee', { input }),
  deleteEmployee: (employee_id: number) => invokeTauri<void>('cmd_delete_employee', { employee_id }),
  listContracts: (company_id: number, employee_id?: number) =>
    invokeTauri<Contract[]>('cmd_list_contracts', { company_id, employee_id }),
  createContract: (input: CreateContractInput) => invokeTauri<Contract>('cmd_create_contract', { input }),
  listLeaves: (company_id: number, employee_id?: number, state_filter?: string) =>
    invokeTauri<LeaveRequest[]>('cmd_list_leaves', { company_id, employee_id, state_filter }),
  createLeave: (input: CreateLeaveInput) => invokeTauri<LeaveRequest>('cmd_create_leave', { input }),
  validateLeave: (leave_id: number, approved_by_id: number) =>
    invokeTauri<LeaveRequest>('cmd_validate_leave', { leave_id, approved_by_id }),
  refuseLeave: (leave_id: number) => invokeTauri<LeaveRequest>('cmd_refuse_leave', { leave_id }),
  listAttendances: (company_id: number, employee_id?: number, date_filter?: string) =>
    invokeTauri<AttendanceRecord[]>('cmd_list_attendances', { company_id, employee_id, date_filter }),
  recordAttendance: (input: RecordAttendanceInput) =>
    invokeTauri<AttendanceRecord>('cmd_record_attendance', { input }),
};
