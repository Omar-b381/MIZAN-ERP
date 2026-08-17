import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '../i18n/config';
import { useAuthStore } from '../stores/authStore';
import { InvoicesView } from '../components/accounting/InvoicesView';
import { JournalEntriesView } from '../components/accounting/JournalEntriesView';
import { PaymentsView } from '../components/accounting/PaymentsView';

describe('Phase 5 — Accounting, Invoicing & Payments Frontend Component Suites', () => {
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
          'accounting.view',
          'accounting.post',
          'invoices.view',
          'invoices.create',
          'invoices.post',
          'payments.view',
          'payments.create',
          'payments.post',
        ],
      },
      activeView: 'invoices',
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

  it('renders Invoices view and lists seeded customer invoice', async () => {
    render(<InvoicesView />);

    await waitFor(() => {
      expect(screen.getByText('INV/2026/00001')).toBeInTheDocument();
      expect(screen.getByText('شركة الأهرام للتجارة')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /\+ فاتورة عميل/i })).toBeInTheDocument();
  });

  it('renders JournalEntries view with Trial Balance and Chart of Accounts tabs', async () => {
    render(<JournalEntriesView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ميزان المراجعة/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /دليل الحسابات/i })).toBeInTheDocument();
    });
  });

  it('renders Payments view with receipt and payment action buttons', async () => {
    render(<PaymentsView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ سند قبض/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ سند صرف/i })).toBeInTheDocument();
    });
  });
});
