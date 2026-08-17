import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrialBanner } from '../components/licensing/TrialBanner';
import { TrialExpiredModal } from '../components/licensing/TrialExpiredModal';
import { SettingsView } from '../components/settings/SettingsView';
import { TrialStatus } from '../types';
import { useAuthStore } from '../stores/authStore';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultVal?: string) => defaultVal || key,
    i18n: { language: 'ar', changeLanguage: vi.fn() },
  }),
}));

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

describe('Phase 8: Production Hardening & Licensing UI Suites', () => {
  beforeEach(() => {
    useAuthStore.setState({
      currentUser: {
        id: 1,
        company_id: 1,
        username: 'admin',
        email: 'admin@mizan.erp',
        full_name: 'مدير النظام',
        roles: [{ id: 1, name: 'admin', description: 'مدير', created_at: '2026-08-17' }],
        permissions: ['*'],
      },
      activeCompanyId: 1,
      activeView: 'settings',
    });
  });

  it('renders TrialBanner with remaining days when trial is active', () => {
    const trialStatus: TrialStatus = {
      is_activated: false,
      is_trial_active: true,
      is_expired: false,
      trial_days_left: 5,
      machine_id: 'MIZAN-TEST-1234',
      licensee_name: null,
      tier: 'trial_all_unlocked',
      allowed_modules: ['core', 'inventory', 'sales'],
      message: 'الفترة التجريبية نشطة',
    };

    const handleOpen = vi.fn();
    render(<TrialBanner status={trialStatus} onOpenActivation={handleOpen} />);

    expect(screen.getByText(/متبقي 5 أيام/i)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /تفعيل الترخيص الدائم/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleOpen).toHaveBeenCalledTimes(1);
  });

  it('does not render TrialBanner when system is activated', () => {
    const activeStatus: TrialStatus = {
      is_activated: true,
      is_trial_active: false,
      is_expired: false,
      trial_days_left: 0,
      machine_id: 'MIZAN-TEST-1234',
      licensee_name: 'شركة ميزان',
      tier: 'enterprise',
      allowed_modules: ['core'],
      message: 'الترخيص نشط',
    };

    const { container } = render(<TrialBanner status={activeStatus} onOpenActivation={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders TrialExpiredModal when trial has expired and allows copying machine ID', async () => {
    const expiredStatus: TrialStatus = {
      is_activated: false,
      is_trial_active: false,
      is_expired: true,
      trial_days_left: 0,
      machine_id: 'MIZAN-EXPIRED-7777',
      licensee_name: null,
      tier: 'expired',
      allowed_modules: ['core'],
      message: 'انتهت الفترة التجريبية',
    };

    const onActivated = vi.fn();
    render(<TrialExpiredModal status={expiredStatus} onActivated={onActivated} />);

    expect(screen.getByText(/انتهت الفترة التجريبية لنظام ميزان ERP/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('MIZAN-EXPIRED-7777')).toBeInTheDocument();

    // Test Machine ID copy button
    const copyBtn = screen.getByRole('button', { name: /نسخ/i });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('MIZAN-EXPIRED-7777');
  });

  it('renders SettingsView with General, License, Backup and Diagnostics tabs', async () => {
    render(<SettingsView />);

    // Check tabs
    expect(screen.getByText('الإعدادات العامة')).toBeInTheDocument();
    expect(screen.getByText('الترخيص وتفعيل المنتج')).toBeInTheDocument();
    expect(screen.getByText('النسخ الاحتياطي والاستعادة')).toBeInTheDocument();
    expect(screen.getByText('التشخيصات وسجلات النظام')).toBeInTheDocument();

    // Switch to License Tab
    fireEvent.click(screen.getByText('الترخيص وتفعيل المنتج'));
    await waitFor(() => {
      expect(screen.getByText(/معرف الجهاز/i)).toBeInTheDocument();
    });

    // Switch to Backup Tab
    fireEvent.click(screen.getByText('النسخ الاحتياطي والاستعادة'));
    await waitFor(() => {
      expect(screen.getByText(/إدارة النسخ الاحتياطي/i)).toBeInTheDocument();
      expect(screen.getByText(/إنشاء نسخة احتياطية الآن/i)).toBeInTheDocument();
    });

    // Switch to Diagnostics Tab
    fireEvent.click(screen.getByText('التشخيصات وسجلات النظام'));
    await waitFor(() => {
      expect(screen.getByText(/تقارير وتشخيصات الأخطاء/i)).toBeInTheDocument();
      expect(screen.getByText(/تصدير ملف التشخيص/i)).toBeInTheDocument();
    });
  });
});
