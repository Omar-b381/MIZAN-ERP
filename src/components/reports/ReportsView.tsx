import React, { useState, useEffect } from 'react';
import {
  FileText,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar,
  Printer,
  Building2,
  Users,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  TrialBalanceItem,
  ProfitAndLossReport,
  GeneralLedgerAccount,
  SalesReportRow,
  PurchasesReportRow,
  PartnerStatementReport,
  PartnerAgingItem,
  StockOnHandReportItem,
  StockMovementReportItem,
  LowStockReportItem,
  Partner,
  Account,
  ProductWithStock,
} from '../../types';

interface ReportsViewProps {
  companyId: number;
  activeModules: string[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ companyId, activeModules }) => {
  // Navigation & Sub-Tabs
  const [mainTab, setMainTab] = useState<'financial' | 'sales' | 'purchases' | 'inventory'>('financial');
  const [activeReport, setActiveReport] = useState<string>('trial_balance');

  // Filter States
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];

  const [datePreset, setDatePreset] = useState<string>('this_month');
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(lastDayOfMonth);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | undefined>(undefined);
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [salesGroupBy, setSalesGroupBy] = useState<string>('month');

  // Data States
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [products, setProducts] = useState<ProductWithStock[]>([]);

  // Report Specific Data
  const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([]);
  const [pnl, setPnl] = useState<ProfitAndLossReport | null>(null);
  const [generalLedger, setGeneralLedger] = useState<GeneralLedgerAccount[]>([]);
  const [salesReport, setSalesReport] = useState<SalesReportRow[]>([]);
  const [purchasesReport, setPurchasesReport] = useState<PurchasesReportRow[]>([]);
  const [partnerStatement, setPartnerStatement] = useState<PartnerStatementReport | null>(null);
  const [partnerAging, setPartnerAging] = useState<PartnerAgingItem[]>([]);
  const [stockOnHand, setStockOnHand] = useState<StockOnHandReportItem[]>([]);
  const [stockLedger, setStockLedger] = useState<StockMovementReportItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStockReportItem[]>([]);

  // Load dropdown resources
  useEffect(() => {
    const loadResources = async () => {
      try {
        const [parts, accs, prods] = await Promise.all([
          api.listPartners({ company_id: companyId }),
          api.listAccounts(companyId),
          api.listProducts({ company_id: companyId }),
        ]);
        setPartners(parts);
        setAccounts(accs);
        setProducts(prods);
        if (parts.length > 0 && !selectedPartnerId) {
          setSelectedPartnerId(parts[0].id);
        }
      } catch (err) {
        console.error('Error loading report filters resources:', err);
      }
    };
    loadResources();
  }, [companyId]);

  // Handle Preset changes
  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    const curr = new Date();
    if (preset === 'this_month') {
      setStartDate(new Date(curr.getFullYear(), curr.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(new Date(curr.getFullYear(), curr.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else if (preset === 'last_month') {
      setStartDate(new Date(curr.getFullYear(), curr.getMonth() - 1, 1).toISOString().split('T')[0]);
      setEndDate(new Date(curr.getFullYear(), curr.getMonth(), 0).toISOString().split('T')[0]);
    } else if (preset === 'this_year') {
      setStartDate(`${curr.getFullYear()}-01-01`);
      setEndDate(`${curr.getFullYear()}-12-31`);
    } else if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    }
  };

  // Fetch Report Data
  const loadReportData = async () => {
    setLoading(true);
    try {
      if (activeReport === 'trial_balance') {
        const data = await api.getTrialBalanceFiltered(companyId, startDate, endDate);
        setTrialBalance(data);
      } else if (activeReport === 'pnl') {
        const data = await api.getProfitAndLoss(companyId, startDate, endDate);
        setPnl(data);
      } else if (activeReport === 'general_ledger') {
        const data = await api.getGeneralLedger(companyId, selectedAccountId, startDate, endDate);
        setGeneralLedger(data);
      } else if (activeReport === 'sales_analysis') {
        const data = await api.getSalesReport(companyId, startDate, endDate, salesGroupBy, selectedPartnerId, selectedProductId);
        setSalesReport(data);
      } else if (activeReport === 'customer_statement' && selectedPartnerId) {
        const data = await api.getPartnerStatement(companyId, selectedPartnerId, startDate, endDate);
        setPartnerStatement(data);
      } else if (activeReport === 'customer_aging') {
        const data = await api.getPartnerAging(companyId, 'customer', endDate || today);
        setPartnerAging(data);
      } else if (activeReport === 'purchases_analysis') {
        const data = await api.getPurchasesReport(companyId, startDate, endDate, salesGroupBy, selectedPartnerId, selectedProductId);
        setPurchasesReport(data);
      } else if (activeReport === 'supplier_statement' && selectedPartnerId) {
        const data = await api.getPartnerStatement(companyId, selectedPartnerId, startDate, endDate);
        setPartnerStatement(data);
      } else if (activeReport === 'supplier_aging') {
        const data = await api.getPartnerAging(companyId, 'supplier', endDate || today);
        setPartnerAging(data);
      } else if (activeReport === 'stock_on_hand') {
        const data = await api.getStockOnHandReport(companyId);
        setStockOnHand(data);
      } else if (activeReport === 'stock_ledger') {
        const data = await api.getStockMovementLedger(companyId, selectedProductId, startDate, endDate);
        setStockLedger(data);
      } else if (activeReport === 'low_stock') {
        const data = await api.getLowStockReport(companyId);
        setLowStock(data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeReport, startDate, endDate, selectedPartnerId, selectedAccountId, selectedProductId, salesGroupBy]);

  // Export to Excel Native
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      let title = 'تقرير ميزان';
      let subtitle = `الفترة من ${startDate} إلى ${endDate}`;
      let columns: any[] = [];
      let rows: any[] = [];

      if (activeReport === 'trial_balance') {
        title = 'ميزان المراجعة التجريبي والأرصدة';
        columns = [
          { key: 'code', title: 'رمز الحساب', data_type: 'text' },
          { key: 'name', title: 'اسم الحساب', data_type: 'text' },
          { key: 'type', title: 'نوع الحساب', data_type: 'text' },
          { key: 'debit', title: 'مجموع المدين (ج.م)', data_type: 'currency' },
          { key: 'credit', title: 'مجموع الدائن (ج.م)', data_type: 'currency' },
          { key: 'balance', title: 'صافي الرصيد (ج.م)', data_type: 'currency' },
        ];
        rows = trialBalance.map((r) => ({
          code: r.account_code,
          name: r.account_name,
          type: r.account_type,
          debit: r.debit_sum_cents / 100,
          credit: r.credit_sum_cents / 100,
          balance: r.net_balance_cents / 100,
        }));
      } else if (activeReport === 'pnl' && pnl) {
        title = 'قائمة الدخل والأرباح والخسائر';
        columns = [
          { key: 'section', title: 'القسم المالي', data_type: 'text' },
          { key: 'code', title: 'رمز الحساب', data_type: 'text' },
          { key: 'name', title: 'اسم الحساب / البند', data_type: 'text' },
          { key: 'amount', title: 'المبلغ (ج.م)', data_type: 'currency' },
        ];
        pnl.revenues.forEach((r) => rows.push({ section: 'إيرادات المبيعات والخدمات', code: r.code, name: r.name, amount: r.amount_cents / 100 }));
        pnl.cogs.forEach((c) => rows.push({ section: 'تكلفة البضاعة المباعة', code: c.code, name: c.name, amount: c.amount_cents / 100 }));
        pnl.operating_expenses.forEach((e) => rows.push({ section: 'المصروفات التشغيلية والعمومية', code: e.code, name: e.name, amount: e.amount_cents / 100 }));
      } else if (activeReport === 'customer_statement' && partnerStatement) {
        title = `كشف حساب شريك - ${partnerStatement.partner_name}`;
        subtitle = `الرصيد الافتتاحي: ${(partnerStatement.opening_balance_cents / 100).toFixed(2)} ج.م | الرصيد الختامي: ${(partnerStatement.closing_balance_cents / 100).toFixed(2)} ج.م`;
        columns = [
          { key: 'date', title: 'التاريخ', data_type: 'date' },
          { key: 'ref', title: 'رقم المرجع', data_type: 'text' },
          { key: 'desc', title: 'البيان', data_type: 'text' },
          { key: 'debit', title: 'مدين (ج.م)', data_type: 'currency' },
          { key: 'credit', title: 'دائن (ج.م)', data_type: 'currency' },
          { key: 'balance', title: 'الرصيد التراكمي (ج.م)', data_type: 'currency' },
        ];
        rows = partnerStatement.lines.map((l) => ({
          date: l.date,
          ref: l.reference,
          desc: l.description,
          debit: l.debit_cents / 100,
          credit: l.credit_cents / 100,
          balance: l.running_balance_cents / 100,
        }));
      } else if (activeReport === 'customer_aging' || activeReport === 'supplier_aging') {
        title = activeReport === 'customer_aging' ? 'أعمار ديون العملاء' : 'أعمار ديون الموردين';
        columns = [
          { key: 'name', title: 'اسم الشريك', data_type: 'text' },
          { key: 'phone', title: 'الهاتف', data_type: 'text' },
          { key: 'b0_30', title: '0 - 30 يوم', data_type: 'currency' },
          { key: 'b31_60', title: '31 - 60 يوم', data_type: 'currency' },
          { key: 'b61_90', title: '61 - 90 يوم', data_type: 'currency' },
          { key: 'b90_plus', title: 'أكثر من 90 يوم', data_type: 'currency' },
          { key: 'total', title: 'إجمالي المديونية (ج.م)', data_type: 'currency' },
        ];
        rows = partnerAging.map((a) => ({
          name: a.partner_name,
          phone: a.phone || '-',
          b0_30: a.bucket_0_30_cents / 100,
          b31_60: a.bucket_31_60_cents / 100,
          b61_90: a.bucket_61_90_cents / 100,
          b90_plus: a.bucket_90_plus_cents / 100,
          total: a.total_outstanding_cents / 100,
        }));
      } else if (activeReport === 'stock_on_hand') {
        title = 'جرد المخزون وقيمة بضاعة آخر المدة';
        columns = [
          { key: 'code', title: 'كود الصنف', data_type: 'text' },
          { key: 'name', title: 'اسم الصنف', data_type: 'text' },
          { key: 'warehouse', title: 'المستودع', data_type: 'text' },
          { key: 'location', title: 'الموقع الداخلي', data_type: 'text' },
          { key: 'qty', title: 'الكمية المتوفرة', data_type: 'number' },
          { key: 'uom', title: 'الوحدة', data_type: 'text' },
          { key: 'cost', title: 'سعر التكلفة (ج.م)', data_type: 'currency' },
          { key: 'valuation', title: 'إجمالي التقييم (ج.م)', data_type: 'currency' },
        ];
        rows = stockOnHand.map((s) => ({
          code: s.default_code,
          name: s.product_name,
          warehouse: s.warehouse_name,
          location: s.location_name,
          qty: s.quantity_on_hand_milli / 1000,
          uom: s.uom_name,
          cost: s.cost_price_cents / 100,
          valuation: s.total_valuation_cents / 100,
        }));
      } else if (activeReport === 'low_stock') {
        title = 'تقرير نواقص المخزون ونقاط إعادة الطلب';
        columns = [
          { key: 'code', title: 'كود الصنف', data_type: 'text' },
          { key: 'name', title: 'اسم الصنف', data_type: 'text' },
          { key: 'category', title: 'الفئة', data_type: 'text' },
          { key: 'current', title: 'الرصيد الفعلي', data_type: 'number' },
          { key: 'min', title: 'حد الأمان', data_type: 'number' },
          { key: 'reorder', title: 'الكمية المقترحة لإعادة الطلب', data_type: 'number' },
          { key: 'uom', title: 'الوحدة', data_type: 'text' },
        ];
        rows = lowStock.map((l) => ({
          code: l.default_code,
          name: l.product_name,
          category: l.category_name,
          current: l.current_stock_milli / 1000,
          min: l.min_stock_milli / 1000,
          reorder: l.reorder_qty_milli / 1000,
          uom: l.uom_name,
        }));
      }

      await api.exportReportToXlsx({
        title,
        subtitle,
        company_name: 'شركة ميزان للتجارة والأنظمة المؤسسية',
        date_range: `${startDate} - ${endDate}`,
        columns,
        rows,
        is_rtl: true,
      });
    } catch (err) {
      console.error('Failed to export to Excel:', err);
    } finally {
      setExporting(false);
    }
  };

  const isModuleActive = (key: string) => {
    return activeModules.includes(key);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            <span>التقارير والمستخرجات والتحليلات</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            مركز التقارير المالية، المبيعات، المشتريات، والمخزون مع إمكانية المعاينة والطباعة والتصدير الفوري إلى Excel
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exporting ? 'جاري التصدير...' : 'تصدير إكسيل (.xlsx)'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Main Categories Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {isModuleActive('accounting') && (
          <button
            onClick={() => {
              setMainTab('financial');
              setActiveReport('trial_balance');
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition ${
              mainTab === 'financial'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>التقارير المالية ودفاتر الحسابات</span>
          </button>
        )}

        {isModuleActive('sales') && (
          <button
            onClick={() => {
              setMainTab('sales');
              setActiveReport('sales_analysis');
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition ${
              mainTab === 'sales'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>تقارير المبيعات والعملاء</span>
          </button>
        )}

        {isModuleActive('purchases') && (
          <button
            onClick={() => {
              setMainTab('purchases');
              setActiveReport('purchases_analysis');
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition ${
              mainTab === 'purchases'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>تقارير المشتريات والموردين</span>
          </button>
        )}

        {isModuleActive('stock') && (
          <button
            onClick={() => {
              setMainTab('inventory');
              setActiveReport('stock_on_hand');
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition ${
              mainTab === 'inventory'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>تقارير المخزون والمستودعات</span>
          </button>
        )}
      </div>

      {/* Sub-Reports Selector */}
      <div className="flex flex-wrap gap-2">
        {mainTab === 'financial' && (
          <>
            <button
              onClick={() => setActiveReport('trial_balance')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${
                activeReport === 'trial_balance'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              ميزان المراجعة (Trial Balance)
            </button>
            <button
              onClick={() => setActiveReport('pnl')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${
                activeReport === 'pnl'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              قائمة الدخل والأرباح (P&L)
            </button>
            <button
              onClick={() => setActiveReport('general_ledger')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${
                activeReport === 'general_ledger'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              دفتر الأستاذ العام (General Ledger)
            </button>
          </>
        )}

        {mainTab === 'sales' && (
          <>
            <button
              onClick={() => setActiveReport('sales_analysis')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${
                activeReport === 'sales_analysis'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              تقرير وتحليل المبيعات
            </button>
            <button
              onClick={() => setActiveReport('customer_statement')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${
                activeReport === 'customer_statement'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              كشف حساب عميل (Customer Statement)
            </button>
            <button
              onClick={() => setActiveReport('customer_aging')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${
                activeReport === 'customer_aging'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              أعمار ديون العملاء (Customer Aging)
            </button>
          </>
        )}

        {mainTab === 'purchases' && (
          <>
            <button
              onClick={() => setActiveReport('purchases_analysis')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${
                activeReport === 'purchases_analysis'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              تقرير وتحليل المشتريات
            </button>
            <button
              onClick={() => setActiveReport('supplier_statement')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${
                activeReport === 'supplier_statement'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              كشف حساب مورد (Supplier Statement)
            </button>
            <button
              onClick={() => setActiveReport('supplier_aging')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${
                activeReport === 'supplier_aging'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              أعمار ديون الموردين (Supplier Aging)
            </button>
          </>
        )}

        {mainTab === 'inventory' && (
          <>
            <button
              onClick={() => setActiveReport('stock_on_hand')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${
                activeReport === 'stock_on_hand'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              جرد المخزون حسب المستودع
            </button>
            <button
              onClick={() => setActiveReport('stock_ledger')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${
                activeReport === 'stock_ledger'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              دفتر حركة وسجل المخزون
            </button>
            <button
              onClick={() => setActiveReport('low_stock')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${
                activeReport === 'low_stock'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              نواقص المخزون ونقاط الطلب
            </button>
          </>
        )}
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>الفترة:</span>
          <select
            value={datePreset}
            onChange={(e) => applyDatePreset(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 font-bold"
          >
            <option value="this_month">الشهر الحالي</option>
            <option value="last_month">الشهر الماضي</option>
            <option value="this_year">السنة المالية الحالية</option>
            <option value="today">اليوم فقط</option>
            <option value="custom">تخصيص فترة</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span>من:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setDatePreset('custom');
            }}
            className="p-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
          />
          <span>إلى:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setDatePreset('custom');
            }}
            className="p-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
          />
        </div>

        {/* Group By for Sales/Purchases */}
        {(activeReport === 'sales_analysis' || activeReport === 'purchases_analysis') && (
          <div className="flex items-center gap-2">
            <span>تجميع حسب:</span>
            <select
              value={salesGroupBy}
              onChange={(e) => setSalesGroupBy(e.target.value)}
              className="p-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
            >
              <option value="month">الشهر</option>
              <option value="partner">العميل / المورد</option>
              <option value="product">الصنف والمنتج</option>
            </select>
          </div>
        )}

        {/* Partner Select for Statement */}
        {(activeReport === 'customer_statement' ||
          activeReport === 'supplier_statement' ||
          activeReport === 'sales_analysis' ||
          activeReport === 'purchases_analysis') && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span>الشريك:</span>
            <select
              value={selectedPartnerId || ''}
              onChange={(e) => setSelectedPartnerId(Number(e.target.value) || undefined)}
              className="p-2 border border-slate-200 rounded-xl bg-slate-50 min-w-[160px]"
            >
              <option value="">جميع الشركاء</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Account Select for GL */}
        {activeReport === 'general_ledger' && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>الحساب المالي:</span>
            <select
              value={selectedAccountId || ''}
              onChange={(e) => setSelectedAccountId(Number(e.target.value) || undefined)}
              className="p-2 border border-slate-200 rounded-xl bg-slate-50 min-w-[200px]"
            >
              <option value="">كل الحسابات معاً</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Product Select */}
        {(activeReport === 'sales_analysis' ||
          activeReport === 'purchases_analysis' ||
          activeReport === 'stock_ledger') && (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            <span>الصنف:</span>
            <select
              value={selectedProductId || ''}
              onChange={(e) => setSelectedProductId(Number(e.target.value) || undefined)}
              className="p-2 border border-slate-200 rounded-xl bg-slate-50 min-w-[180px]"
            >
              <option value="">كل الأصناف</option>
              {products.map((pr) => (
                <option key={pr.product.id} value={pr.product.id}>
                  {pr.product.sku} - {pr.product.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Report Content Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3"></div>
            <p className="text-sm font-semibold text-slate-500">جاري تجميع وحساب بيانات التقرير...</p>
          </div>
        ) : (
          <div className="p-6">
            {/* 1. Trial Balance */}
            {activeReport === 'trial_balance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-700">إجمالي المدين (Total Debits)</span>
                    <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                      {(trialBalance.reduce((s, r) => s + r.debit_sum_cents, 0) / 100).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      ج.م
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
                    <span className="text-xs font-bold text-purple-700">إجمالي الدائن (Total Credits)</span>
                    <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                      {(trialBalance.reduce((s, r) => s + r.credit_sum_cents, 0) / 100).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      ج.م
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-700">اتزان ميزان المراجعة</span>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-extrabold text-emerald-900">متوازن محاسبياً (Balanced)</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold">
                        <th className="p-3 rounded-r-lg">رمز الحساب</th>
                        <th className="p-3">اسم الحساب</th>
                        <th className="p-3">طبيعة الحساب</th>
                        <th className="p-3 text-left">مجموع المدين (ج.م)</th>
                        <th className="p-3 text-left">مجموع الدائن (ج.م)</th>
                        <th className="p-3 text-left rounded-l-lg">صافي الرصيد (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {trialBalance.map((item) => (
                        <tr key={item.account_id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{item.account_code}</td>
                          <td className="p-3 font-sans font-semibold text-slate-800">{item.account_name}</td>
                          <td className="p-3 font-sans text-slate-500">
                            {item.account_type === 'asset'
                              ? 'أصول'
                              : item.account_type === 'liability'
                              ? 'التزامات'
                              : item.account_type === 'equity'
                              ? 'حقوق ملكية'
                              : item.account_type === 'income'
                              ? 'إيرادات'
                              : 'مصروفات'}
                          </td>
                          <td className="p-3 text-left text-slate-700">
                            {(item.debit_sum_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-left text-slate-700">
                            {(item.credit_sum_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td
                            className={`p-3 text-left font-bold ${
                              item.net_balance_cents >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {(item.net_balance_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Profit and Loss */}
            {activeReport === 'pnl' && pnl && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-700">إجمالي الإيرادات (Revenues)</span>
                    <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                      {(pnl.total_revenue_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
                    <span className="text-xs font-bold text-amber-700">تكلفة البضاعة المباعة (COGS)</span>
                    <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                      {(pnl.total_cogs_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-700">مجمل الربح (Gross Profit)</span>
                    <p className="text-xl font-black text-indigo-900 mt-1 font-mono">
                      {(pnl.gross_profit_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-xl border ${
                      pnl.net_profit_cents >= 0
                        ? 'bg-emerald-100/60 border-emerald-300'
                        : 'bg-rose-100/60 border-rose-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800">صافي الربح / الخسارة (Net Income)</span>
                    <p
                      className={`text-2xl font-black mt-1 font-mono ${
                        pnl.net_profit_cents >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {(pnl.net_profit_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Revenue Lines */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 font-bold text-xs text-slate-800 flex justify-between">
                      <span>إيرادات المبيعات والنشاط التجاري (Sales Revenues)</span>
                      <span className="font-mono">
                        {(pnl.total_revenue_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                      </span>
                    </div>
                    <div className="p-3 space-y-2 text-xs">
                      {pnl.revenues.map((r) => (
                        <div key={r.account_id} className="flex justify-between text-slate-600">
                          <span>
                            {r.code} - {r.name}
                          </span>
                          <span className="font-mono font-medium" dir="ltr">
                            {(r.amount_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expenses Lines */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 font-bold text-xs text-slate-800 flex justify-between">
                      <span>المصروفات العمومية والتشغيلية (Operating Expenses)</span>
                      <span className="font-mono text-rose-700">
                        {(pnl.total_operating_expenses_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                        ج.م
                      </span>
                    </div>
                    <div className="p-3 space-y-2 text-xs">
                      {pnl.operating_expenses.length > 0 ? (
                        pnl.operating_expenses.map((e) => (
                          <div key={e.account_id} className="flex justify-between text-slate-600">
                            <span>
                              {e.code} - {e.name}
                            </span>
                            <span className="font-mono font-medium" dir="ltr">
                              {(e.amount_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-center py-2">لا توجد مصروفات مسجلة خلال الفترة</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. General Ledger */}
            {activeReport === 'general_ledger' && (
              <div className="space-y-6">
                {generalLedger.map((acc) => (
                  <div key={acc.account_id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-indigo-300 font-mono">{acc.account_code}</span>
                        <h4 className="font-bold text-sm">{acc.account_name}</h4>
                      </div>
                      <div className="text-left font-mono text-xs">
                        <span>الرصيد الختامي: </span>
                        <span className="font-bold text-emerald-400">
                          {(acc.closing_balance_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <th className="p-2.5">التاريخ</th>
                            <th className="p-2.5">رقم القيد</th>
                            <th className="p-2.5">البيان</th>
                            <th className="p-2.5">الطرف</th>
                            <th className="p-2.5 text-left">مدين (ج.م)</th>
                            <th className="p-2.5 text-left">دائن (ج.م)</th>
                            <th className="p-2.5 text-left">الرصيد التراكمي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {acc.lines.map((l, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2.5 text-slate-600">{l.date}</td>
                              <td className="p-2.5 font-bold text-slate-900">{l.move_name}</td>
                              <td className="p-2.5 font-sans text-slate-700">{l.label}</td>
                              <td className="p-2.5 font-sans text-slate-500">{l.partner_name || '-'}</td>
                              <td className="p-2.5 text-left">
                                {l.debit_cents > 0 ? (l.debit_cents / 100).toFixed(2) : '-'}
                              </td>
                              <td className="p-2.5 text-left">
                                {l.credit_cents > 0 ? (l.credit_cents / 100).toFixed(2) : '-'}
                              </td>
                              <td className="p-2.5 text-left font-bold text-indigo-700">
                                {(l.balance_cents / 100).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Sales Report */}
            {activeReport === 'sales_analysis' && (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold">
                        <th className="p-3 rounded-r-lg">الفترة / المجموعة</th>
                        <th className="p-3">العميل / الصنف</th>
                        <th className="p-3 text-center">الكمية المباعة</th>
                        <th className="p-3 text-center">عدد العمليات</th>
                        <th className="p-3 text-left">المبلغ قبل الضريبة</th>
                        <th className="p-3 text-left">الضريبة 14%</th>
                        <th className="p-3 text-left rounded-l-lg">الإجمالي الصافي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {salesReport.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{s.period_group}</td>
                          <td className="p-3 font-sans font-semibold text-slate-800">
                            {s.partner_name || s.product_name || '-'}
                          </td>
                          <td className="p-3 text-center">{(s.qty_sold_milli / 1000).toLocaleString('ar-EG')}</td>
                          <td className="p-3 text-center">{s.orders_count}</td>
                          <td className="p-3 text-left">{(s.amount_untaxed_cents / 100).toFixed(2)}</td>
                          <td className="p-3 text-left">{(s.amount_tax_cents / 100).toFixed(2)}</td>
                          <td className="p-3 text-left font-bold text-indigo-700">
                            {(s.amount_total_cents / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Purchases Report */}
            {activeReport === 'purchases_analysis' && (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold">
                        <th className="p-3 rounded-r-lg">الفترة / المجموعة</th>
                        <th className="p-3">المورد / الصنف</th>
                        <th className="p-3 text-center">الكمية المشتراة</th>
                        <th className="p-3 text-center">عدد الفواتير</th>
                        <th className="p-3 text-left">المبلغ قبل الضريبة</th>
                        <th className="p-3 text-left">الضريبة 14%</th>
                        <th className="p-3 text-left rounded-l-lg">الإجمالي الصافي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {purchasesReport.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{p.period_group}</td>
                          <td className="p-3 font-sans font-semibold text-slate-800">
                            {p.partner_name || p.product_name || '-'}
                          </td>
                          <td className="p-3 text-center">{(p.qty_purchased_milli / 1000).toLocaleString('ar-EG')}</td>
                          <td className="p-3 text-center">{p.orders_count}</td>
                          <td className="p-3 text-left">{(p.amount_untaxed_cents / 100).toFixed(2)}</td>
                          <td className="p-3 text-left">{(p.amount_tax_cents / 100).toFixed(2)}</td>
                          <td className="p-3 text-left font-bold text-indigo-700">
                            {(p.amount_total_cents / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. Partner Statement */}
            {(activeReport === 'customer_statement' || activeReport === 'supplier_statement') && partnerStatement && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{partnerStatement.partner_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      كشف حساب تفصيلي للفترة من {partnerStatement.start_date} إلى {partnerStatement.end_date}
                    </p>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-xs text-slate-500 block">الرصيد الختامي المستحق:</span>
                    <span className="text-xl font-black text-indigo-700">
                      {(partnerStatement.closing_balance_cents / 100).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      ج.م
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold">
                        <th className="p-3 rounded-r-lg">التاريخ</th>
                        <th className="p-3">نوع الحركة</th>
                        <th className="p-3">رقم المرجع</th>
                        <th className="p-3">البيان</th>
                        <th className="p-3 text-left">مدين (ج.م)</th>
                        <th className="p-3 text-left">دائن (ج.م)</th>
                        <th className="p-3 text-left rounded-l-lg">الرصيد التراكمي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      <tr className="bg-indigo-50/40 font-bold">
                        <td className="p-3">{partnerStatement.start_date}</td>
                        <td className="p-3 font-sans" colSpan={3}>
                          الرصيد الافتتاحي ما قبل الفترة (Opening Balance)
                        </td>
                        <td className="p-3 text-left">-</td>
                        <td className="p-3 text-left">-</td>
                        <td className="p-3 text-left text-slate-900">
                          {(partnerStatement.opening_balance_cents / 100).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                      {partnerStatement.lines.map((l, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-700">{l.date}</td>
                          <td className="p-3 font-sans font-semibold text-slate-800">
                            {l.doc_type === 'invoice'
                              ? 'فاتورة مبيعات'
                              : l.doc_type === 'bill'
                              ? 'فاتورة مشتريات'
                              : 'سند دفع / قبض'}
                          </td>
                          <td className="p-3 text-slate-900 font-bold">{l.reference}</td>
                          <td className="p-3 font-sans text-slate-600">{l.description}</td>
                          <td className="p-3 text-left text-slate-800">
                            {l.debit_cents > 0
                              ? (l.debit_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })
                              : '-'}
                          </td>
                          <td className="p-3 text-left text-slate-800">
                            {l.credit_cents > 0
                              ? (l.credit_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })
                              : '-'}
                          </td>
                          <td className="p-3 text-left font-bold text-indigo-700">
                            {(l.running_balance_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. Partner Aging */}
            {(activeReport === 'customer_aging' || activeReport === 'supplier_aging') && (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold">
                        <th className="p-3 rounded-r-lg">اسم الشريك</th>
                        <th className="p-3">الهاتف</th>
                        <th className="p-3 text-left">0 - 30 يوم</th>
                        <th className="p-3 text-left">31 - 60 يوم</th>
                        <th className="p-3 text-left">61 - 90 يوم</th>
                        <th className="p-3 text-left">أكثر من 90 يوم</th>
                        <th className="p-3 text-left rounded-l-lg">إجمالي المديونية (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {partnerAging.map((item) => (
                        <tr key={item.partner_id} className="hover:bg-slate-50">
                          <td className="p-3 font-sans font-bold text-slate-900">{item.partner_name}</td>
                          <td className="p-3 text-slate-500">{item.phone || '-'}</td>
                          <td className="p-3 text-left text-slate-700">
                            {(item.bucket_0_30_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-left text-slate-700">
                            {(item.bucket_31_60_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-left text-amber-700 font-semibold">
                            {(item.bucket_61_90_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-left text-rose-700 font-bold">
                            {(item.bucket_90_plus_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-left font-black text-slate-900">
                            {(item.total_outstanding_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 8. Stock on Hand */}
            {activeReport === 'stock_on_hand' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-slate-900 text-white flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm">إجمالي قيمة بضاعة المخزون (Inventory Valuation)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">تقييم المخزون بالتكلفة الفعلية</p>
                  </div>
                  <div className="text-xl font-black font-mono text-emerald-400">
                    {(stockOnHand.reduce((s, r) => s + r.total_valuation_cents, 0) / 100).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    ج.م
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold">
                        <th className="p-3 rounded-r-lg">كود الصنف</th>
                        <th className="p-3">اسم المنتج</th>
                        <th className="p-3">المستودع والموقع</th>
                        <th className="p-3 text-center">الكمية المتوفرة</th>
                        <th className="p-3 text-left">سعر التكلفة (ج.م)</th>
                        <th className="p-3 text-left rounded-l-lg">قيمة الرصيد (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {stockOnHand.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{item.default_code}</td>
                          <td className="p-3 font-sans font-semibold text-slate-800">{item.product_name}</td>
                          <td className="p-3 font-sans text-slate-500">
                            {item.warehouse_name} / {item.location_name}
                          </td>
                          <td className="p-3 text-center font-bold text-indigo-700">
                            {(item.quantity_on_hand_milli / 1000).toLocaleString('ar-EG')} {item.uom_name}
                          </td>
                          <td className="p-3 text-left text-slate-700">
                            {(item.cost_price_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-left font-black text-slate-900">
                            {(item.total_valuation_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 9. Stock Movement Ledger */}
            {activeReport === 'stock_ledger' && (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold">
                        <th className="p-3 rounded-r-lg">التاريخ</th>
                        <th className="p-3">رقم المرجع</th>
                        <th className="p-3">كود الصنف</th>
                        <th className="p-3">اسم المنتج</th>
                        <th className="p-3">من موقع</th>
                        <th className="p-3">إلى موقع</th>
                        <th className="p-3 text-center">الكمية المنقولة</th>
                        <th className="p-3 text-center rounded-l-lg">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {stockLedger.map((m) => (
                        <tr key={m.move_id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-600">{m.date}</td>
                          <td className="p-3 font-bold text-slate-900">{m.reference}</td>
                          <td className="p-3 font-bold text-slate-700">{m.default_code}</td>
                          <td className="p-3 font-sans font-semibold text-slate-800">{m.product_name}</td>
                          <td className="p-3 font-sans text-slate-500">{m.src_location_name}</td>
                          <td className="p-3 font-sans text-slate-500">{m.dest_location_name}</td>
                          <td className="p-3 text-center font-bold text-indigo-700">
                            {(m.quantity_milli / 1000).toLocaleString('ar-EG')} {m.uom_name}
                          </td>
                          <td className="p-3 text-center font-sans">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {m.state === 'done' ? 'مكتمل' : m.state}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 10. Low Stock */}
            {activeReport === 'low_stock' && (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold">
                        <th className="p-3 rounded-r-lg">كود الصنف</th>
                        <th className="p-3">اسم المنتج</th>
                        <th className="p-3">الفئة</th>
                        <th className="p-3 text-center">الرصيد الفعلي</th>
                        <th className="p-3 text-center">حد الأمان الأدنى</th>
                        <th className="p-3 text-center rounded-l-lg">الكمية المقترحة لإعادة الطلب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {lowStock.length > 0 ? (
                        lowStock.map((item) => (
                          <tr key={item.product_id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{item.default_code}</td>
                            <td className="p-3 font-sans font-semibold text-slate-800">{item.product_name}</td>
                            <td className="p-3 font-sans text-slate-500">{item.category_name}</td>
                            <td className="p-3 text-center font-bold text-rose-600">
                              {(item.current_stock_milli / 1000).toLocaleString('ar-EG')} {item.uom_name}
                            </td>
                            <td className="p-3 text-center text-slate-600">
                              {(item.min_stock_milli / 1000).toLocaleString('ar-EG')} {item.uom_name}
                            </td>
                            <td className="p-3 text-center font-black text-emerald-700 bg-emerald-50/50">
                              +{(item.reorder_qty_milli / 1000).toLocaleString('ar-EG')} {item.uom_name}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                            لا توجد منتجات وصلت إلى حد الطلب الأدنى حالياً.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
