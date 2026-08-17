import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShoppingCart,
  ShoppingBag,
  Boxes,
  CreditCard,
  Users2,
  CalendarDays,
  ArrowUpRight,
  Receipt,
  Clock,
  AlertTriangle,
  Landmark,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { ModuleRecord, DashboardMetrics, ActivityLog } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface DashboardOverviewProps {
  modules: ModuleRecord[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ modules }) => {
  const { t, i18n } = useTranslation();
  const { activeCompanyId, setActiveView, currentUser } = useAuthStore();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mMetrics, lData] = await Promise.all([
          api.getDashboardMetrics(activeCompanyId),
          api.getRecentActivities(activeCompanyId, 6),
        ]);
        setMetrics(mMetrics);
        setRecentLogs(lData);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      }
    };
    fetchData();
  }, [activeCompanyId]);

  const activeModulesCount = modules.filter((m) => m.is_active).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>منظومة ميزان ERP • لوحة المؤشرات التنفيذية المتكاملة</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {t('auth.welcome', 'مرحباً')} {currentUser?.full_name || 'مدير النظام'}
          </h2>
          <p className="text-xs text-muted-foreground">
            نظرة شاملة ولحظية على مؤشرات الأداء المالي، المبيعات، المشتريات، المخازن، والموارد البشرية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveView('sales')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>+ أمر بيع جديد</span>
          </button>
          <button
            onClick={() => setActiveView('invoices')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border"
          >
            <Receipt className="w-3.5 h-3.5 text-primary" />
            <span>+ فاتورة مبيعات</span>
          </button>
          <button
            onClick={() => setActiveView('payments')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ سند قبض / صرف</span>
          </button>
        </div>
      </div>

      {/* Operational Alerts Row */}
      {metrics && (metrics.pending_deliveries_count > 0 || metrics.pending_receipts_count > 0 || metrics.pending_leaves_count > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {metrics.pending_deliveries_count > 0 && (
            <div
              onClick={() => setActiveView('transfers')}
              className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {metrics.pending_deliveries_count} أذون صرف وتسليم بانتظار الخروج
                </span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
            </div>
          )}

          {metrics.pending_receipts_count > 0 && (
            <div
              onClick={() => setActiveView('transfers')}
              className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-blue-500/15 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                  {metrics.pending_receipts_count} شحنات موردين بانتظار الاستلام المخزني
                </span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
            </div>
          )}

          {metrics.pending_leaves_count > 0 && (
            <div
              onClick={() => setActiveView('leaves')}
              className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-purple-500/15 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                  {metrics.pending_leaves_count} طلبات إجازة موظفين بانتظار الاعتماد
                </span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-purple-600" />
            </div>
          )}
        </div>
      )}

      {/* Core Executive KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Metric */}
        <div
          onClick={() => setActiveView('sales')}
          className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-primary/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
              {metrics ? `${metrics.sales_orders_count} أوامر بيع` : '...'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xs text-muted-foreground">إجمالي مبيعات الفترة المعتمَدة</div>
            <div className="text-xl font-extrabold text-foreground mt-0.5">
              {metrics
                ? formatCurrency(metrics.total_sales_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')
                : '...'}
            </div>
          </div>
        </div>

        {/* Purchases Metric */}
        <div
          onClick={() => setActiveView('purchases')}
          className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-primary/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
              {metrics ? `${metrics.purchase_orders_count} أوامر توريد` : '...'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xs text-muted-foreground">إجمالي المشتريات المعتمدة</div>
            <div className="text-xl font-extrabold text-foreground mt-0.5">
              {metrics
                ? formatCurrency(metrics.total_purchases_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')
                : '...'}
            </div>
          </div>
        </div>

        {/* Stock Valuation Metric */}
        <div
          onClick={() => setActiveView('inventory_stock')}
          className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-primary/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
              {metrics ? `${metrics.total_products_count} أصناف` : '...'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xs text-muted-foreground">تقييم المخزون المتاح (التكلفة)</div>
            <div className="text-xl font-extrabold text-foreground mt-0.5">
              {metrics
                ? formatCurrency(metrics.inventory_valuation_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')
                : '...'}
            </div>
          </div>
        </div>

        {/* Cash & Bank Liquidity */}
        <div
          onClick={() => setActiveView('payments')}
          className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-primary/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-600">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600">
              نقدية وبنوك
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xs text-muted-foreground">رصيد السيولة النقدية والخزينة</div>
            <div className="text-xl font-extrabold text-foreground mt-0.5">
              {metrics
                ? formatCurrency(metrics.cash_bank_balance_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')
                : '...'}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview & Operational Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receivables & Payables Balance */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>الذمم المالية والتحصيلات</span>
            </div>
            <button
              onClick={() => setActiveView('journal_entries')}
              className="text-[10px] text-primary hover:underline font-semibold"
            >
              ميزان المراجعة
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-secondary/40 border border-border flex items-center justify-between">
              <div>
                <div className="text-muted-foreground">أرصدة العملاء المدينة (A/R 1030)</div>
                <div className="font-bold text-sm text-emerald-600 mt-0.5">
                  {metrics
                    ? formatCurrency(metrics.accounts_receivable_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')
                    : '...'}
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                مستحقات لنا
              </span>
            </div>

            <div className="p-3 rounded-lg bg-secondary/40 border border-border flex items-center justify-between">
              <div>
                <div className="text-muted-foreground">مستحقات الموردين الدائنة (A/P 2010)</div>
                <div className="font-bold text-sm text-amber-600 mt-0.5">
                  {metrics
                    ? formatCurrency(metrics.accounts_payable_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')
                    : '...'}
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600">
                مستحقات علينا
              </span>
            </div>

            <div className="p-3 rounded-lg bg-secondary/40 border border-border flex items-center justify-between">
              <div>
                <div className="text-muted-foreground">صافي التزام ضريبة القيمة المضافة 14%</div>
                <div className="font-bold text-sm text-foreground mt-0.5">
                  {metrics
                    ? formatCurrency(metrics.net_vat_liability_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')
                    : '...'}
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                VAT 14%
              </span>
            </div>
          </div>
        </div>

        {/* Human Resources Snapshot */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Users2 className="w-4 h-4 text-primary" />
              <span>فريق العمل والموارد البشرية</span>
            </div>
            <button
              onClick={() => setActiveView('employees')}
              className="text-[10px] text-primary hover:underline font-semibold"
            >
              دليل الموظفين
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-secondary/40 border border-border flex items-center justify-between">
              <div>
                <div className="text-muted-foreground">إجمالي القوة العاملة على رأس العمل</div>
                <div className="font-bold text-sm text-foreground mt-0.5">
                  {metrics ? `${metrics.active_employees_count} موظف نشط` : '...'}
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600">
                Active Staff
              </span>
            </div>

            <div className="p-3 rounded-lg bg-secondary/40 border border-border flex items-center justify-between">
              <div>
                <div className="text-muted-foreground">إجمالي الرواتب الشهرية الأساسية</div>
                <div className="font-bold text-sm text-foreground mt-0.5">
                  {metrics
                    ? formatCurrency(metrics.monthly_payroll_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')
                    : '...'}
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600">
                شهرياً
              </span>
            </div>

            <div className="p-3 rounded-lg bg-secondary/40 border border-border flex items-center justify-between">
              <div>
                <div className="text-muted-foreground">الوحدات البرمجية النشطة</div>
                <div className="font-bold text-sm text-foreground mt-0.5">
                  {activeModulesCount} من {modules.length} موديول
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                100% Native
              </span>
            </div>
          </div>
        </div>

        {/* Live System Activity Log */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>أحدث أنشطة النظام (Audit Trail)</span>
            </div>
            <button
              onClick={() => setActiveView('activity')}
              className="text-[10px] text-primary hover:underline font-semibold"
            >
              سجل النشاط الكامل
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {recentLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">لا توجد أنشطة مسجلة حديثاً</p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-secondary/20 border border-border flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-foreground text-[11px]">{log.summary}</div>
                    <div className="text-[10px] text-muted-foreground">بواسطة مدير النظام • {log.action}</div>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap">
                    {log.created_at.split('T')[1]?.slice(0, 5) || 'الآن'}
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
