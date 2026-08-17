import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { ModuleRecord } from '../types';
import '../i18n/config';

describe('Phase 7 — Executive Dashboard & Comprehensive Analytics', () => {
  const mockModules: ModuleRecord[] = [
    { key: 'core', name: 'النواة الأساسية', is_active: true, description: 'نواة النظام', category: 'core', requires: [] },
    { key: 'inventory', name: 'المخزون', is_active: true, description: 'إدارة المخزون', category: 'operations', requires: [] },
    { key: 'sales', name: 'المبيعات', is_active: true, description: 'إدارة المبيعات', category: 'operations', requires: [] },
    { key: 'purchases', name: 'المشتريات', is_active: true, description: 'إدارة المشتريات', category: 'operations', requires: [] },
    { key: 'accounting', name: 'الحسابات العامة', is_active: true, description: 'الحسابات والفوترة', category: 'finance', requires: [] },
    { key: 'employees', name: 'الموارد البشرية', is_active: true, description: 'دليل الموظفين', category: 'hr', requires: [] },
  ];

  it('renders executive KPI cards across Sales, Purchases, Stock, and Cash Flow', async () => {
    render(<DashboardOverview modules={mockModules} />);

    await waitFor(() => {
      expect(screen.getByText(/لوحة المؤشرات التنفيذية المتكاملة/i)).toBeInTheDocument();
      expect(screen.getByText(/إجمالي مبيعات الفترة/i)).toBeInTheDocument();
      expect(screen.getByText(/إجمالي المشتريات المعتمدة/i)).toBeInTheDocument();
      expect(screen.getByText(/تقييم المخزون المتاح/i)).toBeInTheDocument();
      expect(screen.getByText(/رصيد السيولة النقدية والخزينة/i)).toBeInTheDocument();
    });

    // Check financial balances
    expect(screen.getByText(/الذمم المالية والتحصيلات/i)).toBeInTheDocument();
    expect(screen.getByText(/أرصدة العملاء المدينة/i)).toBeInTheDocument();
    expect(screen.getByText(/مستحقات الموردين الدائنة/i)).toBeInTheDocument();
  });

  it('renders Human Resources overview and workforce metrics', async () => {
    render(<DashboardOverview modules={mockModules} />);

    await waitFor(() => {
      expect(screen.getByText(/فريق العمل والموارد البشرية/i)).toBeInTheDocument();
      expect(screen.getByText(/إجمالي القوة العاملة على رأس العمل/i)).toBeInTheDocument();
    });
  });

  it('renders Quick Action action buttons', async () => {
    render(<DashboardOverview modules={mockModules} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ أمر بيع جديد/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ فاتورة مبيعات/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ سند قبض \/ صرف/i })).toBeInTheDocument();
    });
  });
});
