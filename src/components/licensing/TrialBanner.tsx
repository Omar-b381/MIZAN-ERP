import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { TrialStatus } from '../../types';

interface TrialBannerProps {
  status: TrialStatus | null;
  onOpenActivation: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ status, onOpenActivation }) => {
  if (!status || status.is_activated || status.is_expired) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-primary/10 to-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-foreground transition-all">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
        <span className="font-semibold text-amber-800 dark:text-amber-300">
          فترة تقييم مجانية مفتوحة الصلاحيات: متبقي {status.trial_days_left} أيام
        </span>
        <span className="hidden md:inline text-muted-foreground">• كافة الوحدات والميزات مفعلة للاختبار</span>
      </div>

      <button
        onClick={onOpenActivation}
        className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-all shadow-sm text-[11px]"
      >
        <span>تفعيل الترخيص الدائم</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};
