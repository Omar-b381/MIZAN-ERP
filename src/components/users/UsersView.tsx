import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Plus, User as UserIcon, Lock, X } from 'lucide-react';
import { User, RoleWithPermissions } from '../../types';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export const UsersView: React.FC = () => {
  const { t } = useTranslation();
  const { activeCompanyId, hasPermission } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role_id: 3, // Staff default
  });

  const loadData = async () => {
    try {
      const [uData, rData] = await Promise.all([
        api.listUsers(activeCompanyId),
        api.listRoles(),
      ]);
      setUsers(uData);
      setRoles(rData);
    } catch (err) {
      console.error('Failed to load users & roles:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        company_id: activeCompanyId,
        username: formData.username,
        email: formData.email || undefined,
        password: formData.password,
        full_name: formData.full_name,
        role_ids: [formData.role_id],
      });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>{t('users.title')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">{t('users.title')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('users.subtitle')}</p>
        </div>

        {hasPermission('core.users.manage') && (
          <button
            onClick={() => {
              setFormData({
                username: '',
                full_name: '',
                email: '',
                password: '',
                role_id: 3,
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('users.add_user')}</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-secondary/20">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            قائمة المستخدمين في الفرع الحالي
          </h3>
        </div>
        <table className="w-full text-xs text-start">
          <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-semibold">
            <tr>
              <th className="py-3 px-4 text-start">{t('users.full_name')}</th>
              <th className="py-3 px-4 text-start">{t('auth.username')}</th>
              <th className="py-3 px-4 text-start">البريد الإلكتروني</th>
              <th className="py-3 px-4 text-start">{t('common.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <span>{user.full_name}</span>
                </td>
                <td className="py-3 px-4 font-mono text-muted-foreground">{user.username}</td>
                <td className="py-3 px-4 text-muted-foreground">{user.email || '-'}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold">
                    {user.is_active ? t('users.active') : t('users.inactive')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RBAC Roles & Permissions Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <span>هيكل الأدوار والصلاحيات (RBAC Permissions Matrix)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">{role.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono font-semibold">
                  Role ID #{role.id}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{role.description}</p>

              <div className="pt-2 border-t border-border/60 space-y-1.5">
                <div className="text-[11px] font-semibold text-foreground">الصلاحيات:</div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-mono"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">{t('users.add_user')}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">اسم المستخدم *</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">كلمة المرور *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">الدور الوظيفي (Role)</label>
                <select
                  value={formData.role_id}
                  onChange={(e) =>
                    setFormData({ ...formData, role_id: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                >
                  <option value={1}>Admin (مدير النظام)</option>
                  <option value={2}>Manager (مدير عمليات)</option>
                  <option value={3}>Staff (موظف عادي)</option>
                </select>
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
