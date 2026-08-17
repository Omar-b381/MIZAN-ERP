import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { History, Shield, RefreshCw } from 'lucide-react';
import { ActivityLog } from '../../types';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export const ActivityLogView: React.FC = () => {
  const { t } = useTranslation();
  const { activeCompanyId } = useAuthStore();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await api.getRecentActivities(activeCompanyId, 50);
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [activeCompanyId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <History className="w-5 h-5" />
            <span>{t('activity.title')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">{t('activity.title')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('activity.subtitle')}</p>
        </div>

        <button
          onClick={loadActivities}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث السجل</span>
        </button>
      </div>

      {/* Timeline List */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">{t('activity.empty')}</p>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border/80 text-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground capitalize">
                      {act.entity_type} • <span className="text-primary">{act.action}</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(act.created_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <p className="text-foreground/90 font-medium">{act.summary}</p>
                  {act.details_json && (
                    <pre className="text-[10px] bg-background/80 p-2 rounded border border-border/60 overflow-x-auto text-muted-foreground font-mono mt-1">
                      {act.details_json}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
