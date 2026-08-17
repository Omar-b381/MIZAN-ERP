import {
  ModuleRecord,
  Company,
  User,
  RoleWithPermissions,
  Permission,
  Partner,
  PartnerSubType,
  CreatePartnerInput,
  ActivityLog,
  SessionUser,
} from '../types';

let isTauriEnv = false;
try {
  isTauriEnv = !!(window as any).__TAURI_INTERNALS__ || !!(window as any).__TAURI__;
} catch {
  isTauriEnv = false;
}

// Fallback in-memory state for Vitest and browser demo
let mockModules: ModuleRecord[] = [
  { key: 'core', name: 'النواة الأساسية (Core)', category: 'core', is_active: true, requires: [], description: 'إدارة الشركات، الفروع، المستخدمين، والصلاحيات' },
  { key: 'products', name: 'المنتجات والكتالوج', category: 'operations', is_active: false, requires: ['core'], description: 'كتالوج المنتجات، وحدات القياس، والتصنيفات' },
  { key: 'inventory', name: 'المخزون والمستودعات', category: 'operations', is_active: false, requires: ['products'], description: 'المستودعات، حركات المخزون، وسندات الإدخال والإخراج' },
  { key: 'sales', name: 'المبيعات والعقود', category: 'operations', is_active: false, requires: ['products'], description: 'عروض الأسعار، أوامر البيع، والعملاء' },
  { key: 'purchases', name: 'المشتريات والموردين', category: 'operations', is_active: false, requires: ['products'], description: 'طلبات الشراء، أوامر الشراء، والموردين' },
  { key: 'accounting', name: 'الحسابات العامة', category: 'finance', is_active: false, requires: ['core'], description: 'دليل الحسابات، قيود اليومية، وميزان المراجعة' },
  { key: 'invoices', name: 'الفواتير والتحصيل', category: 'finance', is_active: false, requires: ['accounting'], description: 'فواتير المبيعات، فواتير المشتريات، وإشعارات الخصم والإضافة' },
  { key: 'payments', name: 'المدفوعات والمقبوضات', category: 'finance', is_active: false, requires: ['invoices'], description: 'سندات القبض والصرف، وحسابات البنوك والخزينة' },
  { key: 'employees', name: 'شؤون الموظفين', category: 'hr', is_active: false, requires: ['core'], description: 'سجلات الموظفين، الهيكل الوظيفي، والرواتب' },
  { key: 'recruitment', name: 'التوظيف', category: 'hr', is_active: false, requires: ['employees'], description: 'طلبات التوظيف، مقابلات العمل، وقوائم المرشحين' },
  { key: 'timeoff', name: 'الإجازات', category: 'hr', is_active: false, requires: ['employees'], description: 'أرصدة الإجازات، طلبات الإجازات، والموافقات' },
  { key: 'timesheet', name: 'سجلات الحضور', category: 'hr', is_active: false, requires: ['employees'], description: 'تسجيل ساعات العمل، والورديات' },
];

