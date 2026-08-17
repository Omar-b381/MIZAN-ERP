import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Plus,
  Search,
  Barcode,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { ProductWithStock, ProductCategory, Uom, CreateProductInput, ProductType, TrackingMode } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const ProductsView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { activeCompanyId } = useAuthStore();

  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [formData, setFormData] = useState<CreateProductInput>({
    company_id: activeCompanyId,
    name: '',
    sku: '',
    barcode: '',
    description: '',
    type: 'storable',
    category_id: 2,
    uom_id: 1,
    purchase_uom_id: 1,
    sale_price_cents: 0,
    cost_price_cents: 0,
    tracking_mode: 'none',
    min_stock_milli: 0,
    max_stock_milli: 0,
  });

  const loadData = async () => {
    try {
      const [pList, cList, uList] = await Promise.all([
        api.listProducts({
          company_id: activeCompanyId,
          category_id: selectedCategory === 'all' ? undefined : selectedCategory,
          search: searchQuery || undefined,
          is_active: true,
        }),
        api.listProductCategories(activeCompanyId),
        api.listUoms(),
      ]);
      setProducts(pList);
      setCategories(cList);
      setUoms(uList);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId, selectedCategory, searchQuery]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      company_id: activeCompanyId,
      name: '',
      sku: `PROD-${Date.now().toString().slice(-4)}`,
      barcode: '',
      description: '',
      type: 'storable',
      category_id: categories[0]?.id || 1,
      uom_id: uoms[0]?.id || 1,
      purchase_uom_id: uoms[0]?.id || 1,
      sale_price_cents: 0,
      cost_price_cents: 0,
      tracking_mode: 'none',
      min_stock_milli: 0,
      max_stock_milli: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ProductWithStock) => {
    setEditingId(p.product.id);
    setFormData({
      company_id: p.product.company_id,
      name: p.product.name,
      sku: p.product.sku,
      barcode: p.product.barcode || '',
      description: p.product.description || '',
      type: p.product.type,
      category_id: p.product.category_id || undefined,
      uom_id: p.product.uom_id,
      purchase_uom_id: p.product.purchase_uom_id,
      sale_price_cents: p.product.sale_price_cents,
      cost_price_cents: p.product.cost_price_cents,
      tracking_mode: p.product.tracking_mode,
      min_stock_milli: p.product.min_stock_milli ?? undefined,
      max_stock_milli: p.product.max_stock_milli ?? undefined,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateProduct({
          ...formData,
          id: editingId,
          company_id: activeCompanyId,
        });
      } else {
        await api.createProduct({
          ...formData,
          company_id: activeCompanyId,
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save product:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('products.confirmDelete', 'هل أنت متأكد من حذف هذا المنتج؟'))) {
      try {
        await api.deleteProduct(id);
        loadData();
      } catch (err) {
        console.error('Failed to delete product:', err);
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const columns = [
        { key: 'sku', title: 'كود الصنف (SKU)', data_type: 'text' as const },
        { key: 'barcode', title: 'الباركود', data_type: 'text' as const },
        { key: 'name', title: 'اسم المنتج', data_type: 'text' as const },
        { key: 'category', title: 'الفئة والتصنيف', data_type: 'text' as const },
        { key: 'type', title: 'نوع المنتج', data_type: 'text' as const },
        { key: 'sale_price', title: 'سعر البيع (ج.م)', data_type: 'currency' as const },
        { key: 'cost_price', title: 'سعر التكلفة (ج.م)', data_type: 'currency' as const },
        { key: 'uom', title: 'وحدة القياس', data_type: 'text' as const },
        { key: 'stock', title: 'الرصيد المتاح', data_type: 'number' as const },
      ];

      const rows = products.map((p) => ({
        sku: p.product.sku,
        barcode: p.product.barcode || '-',
        name: p.product.name,
        category: p.category_name || 'عام',
        type: p.product.type === 'storable' ? 'مخزني' : p.product.type === 'consumable' ? 'استهلاكي' : 'خدمي',
        sale_price: p.product.sale_price_cents / 100,
        cost_price: p.product.cost_price_cents / 100,
        uom: p.uom_name || 'وحدة',
        stock: p.qty_on_hand_milli / 1000,
      }));

      await api.exportReportToXlsx({
        title: 'دليل المنتجات والأصناف (Product Catalog)',
        subtitle: `عدد الأصناف: ${products.length} صنف`,
        company_name: 'شركة ميزان للتجارة والأنظمة المؤسسية',
        date_range: new Date().toISOString().split('T')[0],
        columns,
        rows,
        is_rtl: true,
      });
    } catch (err) {
      console.error('Failed to export products to Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Package className="w-5 h-5" />
            <span>{t('products.title', 'كتالوج المنتجات والأصناف')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">{t('products.title', 'كتالوج المنتجات والأصناف')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('products.subtitle', 'إدارة الأصناف، الأسعار، وحدات القياس، وأرقام التشغيل والتتبع')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting ? 'جاري التصدير...' : 'تصدير الأصناف (.xlsx)'}</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('products.addProduct', 'إضافة صنف جديد')}</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
            }`}
          >
            {t('common.all', 'الكل')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === c.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('products.searchPlaceholder', 'بحث بالاسم، الكود، أو الباركود...')}
            className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-start">{t('products.fields.product', 'المنتج / الصنف')}</th>
                <th className="py-3.5 px-4 text-start">{t('products.fields.sku', 'رمز SKU')}</th>
                <th className="py-3.5 px-4 text-start">{t('products.fields.category', 'التصنيف')}</th>
                <th className="py-3.5 px-4 text-start">{t('products.fields.price', 'سعر البيع')}</th>
                <th className="py-3.5 px-4 text-start">{t('products.fields.cost', 'التكلفة')}</th>
                <th className="py-3.5 px-4 text-start">{t('products.fields.tracking', 'التتبع')}</th>
                <th className="py-3.5 px-4 text-start">{t('products.fields.onHand', 'المتاح بالمخزن')}</th>
                <th className="py-3.5 px-4 text-center">{t('common.actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>{t('products.empty', 'لا توجد منتجات مسجلة تطابق البحث')}</p>
                  </td>
                </tr>
              ) : (
                products.map((item) => {
                  const p = item.product;
                  const qtyUnits = p.type === 'service' ? '-' : (item.qty_on_hand_milli / 1000).toLocaleString(i18n.language);
                  return (
                    <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">{p.name}</div>
                        {p.barcode && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                            <Barcode className="w-3 h-3" />
                            <span>{p.barcode}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                          {p.sku}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">{item.category_name || '-'}</td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {formatCurrency(p.sale_price_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {formatCurrency(p.cost_price_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.tracking_mode === 'serial' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            رقم تسلسلي
                          </span>
                        )}
                        {p.tracking_mode === 'lot' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            رقم تشغيلة
                          </span>
                        )}
                        {p.tracking_mode === 'none' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-normal text-muted-foreground bg-secondary">
                            بدون تتبع
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            p.type === 'service'
                              ? 'text-muted-foreground'
                              : item.qty_on_hand_milli > 0
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {qtyUnits} {p.type !== 'service' && item.uom_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            title={t('common.edit', 'تعديل')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title={t('common.delete', 'حذف')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <Package className="w-5 h-5 text-primary" />
                <span>{editingId ? t('products.editProduct', 'تعديل بيانات الصنف') : t('products.addProduct', 'إضافة صنف جديد')}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('products.fields.name', 'اسم الصنف')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="مثال: لابتوب ديل للأعمال Dell Latitude 5530"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('products.fields.sku', 'رمز الصنف (SKU)')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('products.fields.barcode', 'الباركود الدولي')}
                  </label>
                  <input
                    type="text"
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="622..."
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('products.fields.category', 'التصنيف')}
                  </label>
                  <select
                    value={formData.category_id || 1}
                    onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('products.fields.type', 'نوع الصنف')}
                  </label>
                  <select
                    value={formData.type || 'storable'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ProductType })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="storable">صنف مخزني (Storable)</option>
                    <option value="consumable">صنف استهلاكي (Consumable)</option>
                    <option value="service">خدمة (Service)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('products.fields.uom', 'وحدة القياس')}
                  </label>
                  <select
                    value={formData.uom_id}
                    onChange={(e) => setFormData({ ...formData, uom_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {uoms.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('products.fields.tracking', 'طريقة التتبع')}
                  </label>
                  <select
                    value={formData.tracking_mode || 'none'}
                    onChange={(e) => setFormData({ ...formData, tracking_mode: e.target.value as TrackingMode })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="none">بدون تتبع (None)</option>
                    <option value="lot">أرقام تشغيلات (By Lots)</option>
                    <option value="serial">أرقام تسلسلية فريدة (By Unique Serial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('products.fields.salePrice', 'سعر البيع (جنيه مصري)')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={((formData.sale_price_cents || 0) / 100).toFixed(2)}
                    onChange={(e) =>
                      setFormData({ ...formData, sale_price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('products.fields.costPrice', 'تكلفة الشراء (جنيه مصري)')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={((formData.cost_price_cents || 0) / 100).toFixed(2)}
                    onChange={(e) =>
                      setFormData({ ...formData, cost_price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-muted-foreground font-medium mb-1">
                    {t('products.fields.description', 'الوصف والمواصفات')}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="مواصفات إضافية للصنف..."
                  />
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
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  {t('common.save', 'حفظ الصنف')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
