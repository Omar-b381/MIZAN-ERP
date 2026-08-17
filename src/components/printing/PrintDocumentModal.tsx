import React from 'react';
import {
  Printer,
  FileSpreadsheet,
  X,
  Building2,
  QrCode,
} from 'lucide-react';
import { api } from '../../lib/api';

export interface PrintableDocLine {
  id: number | string;
  name: string;
  quantity?: number;
  uom_name?: string;
  price_unit?: number;
  discount_percent?: number;
  tax_rate?: number;
  subtotal: number;
}

export interface PrintableDocumentData {
  docType: string;
  docNumber: string;
  date: string;
  dueDate?: string | null;
  origin?: string | null;
  paymentState?: string;
  companyName: string;
  companyTaxId?: string;
  companyCommercialReg?: string;
  companyPhone?: string;
  companyAddress?: string;
  partnerName: string;
  partnerTaxId?: string | null;
  partnerPhone?: string | null;
  partnerAddress?: string | null;
  currency: string;
  lines: PrintableDocLine[];
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  note?: string | null;
}

interface PrintDocumentModalProps {
  document: PrintableDocumentData;
  onClose: () => void;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({ document: doc, onClose }) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const getDocTitle = () => {
    switch (doc.docType) {
      case 'out_invoice':
        return { ar: 'فاتورة مبيعات ضريبية', en: 'TAX INVOICE', color: 'text-emerald-700' };
      case 'in_invoice':
        return { ar: 'فاتورة مشتريات / مطالبة مورد', en: 'VENDOR BILL', color: 'text-blue-700' };
      case 'sale_order':
        return { ar: 'أمر بيع معتمد', en: 'SALES ORDER', color: 'text-indigo-700' };
      case 'purchase_order':
        return { ar: 'أمر شراء توريد', en: 'PURCHASE ORDER', color: 'text-amber-700' };
      case 'payment_in':
        return { ar: 'سند قبض نقدية / بنك', en: 'RECEIPT VOUCHER', color: 'text-emerald-700' };
      case 'payment_out':
        return { ar: 'سند صرف نقدية / بنك', en: 'PAYMENT VOUCHER', color: 'text-rose-700' };
      default:
        return { ar: 'مستند مالي', en: 'FINANCIAL DOCUMENT', color: 'text-slate-800' };
    }
  };

  const docTitle = getDocTitle();

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const columns = [
        { key: 'index', title: '#', data_type: 'number' as const },
        { key: 'name', title: 'البيان / الصنف', data_type: 'text' as const },
        { key: 'qty', title: 'الكمية', data_type: 'number' as const },
        { key: 'unit_price', title: 'سعر الوحدة', data_type: 'currency' as const },
        { key: 'tax', title: 'الضريبة', data_type: 'percent' as const },
        { key: 'total', title: 'الإجمالي', data_type: 'currency' as const },
      ];

      const rows = doc.lines.map((l, i) => ({
        index: i + 1,
        name: l.name,
        qty: l.quantity || 1,
        unit_price: l.price_unit || 0,
        tax: l.tax_rate ? l.tax_rate / 100 : 0.14,
        total: l.subtotal,
      }));

