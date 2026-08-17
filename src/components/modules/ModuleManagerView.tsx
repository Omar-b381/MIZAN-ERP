import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Boxes,
  CheckCircle2,
  Lock,
  Power,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ModuleRecord } from '../../types';
import { api } from '../../lib/api';

interface ModuleManagerViewProps {
  modules: ModuleRecord[];
  onRefresh: () => void;
}

export const ModuleManagerView: React.FC<ModuleManagerViewProps> = ({
  modules,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'الكل / All' },
    { id: 'core', label: t('modules.core') },
    { id: 'operations', label: 'العمليات / Operations' },
    { id: 'finance', label: 'المالية / Finance' },
    { id: 'hr', label: 'الموارد البشرية / HR' },
  ];

  const filteredModules = modules.filter((m) => {
    if (activeCategory === 'all') return true;
    return m.category === activeCategory;
  });

  const handleToggle = async (mod: ModuleRecord) => {
    if (mod.key === 'core') return; // Guard: Core cannot be deactivated
    setUpdatingKey(mod.key);
    try {
      await api.toggleModule(mod.key, !mod.is_active);
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle module:', err);
    } finally {
      setUpdatingKey(null);
    }
  };

  const activeCount = modules.filter((m) => m.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Boxes className="w-5 h-5" />
            <span>{t('modules.title')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">
            {t('modules.title')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('modules.description')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">
              {activeCount} / {modules.length} {t('modules.active')}
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-foreground/80 hover:bg-secondary'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map((mod) => {
          const isCore = mod.key === 'core';
          const isPending = updatingKey === mod.key;

          return (
            <div
              key={mod.key}
              className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                mod.is_active
                  ? 'bg-card border-primary/40 shadow-sm ring-1 ring-primary/10'
                  : 'bg-card/50 border-border opacity-80 hover:opacity-100'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                        mod.is_active
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {mod.name}
                      </h3>
                      <span className="text-[10px] font-mono uppercase text-muted-foreground">
                        {mod.key}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      mod.is_active
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {mod.is_active ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        {t('modules.active')}
                      </>
                    ) : (
                      t('modules.inactive')
                    )}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {mod.description}
                </p>

                {mod.requires.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground">
                    <span>يتطلب:</span>
                    {mod.requires.map((req) => (
                      <span
                        key={req}
                        className="px-1.5 py-0.5 rounded bg-secondary text-foreground/80 font-mono"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button / Switch */}
              <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground capitalize">
                  {mod.category}
                </span>

                {isCore ? (
                  <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                    <Lock className="w-3 h-3" />
                    <span>أساسي دائم</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleToggle(mod)}
                    disabled={isPending}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      mod.is_active
                        ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>
                      {isPending
                        ? t('common.loading')
                        : mod.is_active
                        ? t('modules.deactivate')
                        : t('modules.activate')}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
