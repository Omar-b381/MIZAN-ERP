import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PrintDocumentModal, PrintableDocumentData } from '../components/printing/PrintDocumentModal';
import { ReportsView } from '../components/reports/ReportsView';
import { InvoicesView } from '../components/accounting/InvoicesView';
import '../i18n/config';

describe('Phase 9 — Printing, Reports & Data Export Engine', () => {
  const mockPrintDoc: PrintableDocumentData = {
    docType: 'out_invoice',
    docNumber: 'INV/2026/00001',
    date: '2026-08-17',
    dueDate: '2026-09-17',
    origin: 'SO/2026/00001',
    paymentState: 'paid',
    companyName: 'شركة ميزان للتجارة والصناعة',
    companyTaxId: '100-245-890',
    companyCommercialReg: 'س.ت 44820',
    companyPhone: '+20 2 2456 7890',
    companyAddress: 'القاهرة، مصر',
    partnerName: 'شركة الأهرام للتجارة',
    partnerTaxId: '998-112-334',
    partnerPhone: '01012345678',
    partnerAddress: 'مدينة نصر، القاهرة',
    currency: 'EGP',
    lines: [
      {
        id: 1,
        name: 'Dell Latitude 5530 Business Laptop',
        quantity: 2,
        uom_name: 'قطعة',
        price_unit: 35000,
        discount_percent: 0,
        tax_rate: 14,
        subtotal: 70000,
      },
    ],
    amountUntaxed: 70000,
    amountTax: 9800,
    amountTotal: 79800,
    note: 'تسليم المخزن الرئيسي',
  };

  it('renders PrintDocumentModal with complete bilingual letterhead, QR, and Arabic Tafqeet', async () => {
    const handleClose = vi.fn();
    render(<PrintDocumentModal document={mockPrintDoc} onClose={handleClose} />);

    // Header & Letterhead
    expect(screen.getByText('شركة ميزان للتجارة والصناعة')).toBeInTheDocument();
    expect(screen.getByText('فاتورة مبيعات ضريبية')).toBeInTheDocument();
    expect(screen.getByText('TAX INVOICE')).toBeInTheDocument();
    expect(screen.getByText('INV/2026/00001')).toBeInTheDocument();
    expect(screen.getByText(/100-245-890/)).toBeInTheDocument();

    // Partner
    expect(screen.getByText('شركة الأهرام للتجارة')).toBeInTheDocument();

    // Items table
    expect(screen.getByText('Dell Latitude 5530 Business Laptop')).toBeInTheDocument();

    // Totals & Tafqeet
    expect(screen.getByText(/فقط ٧٩٬٨٠٠ جنيهاً مصرياً/)).toBeInTheDocument();

    // Action buttons
    expect(screen.getByRole('button', { name: /حفظ كملف PDF/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /أمر طباعة مباشر/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /إكسيل/i })).toBeInTheDocument();
  });

  it('renders ReportsView with all report categories for active modules', async () => {
    const activeModules = ['accounting', 'sales', 'purchases', 'stock'];
    render(<ReportsView companyId={1} activeModules={activeModules} />);

    await waitFor(() => {
      expect(screen.getByText(/التقارير والمستخرجات والتحليلات/i)).toBeInTheDocument();
      expect(screen.getByText(/التقارير المالية ودفاتر الحسابات/i)).toBeInTheDocument();
      expect(screen.getByText(/تقارير المبيعات والعملاء/i)).toBeInTheDocument();
      expect(screen.getByText(/تقارير المشتريات والموردين/i)).toBeInTheDocument();
      expect(screen.getByText(/تقارير المخزون والمستودعات/i)).toBeInTheDocument();
    });

    // Verify presence of Trial Balance metrics
    expect(screen.getAllByText(/ميزان المراجعة/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /تصدير إكسيل/i })).toBeInTheDocument();
  });

  it('renders InvoicesView with Batch Zip Export and Document Print capabilities', async () => {
    render(<InvoicesView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /تصدير مجمع \(ZIP\)/i })).toBeInTheDocument();
    });
  });
});
