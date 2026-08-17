import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Plus, Phone, Mail, MapPin, X, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export const CompaniesView: React.FC = () => {
  const { t } = useTranslation();
  const { companies, setCompanies, activeCompanyId, setActiveCompanyId } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    parent_id: null as number | null,
    currency: 'EGP',
    timezone: 'Africa/Cairo',
    tax_id: '',
    commercial_registry: '',
    phone: '',
    email: '',
    street: '',
    city: 'الإسكندرية',
    state: 'الإسكندرية',
    country: 'EG',
  });

  const loadCompanies = async () => {
    try {
      const data = await api.listCompanies();
      setCompanies(data);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCompany({
        name: formData.name,
        parent_id: formData.parent_id || 1,
        currency: formData.currency,
        timezone: formData.timezone,
        tax_id: formData.tax_id || null,
        commercial_registry: formData.commercial_registry || null,
        phone: formData.phone || null,
        email: formData.email || null,
        street: formData.street || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country,
      });
      setIsModalOpen(false);
      loadCompanies();
    } catch (err) {
      console.error('Failed to create branch:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Building2 className="w-5 h-5" />
            <span>{t('companies.title')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">{t('companies.title')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('companies.subtitle')}</p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: '',
              parent_id: activeCompanyId,
              currency: 'EGP',
              timezone: 'Africa/Cairo',
              tax_id: '',
              commercial_registry: '',
              phone: '',
              email: '',
              street: '',
              city: 'الإسكندرية',
              state: 'الإسكندرية',
              country: 'EG',
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('companies.add_company')}</span>
        </button>
      </div>

      {/* Companies & Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => {
          const isHQ = !company.parent_id;
          const isCurrentActive = activeCompanyId === company.id;

          return (
            <div
              key={company.id}
              className={`rounded-xl border p-5 bg-card flex flex-col justify-between transition-all ${
                isCurrentActive
                  ? 'border-primary ring-2 ring-primary/20 shadow-md'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{company.name}</h3>
                      <span className="text-[11px] text-muted-foreground">
                        {isHQ ? t('companies.headquarters') : `${t('companies.branch_of')} HQ`}
                      </span>
                    </div>
                  </div>

                  {isCurrentActive && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      الفرع النشط
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground pt-2">
                  {company.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{company.city}, {company.country}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2 font-mono">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{company.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 text-[11px] font-mono text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-secondary">{company.currency}</span>
                  <span className="px-2 py-0.5 rounded bg-secondary">{company.timezone}</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border flex items-center justify-end">
                {!isCurrentActive && (
                  <button
                    onClick={() => setActiveCompanyId(company.id)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-xs font-medium transition-colors"
                  >
                    التبديل لهذا الفرع
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">{t('companies.add_company')}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">اسم الفرع / الشركة *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: فرع الإسكندرية"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">العملة</label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">المدينة</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">رقم الهاتف</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-medium hover:bg-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
