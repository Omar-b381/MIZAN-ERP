import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users2,
  Building2,
  Boxes,
  Activity,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { ModuleRecord, Partner, ActivityLog } from '../../types';

interface DashboardOverviewProps {
  modules: ModuleRecord[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ modules }) => {
  const { t } = useTranslation();
  const { activeCompanyId, setActiveView, currentUser } = useAuthStore();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pData, lData] = await Promise.all([
          api.listPartners({ company_id: activeCompanyId, is_active: true }),
          api.getRecentActivities(activeCompanyId, 5),
        ]);
        setPartners(pData);
        setRecentLogs(lData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };
    fetchData();
  }, [activeCompanyId]);

  const customerCount = partners.filter((p) => p.sub_type === 'customer').length;
  const vendorCount = partners.filter((p) => p.sub_type === 'vendor').length;
  const activeModulesCount = modules.filter((m) => m.is_active).length;

  const stats = [
    {
      id: 'customers',
      title: 'العملاء المسجلين',
      count: customerCount,
      icon: Users2,
      color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
      action: () => setActiveView('contacts'),
    },
    {
      id: 'vendors',
      title: 'الموردون المعتمدون',
      count: vendorCount,
      icon: Building2,
      color: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
      action: () => setActiveView('contacts'),
    },
    {
      id: 'modules',
      title: 'الوحدات المفعلة',
      count: `${activeModulesCount} / ${modules.length}`,
      icon: Boxes,
      color: 'text-primary bg-primary/10 border-primary/20',
      action: () => setActiveView('modules'),
    },
    {
      id: 'system',
      title: 'حالة النظام',
      count: '100% جاهز',
      icon: ShieldCheck,
      color: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
      action: () => setActiveView('activity'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>منظومة ميزان ERP • Phase 1 Core</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {t('auth.welcome')} {currentUser?.full_name || 'مدير النظام'}
          </h2>
          <p className="text-xs text-muted-foreground">
            مرحباً بك في لوحة تحكم النظام. يمكنك إدارة الهيكل المؤسسي، جهات الاتصال، وتفعيل الوحدات البرمجية.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveView('contacts')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('contacts.add_contact')}</span>
          </button>

          <button
            onClick={() => setActiveView('modules')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-medium transition-colors"
          >
            <Boxes className="w-3.5 h-3.5 text-primary" />
            <span>{t('nav.modules')}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              onClick={stat.action}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all cursor-pointer shadow-xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-foreground">{stat.count}</div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Setup Checklist */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground">إعدادات النواة المكتملة</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold">
              جاهز
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">الشركات والفروع</div>
                <p className="text-[11px] text-muted-foreground">شجرة الفروع وعملة EGP وتوقيت القاهرة</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">المستخدمين والأدوار (RBAC)</div>
                <p className="text-[11px] text-muted-foreground">صلاحيات dot-notation مشفرة ومؤمنة</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">دليل جهات الاتصال الموحد</div>
                <p className="text-[11px] text-muted-foreground">جدول partners مع تمييز العملاء والموردين</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">سجل النشاط والمحادثات (Chatter)</div>
                <p className="text-[11px] text-muted-foreground">تتبع تلقائي للعمليات append-only</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">آخر الأنشطة والعمليات</h3>
            </div>
            <button
              onClick={() => setActiveView('activity')}
              className="text-xs text-primary font-medium hover:underline"
            >
              عرض السجل الكامل
            </button>
          </div>

          <div className="space-y-2.5">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">لا توجد أنشطة مسجلة</p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/60 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <div>
                      <div className="font-semibold text-foreground">{log.summary}</div>
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {log.entity_type} • {log.action}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(log.created_at).toLocaleTimeString('ar-EG')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
