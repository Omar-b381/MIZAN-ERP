import { create } from 'zustand';
import { SessionUser, Company } from '../types';

interface AuthState {
  currentUser: SessionUser | null;
  activeCompanyId: number;
  companies: Company[];
  activeView: string;
  setCurrentUser: (user: SessionUser | null) => void;
  setActiveCompanyId: (id: number) => void;
  setCompanies: (companies: Company[]) => void;
  setActiveView: (view: string) => void;
  hasPermission: (permissionKey: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: {
    id: 1,
    company_id: 1,
    username: 'admin',
    email: 'admin@mizan.local',
    full_name: 'مدير النظام',
    roles: [{ id: 1, name: 'Admin', description: 'مدير النظام مع صلاحيات كاملة', created_at: '' }],
    permissions: [
      'core.companies.view',
      'core.companies.manage',
      'core.users.view',
      'core.users.manage',
      'core.rbac.manage',
      'core.settings.view',
      'core.settings.manage',
      'core.modules.manage',
      'contacts.view',
      'contacts.create',
      'contacts.edit',
      'contacts.delete',
    ],
  },
  activeCompanyId: 1,
  companies: [],
  activeView: 'dashboard',
  setCurrentUser: (user) => set({ currentUser: user }),
  setActiveCompanyId: (id) => set({ activeCompanyId: id }),
  setCompanies: (companies) => set({ companies }),
  setActiveView: (view) => set({ activeView: view }),
  hasPermission: (permissionKey: string) => {
    const user = get().currentUser;
    if (!user) return false;
    if (user.roles.some((r) => r.name === 'Admin')) return true;
    return user.permissions.includes(permissionKey);
  },
  logout: () => set({ currentUser: null, activeView: 'login' }),
}));