let mockCompanies: Company[] = [
  {
    id: 1,
    name: 'شركة ميزان الرئيسية',
    parent_id: null,
    currency: 'EGP',
    timezone: 'Africa/Cairo',
    tax_id: '100-200-300',
    commercial_registry: '45892',
    phone: '01000000000',
    email: 'info@mizan-erp.local',
    website: 'https://mizan.local',
    street: 'شارع التسعين',
    city: 'القاهرة',
    state: 'القاهرة',
    zip: '11835',
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
    name: 'شركة الأمل للتوريدات',
    sub_type: 'vendor',
    is_company: 1,
    email: 'sales@alamal.com',
    phone: '01122334455',
    mobile: '01011122233',
    tax_id: '555-444-333',
    commercial_registry: '887799',
    street: 'المنطقة الصناعية',
    city: 'الجيزة',
    state: 'الجيزة',
    country: 'EG',
    credit_limit_cents: 10000000,
    notes: 'مورد مواد خام أساسي',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    company_id: 1,
    parent_id: null,
    name: 'مؤسسة النور للتجزئة',
    sub_type: 'customer',
    is_company: 1,
    email: 'info@alnoor.com',
    phone: '01234567890',
    mobile: '01222233344',
    tax_id: '111-222-333',
    commercial_registry: '112233',
    street: 'شارع المعز',
    city: 'القاهرة',
    state: 'القاهرة',
    country: 'EG',
    credit_limit_cents: 5000000,
    notes: 'عميل رئيسي في قطاع التجزئة',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    company_id: 1,
    parent_id: null,
    name: 'أحمد محمود (مندوب مشتريات)',
    sub_type: 'contact',
    is_company: 0,
    email: 'ahmed@alnoor.com',
    phone: '01011223344',
    mobile: '01011223344',
    tax_id: null,
    commercial_registry: null,
    street: 'وسط البلد',
    city: 'القاهرة',
    state: 'القاهرة',
    country: 'EG',
    credit_limit_cents: 0,
    notes: 'جهة اتصال فرعية لمؤسسة النور',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockActivities: ActivityLog[] = [
  {
    id: 1,
    company_id: 1,
    entity_type: 'module',
    entity_id: 0,
    user_id: 1,
    action: 'activated',
    summary: "System initialized with Core architecture",
    details_json: null,
    created_at: new Date().toISOString(),
  },
];

let mockSettings: Record<string, string> = {
  currency: 'EGP',
  timezone: 'Africa/Cairo',
  tax_rate_default: '14',
  company_name: 'شركة ميزان للتجارة والتوزيع',
  allow_negative_stock: '0',
};

async function invokeTauri<T>(cmd: string, args?: Record<string, any>): Promise<T> {
  if (isTauriEnv) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<T>(cmd, args);
    } catch {
      // Fallback
    }
  }

  // In-Memory browser/test fallback
  switch (cmd) {
    case 'cmd_get_modules':
    case 'get_modules':
      return [...mockModules] as unknown as T;
    case 'cmd_toggle_module':
    case 'toggle_module': {
      const key = args?.key;
      const active = args?.active;
      mockModules = mockModules.map((m) => (m.key === key ? { ...m, is_active: active } : m));
      mockActivities.unshift({
        id: Date.now(),
        company_id: 1,
        entity_type: 'module',
        entity_id: 0,
        user_id: 1,
        action: active ? 'activated' : 'deactivated',
        summary: `Module '${key}' was ${active ? 'activated' : 'deactivated'}`,
        details_json: null,
        created_at: new Date().toISOString(),
      });
      return undefined as unknown as T;
    }
    case 'cmd_login_user':
    case 'login_user': {
      const { username, password } = args?.input || {};
      if (username === 'admin' && (password === 'admin123' || password === 'admin')) {
        return {
          id: 1,
          company_id: 1,
          username: 'admin',
          email: 'admin@mizan.local',
          full_name: 'مدير النظام',
          roles: [{ id: 1, name: 'Admin', description: 'Super Administrator', created_at: new Date().toISOString() }],
          permissions: [
            'core.companies.view',
            'core.companies.manage',
            'core.users.view',
            'core.users.manage',
            'core.rbac.manage',
            'core.settings.view',
            'core.settings.manage',
            'core.modules.manage',
            'contacts.view',
            'contacts.create',
            'contacts.edit',
            'contacts.delete',
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
        ...args?.input,
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockCompanies.push(newComp);
      return newComp as unknown as T;
    }
    case 'cmd_list_partners':
    case 'list_partners': {
      const filter = args?.filter;
      let result = [...mockPartners];
      if (filter?.sub_type && filter.sub_type !== 'all') {
        result = result.filter((p) => p.sub_type === filter.sub_type);
      }
      if (filter?.search) {
        const s = filter.search.toLowerCase();
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(s) ||
            (p.phone && p.phone.includes(s)) ||
            (p.tax_id && p.tax_id.includes(s))
        );
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
      mockActivities.unshift({
        id: Date.now(),
        company_id: input.company_id,
        entity_type: 'partner',
        entity_id: newPartner.id,
        user_id: 1,
        action: 'created',
        summary: `Contact '${newPartner.name}' created`,
        details_json: null,
        created_at: new Date().toISOString(),
      });
      return newPartner as unknown as T;
    }
    case 'cmd_update_partner':
    case 'update_partner': {
      const input = args?.input;
      mockPartners = mockPartners.map((p) =>
        p.id === input.id ? { ...p, ...input, is_company: input.is_company ? 1 : 0 } : p
      );
      const updated = mockPartners.find((p) => p.id === input.id)!;
      return updated as unknown as T;
    }
    case 'cmd_delete_partner':
    case 'delete_partner': {
      const id = args?.id;
      mockPartners = mockPartners.map((p) => (p.id === id ? { ...p, is_active: 0 } : p));
      return undefined as unknown as T;
    }
    case 'cmd_get_settings':
    case 'get_settings':
      return { ...mockSettings } as unknown as T;
    case 'cmd_set_setting':
    case 'set_setting': {
      const { key, value } = args?.input || {};
      mockSettings[key] = value;
      return undefined as unknown as T;
    }
    case 'cmd_get_recent_activities':
    case 'get_recent_activities':
      return [...mockActivities] as unknown as T;
    case 'cmd_get_entity_activities':
    case 'get_entity_activities': {
      const { entity_type, entity_id } = args || {};
      return mockActivities.filter(
        (a) => a.entity_type === entity_type && a.entity_id === entity_id
      ) as unknown as T;
    }
    case 'cmd_list_roles':
    case 'list_roles':
      return [
        { id: 1, name: 'Admin', description: 'مدير النظام', permissions: ['all'] },
        { id: 2, name: 'Manager', description: 'مدير عمليات', permissions: ['contacts.view', 'contacts.create'] },
        { id: 3, name: 'Staff', description: 'موظف', permissions: ['contacts.view'] },
      ] as unknown as T;
    case 'cmd_list_users':
    case 'list_users':
      return [
        { id: 1, company_id: 1, username: 'admin', email: 'admin@mizan.local', full_name: 'مدير النظام', is_active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ] as unknown as T;
    default:
      throw new Error(`Command ${cmd} not implemented in mock`);
  }
}

export const api = {
  // Modules
  getModules: () => invokeTauri<ModuleRecord[]>('cmd_get_modules'),
  toggleModule: (key: string, active: boolean) =>
    invokeTauri<void>('cmd_toggle_module', { key, active }),

  // Auth
  login: (input: { username: string; password: string }) =>
    invokeTauri<SessionUser | null>('cmd_login_user', { input }),
  listUsers: (company_id?: number) =>
    invokeTauri<User[]>('cmd_list_users', { companyId: company_id }),
  createUser: (input: any) => invokeTauri<User>('cmd_create_user', { input }),
  updateUser: (input: any) => invokeTauri<User>('cmd_update_user', { input }),

  // RBAC
  listRoles: () => invokeTauri<RoleWithPermissions[]>('cmd_list_roles'),
  listPermissions: () => invokeTauri<Permission[]>('cmd_list_permissions'),

  // Companies
  listCompanies: () => invokeTauri<Company[]>('cmd_list_companies'),
  createCompany: (input: any) => invokeTauri<Company>('cmd_create_company', { input }),
  updateCompany: (input: any) => invokeTauri<Company>('cmd_update_company', { input }),

  // Partners
  listPartners: (filter: {
    company_id?: number;
    sub_type?: PartnerSubType | 'all';
    is_active?: boolean;
    search?: string;
  }) => invokeTauri<Partner[]>('cmd_list_partners', { filter }),
  getPartner: (id: number) => invokeTauri<Partner | null>('cmd_get_partner', { id }),
  createPartner: (input: CreatePartnerInput) =>
    invokeTauri<Partner>('cmd_create_partner', { input }),
  updatePartner: (input: any) => invokeTauri<Partner>('cmd_update_partner', { input }),
  deletePartner: (id: number) => invokeTauri<void>('cmd_delete_partner', { id }),

  // Settings
  getSettings: (company_id: number) =>
    invokeTauri<Record<string, string>>('cmd_get_settings', { companyId: company_id }),
  setSetting: (input: { key: string; company_id: number; value: string }) =>
    invokeTauri<void>('cmd_set_setting', { input }),

  // Activity
  getRecentActivities: (company_id: number, limit = 20) =>
    invokeTauri<ActivityLog[]>('cmd_get_recent_activities', { companyId: company_id, limit }),
  getEntityActivities: (entity_type: string, entity_id: number) =>
    invokeTauri<ActivityLog[]>('cmd_get_entity_activities', { entityType: entity_type, entityId: entity_id }),
};
