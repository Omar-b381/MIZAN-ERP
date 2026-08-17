import React, { useState } from 'react';
import { Lock, KeyRound, Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { TrialStatus } from '../../types';
import { api } from '../../lib/api';

interface TrialExpiredModalProps {
  status: TrialStatus;
  onActivated: (updated: TrialStatus) => void;
}

export const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({ status, onActivated }) => {
  const [licenseText, setLicenseText] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(status.machine_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseText.trim()) {
      setErrorMsg('يرجى لصق محتوى ملف الترخيص .mizan أولاً');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const updated = await api.activateLicense(licenseText.trim());
      onActivated(updated);
    } catch (err: any) {
      setErrorMsg(err.toString() || 'فشل التحقق من صحة الترخيص');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 mx-auto flex items-center justify-center shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">انتهت الفترة التجريبية لنظام ميزان ERP</h2>
          <p className="text-xs text-muted-foreground">
            شكراً لتقييمك لمنظومة ميزان ERP. يرجى تفعيل الترخيص التجاري الدائم لمتابعة استخدام النظام.
          </p>
        </div>

        {/* Data Protection Guarantee */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">بياناتك ومستنداتك محفوظة بأمان تام: </span>
            <span>كافة الفواتير، الحسابات، المخزون، وسجلات الموظفين المسجلة محفوظة محلياً بنسبة 100% وستكون متاحة فور التفعيل.</span>
          </div>
        </div>

        {/* Step 1: Copy Machine ID */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>الخطوة 1: معرف جهازك (Machine ID)</span>
            <span className="text-[10px] text-muted-foreground">أرسل هذا المعرف للحصول على ملف الترخيص</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={status.machine_id}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
            </button>
          </div>
        </div>

        {/* Step 2: Paste or import license */}
        <form onSubmit={handleActivate} className="space-y-3">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>الخطوة 2: محتوى ملف الترخيص (.mizan)</span>
          </label>
          <textarea
            rows={4}
            value={licenseText}
            onChange={(e) => setLicenseText(e.target.value)}
            placeholder="الصق كود الترخيص المشفر هنا أو محتوى ملف .mizan..."
            className="w-full bg-secondary/50 border border-border rounded-lg p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2.5 flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isSubmitting ? 'جاري التحقق من الترخيص...' : 'تفعيل الترخيص الدائم الآن'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
