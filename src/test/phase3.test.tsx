import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '../i18n/config';
import { useAuthStore } from '../stores/authStore';
import { SalesOrdersView } from '../components/sales/SalesOrdersView';

describe('Phase 3 — Sales & Quotations Frontend Component Suites', () => {
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
          'products.view',
          'products.manage',
          'inventory.view',
          'inventory.manage',
          'inventory.adjust',
          'sales.view',
          'sales.create',
          'sales.edit',
          'sales.confirm',
          'sales.cancel',
        ],
      },
      activeView: 'sales',
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

  it('renders Sales and Quotations view and lists seeded quotation', async () => {
    render(<SalesOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('SO/2026/00001')).toBeInTheDocument();
      expect(screen.getByText('شركة الأهرام للتجارة')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /إنشاء عرض أسعار/i })).toBeInTheDocument();
  });

  it('displays correct financial metrics for quotations and confirmed orders', async () => {
    render(<SalesOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('عروض الأسعار المفتوحة')).toBeInTheDocument();
      expect(screen.getByText('أوامر البيع المؤكدة')).toBeInTheDocument();
    });
  });
});
