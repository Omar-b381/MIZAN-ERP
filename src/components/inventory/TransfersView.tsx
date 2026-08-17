import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftRight,
  Plus,
  X,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import {
  StockPicking,
  StockPickingType,
  ProductWithStock,
  Partner,
  StockLocation,
  CreatePickingInput,
  CreatePickingMoveInput,
} from '../../types';

export const TransfersView: React.FC = () => {
  const { t } = useTranslation();
  const { activeCompanyId } = useAuthStore();

  const [pickings, setPickings] = useState<StockPicking[]>([]);
  const [pickingTypes, setPickingTypes] = useState<StockPickingType[]>([]);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);

  const [selectedState, setSelectedState] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<CreatePickingInput>({
    company_id: activeCompanyId,
    picking_type_id: 1,
    partner_id: undefined,
    scheduled_date: new Date().toISOString().split('T')[0],
    origin: '',
    note: '',
    moves: [
      {
        product_id: 1,
        quantity_milli: 1000,
        uom_id: 1,
        lot_serial_number: '',
      },
    ],
  });

  const loadData = async () => {
    try {
      const [pList, ptList, prodList, partList, locList] = await Promise.all([
        api.listPickings(activeCompanyId, selectedState === 'all' ? undefined : selectedState),
        api.listPickingTypes(activeCompanyId),
        api.listProducts({ company_id: activeCompanyId, is_active: true }),
        api.listPartners({ company_id: activeCompanyId, is_active: true }),
        api.listLocations(activeCompanyId),
      ]);
      setPickings(pList);
      setPickingTypes(ptList);
      setProducts(prodList);
      setPartners(partList);
      setLocations(locList);
    } catch (err) {
      console.error('Failed to load transfers:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId, selectedState]);

  const handleOpenCreate = () => {
    setFormData({
      company_id: activeCompanyId,
      picking_type_id: pickingTypes[0]?.id || 1,
      partner_id: partners[0]?.id || undefined,
      scheduled_date: new Date().toISOString().split('T')[0],
      origin: '',
      note: '',
      moves: [
        {
          product_id: products[0]?.product.id || 1,
          quantity_milli: 1000,
          uom_id: products[0]?.product.uom_id || 1,
          lot_serial_number: '',
        },
      ],
    });
    setIsModalOpen(true);
  };

  const handleAddMoveLine = () => {
    setFormData({
      ...formData,
      moves: [
        ...formData.moves,
        {
          product_id: products[0]?.product.id || 1,
          quantity_milli: 1000,
          uom_id: products[0]?.product.uom_id || 1,
          lot_serial_number: '',
        },
      ],
    });
  };

  const handleRemoveMoveLine = (index: number) => {
    setFormData({
      ...formData,
      moves: formData.moves.filter((_, i) => i !== index),
    });
  };

  const handleUpdateMoveLine = (index: number, field: keyof CreatePickingMoveInput, val: unknown) => {
    const updated = [...formData.moves];
    updated[index] = { ...updated[index], [field]: val };
    if (field === 'product_id') {
      const selectedProd = products.find((p) => p.product.id === Number(val));
      if (selectedProd) {
        updated[index].uom_id = selectedProd.product.uom_id;
      }
    }
    setFormData({ ...formData, moves: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPicking({
        ...formData,
        company_id: activeCompanyId,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to create transfer:', err);
    }
  };

  const handleValidate = async (id: number) => {
    try {
      await api.confirmPicking(id);
      loadData();
    } catch (err) {
      console.error('Failed to validate transfer:', err);
    }
  };

  const getLocationName = (id: number) => {
    return locations.find((l) => l.id === id)?.name || `موقع #${id}`;
  };

  const getPartnerName = (id?: number | null) => {
    if (!id) return '-';
    return partners.find((p) => p.id === id)?.name || `جهة #${id}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <ArrowLeftRight className="w-5 h-5" />
            <span>{t('inventory.transfersTitle', 'حركات وعمليات المخزون (Operations & Transfers)')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">
            {t('inventory.transfersTitle', 'حركات وعمليات المخزون (Operations & Transfers)')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('inventory.transfersSubtitle', 'إدارة أذون الاستلام، أوامر الصرف والتسليم، والتحويلات بين المخازن')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('inventory.createTransfer', 'إنشاء إذن نقل / استلام جديد')}</span>
          </button>
        </div>
      </div>

      {/* State Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'draft', 'confirmed', 'done', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                selectedState === st
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {st === 'all'
                ? 'الكل'
                : st === 'draft'
                ? 'مسودة'
                : st === 'confirmed'
                ? 'مؤكد'
                : st === 'done'
                ? 'مكتمل'
                : 'ملغي'}
            </button>
          ))}
        </div>
      </div>

      {/* Transfers List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-start">{t('inventory.fields.reference', 'الرقم المرجعي')}</th>
                <th className="py-3.5 px-4 text-start">{t('inventory.fields.from', 'من موقع')}</th>
                <th className="py-3.5 px-4 text-start">{t('inventory.fields.to', 'إلى موقع')}</th>
                <th className="py-3.5 px-4 text-start">{t('inventory.fields.partner', 'الجهة المتعاملة')}</th>
                <th className="py-3.5 px-4 text-start">{t('inventory.fields.date', 'التاريخ')}</th>
                <th className="py-3.5 px-4 text-start">{t('inventory.fields.state', 'الحالة')}</th>
                <th className="py-3.5 px-4 text-center">{t('common.actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pickings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>{t('inventory.emptyTransfers', 'لا توجد حركات مخزنية مسجلة')}</p>
                  </td>
                </tr>
              ) : (
                pickings.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {p.name}
                      {p.origin && (
                        <span className="block text-[10px] font-sans text-muted-foreground">
                          {p.origin}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">{getLocationName(p.src_location_id)}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">{getLocationName(p.dest_location_id)}</td>
                    <td className="py-3.5 px-4 text-foreground font-medium">{getPartnerName(p.partner_id)}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {p.scheduled_date || p.created_at.split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.state === 'draft' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground">
                          مسودة (Draft)
                        </span>
                      )}
                      {p.state === 'confirmed' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          جاهز للتنفيذ (Ready)
                        </span>
                      )}
                      {p.state === 'done' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          مكتمل ومرحل (Done)
                        </span>
                      )}
                      {p.state === 'cancelled' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                          ملغي (Cancelled)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.state !== 'done' && p.state !== 'cancelled' && (
                        <button
                          onClick={() => handleValidate(p.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors shadow-sm"
                        >
                          اعتماد وترحيل (Validate)
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Picking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
                <span>{t('inventory.createTransfer', 'إنشاء إذن نقل / استلام جديد')}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('inventory.fields.operationType', 'نوع العملية')} *
                  </label>
                  <select
                    value={formData.picking_type_id}
                    onChange={(e) => setFormData({ ...formData, picking_type_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {pickingTypes.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} ({pt.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('inventory.fields.partner', 'الجهة المتعاملة (مورد / عميل)')}
                  </label>
                  <select
                    value={formData.partner_id || ''}
                    onChange={(e) => setFormData({ ...formData, partner_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">-- بدون جهة --</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sub_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('inventory.fields.date', 'تاريخ الجدولة')}
                  </label>
                  <input
                    type="date"
                    value={formData.scheduled_date || ''}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Move Lines Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-foreground text-xs">بنود الأصناف والكميات (Lines)</span>
                  <button
                    type="button"
                    onClick={handleAddMoveLine}
                    className="flex items-center gap-1 text-primary hover:underline font-semibold text-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>إضافة سطر صنف</span>
                  </button>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-start">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2 px-3 text-start">الصنف</th>
                        <th className="py-2 px-3 text-start w-32">الكمية</th>
                        <th className="py-2 px-3 text-start">رقم التشغيلة / السيريال (اختياري)</th>
                        <th className="py-2 px-2 text-center w-12">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {formData.moves.map((move, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={move.product_id}
                              onChange={(e) => handleUpdateMoveLine(idx, 'product_id', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 rounded border border-border bg-background"
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
                              value={(move.quantity_milli / 1000).toString()}
                              onChange={(e) =>
                                handleUpdateMoveLine(
                                  idx,
                                  'quantity_milli',
                                  Math.round(parseFloat(e.target.value || '1') * 1000)
                                )
                              }
                              className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-center font-mono font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={move.lot_serial_number || ''}
                              onChange={(e) => handleUpdateMoveLine(idx, 'lot_serial_number', e.target.value)}
                              placeholder="مثال: SN-2026-001"
                              className="w-full px-2.5 py-1.5 rounded border border-border bg-background font-mono"
                            />
                          </td>
                          <td className="p-2 text-center">
                            {formData.moves.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMoveLine(idx)}
                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  {t('inventory.fields.note', 'ملاحظات إضافية')}
                </label>
                <textarea
                  rows={2}
                  value={formData.note || ''}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
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
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  {t('common.create', 'حفظ الإذن')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
