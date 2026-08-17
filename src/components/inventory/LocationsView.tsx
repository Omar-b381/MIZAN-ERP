import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Warehouse,
  Plus,
  FolderTree,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { StockLocation, StockWarehouse, CreateLocationInput, LocationType } from '../../types';

export const LocationsView: React.FC = () => {
  const { t } = useTranslation();
  const { activeCompanyId } = useAuthStore();

  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [warehouses, setWarehouses] = useState<StockWarehouse[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<CreateLocationInput>({
    company_id: activeCompanyId,
    name: '',
    parent_id: 5,
    location_type: 'internal',
  });

  const loadData = async () => {
    try {
      const [locList, whList] = await Promise.all([
        api.listLocations(activeCompanyId),
        api.listWarehouses(activeCompanyId),
      ]);
      setLocations(locList);
      setWarehouses(whList);
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLocation({
        ...formData,
        company_id: activeCompanyId,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to create location:', err);
    }
  };

  const getLocationTypeBadge = (type: LocationType) => {
    switch (type) {
      case 'internal':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">داخلي / Internal</span>;
      case 'view':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">مجموعة / View</span>;
      case 'supplier':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">موردين / Supplier</span>;
      case 'customer':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">عملاء / Customer</span>;
      case 'inventory_loss':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">تسوية وتلفيات / Loss</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <FolderTree className="w-5 h-5" />
            <span>{t('inventory.locationsTitle', 'شجرة المواقع والمستودعات (Stock Locations)')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">
            {t('inventory.locationsTitle', 'شجرة المواقع والمستودعات (Stock Locations)')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('inventory.locationsSubtitle', 'الهيكل الشجري لمواقع التخزين والأرفف والمواقع الافتراضية للشركاء والتسويات')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFormData({
                company_id: activeCompanyId,
                name: '',
                parent_id: locations.find((l) => l.location_type === 'internal')?.id || 5,
                location_type: 'internal',
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('inventory.addLocation', 'إضافة موقع / رف جديد')}</span>
          </button>
        </div>
      </div>

      {/* Warehouses Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {warehouses.map((wh) => (
          <div key={wh.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <Warehouse className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm text-foreground">{wh.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="font-mono px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-semibold">
                    {wh.code}
                  </span>
                  <span>المستودع الرئيسي</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Locations Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-start">اسم الموقع / الرف</th>
                <th className="py-3.5 px-4 text-start">المسار الكامل (Complete Path)</th>
                <th className="py-3.5 px-4 text-start">نوع الموقع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{loc.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">{loc.complete_name}</td>
                  <td className="py-3.5 px-4">{getLocationTypeBadge(loc.location_type)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Location Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>إضافة موقع تخزين جديد</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground font-medium mb-1">اسم الموقع / الرف *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: رف أ-1 / Shelf A-1"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">الموقع الأب (Parent Location)</label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.complete_name} ({l.location_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">نوع الموقع</label>
                <select
                  value={formData.location_type}
                  onChange={(e) => setFormData({ ...formData, location_type: e.target.value as LocationType })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="internal">موقع تخزين داخلي (Internal Location)</option>
                  <option value="view">موقع افتراضي للتجميع (View)</option>
                  <option value="customer">موقع العملاء (Customer)</option>
                  <option value="supplier">موقع الموردين (Supplier)</option>
                  <option value="inventory_loss">موقع فروقات الجرد والتلف (Inventory Loss)</option>
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
                  {t('common.save', 'حفظ الموقع')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
