import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export const SettingsView: React.FC = () => {
  const { t } = useTranslation();
  const { activeCompanyId } = useAuthStore();
  const [settings, setSettings] = useState<Record<string, string>>({
    currency: 'EGP',
    timezone: 'Africa/Cairo',
    tax_rate_default: '14',
    company_name: 'شركة ميزان للتجارة والتوزيع',
    allow_negative_stock: '0',
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const s = await api.getSettings(activeCompanyId);
        setSettings((prev) => ({ ...prev, ...s }));
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, [activeCompanyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await api.setSetting({ key, company_id: activeCompanyId, value });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Settings className="w-5 h-5" />
          <span>{t('settings.title')}</span>
        </div>
        <h2 className="text-xl font-bold text-foreground mt-1">{t('settings.title')}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t('settings.subtitle')}</p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{t('settings.saved_success')}</span>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t('settings.company_name')}
            </label>
            <input
              type="text"
              value={settings.company_name || ''}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t('settings.default_currency')}
              </label>
              <input
                type="text"
                value={settings.currency || 'EGP'}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring font-mono"
              />
              <span className="text-[10px] text-muted-foreground">الافتراضي: EGP (الجنيه المصري)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t('settings.default_timezone')}
              </label>
              <input
                type="text"
                value={settings.timezone || 'Africa/Cairo'}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring font-mono"
              />
              <span className="text-[10px] text-muted-foreground">الافتراضي: Africa/Cairo</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t('settings.default_tax_rate')}
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.tax_rate_default || '14'}
              onChange={(e) => setSettings({ ...settings, tax_rate_default: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring font-mono"
            />
            <span className="text-[10px] text-muted-foreground">
              الافتراضي القانوني لضريبة القيمة المضافة في مصر: 14%
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="allow_neg_stock"
              checked={settings.allow_negative_stock === '1'}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  allow_negative_stock: e.target.checked ? '1' : '0',
                })
              }
              className="rounded border-input text-primary focus:ring-primary w-4 h-4"
            />
            <label htmlFor="allow_neg_stock" className="text-xs font-medium text-foreground cursor-pointer">
              {t('settings.allow_negative_stock')}
            </label>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? t('common.loading') : t('common.save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
