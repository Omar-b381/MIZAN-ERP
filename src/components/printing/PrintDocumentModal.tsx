import React, { useState } from 'react';
import {
  Printer,
  FileSpreadsheet,
  Download,
  X,
  Building2,
  QrCode,
  FileCheck,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const getDocTitle = () => {
    switch (doc.docType) {
      case 'out_invoice':
        return { ar: 'فاتورة مبيعات ضريبية', en: 'TAX INVOICE', color: 'text-emerald-700' };
      case 'in_invoice':
        return { ar: 'فاتورة مشتريات / مطالبة مورد', en: 'VENDOR BILL', color: 'text-blue-700' };
      case 'sale_order':
        return { ar: 'أمر بيع معتمد', en: 'SALES ORDER', color: 'text-indigo-700' };
      case 'purchase_order':
        return { ar: 'أمر شراء وتوريد', en: 'PURCHASE ORDER', color: 'text-purple-700' };
      case 'payment_in':
        return { ar: 'سند قبض نقدية وبنوك', en: 'OFFICIAL RECEIPT VOUCHER', color: 'text-teal-700' };
      case 'payment_out':
        return { ar: 'سند صرف نقدية وبنوك', en: 'PAYMENT VOUCHER', color: 'text-amber-700' };
      default:
        return { ar: 'مستند أعمال رسمي', en: 'COMMERCIAL DOCUMENT', color: 'text-slate-800' };
    }
  };

  const docTitle = getDocTitle();

  // Arabic Tafqeet Helper
  const numberToArabicWords = (amount: number): string => {
    if (amount === 0) return 'صفر';
    const integerPart = Math.floor(amount);
    return `فقط ${integerPart.toLocaleString('ar-EG')} جنيهاً مصرياً لا غير`;
  };

  // Direct Hardware Printing
  const handleDirectPrint = () => {
    window.print();
  };

  // Direct PDF Save without browser dialog
  const handleSavePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const sheet = window.document.getElementById('printable-document-sheet');
      if (!sheet) return;

      const canvas = await html2canvas(sheet, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const sanitizedDocNum = doc.docNumber.replace(/[/\\?%*:|"<>]/g, '_');
      pdf.save(`${docTitle.ar}_${sanitizedDocNum}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Direct Native Excel Export
  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const columns = [
        { key: 'item', title: 'البند / الصنف', data_type: 'text' as const },
        { key: 'qty', title: 'الكمية', data_type: 'number' as const },
        { key: 'uom', title: 'الوحدة', data_type: 'text' as const },
        { key: 'price', title: 'سعر الوحدة (ج.م)', data_type: 'currency' as const },
        { key: 'tax', title: 'نسبة الضريبة (%)', data_type: 'number' as const },
        { key: 'total', title: 'الإجمالي الصافي (ج.م)', data_type: 'currency' as const },
      ];

      const rows = doc.lines.map((l) => ({
        item: l.name,
        qty: l.quantity || 1,
        uom: l.uom_name || 'وحدة',
        price: l.price_unit || 0,
        tax: l.tax_rate || 0,
        total: l.subtotal,
      }));

      await api.exportReportToXlsx({
        title: `${docTitle.ar} — ${doc.docNumber}`,
        subtitle: `الطرف: ${doc.partnerName} | التاريخ: ${doc.date}`,
        company_name: doc.companyName,
        date_range: doc.date,
        columns,
        rows,
        is_rtl: true,
      });
    } catch (err) {
      console.error('Failed to export document to Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto print:shadow-none print:max-w-none print:w-full print:rounded-none">
        {/* Action Header - Hidden on Print */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 bg-slate-800 text-white gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <Printer className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold">معاينة وطباعة وتصدير المستند</h3>
              <p className="text-xs text-slate-300">
                {docTitle.ar} — {doc.docNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Save Direct PDF */}
            <button
              onClick={handleSavePdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-sm"
              title="حفظ مباشر كملف PDF عالي الجودة"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'جاري تجهيز PDF...' : 'حفظ كملف PDF'}</span>
            </button>

            {/* Direct Hardware Print */}
            <button
              onClick={handleDirectPrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-md"
              title="إرسال أمر طباعة مباشر إلى الطابعة"
            >
              <Printer className="w-4 h-4" />
              <span>أمر طباعة مباشر</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-sm"
              title="تصدير بيانات المستند إلى ملف إكسيل"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExportingExcel ? 'جاري...' : 'إكسيل'}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition mr-auto sm:mr-0"
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
                    <strong className="text-slate-800">الرقم الضريبي (Tax ID):</strong>{' '}
                    <span className="font-mono">{doc.companyTaxId}</span>
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
                العملة المعتمدة:{' '}
                <strong className="text-slate-800 font-mono">
                  {doc.currency === 'EGP' ? 'جنيه مصري (EGP)' : doc.currency}
                </strong>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto my-6">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white font-bold">
                  <th className="p-3 rounded-r-lg">#</th>
                  <th className="p-3">الوصف / اسم الصنف والمنتج</th>
                  <th className="p-3 text-center">الكمية</th>
                  <th className="p-3 text-center">الوحدة</th>
                  <th className="p-3 text-left">سعر الوحدة</th>
                  <th className="p-3 text-center">الخصم %</th>
                  <th className="p-3 text-center">الضريبة %</th>
                  <th className="p-3 text-left rounded-l-lg">الإجمالي الصافي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {doc.lines.map((line, idx) => (
                  <tr key={line.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-500 font-sans">{idx + 1}</td>
                    <td className="p-3 font-sans font-bold text-slate-900">{line.name}</td>
                    <td className="p-3 text-center font-bold text-slate-800">
                      {(line.quantity || 1).toLocaleString('ar-EG')}
                    </td>
                    <td className="p-3 text-center font-sans text-slate-600">{line.uom_name || 'وحدة'}</td>
                    <td className="p-3 text-left text-slate-700">
                      {(line.price_unit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center text-slate-600">{line.discount_percent || 0}%</td>
                    <td className="p-3 text-center text-slate-600">{line.tax_rate || 14}%</td>
                    <td className="p-3 text-left font-bold text-slate-900">
                      {line.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Arabic Tafqeet Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 my-6 pt-4 border-t border-slate-200">
            {/* Arabic Tafqeet & QR Verification */}
            <div className="sm:col-span-7 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  المبلغ الإجمالي كتابةً بالحروف (Tafqeet):
                </span>
                <p className="text-sm font-extrabold text-slate-900">{numberToArabicWords(doc.amountTotal)}</p>
              </div>

              {doc.note && (
                <div className="text-xs text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                  <strong className="text-slate-800">ملاحظات وشروط:</strong> {doc.note}
                </div>
              )}

              {/* QR Verification Badge */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 w-fit">
                <QrCode className="w-10 h-10 text-slate-800" />
                <div className="text-[11px]">
                  <span className="font-bold text-slate-900 block">فحص وتوثيق المستند إلكترونياً</span>
                  <span className="text-slate-500 font-mono">ZATCA / ETA Standard Verification</span>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="sm:col-span-5 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 text-slate-600 border-b border-slate-100">
                <span className="font-sans">المجموع قبل الضريبة (Untaxed):</span>
                <span className="font-bold text-slate-800">
                  {doc.amountUntaxed.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                </span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-600 border-b border-slate-100">
                <span className="font-sans">ضريبة القيمة المضافة 14% (VAT):</span>
                <span className="font-bold text-slate-800">
                  {doc.amountTax.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                </span>
              </div>
              <div className="flex justify-between py-2.5 px-3 rounded-xl bg-slate-900 text-white font-bold text-sm">
                <span className="font-sans">الإجمالي النهائي المستحق:</span>
                <span className="text-emerald-400 font-black">
                  {doc.amountTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Signatures & Footer */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-dashed border-slate-300 text-xs text-center">
            <div>
              <p className="font-bold text-slate-700 mb-8">توقيع المستلم / العميل المعتمد</p>
              <div className="w-40 border-b border-slate-400 mx-auto"></div>
            </div>
            <div>
              <p className="font-bold text-slate-700 mb-8">توقيع وختم الإدارة المالية / الشركة</p>
              <div className="w-40 border-b border-slate-400 mx-auto"></div>
            </div>
          </div>

          {/* System watermark */}
          <div className="text-center text-[10px] text-slate-400 mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-1">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>تم استخراج هذا المستند آلياً بواسطة نظام ميزان لإدارة المؤسسات (MIZAN ERP)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
