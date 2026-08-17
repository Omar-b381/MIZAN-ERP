import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ClipboardCheck,
  Plus,
  CheckCircle2,
  MapPin,
  X,
  Scale,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import {
  StockInventoryAdjustment,
  StockInventoryAdjustmentLineDetail,
  StockLocation,
} from '../../types';

export const InventoryAdjustmentsView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { activeCompanyId } = useAuthStore();

  const [adjustments, setAdjustments] = useState<StockInventoryAdjustment[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockInventoryAdjustment | null>(null);
  const [lines, setLines] = useState<StockInventoryAdjustmentLineDetail[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newLocationId, setNewLocationId] = useState<number>(5);

  const loadData = async () => {
    try {
      const [adjList, locList] = await Promise.all([
        api.listInventoryAdjustments(activeCompanyId),
        api.listLocations(activeCompanyId),
      ]);
      setAdjustments(adjList);
      setLocations(locList.filter((l) => l.location_type === 'internal'));

      if (adjList.length > 0 && !selectedAdjustment) {
        handleSelectAdjustment(adjList[0]);
      }
    } catch (err) {
      console.error('Failed to load adjustments:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId]);

  const handleSelectAdjustment = async (adj: StockInventoryAdjustment) => {
    setSelectedAdjustment(adj);
    try {
      const lineDetails = await api.getAdjustmentLines(adj.id);
      setLines(lineDetails);
    } catch (err) {
      console.error('Failed to load adjustment lines:', err);
    }
  };

  const handleCountChange = async (lineId: number, val: number) => {
    const milliVal = Math.round(val * 1000);
    try {
      await api.updateAdjustmentLineCount({
        line_id: lineId,
        counted_qty_milli: milliVal,
      });
      setLines((prev) =>
        prev.map((l) =>
          l.id === lineId
            ? {
                ...l,
                counted_qty_milli: milliVal,
                difference_qty_milli: milliVal - l.theoretical_qty_milli,
              }
            : l
        )
      );
    } catch (err) {
      console.error('Failed to update count:', err);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createInventoryAdjustment({
        company_id: activeCompanyId,
        name: newSessionName || `جرد دوري - ${new Date().toLocaleDateString(i18n.language)}`,
        location_id: newLocationId,
      });
      setIsModalOpen(false);
      await loadData();
      handleSelectAdjustment(created);
    } catch (err) {
      console.error('Failed to create adjustment session:', err);
    }
  };

  const handleValidateAdjustment = async () => {
    if (!selectedAdjustment) return;
    if (
      window.confirm(
        t(
          'inventory.confirmAdjustment',
          'هل أنت متأكد من اعتماد نتائج الجرد وترحيل الفروقات المخزنية؟'
        )
      )
    ) {
      try {
        const validated = await api.validateInventoryAdjustment(selectedAdjustment.id);
        setSelectedAdjustment(validated);
        loadData();
      } catch (err) {
        console.error('Failed to validate adjustment:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <ClipboardCheck className="w-5 h-5" />
            <span>{t('inventory.adjustmentsTitle', 'الجرد الفعلي وتسوية الفروقات (Physical Inventory)')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">
            {t('inventory.adjustmentsTitle', 'الجرد الفعلي وتسوية الفروقات (Physical Inventory)')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'inventory.adjustmentsSubtitle',
              'مطابقة الأرصدة النظرية بالعد الفعلي بالمخزن وتوليد قيود التسوية الآلية'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setNewSessionName(`جرد مخزني - ${new Date().toLocaleDateString(i18n.language)}`);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('inventory.newAdjustmentSession', 'بدء جلسة جرد جديدة')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sessions Sidebar */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-xs text-foreground px-1">جلسات الجرد</h3>
          <div className="space-y-1.5">
            {adjustments.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center">لا توجد جلسات جرد مسجلة</p>
            ) : (
              adjustments.map((adj) => (
                <button
                  key={adj.id}
                  onClick={() => handleSelectAdjustment(adj)}
                  className={`w-full text-start p-3 rounded-lg text-xs transition-all border ${
                    selectedAdjustment?.id === adj.id
                      ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                      : 'bg-background hover:bg-secondary border-border text-foreground'
                  }`}
                >
                  <div className="font-bold truncate">{adj.name}</div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                    <span>{adj.created_at.split('T')[0]}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-semibold ${
                        adj.state === 'done'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {adj.state === 'done' ? 'معتمد ومرحل' : 'قيد الجرد'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Lines Matrix View */}
        <div className="lg:col-span-3 space-y-4">
          {selectedAdjustment ? (
            <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
                <div>
                  <div className="text-base font-bold text-foreground">{selectedAdjustment.name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {locations.find((l) => l.id === selectedAdjustment.location_id)?.complete_name ||
                        'المخزن الرئيسي'}
                    </span>
                  </div>
                </div>

                {selectedAdjustment.state !== 'done' && (
                  <button
                    onClick={handleValidateAdjustment}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('inventory.validateAdjustment', 'اعتماد وترحيل التسويات')}</span>
                  </button>
                )}
              </div>

              {/* Lines Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-start text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3 px-4 text-start">الصنف</th>
                      <th className="py-3 px-4 text-start">رمز SKU</th>
                      <th className="py-3 px-4 text-center">الرصيد الدفتري (Theoretical)</th>
                      <th className="py-3 px-4 text-center w-36">العد الفعلي (Counted)</th>
                      <th className="py-3 px-4 text-center">الفارق (Difference)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lines.map((line) => {
                      const theoryUnits = line.theoretical_qty_milli / 1000;
                      const countedUnits = line.counted_qty_milli / 1000;
                      const diffUnits = line.difference_qty_milli / 1000;

                      return (
                        <tr key={line.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {line.product_name}
                            {line.lot_serial_number && (
                              <span className="block font-mono text-[10px] text-primary">
                                {line.lot_serial_number}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-muted-foreground">{line.sku}</td>
                          <td className="py-3 px-4 text-center font-semibold text-foreground">
                            {theoryUnits.toLocaleString(i18n.language)} {line.uom_name}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {selectedAdjustment.state === 'done' ? (
                              <span className="font-bold text-foreground">
                                {countedUnits.toLocaleString(i18n.language)} {line.uom_name}
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.001"
                                value={countedUnits.toString()}
                                onChange={(e) =>
                                  handleCountChange(line.id, parseFloat(e.target.value || '0'))
                                }
                                className="w-28 px-2 py-1 text-center font-mono font-bold rounded border border-border bg-background focus:ring-2 focus:ring-primary/20"
                              />
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {diffUnits === 0 ? (
                              <span className="text-muted-foreground font-medium">مطابق (0)</span>
                            ) : diffUnits > 0 ? (
                              <span className="font-bold text-emerald-600">
                                +{diffUnits.toLocaleString(i18n.language)} (زيادة)
                              </span>
                            ) : (
                              <span className="font-bold text-destructive">
                                {diffUnits.toLocaleString(i18n.language)} (عجز)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
              <Scale className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>اختر جلسة جرد لعرض بنود الأصناف أو ابدأ جلسة جديدة</p>
            </div>
          )}
        </div>
      </div>

      {/* Start Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                <span>بدء جلسة جرد مخزني جديدة</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground font-medium mb-1">اسم جلسة الجرد *</label>
                <input
                  type="text"
                  required
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">الموقع المراد جرده *</label>
                <select
                  value={newLocationId}
                  onChange={(e) => setNewLocationId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-foreground"
                >
                  {t('common.cancel', 'إلغاء')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  {t('common.start', 'بدء الجرد')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
