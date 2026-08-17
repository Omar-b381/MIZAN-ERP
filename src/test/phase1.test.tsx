import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import '../i18n/config';
import { formatCurrency } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';

describe('Phase 1 — Core Frontend Suites', () => {
  beforeEach(() => {
    useAuthStore.setState({
      currentUser: {
        id: 1,
        company_id: 1,
        username: 'admin',
        email: 'admin@mizan.local',
        full_name: 'مدير النظام',
        roles: [{ id: 1, name: 'Admin', description: 'Admin', created_at: '' }],
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
      activeView: 'dashboard',
      activeCompanyId: 1,
      companies: [
        {
          id: 1,
          name: 'شركة ميزان الرئيسية',
          currency: 'EGP',
          timezone: 'Africa/Cairo',
          country: 'EG',
          is_active: 1,
          created_at: '',
          updated_at: '',
        },
      ],
    });
  });

  it('renders application brand title and RTL default orientation', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'ميزان ERP' })).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('formats minor integer units accurately into EGP standard display', () => {
    const formattedEn = formatCurrency(5000000, 'EGP', 'en-EG');
    expect(formattedEn).toContain('50,000.00');

    const formattedAr = formatCurrency(5000000, 'EGP', 'ar-EG');
    expect(formattedAr).toContain('ج.م.');
  });

  it('renders Contacts directory view when activeView is contacts', async () => {
    useAuthStore.setState({ activeView: 'contacts' });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /دليل جهات الاتصال الموحد/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'العملاء' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'الموردون' })).toBeInTheDocument();
  });

  it('renders Module Manager and displays Core active permanently', async () => {
    useAuthStore.setState({ activeView: 'modules' });
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('الوحدات البرمجية').length).toBeGreaterThan(0);
      expect(screen.getByText('النواة الأساسية (Core)')).toBeInTheDocument();
      expect(screen.getByText('أساسي دائم')).toBeInTheDocument();
    });
  });

  it('renders Settings and displays Egyptian default constants', async () => {
    useAuthStore.setState({ activeView: 'settings' });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /إعدادات النظام العامة/i })).toBeInTheDocument();
      expect(screen.getByText(/الافتراضي القانوني لضريبة القيمة المضافة في مصر: 14%/i)).toBeInTheDocument();
    });
  });

  it('renders Companies & Branches view when activeView is companies', async () => {
    useAuthStore.setState({ activeView: 'companies' });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /الشركات والفروع/i })).toBeInTheDocument();
      expect(screen.getByText('إضافة شركة / فرع')).toBeInTheDocument();
    });
  });

  it('renders Users & RBAC Permissions view when activeView is users', async () => {
    useAuthStore.setState({ activeView: 'users' });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /المستخدمون والصلاحيات/i })).toBeInTheDocument();
      expect(screen.getByText(/RBAC Permissions Matrix/i)).toBeInTheDocument();
    });
  });

  it('renders Login view when user is logged out', async () => {
    useAuthStore.setState({ currentUser: null, activeView: 'login' });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /تسجيل الدخول للنظام/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /دخول سريع كمدير/i })).toBeInTheDocument();
    });
  });
});
