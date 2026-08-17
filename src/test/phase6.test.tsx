import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmployeesView } from '../components/hr/EmployeesView';
import { LeavesView } from '../components/hr/LeavesView';
import { AttendanceView } from '../components/hr/AttendanceView';
import '../i18n/config';

describe('Phase 6 — Human Resources (HR) Module', () => {
  it('renders employee directory and employee details', async () => {
    render(<EmployeesView />);

    await waitFor(() => {
      expect(screen.getAllByText(/دليل الموظفين/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText('أحمد محمود القاضي').length).toBeGreaterThan(0);
      expect(screen.getAllByText('سارة إبراهيم حسن').length).toBeGreaterThan(0);
    });

    // Check KPI metric cards
    expect(screen.getByText(/إجمالي عدد الموظفين/i)).toBeInTheDocument();
    expect(screen.getByText(/إجمالي الرواتب الشهرية الأساسية/i)).toBeInTheDocument();
  });

  it('renders leave requests and allows approval filtering', async () => {
    render(<LeavesView />);

    await waitFor(() => {
      expect(screen.getAllByText(/إدارة طلبات الإجازات/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/إجازة سنوية اعتيادية/i).length).toBeGreaterThan(0);
    });

    // Filter button for pending requests
    const filterBtn = screen.getByRole('button', { name: /بانتظار الاعتماد/i });
    fireEvent.click(filterBtn);
  });

  it('renders attendance register and daily work hours', async () => {
    render(<AttendanceView />);

    await waitFor(() => {
      expect(screen.getAllByText(/سجل الحضور والانصراف/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/إجمالي ساعات العمل المنجزة/i)).toBeInTheDocument();
      expect(screen.getAllByText(/حضور تام/i).length).toBeGreaterThan(0);
    });
  });
});
