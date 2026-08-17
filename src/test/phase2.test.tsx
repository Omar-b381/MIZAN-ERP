import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '../i18n/config';
import { useAuthStore } from '../stores/authStore';
import { ProductsView } from '../components/products/ProductsView';
import { InventoryStockView } from '../components/inventory/InventoryStockView';
import { TransfersView } from '../components/inventory/TransfersView';
import { InventoryAdjustmentsView } from '../components/inventory/InventoryAdjustmentsView';
import { LocationsView } from '../components/inventory/LocationsView';

describe('Phase 2 — Products & Inventory Frontend Component Suites', () => {
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

  it('renders Products catalog view and lists seeded items', async () => {
    render(<ProductsView />);

    await waitFor(() => {
      expect(screen.getByText('PROD-DELL-5530')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /إضافة صنف جديد/i })).toBeInTheDocument();
  });

  it('renders Real-Time Stock On Hand Matrix', async () => {
    render(<InventoryStockView />);

    await waitFor(() => {
      expect(screen.getAllByText('المخزن الرئيسي / Stock').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('SN-DELL-001')).toBeInTheDocument();
  });

  it('renders Stock Transfers and Operations View', async () => {
    render(<TransfersView />);

    await waitFor(() => {
      expect(screen.getByText('WH/IN/00001')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /إنشاء إذن نقل/i })).toBeInTheDocument();
  });

  it('renders Physical Inventory Adjustments Reconciliation View', async () => {
    render(<InventoryAdjustmentsView />);

    await waitFor(() => {
      expect(screen.getAllByText(/جرد مستودع القاهرة/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByRole('button', { name: /بدء جلسة جرد جديدة/i })).toBeInTheDocument();
  });

  it('renders Stock Locations and Warehouses Hierarchy View', async () => {
    render(<LocationsView />);

    await waitFor(() => {
      expect(screen.getByText(/المستودع الرئيسي - القاهرة/i)).toBeInTheDocument();
      expect(screen.getAllByText(/المواقع الافتراضية \/ المستودع الرئيسي/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByRole('button', { name: /إضافة موقع \/ رف جديد/i })).toBeInTheDocument();
  });
});
