import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { PrintableDocumentData } from '../components/printing/PrintDocumentModal';

export const exportInvoiceToPdf = async (doc: PrintableDocumentData): Promise<void> => {
  // Create an offscreen A4 container with exact corporate template styling
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px'; // standard A4 pixel width at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'Cairo, system-ui, -apple-system, sans-serif';
  container.style.direction = 'rtl';
  container.style.padding = '40px';
  container.style.boxSizing = 'border-box';

  const docTitleAr =
    doc.docType === 'out_invoice'
      ? 'فاتورة مبيعات ضريبية'
      : doc.docType === 'in_invoice'
      ? 'فاتورة مشتريات / مطالبة مورد'
      : doc.docType === 'sale_order'
      ? 'أمر بيع معتمد'
      : doc.docType === 'purchase_order'
      ? 'أمر شراء وتوريد'
      : 'مستند تجاري رسمي';

  const docTitleEn =
    doc.docType === 'out_invoice'
      ? 'TAX INVOICE'
      : doc.docType === 'in_invoice'
      ? 'VENDOR BILL'
      : doc.docType === 'sale_order'
      ? 'SALES ORDER'
      : doc.docType === 'purchase_order'
      ? 'PURCHASE ORDER'
      : 'OFFICIAL DOCUMENT';

  const paymentStateText =
    doc.paymentState === 'paid'
      ? 'مدفوعة بالكامل (PAID)'
      : doc.paymentState === 'partial'
      ? 'سداد جزئي'
      : 'مستحقة للدفع';

  const paymentBadgeBg =
    doc.paymentState === 'paid' ? '#dcfce7' : '#fef3c7';
  const paymentBadgeColor =
    doc.paymentState === 'paid' ? '#15803d' : '#b45309';

  // Build HTML Template
  container.innerHTML = `
    <div style="border: 2px solid #1e293b; border-radius: 12px; padding: 24px; background: #ffffff;">
      <!-- Letterhead Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e293b; padding-bottom: 16px;">
        <div>
          <div style="font-size: 20px; font-weight: 900; color: #0f172a;">${doc.companyName || 'شركة ميزان للحلول والأنظمة المؤسسية'}</div>
          <div style="font-size: 11px; font-weight: 700; color: #4f46e5; letter-spacing: 1px; margin-top: 2px;">MIZAN ERP ENTERPRISE PLATFORM</div>
          <div style="font-size: 11px; color: #475569; margin-top: 8px; line-height: 1.6;">
            ${doc.companyTaxId ? `<div><strong>الرقم الضريبي:</strong> <span style="font-family: monospace;">${doc.companyTaxId}</span></div>` : ''}
            ${doc.companyCommercialReg ? `<div><strong>السجل التجاري:</strong> ${doc.companyCommercialReg}</div>` : ''}
            ${doc.companyAddress ? `<div><strong>العنوان:</strong> ${doc.companyAddress}</div>` : ''}
            ${doc.companyPhone ? `<div><strong>الهاتف:</strong> ${doc.companyPhone}</div>` : ''}
          </div>
        </div>

        <div style="text-align: left; direction: ltr;">
          <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 16px; font-weight: 900; color: #0f172a;">${docTitleAr}</div>
            <div style="font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 1.5px;">${docTitleEn}</div>
          </div>
          <div style="font-size: 11px; color: #334155; margin-top: 8px; line-height: 1.5; text-align: right; direction: rtl;">
            <div><strong>رقم المستند:</strong> <span style="font-family: monospace; font-weight: bold;">${doc.docNumber}</span></div>
            <div><strong>تاريخ التحرير:</strong> ${doc.date}</div>
            ${doc.dueDate ? `<div><strong>تاريخ الاستحقاق:</strong> ${doc.dueDate}</div>` : ''}
            ${doc.origin ? `<div><strong>المستند المرجعي:</strong> ${doc.origin}</div>` : ''}
            <div style="margin-top: 4px;">
              <span style="background: ${paymentBadgeBg}; color: ${paymentBadgeColor}; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                ${paymentStateText}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Partner Info Box -->
      <div style="margin: 16px 0; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; justify-content: space-between;">
        <div>
          <div style="font-size: 10px; font-weight: 700; color: #64748b;">بيانات العميل / المورد (Partner Details):</div>
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">${doc.partnerName}</div>
          ${doc.partnerAddress ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">${doc.partnerAddress}</div>` : ''}
          ${doc.partnerPhone ? `<div style="font-size: 11px; color: #475569;">الهاتف: ${doc.partnerPhone}</div>` : ''}
        </div>
        <div style="text-align: left; font-size: 11px; color: #334155;">
          ${doc.partnerTaxId ? `<div><strong>الرقم الضريبي:</strong> <span style="font-family: monospace;">${doc.partnerTaxId}</span></div>` : ''}
          <div style="margin-top: 4px;"><strong>العملة المعتمدة:</strong> ${doc.currency === 'EGP' ? 'جنيه مصري (EGP)' : doc.currency}</div>
        </div>
      </div>

      <!-- Line Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 11px; text-align: right;">
        <thead>
          <tr style="background: #1e293b; color: #ffffff; font-weight: bold;">
            <th style="padding: 8px 10px; border-radius: 0 6px 0 0;">#</th>
            <th style="padding: 8px 10px;">الوصف / اسم الصنف</th>
            <th style="padding: 8px 10px; text-align: center;">الكمية</th>
            <th style="padding: 8px 10px; text-align: center;">الوحدة</th>
            <th style="padding: 8px 10px; text-align: left;">سعر الوحدة</th>
            <th style="padding: 8px 10px; text-align: center;">الضريبة %</th>
            <th style="padding: 8px 10px; text-align: left; border-radius: 6px 0 0 0;">الإجمالي (ج.م)</th>
          </tr>
        </thead>
        <tbody>
          ${doc.lines
            .map(
              (l, idx) => `
            <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
              <td style="padding: 8px 10px; color: #64748b;">${idx + 1}</td>
              <td style="padding: 8px 10px; font-weight: 700; color: #0f172a;">${l.name}</td>
              <td style="padding: 8px 10px; text-align: center; font-weight: bold;">${(l.quantity || 1).toLocaleString('ar-EG')}</td>
              <td style="padding: 8px 10px; text-align: center; color: #475569;">${l.uom_name || 'وحدة'}</td>
              <td style="padding: 8px 10px; text-align: left; font-family: monospace;">${(l.price_unit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td style="padding: 8px 10px; text-align: center; color: #475569;">${l.tax_rate || 14}%</td>
              <td style="padding: 8px 10px; text-align: left; font-weight: bold; font-family: monospace;">${l.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <!-- Summary & Tafqeet -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 16px; padding-top: 12px; border-top: 1px solid #cbd5e1;">
        <div style="flex: 1; padding-left: 24px;">
          <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px;">
            <div style="color: #64748b; font-weight: bold;">المبلغ الإجمالي بالحروف (Tafqeet):</div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px;">
              فقط ${Math.floor(doc.amountTotal).toLocaleString('ar-EG')} جنيهاً مصرياً لا غير
            </div>
          </div>
          ${
            doc.note
              ? `<div style="font-size: 10px; color: #475569; margin-top: 8px;"><strong>ملاحظات:</strong> ${doc.note}</div>`
              : ''
          }
        </div>

        <div style="width: 260px; font-size: 11px; font-family: monospace;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
            <span>المجموع قبل الضريبة:</span>
            <span>${doc.amountUntaxed.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
            <span>ضريبة القيمة المضافة 14%:</span>
            <span>${doc.amountTax.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #0f172a; color: #ffffff; font-weight: bold; font-size: 13px; border-radius: 6px; margin-top: 6px;">
            <span>الإجمالي المستحق:</span>
            <span style="color: #4ade80;">${doc.amountTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م</span>
          </div>
        </div>
      </div>

      <!-- Signatures Footer -->
      <div style="display: flex; justify-content: space-around; margin-top: 40px; padding-top: 16px; border-top: 1px dashed #cbd5e1; font-size: 11px; text-align: center; color: #475569;">
        <div>
          <div style="font-weight: bold; margin-bottom: 24px;">توقيع واستلام العميل / المفوض</div>
          <div style="width: 140px; border-bottom: 1px solid #94a3b8; margin: 0 auto;"></div>
        </div>
        <div>
          <div style="font-weight: bold; margin-bottom: 24px;">ختم واعتماد الإدارة المالية</div>
          <div style="width: 140px; border-bottom: 1px solid #94a3b8; margin: 0 auto;"></div>
        </div>
      </div>

      <div style="text-align: center; font-size: 9px; color: #94a3b8; margin-top: 20px;">
        تم استخراج هذا المستند إلكترونياً واعتماده بواسطة نظام ميزان لإدارة المؤسسات (MIZAN ERP)
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
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
    const sanitizedNumber = doc.docNumber.replace(/[/\\?%*:|"<>]/g, '_');
    pdf.save(`${docTitleAr}_${sanitizedNumber}.pdf`);
  } catch (err) {
    console.error('Error generating PDF template:', err);
    throw err;
  } finally {
    document.body.removeChild(container);
  }
};
