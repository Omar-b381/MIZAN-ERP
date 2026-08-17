import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users2,
  Building2,
  ShieldCheck,
  Boxes,
  Settings,
  History,
  ShoppingCart,
  ShoppingBag,
  Package,
  Landmark,
  Lock,
  ArrowLeftRight,
  ClipboardCheck,
  FolderTree,
  Receipt,
  BookOpen,
  CreditCard,
  CalendarDays,
  Clock,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { ModuleRecord } from '../../types';

interface SidebarProps {
  modules?: ModuleRecord[];
}

export const Sidebar: React.FC<SidebarProps> = ({ modules = [] }) => {
  const { t } = useTranslation();
  const activeView = useAuthStore((s) => s.activeView);
  const setActiveView = useAuthStore((s) => s.setActiveView);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const isModuleActive = (key: string) => {
    return modules.some((m) => m.key === key && m.is_active);
  };

  const coreNavItems = [
    {
      id: 'dashboard',
      label: t('nav.dashboard', 'لوحة التحكم'),
      icon: LayoutDashboard,
      view: 'dashboard',
      permission: null,
    },
    {
      id: 'reports',
      label: t('nav.reports', 'التقارير والمستخرجات'),
      icon: FileSpreadsheet,
      view: 'reports',
      permission: null,
    },
    {
      id: 'contacts',
      label: t('nav.contacts', 'جهات الاتصال'),
      icon: Users2,
      view: 'contacts',
      permission: 'contacts.view',
    },
    {
      id: 'companies',
      label: t('nav.companies', 'الشركات والفروع'),
      icon: Building2,
      view: 'companies',
      permission: 'core.companies.view',
    },
    {
      id: 'users',
      label: t('nav.users', 'المستخدمون والصلاحيات'),
      icon: ShieldCheck,
      view: 'users',
      permission: 'core.users.view',
    },
    {
      id: 'modules',
      label: t('nav.modules', 'إدارة الوحدات'),
      icon: Boxes,
      view: 'modules',
      permission: 'core.modules.manage',
    },
    {
      id: 'activity',
      label: t('nav.activity', 'سجل النشاط'),
      icon: History,
      view: 'activity',
      permission: null,
    },
    {
      id: 'settings',
      label: t('nav.settings', 'الإعدادات'),
      icon: Settings,
      view: 'settings',
      permission: 'core.settings.view',
    },
  ];

  const salesNavItems = [
    {
      id: 'sales_orders',
      label: t('nav.salesOrders', 'أوامر البيع وعروض الأسعار'),
      icon: ShoppingCart,
      view: 'sales',
      permission: 'sales.view',
    },
  ];

  const purchasesNavItems = [
    {
      id: 'purchase_orders',
      label: t('nav.purchaseOrders', 'أوامر الشراء وطلبات الأسعار'),
      icon: ShoppingBag,
      view: 'purchases',
      permission: 'purchases.view',
    },
  ];

  const accountingNavItems = [
    {
      id: 'invoices',
      label: t('nav.invoices', 'الفواتير والتحصيل المالي'),
      icon: Receipt,
      view: 'invoices',
      permission: 'invoices.view',
    },
    {
      id: 'journal_entries',
      label: t('nav.journalEntries', 'دليل الحسابات وقيود اليومية'),
      icon: BookOpen,
      view: 'journal_entries',
      permission: 'accounting.view',
    },
    {
      id: 'payments',
      label: t('nav.payments', 'سندات القبض والصرف'),
      icon: CreditCard,
      view: 'payments',
      permission: 'payments.view',
    },
  ];

  const inventoryNavItems = [
    {
      id: 'products',
      label: t('nav.products', 'كتالوج المنتجات'),
      icon: Package,
      view: 'products',
      permission: 'products.view',
    },
    {
      id: 'inventory_stock',
      label: t('nav.inventoryStock', 'أرصدة المخزون'),
      icon: Boxes,
      view: 'inventory_stock',
      permission: 'inventory.view',
    },
    {
      id: 'transfers',
      label: t('nav.transfers', 'حركات وعمليات المخزن'),
      icon: ArrowLeftRight,
      view: 'transfers',
      permission: 'inventory.manage',
    },
    {
      id: 'adjustments',
      label: t('nav.adjustments', 'تسويات وجرد المخزون'),
      icon: ClipboardCheck,
      view: 'adjustments',
      permission: 'inventory.adjust',
    },
    {
      id: 'locations',
      label: t('nav.locations', 'شجرة المواقع والمستودعات'),
      icon: FolderTree,
      view: 'locations',
      permission: 'inventory.manage',
    },
  ];

  const hrNavItems = [
    {
      id: 'employees',
      label: t('nav.employees', 'دليل الموظفين والهيكل'),
      icon: Users2,
      view: 'employees',
      permission: 'hr.view',
    },
    {
      id: 'leaves',
      label: t('nav.leaves', 'طلبات الإجازات والعطلات'),
      icon: CalendarDays,
      view: 'leaves',
      permission: 'hr.leaves.manage',
    },
    {
      id: 'attendance',
      label: t('nav.attendance', 'سجل الحضور والانصراف'),
      icon: Clock,
      view: 'attendance',
      permission: 'hr.attendance.manage',
    },
  ];

  const modularFeatures = [
    {
      key: 'payroll',
      label: t('nav.payroll', 'مسير الرواتب والتأمينات'),
      icon: Landmark,
      view: 'payroll',
    },
  ];

  return (
    <aside className="w-64 border-e border-border bg-card/60 flex flex-col justify-between select-none h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Core System Navigation */}
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {t('modules.core', 'النواة الأساسية')}
          </div>
          {coreNavItems.map((item) => {
            if (item.permission && !hasPermission(item.permission)) {
              return null;
            }
            const Icon = item.icon;
            const isActive = activeView === item.view;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.view)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground/80 hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sales Section (Active in Phase 3) */}
        {isModuleActive('sales') && (
          <div className="space-y-1 pt-2 border-t border-border/60">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{t('modules.salesSection', 'المبيعات')}</span>
              <span className="text-[10px] text-emerald-600 font-semibold">نشط</span>
            </div>
            {salesNavItems.map((item) => {
              if (item.permission && !hasPermission(item.permission)) {
                return null;
              }
              const Icon = item.icon;
              const isActive = activeView === item.view;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.view)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/80 hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Purchases Section (Active in Phase 4) */}
        {isModuleActive('purchases') && (
          <div className="space-y-1 pt-2 border-t border-border/60">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{t('modules.purchasesSection', 'المشتريات')}</span>
              <span className="text-[10px] text-emerald-600 font-semibold">نشط</span>
            </div>
            {purchasesNavItems.map((item) => {
              if (item.permission && !hasPermission(item.permission)) {
                return null;
              }
              const Icon = item.icon;
              const isActive = activeView === item.view;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.view)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/80 hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Products & Inventory Section (Active in Phase 2) */}
        {(isModuleActive('products') || isModuleActive('inventory')) && (
          <div className="space-y-1 pt-2 border-t border-border/60">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{t('modules.inventorySection', 'المخزون والمنتجات')}</span>
              <span className="text-[10px] text-emerald-600 font-semibold">نشط</span>
            </div>
            {inventoryNavItems.map((item) => {
              if (item.permission && !hasPermission(item.permission)) {
                return null;
              }
              const Icon = item.icon;
              const isActive = activeView === item.view;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.view)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/80 hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Accounting & Financial Management */}
        {(isModuleActive('accounting') || isModuleActive('invoices') || isModuleActive('payments')) && (
          <div className="space-y-1 pt-2 border-t border-border/60">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{t('modules.accountingSection', 'الحسابات العامة والفواتير')}</span>
              <span className="text-[10px] text-emerald-600 font-semibold">نشط</span>
            </div>
            {accountingNavItems.map((item) => {
              if (item.permission && !hasPermission(item.permission)) {
                return null;
              }
              const Icon = item.icon;
              const isActive = activeView === item.view;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.view)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/80 hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Human Resources (HR) Management */}
        {isModuleActive('employees') && (
          <div className="space-y-1 pt-2 border-t border-border/60">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{t('modules.hrSection', 'الموارد البشرية والموظفين')}</span>
              <span className="text-[10px] text-emerald-600 font-semibold">نشط</span>
            </div>
            {hrNavItems.map((item) => {
              if (item.permission && !hasPermission(item.permission)) {
                return null;
              }
              const Icon = item.icon;
              const isActive = activeView === item.view;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.view)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/80 hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Future Business Modules */}
        <div className="space-y-1 pt-2 border-t border-border/60">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>{t('modules.title', 'الوحدات البرمجية')}</span>
            <span className="text-[10px] text-muted-foreground/80">§ Modular</span>
          </div>

          {modularFeatures.map((feat) => {
            const active = isModuleActive(feat.key);
            const Icon = feat.icon;

            return (
              <button
                key={feat.key}
                disabled={!active}
                onClick={() => active && setActiveView(feat.view)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'text-foreground/90 hover:bg-secondary cursor-pointer'
                    : 'text-muted-foreground/60 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{feat.label}</span>
                </div>
                {!active && (
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    <Lock className="w-2.5 h-2.5" />
                    {t('modules.inactive', 'غير نشط')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-border/40 text-center">
        <p className="text-[11px] text-muted-foreground font-medium">
          Mizan ERP v1.0 • Enterprise Edition
        </p>
      </div>
    </aside>
  );
};