      await api.exportReportToXlsx({
        title: `${docTitle.ar} - ${doc.docNumber}`,
        subtitle: `العميل / المورد: ${doc.partnerName}`,
        company_name: doc.companyName,
        date_range: doc.date,
        columns,
        rows,
        is_rtl: true,
      });
    } catch (err) {
      console.error('Failed to export document to Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Simple Arabic Tafqeet for standard amounts
  const formatTafqeet = (amount: number): string => {
    const integerPart = Math.floor(amount);
    const centsPart = Math.round((amount - integerPart) * 100);

    let result = `فقط ${integerPart.toLocaleString('ar-EG')} جنيهاً مصرياً`;
    if (centsPart > 0) {
      result += ` و ${centsPart} قرشاً`;
    }
    result += ' لا غير.';
    return result;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto print:shadow-none print:max-w-none print:w-full print:rounded-none">
        {/* Action Header - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 text-white print:hidden">
          <div className="flex items-center gap-3">
            <Printer className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold">معاينة وطباعة المستند</h3>
              <p className="text-xs text-slate-300">
                {docTitle.ar} — {doc.docNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-medium rounded-xl transition shadow-sm"
              title="تصدير إكسيل"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExporting ? 'جاري التصدير...' : 'تصدير إكسيل'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة المستند</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Sheet (Standard A4 Page) */}
        <div
          id="printable-document-sheet"
          className="p-8 sm:p-12 text-slate-800 bg-white font-sans print:p-6"
          dir="rtl"
        >
          {/* Header & Letterhead */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-800 pb-6">
            {/* Company Info */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-900 text-white rounded-lg">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {doc.companyName || 'شركة ميزان للحلول والأنظمة'}
                  </h1>
                  <span className="text-xs font-semibold text-indigo-700 uppercase tracking-widest">
                    MIZAN ERP CERTIFIED ENTERPRISE
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-600 space-y-0.5 pt-2">
                {doc.companyTaxId && (
                  <p>
                    <strong className="text-slate-800">الرقم الضريبي (Tax ID):</strong> {doc.companyTaxId}
                  </p>
                )}
                {doc.companyCommercialReg && (
                  <p>
                    <strong className="text-slate-800">السجل التجاري:</strong> {doc.companyCommercialReg}
                  </p>
                )}
                {doc.companyAddress && (
                  <p>
                    <strong className="text-slate-800">العنوان:</strong> {doc.companyAddress}
                  </p>
                )}
                {doc.companyPhone && (
                  <p>
                    <strong className="text-slate-800">الهاتف:</strong> {doc.companyPhone}
                  </p>
                )}
              </div>
            </div>

            {/* Document Metadata */}
            <div className="sm:text-left text-right space-y-2 border-t sm:border-t-0 pt-4 sm:pt-0 w-full sm:w-auto">
              <div className="inline-block bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                <h2 className={`text-lg font-black ${docTitle.color}`}>{docTitle.ar}</h2>
                <div className="text-[11px] font-bold text-slate-500 tracking-widest">{docTitle.en}</div>
              </div>
              <div className="text-xs space-y-1 text-slate-700 pt-1">
                <p className="flex justify-between sm:justify-start gap-4">
                  <span className="text-slate-500 font-medium">رقم المستند:</span>
                  <span className="font-mono font-bold text-slate-900">{doc.docNumber}</span>
                </p>
                <p className="flex justify-between sm:justify-start gap-4">
                  <span className="text-slate-500 font-medium">تاريخ التحرير:</span>
                  <span className="font-medium text-slate-900">{doc.date}</span>
                </p>
                {doc.dueDate && (
                  <p className="flex justify-between sm:justify-start gap-4">
                    <span className="text-slate-500 font-medium">تاريخ الاستحقاق:</span>
                    <span className="font-medium text-slate-900">{doc.dueDate}</span>
                  </p>
                )}
                {doc.origin && (
                  <p className="flex justify-between sm:justify-start gap-4">
                    <span className="text-slate-500 font-medium">المستند المرجعي:</span>
                    <span className="font-mono font-medium text-slate-900">{doc.origin}</span>
                  </p>
                )}
                {doc.paymentState && (
                  <div className="pt-1 flex justify-between sm:justify-start gap-2 items-center">
                    <span className="text-slate-500 font-medium">حالة السداد:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {doc.paymentState === 'paid'
                        ? 'مدفوعة بالكامل'
                        : doc.paymentState === 'partial'
                        ? 'سداد جزئي'
                        : 'مستحقة للدفع'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Party Card */}
          <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {doc.docType.includes('in_invoice') || doc.docType.includes('purchase')
                  ? 'بيانات المورد (Vendor Details)'
                  : 'بيانات العميل (Customer Details)'}
              </span>
              <p className="font-bold text-slate-900 text-base">{doc.partnerName}</p>
              {doc.partnerAddress && <p className="text-xs text-slate-600 mt-0.5">{doc.partnerAddress}</p>}
              {doc.partnerPhone && <p className="text-xs text-slate-600 mt-0.5">الهاتف: {doc.partnerPhone}</p>}
            </div>
            <div className="sm:text-left flex flex-col justify-center">
              {doc.partnerTaxId && (
                <p className="text-xs text-slate-700">
                  <span className="font-bold text-slate-900">الرقم الضريبي للعميل:</span>{' '}
                  <span className="font-mono">{doc.partnerTaxId}</span>
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                عملة المعاملة: <span className="font-bold text-slate-800">{doc.currency || 'EGP (ج.م)'}</span>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto my-6">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white uppercase text-[11px] font-bold">
                  <th className="py-2.5 px-3 rounded-r-lg w-10 text-center">#</th>
                  <th className="py-2.5 px-3">الصنف / البيان (Description)</th>
                  <th className="py-2.5 px-3 text-center w-20">الكمية</th>
                  <th className="py-2.5 px-3 text-left w-28">السعر الإفرادي</th>
                  <th className="py-2.5 px-3 text-center w-16">الضريبة</th>
                  <th className="py-2.5 px-3 text-left rounded-l-lg w-28">الإجمالي الصافي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {doc.lines.length > 0 ? (
                  doc.lines.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {item.name}
                        {item.uom_name && (
                          <span className="text-[10px] text-slate-500 block font-normal">
                            الوحدة: {item.uom_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-800">
                        {item.quantity?.toLocaleString('ar-EG') || '1'}
                      </td>
                      <td className="py-3 px-3 text-left font-mono font-medium text-slate-800" dir="ltr">
                        {item.price_unit?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-mono">
                        {item.tax_rate ? `${item.tax_rate}%` : '14%'}
                      </td>
                      <td className="py-3 px-3 text-left font-mono font-bold text-slate-900" dir="ltr">
                        {item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      لا توجد بنود مدرجة في هذا المستند
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Summary & Tafqeet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-4 border-t border-slate-200">
            {/* Tafqeet & Notes */}
            <div className="space-y-3">
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <span className="text-[11px] font-bold text-indigo-900 block mb-1">
                  المبلغ الإجمالي بالحروف (Tafqeet):
                </span>
                <p className="text-xs font-semibold text-indigo-950 leading-relaxed">
                  {formatTafqeet(doc.amountTotal)}
                </p>
              </div>

              {doc.note && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <strong className="text-slate-800 block mb-0.5">ملاحظات وشروط:</strong>
                  <p className="leading-relaxed">{doc.note}</p>
                </div>
              )}
            </div>

            {/* Numbers Summary Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>المجموع الخاضع للضريبة (Subtotal):</span>
                <span className="font-mono font-medium" dir="ltr">
                  {doc.amountUntaxed.toLocaleString('en-US', { minimumFractionDigits: 2 })} {doc.currency}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ضريبة القيمة المضافة 14% (VAT 14%):</span>
                <span className="font-mono font-medium" dir="ltr">
                  {doc.amountTax.toLocaleString('en-US', { minimumFractionDigits: 2 })} {doc.currency}
                </span>
              </div>
              <div className="border-t-2 border-slate-300 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                <span>الإجمالي النهائي الصافي (Net Total):</span>
                <span className="font-mono text-base text-indigo-700" dir="ltr">
                  {doc.amountTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {doc.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures & Verification Footer */}
          <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
            {/* Signature 1 */}
            <div className="space-y-12">
              <p className="font-bold text-slate-800">توقيع المستلم / العميل</p>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
            </div>

            {/* QR Verification */}
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="p-2 border border-slate-300 rounded-lg bg-white shadow-sm">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
              <span className="text-[10px] text-slate-500 font-mono">MIZAN VERIFIED QR</span>
            </div>

            {/* Signature 2 */}
            <div className="space-y-12">
              <p className="font-bold text-slate-800">اعتماد الإدارة والختم</p>
              <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            تم استخراج هذا المستند إلكترونياً عبر منظومة ميزان لإدارة الموارد المؤسسية (MIZAN ERP v1.1.0)
          </div>
        </div>
      </div>
    </div>
  );
};
