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
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{ licensee?: string; tier?: string; machine_id?: string; expires_at?: string | null } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
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

  const parseLicenseText = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (parsed.payload_json) {
        const payload = JSON.parse(parsed.payload_json);
        setParsedPreview(payload);
      } else if (parsed.licensee) {
        setParsedPreview(parsed);
      } else {
        setParsedPreview(null);
      }
    } catch {
      setParsedPreview(null);
    }
  };

  const processLicenseFile = (file: File) => {
    if (!file) return;
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setLicenseInput(content.trim());
        parseLicenseText(content.trim());
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processLicenseFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processLicenseFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

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
      setSelectedFileName(null);
      setParsedPreview(null);
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
          <form onSubmit={handleActivateLicense} className="space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              <span>تفعيل ترخيص تجاري جديد (.mizan)</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              يمكنك رفع ملف الترخيص الرقمي الموقّع مباشرةً (.mizan) أو سحبه وإسقاطه هنا، أو لصق محتواه يدوياً.
            </p>

            {/* Hidden Native File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".mizan,.json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Drag & Drop File Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                selectedFileName
                  ? 'border-primary bg-primary/5 hover:bg-primary/10'
                  : 'border-border/80 hover:border-primary/60 bg-secondary/30 hover:bg-secondary/60'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">
                  {selectedFileName ? (
                    <span className="text-primary font-mono font-semibold flex items-center gap-1.5 justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {selectedFileName}
                    </span>
                  ) : (
                    'انقر هنا لاختيار ملف الترخيص (.mizan) أو اسحبه إلى هنا'
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  يدعم ملفات التراخيص المشفرة الرقمية (.mizan, .json)
                </p>
              </div>
            </div>

            {/* License Payload Preview Card (if valid JSON parsed) */}
            {parsedPreview && (
              <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 text-xs space-y-1.5 animate-fadeIn">
                <div className="font-bold text-primary flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>معلومات الترخيص المكتشف في الملف:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-foreground text-[11px] pt-1">
                  <div>
                    <span className="text-muted-foreground">المرخص له: </span>
                    <span className="font-semibold">{parsedPreview.licensee || 'غير محدد'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الباقة: </span>
                    <span className="font-semibold uppercase text-primary">{parsedPreview.tier || 'Enterprise'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الجهاز المستهدف: </span>
                    <span className="font-mono">{parsedPreview.machine_id || '*'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">المدة: </span>
                    <span className="font-semibold">{parsedPreview.expires_at ? parsedPreview.expires_at.slice(0, 10) : 'دائم مدى الحياة (Perpetual)'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Textarea Fallback for manual copy/paste */}
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                أو ألصق كود الترخيص يدوياً (JSON):
              </label>
              <textarea
                rows={3}
                value={licenseInput}
                onChange={(e) => {
                  setLicenseInput(e.target.value);
                  parseLicenseText(e.target.value);
                }}
                placeholder="ألصق كود الترخيص هنا في حال لم تختر ملفاً..."
                className="w-full bg-secondary border border-border rounded-lg p-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={activating || !licenseInput.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <KeyRound className="w-4 h-4" />
              <span>{activating ? 'جاري التفعيل والتحقق...' : 'تفعيل وحفظ الترخيص الدائم'}</span>
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
