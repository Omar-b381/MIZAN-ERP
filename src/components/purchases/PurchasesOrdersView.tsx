import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle2,
  FileText,
  Truck,
  Edit2,
  Trash2,
  X,
  PlusCircle,
  TrendingDown,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import {
  PurchaseOrder,
  Partner,
  ProductWithStock,
  CreatePurchaseOrderInput,
  CreatePurchaseOrderLineInput,
} from '../../types';
import { formatCurrency } from '../../lib/utils';

export const PurchasesOrdersView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { activeCompanyId } = useAuthStore();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Partner[]>([]);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreatePurchaseOrderInput>({
    company_id: activeCompanyId,
    partner_id: 3,
    date_planned: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'EGP',
    origin: '',
    note: '',
    lines: [
      {
        product_id: 1,
        name: '',
        product_uom_qty_milli: 1000,
        product_uom_id: 1,
        price_unit_cents: 0,
        discount_percent_milli: 0,
        tax_rate_milli: 14000, // 14% Egyptian VAT
      },
    ],
  });

  const loadData = async () => {
    try {
      const [oList, partList, prodList] = await Promise.all([
        api.listPurchaseOrders(activeCompanyId, selectedState === 'all' ? undefined : selectedState),
        api.listPartners({ company_id: activeCompanyId, is_active: true }),
        api.listProducts({ company_id: activeCompanyId, is_active: true }),
      ]);
      setOrders(oList);
      setVendors(partList.filter((p) => p.sub_type === 'vendor' || p.sub_type === 'contact' || p.is_company === 1));
      setProducts(prodList);
    } catch (err) {
      console.error('Failed to load purchases data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId, selectedState]);

  const handleOpenCreate = () => {
    setEditingId(null);
    const initialProd = products[0];
    setFormData({
      company_id: activeCompanyId,
      partner_id: vendors[0]?.id || 3,
      date_planned: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'EGP',
      origin: '',
      note: '',
      lines: [
        {
          product_id: initialProd?.product.id || 1,
          name: initialProd?.product.name || '',
          product_uom_qty_milli: 1000,
          product_uom_id: initialProd?.product.uom_id || 1,
          price_unit_cents: initialProd?.product.cost_price_cents || 0,
          discount_percent_milli: 0,
          tax_rate_milli: 14000,
        },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (orderId: number) => {
    try {
      const detail = await api.getPurchaseOrder(orderId);
      if (!detail) return;
      setEditingId(orderId);
      setFormData({
        company_id: detail.order.company_id,
        partner_id: detail.order.partner_id,
        date_planned: detail.order.date_planned || undefined,
        currency: detail.order.currency,
        origin: detail.order.origin || '',
        note: detail.order.note || '',
        lines: detail.lines.map((l) => ({
          product_id: l.product_id,
          name: l.name,
          product_uom_qty_milli: l.product_uom_qty_milli,
          product_uom_id: l.product_uom_id,
          price_unit_cents: l.price_unit_cents,
          discount_percent_milli: l.discount_percent_milli,
          tax_rate_milli: l.tax_rate_milli,
        })),
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to load order detail:', err);
    }
  };

  const handleAddLine = () => {
    const initialProd = products[0];
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        {
          product_id: initialProd?.product.id || 1,
          name: initialProd?.product.name || '',
          product_uom_qty_milli: 1000,
          product_uom_id: initialProd?.product.uom_id || 1,
          price_unit_cents: initialProd?.product.cost_price_cents || 0,
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
    updated[idx] = {
      ...updated[idx],
      product_id: productId,
      name: prod?.product.name || '',
      product_uom_id: prod?.product.uom_id || 1,
      price_unit_cents: prod?.product.cost_price_cents || 0,
    };
    setFormData({ ...formData, lines: updated });
  };

  const handleLineFieldChange = (
    idx: number,
    field: keyof CreatePurchaseOrderLineInput,
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
      const base = (l.product_uom_qty_milli * l.price_unit_cents) / 1000;
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
      if (editingId) {
        await api.updatePurchaseOrder({
          id: editingId,
          partner_id: formData.partner_id,
          date_planned: formData.date_planned,
          origin: formData.origin,
          note: formData.note,
          lines: formData.lines,
        });
      } else {
        await api.createPurchaseOrder(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save purchase order:', err);
    }
  };

  const handleConfirmOrder = async (orderId: number) => {
    try {
      await api.confirmPurchaseOrder(orderId);
      loadData();
    } catch (err) {
      console.error('Failed to confirm purchase order:', err);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (window.confirm(t('purchases.confirmCancel', 'هل أنت متأكد من إلغاء أمر الشراء هذا؟'))) {
      try {
        await api.cancelPurchaseOrder(orderId);
        loadData();
      } catch (err) {
        console.error('Failed to cancel order:', err);
      }
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (window.confirm(t('purchases.confirmDelete', 'هل أنت متأكد من حذف هذا الطلب؟'))) {
      try {
        await api.deletePurchaseOrder(orderId);
        loadData();
      } catch (err) {
        console.error('Failed to delete order:', err);
      }
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      o.name.toLowerCase().includes(term) ||
      (o.partner_name && o.partner_name.toLowerCase().includes(term)) ||
      (o.origin && o.origin.toLowerCase().includes(term))
    );
  });

  const totals = calculateTotals();

  // Summary Metrics
  const totalRfqCount = orders.filter((o) => o.state === 'draft' || o.state === 'sent').length;
  const totalPurchasesCount = orders.filter((o) => o.state === 'purchase' || o.state === 'done').length;
  const totalPurchaseSpendCents = orders
    .filter((o) => o.state === 'purchase' || o.state === 'done')
    .reduce((sum, o) => sum + o.amount_total_cents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <ShoppingBag className="w-5 h-5" />
            <span>{t('purchases.title', 'إدارة المشتريات والموردين')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">
            {t('purchases.title', 'إدارة المشتريات والموردين')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('purchases.subtitle', 'دورة التوريد والمشتريات: طلبات الأسعار، أوامر الشراء المؤكدة، الضرائب، وتوليد أذون الاستلام المخزني')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('purchases.createOrder', 'إنشاء طلب شراء / أمر توريد جديد')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">طلبات عروض الأسعار المفتوحة (RFQs)</div>
            <div className="text-lg font-bold text-foreground">{totalRfqCount} طلب</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">أوامر الشراء المعتمدة</div>
            <div className="text-lg font-bold text-foreground">{totalPurchasesCount} أمر شراء</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">إجمالي منصرفات المشتريات المعتمدة</div>
            <div className="text-lg font-bold text-foreground">
              {formatCurrency(totalPurchaseSpendCents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { key: 'all', label: 'الكل' },
            { key: 'draft', label: 'طلبات عروض أسعار (RFQ)' },
            { key: 'purchase', label: 'أوامر شراء معتمدة (PO)' },
            { key: 'done', label: 'مكتملة ومستلمة' },
            { key: 'cancelled', label: 'ملغاة' },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setSelectedState(st.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedState === st.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('purchases.searchPlaceholder', 'بحث برقم الأمر أو اسم المورد أو المرجع...')}
            className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-start">{t('purchases.fields.number', 'الرقم المرجعي')}</th>
                <th className="py-3.5 px-4 text-start">{t('purchases.fields.vendor', 'المورد')}</th>
                <th className="py-3.5 px-4 text-start">{t('purchases.fields.date', 'تاريخ الأمر')}</th>
                <th className="py-3.5 px-4 text-start">{t('purchases.fields.datePlanned', 'موعد الاستلام المتوقع')}</th>
                <th className="py-3.5 px-4 text-start">{t('purchases.fields.untaxed', 'قبل الضريبة')}</th>
                <th className="py-3.5 px-4 text-start">{t('purchases.fields.tax', 'ضريبة (14%)')}</th>
                <th className="py-3.5 px-4 text-start">{t('purchases.fields.total', 'الإجمالي الشامل')}</th>
                <th className="py-3.5 px-4 text-start">{t('purchases.fields.receipt', 'الاستلام المخزني')}</th>
                <th className="py-3.5 px-4 text-start">{t('purchases.fields.state', 'الحالة')}</th>
                <th className="py-3.5 px-4 text-center">{t('common.actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>{t('purchases.empty', 'لا توجد أوامر شراء أو طلبات عروض أسعار مسجلة')}</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {order.name}
                      {order.origin && (
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          مرجع: {order.origin}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      {order.partner_name || `مورد #${order.partner_id}`}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {order.date_order.split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {order.date_planned ? order.date_planned.split('T')[0] : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">
                      {formatCurrency(order.amount_untaxed_cents, order.currency, i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">
                      {formatCurrency(order.amount_tax_cents, order.currency, i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground font-mono">
                      {formatCurrency(order.amount_total_cents, order.currency, i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                    </td>
                    <td className="py-3.5 px-4">
                      {order.receipt_status === 'to_receive' && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                          <Truck className="w-3 h-3" />
                          <span>في انتظار الاستلام</span>
                        </span>
                      )}
                      {order.receipt_status === 'received' && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>تم الاستلام بالمستودع</span>
                        </span>
                      )}
                      {order.receipt_status === 'no' && (
                        <span className="text-[10px] text-muted-foreground">-</span>
                      )}
                      {order.receipt_status === 'cancelled' && (
                        <span className="text-[10px] text-destructive">ملغي</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {order.state === 'draft' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground">
                          طلب عرض أسعار (RFQ)
                        </span>
                      )}
                      {order.state === 'sent' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          مرسل للمورد (Sent)
                        </span>
                      )}
                      {order.state === 'purchase' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          أمر شراء معتمد (Purchase Order)
                        </span>
                      )}
                      {order.state === 'done' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          مكتمل ومرحل (Done)
                        </span>
                      )}
                      {order.state === 'cancelled' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                          ملغي (Cancelled)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {(order.state === 'draft' || order.state === 'sent') && (
                          <>
                            <button
                              onClick={() => handleConfirmOrder(order.id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] shadow-sm transition-colors"
                              title="تأكيد أمر الشراء وتوليد إذن الاستلام المخزني"
                            >
                              تأكيد الأمر
                            </button>
                            <button
                              onClick={() => handleOpenEdit(order.id)}
                              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {order.state === 'purchase' && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="px-2 py-1 rounded hover:bg-destructive/10 text-destructive text-[10px] font-medium transition-colors"
                          >
                            إلغاء الأمر
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

      {/* Purchase Order / RFQ Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <span>
                  {editingId ? t('purchases.editOrder', 'تعديل طلب الشراء') : t('purchases.createOrder', 'إنشاء طلب شراء / أمر توريد جديد')}
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
                    {t('purchases.fields.vendor', 'المورد')} *
                  </label>
                  <select
                    value={formData.partner_id}
                    onChange={(e) => setFormData({ ...formData, partner_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.sub_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('purchases.fields.datePlanned', 'موعد الاستلام المتوقع')}
                  </label>
                  <input
                    type="date"
                    value={formData.date_planned || ''}
                    onChange={(e) => setFormData({ ...formData, date_planned: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('purchases.fields.origin', 'المرجع / رقم الطلب الداخلي')}
                  </label>
                  <input
                    type="text"
                    value={formData.origin || ''}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="مثال: PR/2026/001"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('purchases.fields.currency', 'العملة')}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.currency || 'EGP'}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-muted-foreground"
                  />
                </div>
              </div>

              {/* Order Lines Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-foreground text-xs">بنود وتكاليف المشتريات (Purchase Lines)</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="flex items-center gap-1 text-primary hover:underline font-semibold text-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>إضافة سطر منتج</span>
                  </button>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-start">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2 px-3 text-start">المنتج</th>
                        <th className="py-2 px-3 text-start w-28">الكمية</th>
                        <th className="py-2 px-3 text-start w-32">سعر التكلفة (ج.م)</th>
                        <th className="py-2 px-3 text-start w-24">خصم (%)</th>
                        <th className="py-2 px-3 text-start w-24">ضريبة (%)</th>
                        <th className="py-2 px-3 text-start w-32">الإجمالي (ج.م)</th>
                        <th className="py-2 px-2 text-center w-10">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {formData.lines.map((line, idx) => {
                        const base = (line.product_uom_qty_milli * line.price_unit_cents) / 1000;
                        const disc = (base * (line.discount_percent_milli || 0)) / 100000;
                        const sub = base - disc;
                        const tVal = (sub * (line.tax_rate_milli || 14000)) / 100000;
                        const lineTotal = sub + tVal;

                        return (
                          <tr key={idx}>
                            <td className="p-2">
                              <select
                                value={line.product_id}
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
                                value={(line.product_uom_qty_milli / 1000).toString()}
                                onChange={(e) =>
                                  handleLineFieldChange(
                                    idx,
                                    'product_uom_qty_milli',
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
                                  <Trash2 className="w-3.5 h-3.5" />
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

              {/* Summary and Note Footer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('purchases.fields.notes', 'الشروط والملاحظات')}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.note || ''}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="شروط التوريد والدفع ومواصفات الشحن..."
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
                    <span>الإجمالي الشامل (Grand Total):</span>
                    <span>
                      {formatCurrency(totals.total, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-foreground font-medium"
                >
                  {t('common.cancel', 'إلغاء')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm"
                >
                  {editingId ? t('common.save', 'حفظ التغييرات') : t('purchases.saveRfq', 'حفظ كطلب عرض أسعار')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
