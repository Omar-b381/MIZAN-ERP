import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '../i18n/config';
import { useAuthStore } from '../stores/authStore';
import { PurchasesOrdersView } from '../components/purchases/PurchasesOrdersView';

describe('Phase 4 — Purchases & Vendor Orders Frontend Component Suites', () => {
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
          'purchases.view',
          'purchases.create',
          'purchases.edit',
          'purchases.confirm',
          'purchases.cancel',
        ],
      },
      activeView: 'purchases',
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

  it('renders Purchases view and lists seeded purchase order', async () => {
    render(<PurchasesOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('PO/2026/00001')).toBeInTheDocument();
      expect(screen.getByText('مؤسسة الأمل للتوريدات')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /إنشاء طلب شراء/i })).toBeInTheDocument();
  });

  it('displays correct KPI metrics for RFQs and confirmed purchase orders', async () => {
    render(<PurchasesOrdersView />);

    await waitFor(() => {
      expect(screen.getByText(/طلبات عروض الأسعار المفتوحة/i)).toBeInTheDocument();
      expect(screen.getByText(/أوامر الشراء المعتمدة/i)).toBeInTheDocument();
    });
  });
});
