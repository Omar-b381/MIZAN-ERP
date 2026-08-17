import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  FileText,
  CreditCard,
  RotateCcw,
  X,
  PlusCircle,
  TrendingUp,
  Printer,
  Archive,
  FileDown,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import {
  AccountMove,
  Partner,
  ProductWithStock,
  CreateInvoiceInput,
  CreateInvoiceLineInput,
  MoveType,
} from '../../types';
import { formatCurrency } from '../../lib/utils';
import { PrintDocumentModal, PrintableDocumentData } from '../printing/PrintDocumentModal';
import { exportInvoiceToPdf } from '../../lib/pdfTemplate';

export const InvoicesView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { activeCompanyId } = useAuthStore();

  const [moves, setMoves] = useState<AccountMove[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState<AccountMove | null>(null);
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<PrintableDocumentData | null>(null);
  const [isBatchExporting, setIsBatchExporting] = useState(false);

  const [formData, setFormData] = useState<CreateInvoiceInput>({
    company_id: activeCompanyId,
    partner_id: 2,
    move_type: 'out_invoice',
    date: new Date().toISOString().split('T')[0],
    invoice_date_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'EGP',
    origin: '',
    note: '',
    lines: [
      {
        product_id: 1,
        name: '',
        quantity_milli: 1000,
        price_unit_cents: 0,
        discount_percent_milli: 0,
        tax_rate_milli: 14000, // 14% Egyptian VAT
      },
    ],
  });

  const [paymentForm, setPaymentForm] = useState({
    amount_cents: 0,
    journal_id: 3, // Cash
    payment_method: 'cash',
    note: '',
  });

  const loadData = async () => {
    try {
      const [mList, partList, prodList] = await Promise.all([
        api.listMoves(
          activeCompanyId,
          selectedType === 'all' ? undefined : selectedType,
          selectedState === 'all' ? undefined : selectedState
        ),
        api.listPartners({ company_id: activeCompanyId, is_active: true }),
        api.listProducts({ company_id: activeCompanyId, is_active: true }),
      ]);
      setMoves(mList.filter((m) => m.move_type === 'out_invoice' || m.move_type === 'in_invoice'));
      setPartners(partList);
      setProducts(prodList);
    } catch (err) {
      console.error('Failed to load invoices data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId, selectedType, selectedState]);

  const handleOpenCreate = (type: MoveType) => {
    const initialProd = products[0];
    const initialPartner = partners.find((p) => (type === 'out_invoice' ? p.sub_type === 'customer' : p.sub_type === 'vendor')) || partners[0];
    const initialPrice = type === 'out_invoice' ? initialProd?.product.sale_price_cents || 0 : initialProd?.product.cost_price_cents || 0;

    setFormData({
      company_id: activeCompanyId,
      partner_id: initialPartner?.id || 2,
      move_type: type,
      date: new Date().toISOString().split('T')[0],
      invoice_date_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'EGP',
      origin: '',
      note: '',
      lines: [
        {
          product_id: initialProd?.product.id || 1,
          name: initialProd?.product.name || '',
          quantity_milli: 1000,
          price_unit_cents: initialPrice,
          discount_percent_milli: 0,
          tax_rate_milli: 14000,
        },
      ],
    });
    setIsModalOpen(true);
  };

  const handleAddLine = () => {
    const initialProd = products[0];
    const initialPrice = formData.move_type === 'out_invoice' ? initialProd?.product.sale_price_cents || 0 : initialProd?.product.cost_price_cents || 0;
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        {
          product_id: initialProd?.product.id || 1,
          name: initialProd?.product.name || '',
          quantity_milli: 1000,
          price_unit_cents: initialPrice,
          discount_percent_milli: 0,
          tax_rate_milli: 14000,
        },
      ],
    });
  };

  const handleRemoveLine = (idx: number) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== idx),
    });
  };

  const handleLineProductChange = (idx: number, productId: number) => {
    const prod = products.find((p) => p.product.id === productId);
    const updated = [...formData.lines];
    const unitPrice = formData.move_type === 'out_invoice' ? prod?.product.sale_price_cents || 0 : prod?.product.cost_price_cents || 0;
    updated[idx] = {
      ...updated[idx],
      product_id: productId,
      name: prod?.product.name || '',
      price_unit_cents: unitPrice,
    };
    setFormData({ ...formData, lines: updated });
  };

  const handleLineFieldChange = (
    idx: number,
    field: keyof CreateInvoiceLineInput,
    val: unknown
  ) => {
    const updated = [...formData.lines];
    updated[idx] = { ...updated[idx], [field]: val };
    setFormData({ ...formData, lines: updated });
  };

  const calculateTotals = () => {
    let untaxed = 0;
    let tax = 0;
    let total = 0;

    for (const l of formData.lines) {
      const base = (l.quantity_milli * l.price_unit_cents) / 1000;
      const disc = (base * (l.discount_percent_milli || 0)) / 100000;
      const sub = base - disc;
      const tVal = (sub * (l.tax_rate_milli || 14000)) / 100000;
      untaxed += sub;
      tax += tVal;
      total += sub + tVal;
    }

    return { untaxed, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createInvoice(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save invoice:', err);
    }
  };

  const handlePostMove = async (moveId: number) => {
    try {
      await api.postMove(moveId);
      loadData();
    } catch (err) {
      console.error('Failed to post invoice:', err);
    }
  };

  const handleReverseMove = async (moveId: number) => {
    if (window.confirm('هل أنت متأكد من إنشاء قيد عكسي / إشعار دائن لهذه الفاتورة؟')) {
      try {
        await api.reverseMove(moveId);
        loadData();
      } catch (err) {
        console.error('Failed to reverse invoice:', err);
      }
    }
  };

  const handleOpenPayment = (inv: AccountMove) => {
    setActiveInvoiceForPayment(inv);
    setPaymentForm({
      amount_cents: inv.amount_total_cents,
      journal_id: 3, // Cash
      payment_method: 'cash',
      note: `سداد الفاتورة ${inv.name}`,
    });
    setIsPaymentModalOpen(true);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoiceForPayment) return;
    try {
      await api.createAndPostPayment({
        company_id: activeCompanyId,
        partner_id: activeInvoiceForPayment.partner_id || 1,
        payment_type: activeInvoiceForPayment.move_type === 'out_invoice' ? 'inbound' : 'outbound',
        amount_cents: paymentForm.amount_cents,
        journal_id: paymentForm.journal_id,
        payment_method: paymentForm.payment_method,
        invoice_id: activeInvoiceForPayment.id,
        note: paymentForm.note,
      });
      setIsPaymentModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to register payment:', err);
    }
  };

  const buildPrintableInvoiceData = async (invoice: AccountMove): Promise<PrintableDocumentData> => {
    const detail = await api.getMove(invoice.id);
    const invoiceLines = (detail?.lines || []).filter(
      (l) => l.product_id !== null || (l.account_code && !['1030', '2010', '2020', '2025'].includes(l.account_code))
    );

    const printableLines = invoiceLines.length > 0
      ? invoiceLines.map((l) => ({
          id: l.id,
          name: l.name || l.product_name || 'بند فاتورة',
          quantity: (l.quantity_milli || 1000) / 1000,
          price_unit: (l.price_unit_cents || 0) / 100,
          tax_rate: (l.tax_rate_milli || 14000) / 1000,
          subtotal: (l.price_unit_cents && l.quantity_milli)
            ? ((l.price_unit_cents * l.quantity_milli) / 100000)
            : Math.abs(l.balance_cents) / 100,
        }))
      : [
          {
            id: 1,
            name: invoice.note || 'إجمالي بنود الفاتورة',
            quantity: 1,
            price_unit: invoice.amount_untaxed_cents / 100,
            tax_rate: 14,
            subtotal: invoice.amount_untaxed_cents / 100,
          },
        ];

    return {
      docType: invoice.move_type,
      docNumber: invoice.name,
      date: invoice.date,
      dueDate: invoice.invoice_date_due,
      origin: invoice.origin,
      paymentState: invoice.payment_state,
      companyName: 'شركة ميزان للحلول والتجارة المؤسسية',
      companyTaxId: '100-245-890',
      companyCommercialReg: 'س.ت 44820',
      companyPhone: '+20 2 2456 7890',
      companyAddress: 'القاهرة، جمهورية مصر العربية',
      partnerName: invoice.partner_name || `طرف #${invoice.partner_id}`,
      currency: invoice.currency || 'EGP',
      lines: printableLines,
      amountUntaxed: invoice.amount_untaxed_cents / 100,
      amountTax: invoice.amount_tax_cents / 100,
      amountTotal: invoice.amount_total_cents / 100,
      note: invoice.note,
    };
  };

  const handleExportSinglePdf = async (invoice: AccountMove) => {
    try {
      const doc = await buildPrintableInvoiceData(invoice);
      await exportInvoiceToPdf(doc);
    } catch (err) {
      console.error('Failed to export invoice PDF:', err);
    }
  };

  const handleExportSingleExcel = async (invoice: AccountMove) => {
    try {
      const doc = await buildPrintableInvoiceData(invoice);
      const columns = [
        { key: 'item', title: 'البند / الصنف', data_type: 'text' as const },
        { key: 'qty', title: 'الكمية', data_type: 'number' as const },
        { key: 'price', title: 'سعر الوحدة (ج.م)', data_type: 'currency' as const },
        { key: 'tax', title: 'نسبة الضريبة (%)', data_type: 'number' as const },
        { key: 'total', title: 'الإجمالي الصافي (ج.م)', data_type: 'currency' as const },
      ];
      const rows = doc.lines.map((l) => ({
        item: l.name,
        qty: l.quantity,
        price: l.price_unit,
        tax: l.tax_rate,
        total: l.subtotal,
      }));

      await api.exportReportToXlsx({
        title: `فاتورة ${doc.docNumber}`,
        subtitle: `العميل / المورد: ${doc.partnerName} | التاريخ: ${doc.date}`,
        company_name: doc.companyName || 'شركة ميزان',
        date_range: doc.date,
        columns,
        rows,
        is_rtl: true,
      });
    } catch (err) {
      console.error('Failed to export invoice Excel:', err);
    }
  };

  const handlePrintInvoice = async (invoice: AccountMove) => {
    try {
      const doc = await buildPrintableInvoiceData(invoice);
      setActiveInvoiceForPrint(doc);
    } catch (err) {
      console.error('Failed to load invoice for printing:', err);
    }
  };

  const handleBatchZipExport = async () => {
    try {
      setIsBatchExporting(true);
      const files = filteredMoves.map((m) => {
        const content = `====================================================\nمنظومة ميزان ERP - مستند مالي\n====================================================\nرقم الفاتورة: ${m.name}\nالنوع: ${m.move_type}\nالطرف: ${m.partner_name || m.partner_id}\nتاريخ التحرير: ${m.date}\nتاريخ الاستحقاق: ${m.invoice_date_due || '-'}\nالمبلغ قبل الضريبة: ${(m.amount_untaxed_cents / 100).toFixed(2)} ${m.currency}\nالضريبة: ${(m.amount_tax_cents / 100).toFixed(2)} ${m.currency}\nالإجمالي الصافي: ${(m.amount_total_cents / 100).toFixed(2)} ${m.currency}\nحالة السداد: ${m.payment_state}\nملاحظات: ${m.note || '-'}\n`;
        return {
          filename: `${m.name.replace(/\//g, '_')}.txt`,
          content_text: content,
          content_base64: null,
        };
      });

      await api.exportBatchZip({
        zip_filename: `invoices_batch_${new Date().toISOString().split('T')[0]}.zip`,
        files,
      });
    } catch (err) {
      console.error('Failed to export batch zip:', err);
    } finally {
      setIsBatchExporting(false);
    }
  };

  const filteredMoves = moves.filter((m) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(term) ||
      (m.partner_name && m.partner_name.toLowerCase().includes(term)) ||
      (m.origin && m.origin.toLowerCase().includes(term))
    );
  });

  const totals = calculateTotals();

  // Metrics
  const totalInvoicedCents = moves
    .filter((m) => m.move_type === 'out_invoice' && m.state === 'posted')
    .reduce((sum, m) => sum + m.amount_total_cents, 0);
  const totalBilledCents = moves
    .filter((m) => m.move_type === 'in_invoice' && m.state === 'posted')
    .reduce((sum, m) => sum + m.amount_total_cents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Receipt className="w-5 h-5" />
            <span>{t('invoices.title', 'الفواتير والتحصيل المالي')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">
            {t('invoices.title', 'الفواتير والتحصيل المالي')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('invoices.subtitle', 'فواتير المبيعات، فواتير المشتريات، حساب ضريبة القيمة المضافة 14%، والتسوية المباشرة مع الخزينة والبنوك')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleBatchZipExport}
            disabled={isBatchExporting || filteredMoves.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
            title="تصدير جميع الفواتير المحددة في أرشيف مضغوط ZIP"
          >
            <Archive className="w-4 h-4" />
            <span>{isBatchExporting ? 'جاري التحزيم...' : 'تصدير مجمع (ZIP)'}</span>
          </button>
          <button
            onClick={() => handleOpenCreate('out_invoice')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ فاتورة عميل (مبيعات)</span>
          </button>
          <button
            onClick={() => handleOpenCreate('in_invoice')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors border border-border shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ فاتورة مورد (مشتريات)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">إجمالي فواتير المبيعات المرحلة</div>
            <div className="text-lg font-bold text-foreground">
              {formatCurrency(totalInvoicedCents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">إجمالي فواتير المشتريات المرحلة</div>
            <div className="text-lg font-bold text-foreground">
              {formatCurrency(totalBilledCents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">إجمالي عدد الفواتير المسجلة</div>
            <div className="text-lg font-bold text-foreground">{moves.length} فاتورة</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-secondary/50 p-1 rounded-lg border border-border text-xs">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded-md font-semibold ${selectedType === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              الكل
            </button>
            <button
              onClick={() => setSelectedType('out_invoice')}
              className={`px-3 py-1 rounded-md font-semibold ${selectedType === 'out_invoice' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              فواتير عملاء (INV)
            </button>
            <button
              onClick={() => setSelectedType('in_invoice')}
              className={`px-3 py-1 rounded-md font-semibold ${selectedType === 'in_invoice' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              فواتير موردين (BILL)
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {['all', 'draft', 'posted', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedState(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  selectedState === st ? 'bg-secondary text-foreground border border-border' : 'text-muted-foreground hover:bg-secondary/40'
                }`}
              >
                {st === 'all' && 'كل الحالات'}
                {st === 'draft' && 'مسودات'}
                {st === 'posted' && 'مرحلة'}
                {st === 'cancelled' && 'ملغاة'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الفاتورة، الطرف، المرجع..."
            className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-start">رقم الفاتورة</th>
                <th className="py-3.5 px-4 text-start">النوع والطرف</th>
                <th className="py-3.5 px-4 text-start">تاريخ الفاتورة</th>
                <th className="py-3.5 px-4 text-start">تاريخ الاستحقاق</th>
                <th className="py-3.5 px-4 text-start">قبل الضريبة</th>
                <th className="py-3.5 px-4 text-start">ضريبة (14%)</th>
                <th className="py-3.5 px-4 text-start">الإجمالي الشامل</th>
                <th className="py-3.5 px-4 text-start">حالة السداد</th>
                <th className="py-3.5 px-4 text-start">حالة القيد</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMoves.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>لا توجد فواتير مسجلة تطابق معايير البحث</p>
                  </td>
                </tr>
              ) : (
                filteredMoves.map((m) => (
                  <tr key={m.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {m.name}
                      {m.origin && (
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          أمر: {m.origin}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      <div>{m.partner_name || `طرف #${m.partner_id}`}</div>
                      <span className="text-[10px] text-muted-foreground">
                        {m.move_type === 'out_invoice' ? 'فاتورة مبيعات عميل' : 'فاتورة مشتريات مورد'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">{m.date}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">{m.invoice_date_due || '-'}</td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">
                      {formatCurrency(m.amount_untaxed_cents, m.currency, i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">
                      {formatCurrency(m.amount_tax_cents, m.currency, i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground font-mono">
                      {formatCurrency(m.amount_total_cents, m.currency, i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                    </td>
                    <td className="py-3.5 px-4">
                      {m.payment_state === 'paid' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          مدفوعة بالكامل
                        </span>
                      )}
                      {m.payment_state === 'not_paid' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          غير مدفوعة
                        </span>
                      )}
                      {m.payment_state === 'reversed' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          معكوسة / مردودة
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {m.state === 'draft' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground">
                          مسودة (Draft)
                        </span>
                      )}
                      {m.state === 'posted' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          مرحلة ومقيدة (Posted)
                        </span>
                      )}
                      {m.state === 'cancelled' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                          ملغاة (Cancelled)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleExportSinglePdf(m)}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-rose-600 transition-colors"
                          title="تصدير ملف PDF مباشر على التيمبلت المعتمد"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportSingleExcel(m)}
                          className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-600 transition-colors"
                          title="تصدير إكسيل (.xlsx)"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(m)}
                          className="p-1.5 rounded hover:bg-indigo-500/10 text-indigo-600 transition-colors"
                          title="معاينة المستند وقالب الطباعة"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {m.state === 'draft' && (
                          <button
                            onClick={() => handlePostMove(m.id)}
                            className="px-2.5 py-1 rounded bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[10px] shadow-sm transition-colors"
                          >
                            ترحيل القيد
                          </button>
                        )}
                        {m.state === 'posted' && m.payment_state === 'not_paid' && (
                          <button
                            onClick={() => handleOpenPayment(m)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] shadow-sm flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>سداد</span>
                          </button>
                        )}
                        {m.state === 'posted' && (
                          <button
                            onClick={() => handleReverseMove(m.id)}
                            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                            title="عكس القيد / إشعار دائن"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <Receipt className="w-5 h-5 text-primary" />
                <span>
                  {formData.move_type === 'out_invoice' ? 'إنشاء فاتورة مبيعات جديدة' : 'إنشاء فاتورة مشتريات / مورد'}
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {formData.move_type === 'out_invoice' ? 'العميل' : 'المورد'} *
                  </label>
                  <select
                    value={formData.partner_id}
                    onChange={(e) => setFormData({ ...formData, partner_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sub_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">تاريخ الفاتورة</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={formData.invoice_date_due || ''}
                    onChange={(e) => setFormData({ ...formData, invoice_date_due: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">المرجع / أصل المعاملة</label>
                  <input
                    type="text"
                    value={formData.origin || ''}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="مثال: SO/2026/00001"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Lines Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-foreground text-xs">بنود الفاتورة والضرائب</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="flex items-center gap-1 text-primary hover:underline font-semibold text-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>إضافة سطر</span>
                  </button>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-start">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2 px-3 text-start">المنتج / الوصف</th>
                        <th className="py-2 px-3 text-start w-28">الكمية</th>
                        <th className="py-2 px-3 text-start w-32">سعر الوحدة (ج.م)</th>
                        <th className="py-2 px-3 text-start w-24">خصم (%)</th>
                        <th className="py-2 px-3 text-start w-24">ضريبة (%)</th>
                        <th className="py-2 px-3 text-start w-32">الإجمالي (ج.م)</th>
                        <th className="py-2 px-2 text-center w-10">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {formData.lines.map((line, idx) => {
                        const base = (line.quantity_milli * line.price_unit_cents) / 1000;
                        const disc = (base * (line.discount_percent_milli || 0)) / 100000;
                        const sub = base - disc;
                        const tVal = (sub * (line.tax_rate_milli || 14000)) / 100000;
                        const lineTotal = sub + tVal;

                        return (
                          <tr key={idx}>
                            <td className="p-2">
                              <select
                                value={line.product_id || 1}
                                onChange={(e) => handleLineProductChange(idx, Number(e.target.value))}
                                className="w-full px-2 py-1.5 rounded border border-border bg-background"
                              >
                                {products.map((p) => (
                                  <option key={p.product.id} value={p.product.id}>
                                    {p.product.name} ({p.product.sku})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.001"
                                value={(line.quantity_milli / 1000).toString()}
                                onChange={(e) =>
                                  handleLineFieldChange(
                                    idx,
                                    'quantity_milli',
                                    Math.round(parseFloat(e.target.value || '1') * 1000)
                                  )
                                }
                                className="w-full px-2 py-1.5 rounded border border-border bg-background text-center font-mono font-bold"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                value={((line.price_unit_cents || 0) / 100).toFixed(2)}
                                onChange={(e) =>
                                  handleLineFieldChange(
                                    idx,
                                    'price_unit_cents',
                                    Math.round(parseFloat(e.target.value || '0') * 100)
                                  )
                                }
                                className="w-full px-2 py-1.5 rounded border border-border bg-background text-center font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.1"
                                value={((line.discount_percent_milli || 0) / 1000).toString()}
                                onChange={(e) =>
                                  handleLineFieldChange(
                                    idx,
                                    'discount_percent_milli',
                                    Math.round(parseFloat(e.target.value || '0') * 1000)
                                  )
                                }
                                className="w-full px-2 py-1.5 rounded border border-border bg-background text-center font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.1"
                                value={((line.tax_rate_milli || 14000) / 1000).toString()}
                                onChange={(e) =>
                                  handleLineFieldChange(
                                    idx,
                                    'tax_rate_milli',
                                    Math.round(parseFloat(e.target.value || '14') * 1000)
                                  )
                                }
                                className="w-full px-2 py-1.5 rounded border border-border bg-background text-center font-mono"
                              />
                            </td>
                            <td className="p-2 text-start font-mono font-bold text-foreground">
                              {formatCurrency(lineTotal, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                            </td>
                            <td className="p-2 text-center">
                              {formData.lines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLine(idx)}
                                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">ملاحظات وشروط الفاتورة</label>
                  <textarea
                    rows={3}
                    value={formData.note || ''}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>المجموع قبل الضريبة (Untaxed):</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(totals.untaxed, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>ضريبة القيمة المضافة 14% (VAT):</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(totals.tax, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex items-center justify-between text-sm font-bold text-primary">
                    <span>الإجمالي الشامل المستحق:</span>
                    <span>{formatCurrency(totals.total, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-foreground font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm"
                >
                  حفظ كمسودة فاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Registration Modal */}
      {isPaymentModalOpen && activeInvoiceForPayment && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>تسجيل سداد / تحصيل الفاتورة</span>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground font-medium mb-1">الفاتورة المرتبطة</label>
                <input
                  type="text"
                  disabled
                  value={`${activeInvoiceForPayment.name} - ${activeInvoiceForPayment.partner_name || ''}`}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">مبلغ السداد (ج.م)</label>
                <input
                  type="number"
                  step="0.01"
                  value={(paymentForm.amount_cents / 100).toFixed(2)}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      amount_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono font-bold text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">طريقة الدفع</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="cash">نقداً (Cash)</option>
                    <option value="bank_transfer">تحويل بنكي (Bank Transfer)</option>
                    <option value="cheque">شيك مصرفي (Cheque)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">دفتر الخزينة / البنك</label>
                  <select
                    value={paymentForm.journal_id}
                    onChange={(e) => setPaymentForm({ ...paymentForm, journal_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value={3}>الخزينة النقدية الرئيسية</option>
                    <option value={4}>البنك الأهلي المصري</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">البيان / ملاحظات السداد</label>
                <input
                  type="text"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-foreground font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-sm"
                >
                  تأكيد وترحيل السداد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Print Modal */}
      {activeInvoiceForPrint && (
        <PrintDocumentModal
          document={activeInvoiceForPrint}
          onClose={() => setActiveInvoiceForPrint(null)}
        />
      )}
    </div>
  );
};
