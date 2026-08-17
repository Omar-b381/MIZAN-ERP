import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Boxes,
  MapPin,
  Search,
  Warehouse,
  Hash,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { StockQuantityDetail, StockLocation } from '../../types';

export const InventoryStockView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { activeCompanyId } = useAuthStore();

  const [quantities, setQuantities] = useState<StockQuantityDetail[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const [qList, locList] = await Promise.all([
        api.listStockQuantities(
          activeCompanyId,
          selectedLocation === 'all' ? undefined : selectedLocation
        ),
        api.listLocations(activeCompanyId),
      ]);
      setQuantities(qList);
      setLocations(locList.filter((l) => l.location_type === 'internal'));
    } catch (err) {
      console.error('Failed to load stock quantities:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId, selectedLocation]);

  const filteredQuantities = quantities.filter((q) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      q.product_name.toLowerCase().includes(term) ||
      q.sku.toLowerCase().includes(term) ||
      q.lot_serial_number.toLowerCase().includes(term) ||
      q.location_name.toLowerCase().includes(term)
    );
  });

  const totalStockUnits = filteredQuantities.reduce(
    (acc, q) => acc + q.quantity_milli / 1000,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Boxes className="w-5 h-5" />
            <span>{t('inventory.stockTitle', 'أرصدة المخزون الفعلي (Stock on Hand)')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">
            {t('inventory.stockTitle', 'أرصدة المخزون الفعلي (Stock on Hand)')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('inventory.stockSubtitle', 'جرد دقيق للمنتجات المتاحة وتتبع الأرقام التسلسلية والشحنات عبر المواقع')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-xs font-semibold text-foreground transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('common.refresh', 'تحديث')}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">إجمالي الأصناف المتاحة</div>
            <div className="text-lg font-bold text-foreground">
              {totalStockUnits.toLocaleString(i18n.language)} وحدة
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">مواقع التخزين النشطة</div>
            <div className="text-lg font-bold text-foreground">
              {locations.length} موقع
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">سجلات التتبع المسجلة</div>
            <div className="text-lg font-bold text-foreground">
              {filteredQuantities.length} بند
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setSelectedLocation('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedLocation === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
            }`}
          >
            {t('common.allLocations', 'جميع المواقع')}
          </button>
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedLocation === loc.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('inventory.searchStock', 'بحث بالمنتج، SKU، أو رقم التشغيلة...')}
            className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Stock Matrix Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-start">{t('products.fields.product', 'المنتج')}</th>
                <th className="py-3.5 px-4 text-start">{t('products.fields.sku', 'رمز SKU')}</th>
                <th className="py-3.5 px-4 text-start">{t('inventory.fields.location', 'موقع التخزين')}</th>
                <th className="py-3.5 px-4 text-start">{t('inventory.fields.lotSerial', 'رقم التشغيلة / السيريال')}</th>
                <th className="py-3.5 px-4 text-start">{t('inventory.fields.onHand', 'الرصيد المتاح')}</th>
                <th className="py-3.5 px-4 text-start">{t('inventory.fields.updatedAt', 'آخر تحديث')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredQuantities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>{t('inventory.emptyStock', 'لا توجد أرصدة مخزنية مسجلة بالمحددات المختارة')}</p>
                  </td>
                </tr>
              ) : (
                filteredQuantities.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground">{item.product_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                        {item.sku}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>{item.location_name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.lot_serial_number ? (
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20 font-semibold">
                          {item.lot_serial_number}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-600">
                        {(item.quantity_milli / 1000).toLocaleString(i18n.language)} {item.uom_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                      {new Date(item.updated_at).toLocaleString(i18n.language, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
