import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, KeyRound, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';

export const LoginView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setCurrentUser, setActiveView } = useAuthStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRtl = i18n.language === 'ar';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await api.login({ username, password });
      if (user) {
        setCurrentUser(user);
        setActiveView('dashboard');
      } else {
        setError(t('auth.invalid_credentials'));
      }
    } catch (err: any) {
      setError(err?.message || 'Login error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = async () => {
    setUsername('admin');
    setPassword('admin123');
    setLoading(true);
    setError(null);
    try {
      const user = await api.login({ username: 'admin', password: 'admin123' });
      if (user) {
        setCurrentUser(user);
        setActiveView('dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Login error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
            م
          </div>
          <h2 className="text-xl font-bold text-foreground">{t('auth.login_title')}</h2>
          <p className="text-xs text-muted-foreground">{t('auth.login_subtitle')}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{t('auth.username')}</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{t('auth.password')}</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? t('common.loading') : t('auth.login_button')}</span>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Quick Demo Login */}
        <div className="pt-4 border-t border-border/60">
          <button
            type="button"
            onClick={handleQuickAdmin}
            className="w-full py-2 px-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('auth.quick_login')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
