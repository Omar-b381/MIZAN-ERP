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
};
