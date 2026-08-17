import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Globe, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentUser, companies, activeCompanyId, logout } = useAuthStore();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
  };

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || {
    id: 1,
    name: 'شركة ميزان الرئيسية',
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left / Start: Brand & Company Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
            م
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground leading-none">
              {t('app.title')}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t('app.tagline')}</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 border border-border/60 text-xs">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-muted-foreground">{t('companies.headquarters')}:</span>
          <span className="font-semibold text-foreground">{activeCompany.name}</span>
        </div>
      </div>

      {/* Right / End: Controls & User Info */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          aria-label={t('common.language')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-secondary text-xs font-medium transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
        </button>

        {/* User Pill */}
        {currentUser && (
          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="hidden md:block text-start">
              <div className="text-xs font-semibold text-foreground leading-tight">
                {currentUser.full_name}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Shield className="w-2.5 h-2.5 text-primary" />
                <span>{currentUser.roles?.[0]?.name || 'Admin'}</span>
              </div>
            </div>

            <button
              onClick={logout}
              title={t('auth.logout')}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
