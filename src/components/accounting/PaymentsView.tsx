import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  Wallet,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { AccountPayment, Partner, AccountJournal, CreatePaymentInput } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const PaymentsView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { activeCompanyId } = useAuthStore();

  const [payments, setPayments] = useState<AccountPayment[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [journals, setJournals] = useState<AccountJournal[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<CreatePaymentInput>({
    company_id: activeCompanyId,
    partner_id: 2,
    payment_type: 'inbound',
    amount_cents: 1000000,
    date: new Date().toISOString().split('T')[0],
    journal_id: 3, // Cash
    payment_method: 'cash',
    note: '',
  });

  const loadData = async () => {
    try {
      const [pList, partList, jList] = await Promise.all([
        api.listPayments(activeCompanyId),
        api.listPartners({ company_id: activeCompanyId, is_active: true }),
        api.listJournals(activeCompanyId),
      ]);
      setPayments(pList);
      setPartners(partList);
      setJournals(jList.filter((j) => j.type === 'cash' || j.type === 'bank'));
    } catch (err) {
      console.error('Failed to load payments data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId]);

  const handleOpenCreate = (type: 'inbound' | 'outbound') => {
    const initialPartner =
      partners.find((p) => (type === 'inbound' ? p.sub_type === 'customer' : p.sub_type === 'vendor')) ||
      partners[0];

    setFormData({
      company_id: activeCompanyId,
      partner_id: initialPartner?.id || 2,
      payment_type: type,
      amount_cents: 100000,
      date: new Date().toISOString().split('T')[0],
      journal_id: journals[0]?.id || 3,
      payment_method: 'cash',
      note: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAndPostPayment(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save payment:', err);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (selectedType !== 'all' && p.payment_type !== selectedType) return false;
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.partner_name && p.partner_name.toLowerCase().includes(term)) ||
      (p.note && p.note.toLowerCase().includes(term))
    );
  });

  const totalInboundCents = payments
    .filter((p) => p.payment_type === 'inbound' && p.state === 'posted')
    .reduce((s, p) => s + p.amount_cents, 0);

  const totalOutboundCents = payments
    .filter((p) => p.payment_type === 'outbound' && p.state === 'posted')
    .reduce((s, p) => s + p.amount_cents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <CreditCard className="w-5 h-5" />
            <span>{t('payments.title', 'سندات القبض والصرف (المدفوعات والمقبوضات)')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">
            {t('payments.title', 'سندات القبض والصرف')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('payments.subtitle', 'سندات القبض من العملاء، سندات الصرف للموردين، والترحيل التلقائي للخزينة والبنك')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenCreate('inbound')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ سند قبض (تحصيل)</span>
          </button>
          <button
            onClick={() => handleOpenCreate('outbound')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors border border-border shadow-sm"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ سند صرف (دفع)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">إجمالي المقبوضات (المحصل من العملاء)</div>
            <div className="text-lg font-bold text-foreground">
              {formatCurrency(totalInboundCents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">إجمالي المدفوعات (المدفوع للموردين)</div>
            <div className="text-lg font-bold text-foreground">
              {formatCurrency(totalOutboundCents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">صافي السيولة النقدية المحصلة</div>
            <div className="text-lg font-bold text-foreground font-mono">
              {formatCurrency(totalInboundCents - totalOutboundCents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-secondary/50 p-1 rounded-lg border border-border text-xs">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-md font-semibold ${
              selectedType === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            جميع السندات
          </button>
          <button
            onClick={() => setSelectedType('inbound')}
            className={`px-3 py-1 rounded-md font-semibold ${
              selectedType === 'inbound' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            سندات قبض (عملاء)
          </button>
          <button
            onClick={() => setSelectedType('outbound')}
            className={`px-3 py-1 rounded-md font-semibold ${
              selectedType === 'outbound' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            سندات صرف (موردين)
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم السند، الطرف، البيان..."
            className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-start text-xs">
          <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
            <tr>
              <th className="py-3.5 px-4 text-start">رقم السند</th>
              <th className="py-3.5 px-4 text-start">نوع المعاملة</th>
              <th className="py-3.5 px-4 text-start">الطرف (العميل / المورد)</th>
              <th className="py-3.5 px-4 text-start">التاريخ</th>
              <th className="py-3.5 px-4 text-start">دفتر اليومية</th>
              <th className="py-3.5 px-4 text-start">طريقة الدفع</th>
              <th className="py-3.5 px-4 text-start">المبلغ (ج.م)</th>
              <th className="py-3.5 px-4 text-start">البيان / ملاحظات</th>
              <th className="py-3.5 px-4 text-start">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-muted-foreground">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>لا توجد سندات قبض أو صرف مسجلة</p>
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">{p.name}</td>
                  <td className="py-3.5 px-4">
                    {p.payment_type === 'inbound' ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>سند قبض (تحصيل)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>سند صرف (دفع)</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground">{p.partner_name || `طرف #${p.partner_id}`}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">{p.date}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">{p.journal_name || 'خزينة'}</td>
                  <td className="py-3.5 px-4 capitalize text-muted-foreground">{p.payment_method}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    {formatCurrency(p.amount_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">{p.note || '-'}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      مرحل ومعتمد
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <CreditCard className="w-5 h-5 text-primary" />
                <span>
                  {formData.payment_type === 'inbound' ? 'تسجيل سند قبض نقدية / بنك' : 'تسجيل سند صرف نقدية / بنك'}
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  {formData.payment_type === 'inbound' ? 'العميل المستلم منه' : 'المورد المدفوع له'} *
                </label>
                <select
                  value={formData.partner_id}
                  onChange={(e) => setFormData({ ...formData, partner_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sub_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">مبلغ السند (ج.م) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={((formData.amount_cents || 0) / 100).toFixed(2)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono font-bold text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">دفتر الخزينة / البنك</label>
                  <select
                    value={formData.journal_id}
                    onChange={(e) => setFormData({ ...formData, journal_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    {journals.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name} ({j.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">طريقة الدفع</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="cash">نقداً (Cash)</option>
                    <option value="bank_transfer">تحويل بنكي (Bank Transfer)</option>
                    <option value="cheque">شيك مصرفي (Cheque)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">البيان / ملاحظات المعاملة</label>
                <textarea
                  rows={2}
                  value={formData.note || ''}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="وصف سبب القبض / الصرف..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-foreground font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm"
                >
                  ترحيل وتأكيد السند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
