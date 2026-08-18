import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Save,
  CheckCircle2,
  KeyRound,
  Database,
  FileText,
  Copy,
  Check,
  Download,
  Upload,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { TrialStatus, BackupInfo } from '../../types';

interface SettingsViewProps {
  onRefresh?: () => void;
  onLicenseUpdated?: (status: TrialStatus) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onRefresh,
  onLicenseUpdated,
}) => {
  const { t } = useTranslation();
  const { activeCompanyId } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'general' | 'license' | 'backup' | 'diagnostics'>('general');

  // General Settings State
  const [settings, setSettings] = useState<Record<string, string>>({
    currency: 'EGP',
    timezone: 'Africa/Cairo',
    tax_rate_default: '14',
    company_name: 'شركة ميزان للتجارة والتوزيع',
    allow_negative_stock: '0',
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // License State
  const [licenseStatus, setLicenseStatus] = useState<TrialStatus | null>(null);
  const [licenseInput, setLicenseInput] = useState('');
  const [copiedMachineId, setCopiedMachineId] = useState(false);
  const [activating, setActivating] = useState(false);
  const [licenseMsg, setLicenseMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Backup State
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Diagnostics State
  const [diagMsg, setDiagMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [s, lic, bList] = await Promise.all([
          api.getSettings(activeCompanyId),
          api.getLicenseInfo(),
          api.listBackups(),
        ]);
        setSettings((prev) => ({ ...prev, ...s }));
        setLicenseStatus(lic);
        setBackups(bList);
        if (onLicenseUpdated) {
          onLicenseUpdated(lic);
        }
      } catch (err) {
        console.error('Failed to load settings data:', err);
      }
    };
    loadInitialData();
  }, [activeCompanyId]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await api.setSetting({ key, company_id: activeCompanyId, value });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMachineId = () => {
    if (licenseStatus) {
      navigator.clipboard.writeText(licenseStatus.machine_id);
      setCopiedMachineId(true);
      setTimeout(() => setCopiedMachineId(false), 2500);
    }
  };

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseInput.trim()) return;
    setActivating(true);
    setLicenseMsg(null);
    try {
      const updated = await api.activateLicense(licenseInput.trim());
      setLicenseStatus(updated);
      setLicenseInput('');
      setLicenseMsg({ type: 'success', text: 'تم تفعيل الترخيص الدائم بنجاح!' });
      if (onLicenseUpdated) {
        onLicenseUpdated(updated);
      }
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      setLicenseMsg({ type: 'error', text: err.toString() || 'فشل تفعيل الترخيص' });
    } finally {
      setActivating(false);
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    setBackupMsg(null);
    try {
      const newBackup = await api.createBackup();
      setBackups((prev) => [newBackup, ...prev]);
      setBackupMsg({ type: 'success', text: `تم إنشاء نسخة احتياطية بنجاح: ${newBackup.filename}` });
    } catch (err: any) {
      setBackupMsg({ type: 'error', text: err.toString() || 'فشل إنشاء النسخة الاحتياطية' });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (filePath: string) => {
    if (!confirm('تنبيه: ستتم استعادة قاعدة البيانات واستبدال البيانات الحالية. هل تود المتابعة؟')) return;
    setBackupLoading(true);
    setBackupMsg(null);
    try {
      const res = await api.restoreBackup(filePath);
      setBackupMsg({ type: 'success', text: res.message });
    } catch (err: any) {
      setBackupMsg({ type: 'error', text: err.toString() || 'فشل استعادة النسخة الاحتياطية' });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleExportDiagnostics = async () => {
    try {
      const res = await api.exportDiagnostics('mizan_diagnostics_report.json');
      setDiagMsg(`تم تصدير تقرير التشخيص بنجاح (${res.total_entries} سجل): ${res.export_path}`);
    } catch (err: any) {
      setDiagMsg(`فشل تصدير التقرير: ${err.toString()}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Settings className="w-5 h-5" />
          <span>{t('settings.title', 'إعدادات النظام والترخيص')}</span>
        </div>
        <h2 className="text-xl font-bold text-foreground mt-1">{t('settings.title', 'إعدادات النظام العامة')}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          إدارة إعدادات المؤسسة، ترخيص المنتج، النسخ الاحتياطي لقاعدة البيانات، وتقارير التشخيص.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>الإعدادات العامة</span>
        </button>

        <button
          onClick={() => setActiveTab('license')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'license'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>الترخيص وتفعيل المنتج</span>
          {licenseStatus?.is_trial_active && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              تجريبي
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>النسخ الاحتياطي والاستعادة</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'diagnostics'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>التشخيصات وسجلات النظام</span>
        </button>
      </div>

      {/* TAB 1: General Settings */}
      {activeTab === 'general' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          {savedSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('settings.saved_success', 'تم حفظ الإعدادات بنجاح')}</span>
            </div>
          )}

          <form onSubmit={handleSaveGeneral} className="space-y-5 max-w-2xl">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">{t('settings.company_name', 'اسم المنشأة الافتراضي')}</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full bg-secondary border border-border rounded-lg px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">{t('settings.currency', 'العملة الأساسية')}</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="EGP">EGP - الجنيه المصري</option>
                  <option value="USD">USD - الدولار الأمريكي</option>
                  <option value="SAR">SAR - الريال السعودي</option>
                  <option value="AED">AED - الدرهم الإماراتي</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">{t('settings.timezone', 'المنطقة الزمنية')}</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Africa/Cairo">Africa/Cairo (توقيت القاهرة GMT+2/+3)</option>
                  <option value="Asia/Riyadh">Asia/Riyadh (توقيت الرياض GMT+3)</option>
                  <option value="Asia/Dubai">Asia/Dubai (توقيت دبي GMT+4)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t('settings.tax_rate_default', 'الافتراضي القانوني لضريبة القيمة المضافة في مصر: 14%')}
              </label>
              <input
                type="number"
                value={settings.tax_rate_default}
                onChange={(e) => setSettings({ ...settings, tax_rate_default: e.target.value })}
                className="w-full bg-secondary border border-border rounded-lg px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'جاري الحفظ...' : t('settings.save', 'حفظ التغييرات')}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: Licensing & Activation */}
      {activeTab === 'license' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          {licenseMsg && (
            <div
              className={`p-3.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                licenseMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
              }`}
            >
              {licenseMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{licenseMsg.text}</span>
            </div>
          )}

          {/* Current License Status Card */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">حالة الترخيص:</span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    licenseStatus?.is_activated
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : licenseStatus?.is_trial_active
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {licenseStatus?.is_activated
                    ? 'ترخيص تجاري دائم (Activated)'
                    : licenseStatus?.is_trial_active
                    ? `فترة تقييم تجريبية (متبقي ${licenseStatus.trial_days_left} أيام)`
                    : 'منتهي الصلاحية'}
                </span>
              </div>
              <div className="text-sm font-bold text-foreground">
                {licenseStatus?.licensee_name ? `المرخص له: ${licenseStatus.licensee_name}` : 'نسخة تقييم ميزان ERP'}
              </div>
              <div className="text-xs text-muted-foreground">
                الباقة: <span className="font-semibold text-primary uppercase">{licenseStatus?.tier}</span> • الوحدات المتاحة:{' '}
                {licenseStatus?.allowed_modules.join(', ')}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border">
              <div className="text-left font-mono text-xs">
                <div className="text-[10px] text-muted-foreground">معرف الجهاز (Machine ID)</div>
                <div className="font-bold text-foreground">{licenseStatus?.machine_id}</div>
              </div>
              <button
                onClick={handleCopyMachineId}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="نسخ معرف الجهاز"
              >
                {copiedMachineId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Activate License Form */}
          <form onSubmit={handleActivateLicense} className="space-y-3 max-w-2xl">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              <span>تفعيل ترخيص تجاري جديد (.mizan)</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              ألصق محتوى ملف الترخيص الرقمي الموقّع من مسؤول ميزان ERP لترقية باقتك أو تفعيل النسخة الدائمة.
            </p>

            <textarea
              rows={4}
              value={licenseInput}
              onChange={(e) => setLicenseInput(e.target.value)}
              placeholder="ألصق كود الترخيص هنا..."
              className="w-full bg-secondary border border-border rounded-lg p-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <button
              type="submit"
              disabled={activating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{activating ? 'جاري التحقق...' : 'تفعيل الترخيص'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          {backupMsg && (
            <div
              className={`p-3.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                backupMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
              }`}
            >
              {backupMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{backupMsg.text}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">إدارة النسخ الاحتياطي (SQLite WAL Checkpointed)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                يتم حفظ نسخ مطابقة تماماً بعد مزامنة ملفات الـ WAL لضمان سلامة العمليات المحاسبية.
              </p>
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={backupLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{backupLoading ? 'جاري النسخ...' : 'إنشاء نسخة احتياطية الآن'}</span>
            </button>
          </div>

          {/* Backup List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground">النسخ الاحتياطية المتوفرة محلياً</h4>
            {backups.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">لا توجد نسخ احتياطية مسجلة بعد.</p>
            ) : (
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {backups.map((b) => (
                  <div key={b.filename} className="p-3 bg-secondary/30 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-mono font-bold text-foreground">{b.filename}</div>
                      <div className="text-[10px] text-muted-foreground">
                        الحجم: {(b.size_bytes / 1024).toFixed(1)} KB • التاريخ: {b.created_at.split('T')[0]}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestoreBackup(b.file_path)}
                      disabled={backupLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-[11px] border border-amber-500/20 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>استعادة</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-foreground">تقارير وتشخيصات الأخطاء (Local Diagnostics)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              يقوم النظام بتسجيل الأخطاء البرمجية محلياً دون إرسال أي بيانات مالية أو شخصية للحفاظ على خصوصيتك الكاملة.
            </p>
          </div>

          {diagMsg && (
            <div className="p-3.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              {diagMsg}
            </div>
          )}

          <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3 max-w-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>خصوصية تامة: التقرير لا يحتوي على أي أرقام فواتير أو أسماء عملاء</span>
            </div>
            <button
              onClick={handleExportDiagnostics}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>تصدير ملف التشخيص (.json)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
