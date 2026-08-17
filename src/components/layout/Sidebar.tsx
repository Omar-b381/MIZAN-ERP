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
  UserCheck,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { ModuleRecord } from '../../types';

interface SidebarProps {
  modules: ModuleRecord[];
}

export const Sidebar: React.FC<SidebarProps> = ({ modules }) => {
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
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      view: 'dashboard',
      permission: null,
    },
    {
      id: 'contacts',
      label: t('nav.contacts'),
      icon: Users2,
      view: 'contacts',
      permission: 'contacts.view',
    },
    {
      id: 'companies',
      label: t('nav.companies'),
      icon: Building2,
      view: 'companies',
      permission: 'core.companies.view',
    },
    {
      id: 'users',
      label: t('nav.users'),
      icon: ShieldCheck,
      view: 'users',
      permission: 'core.users.view',
    },
    {
      id: 'modules',
      label: t('nav.modules'),
      icon: Boxes,
      view: 'modules',
      permission: 'core.modules.manage',
    },
    {
      id: 'activity',
      label: t('nav.activity'),
      icon: History,
      view: 'activity',
      permission: null,
    },
    {
      id: 'settings',
      label: t('nav.settings'),
      icon: Settings,
      view: 'settings',
      permission: 'core.settings.view',
    },
  ];

  const modularFeatures = [
    {
      key: 'sales',
      label: t('nav.sales'),
      icon: ShoppingCart,
      view: 'sales',
    },
    {
      key: 'purchases',
      label: t('nav.purchases'),
      icon: ShoppingBag,
      view: 'purchases',
    },
    {
      key: 'inventory',
      label: t('nav.inventory'),
      icon: Package,
      view: 'inventory',
    },
    {
      key: 'accounting',
      label: t('nav.accounting'),
      icon: Landmark,
      view: 'accounting',
    },
    {
      key: 'employees',
      label: t('nav.hr'),
      icon: UserCheck,
      view: 'hr',
    },
  ];

  return (
    <aside className="w-64 border-e border-border bg-card/60 flex flex-col justify-between select-none h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Core System Navigation */}
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {t('modules.core')}
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

        {/* Business Modules (Dynamic / Modular) */}
        <div className="space-y-1 pt-2 border-t border-border/60">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>{t('modules.title')}</span>
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
                    {t('modules.inactive')}
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
          Mizan ERP v0.1 • Phase 1
        </p>
      </div>
    </aside>
  );
};
