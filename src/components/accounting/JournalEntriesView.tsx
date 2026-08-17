import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Plus,
  Search,
  Scale,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  PlusCircle,
  FolderTree,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import {
  Account,
  AccountJournal,
  AccountMove,
  TrialBalanceRow,
  CreateJournalEntryInput,
  CreateJournalEntryLineInput,
} from '../../types';
import { formatCurrency } from '../../lib/utils';

export const JournalEntriesView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { activeCompanyId } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'entries' | 'coa' | 'trial_balance'>('entries');
  const [moves, setMoves] = useState<AccountMove[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<AccountJournal[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<CreateJournalEntryInput>({
    company_id: activeCompanyId,
    journal_id: 5, // MISC
    date: new Date().toISOString().split('T')[0],
    origin: '',
    note: '',
    lines: [
      { account_id: 1, partner_id: null, name: 'الطرف المدين', debit_cents: 0, credit_cents: 0 },
      { account_id: 8, partner_id: null, name: 'الطرف الدائن', debit_cents: 0, credit_cents: 0 },
    ],
  });

  const loadData = async () => {
    try {
      const [mList, accList, jList, tbList] = await Promise.all([
        api.listMoves(activeCompanyId),
        api.listAccounts(activeCompanyId),
        api.listJournals(activeCompanyId),
        api.getTrialBalance(activeCompanyId),
      ]);
      setMoves(mList);
      setAccounts(accList);
      setJournals(jList);
      setTrialBalance(tbList);
    } catch (err) {
      console.error('Failed to load accounting data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId]);

  const handleOpenCreate = () => {
    setFormData({
      company_id: activeCompanyId,
      journal_id: journals.find((j) => j.code === 'MISC')?.id || 5,
      date: new Date().toISOString().split('T')[0],
      origin: '',
      note: '',
      lines: [
        { account_id: accounts[0]?.id || 1, partner_id: null, name: '', debit_cents: 0, credit_cents: 0 },
        { account_id: accounts[1]?.id || 2, partner_id: null, name: '', debit_cents: 0, credit_cents: 0 },
      ],
    });
    setIsModalOpen(true);
  };

  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        { account_id: accounts[0]?.id || 1, partner_id: null, name: '', debit_cents: 0, credit_cents: 0 },
      ],
    });
  };

  const handleRemoveLine = (idx: number) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== idx),
    });
  };

  const handleLineChange = (
    idx: number,
    field: keyof CreateJournalEntryLineInput,
    val: unknown
  ) => {
    const updated = [...formData.lines];
    updated[idx] = { ...updated[idx], [field]: val };
    setFormData({ ...formData, lines: updated });
  };

  const totalDebit = formData.lines.reduce((s, l) => s + l.debit_cents, 0);
  const totalCredit = formData.lines.reduce((s, l) => s + l.credit_cents, 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert('يجب أن يتساوى مجموع المدين مع مجموع الدائن طبقاً لمبدأ القيد المزدوج!');
      return;
    }
    try {
      const res = await api.createJournalEntry(formData);
      await api.postMove(res.move.id);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to create journal entry:', err);
    }
  };

  const handlePost = async (moveId: number) => {
    try {
      await api.postMove(moveId);
      loadData();
    } catch (err) {
      console.error('Failed to post entry:', err);
    }
  };

  const handleReverse = async (moveId: number) => {
    if (window.confirm('هل تريد عكس هذا القيد المحاسبي؟')) {
      try {
        await api.reverseMove(moveId);
        loadData();
      } catch (err) {
        console.error('Failed to reverse entry:', err);
      }
    }
  };

  const tbTotalDebit = trialBalance.reduce((s, r) => s + r.debit_sum_cents, 0);
  const tbTotalCredit = trialBalance.reduce((s, r) => s + r.credit_sum_cents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <BookOpen className="w-5 h-5" />
            <span>{t('accounting.title', 'الحسابات العامة ودفاتر اليومية')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">
            {t('accounting.title', 'الحسابات العامة ودفاتر اليومية')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('accounting.subtitle', 'دليل الحسابات المصري الموحد، قيود اليومية المزدوجة، وميزان المراجعة المباشر')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ تسجيل قيد يومية مزدوج</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('entries')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors ${
            activeTab === 'entries'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>دفتر قيود اليومية (General Journal)</span>
        </button>

        <button
          onClick={() => setActiveTab('trial_balance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors ${
            activeTab === 'trial_balance'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>ميزان المراجعة (Trial Balance)</span>
        </button>

        <button
          onClick={() => setActiveTab('coa')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors ${
            activeTab === 'coa'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>دليل الحسابات (Chart of Accounts)</span>
        </button>
      </div>

      {/* Tab Content: Entries */}
      {activeTab === 'entries' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              عرض جميع قيود اليومية المحاسبية المزدوجة (فواتير، مقبوضات، تسويات)
            </div>
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم القيد، البيان، المرجع..."
                className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-start text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3.5 px-4 text-start">رقم القيد</th>
                  <th className="py-3.5 px-4 text-start">دفتر اليومية</th>
                  <th className="py-3.5 px-4 text-start">التاريخ</th>
                  <th className="py-3.5 px-4 text-start">البيان / الوصف</th>
                  <th className="py-3.5 px-4 text-start">المبلغ الإجمالي</th>
                  <th className="py-3.5 px-4 text-start">الحالة</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {moves.map((m) => (
                  <tr key={m.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">{m.name}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">{m.journal_name || 'دفتر عام'}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">{m.date}</td>
                    <td className="py-3.5 px-4 text-foreground font-medium">{m.note || m.origin || '-'}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {formatCurrency(m.amount_total_cents, m.currency, i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                    </td>
                    <td className="py-3.5 px-4">
                      {m.state === 'posted' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          مرحل ومعتمد
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground">
                          مسودة
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {m.state === 'draft' && (
                          <button
                            onClick={() => handlePost(m.id)}
                            className="px-2.5 py-1 rounded bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[10px]"
                          >
                            ترحيل
                          </button>
                        )}
                        {m.state === 'posted' && (
                          <button
                            onClick={() => handleReverse(m.id)}
                            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                            title="عكس القيد المحاسبي"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Trial Balance */}
      {activeTab === 'trial_balance' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">تطابق ميزان المراجعة (Balanced Ledger)</div>
                <div className="text-xs text-muted-foreground">
                  مجموع الأرصدة المدينة = مجموع الأرصدة الدائنة (SUM(Debit) == SUM(Credit))
                </div>
              </div>
            </div>

            <div className="text-start font-mono text-xs">
              <div>
                إجمالي المدين: <span className="font-bold">{formatCurrency(tbTotalDebit, 'EGP', 'ar-EG')}</span>
              </div>
              <div>
                إجمالي الدائن: <span className="font-bold">{formatCurrency(tbTotalCredit, 'EGP', 'ar-EG')}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-start text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3.5 px-4 text-start">رمز الحساب</th>
                  <th className="py-3.5 px-4 text-start">اسم الحساب في الدليل</th>
                  <th className="py-3.5 px-4 text-start">التصنيف</th>
                  <th className="py-3.5 px-4 text-start">مجموع المدين (ج.م)</th>
                  <th className="py-3.5 px-4 text-start">مجموع الدائن (ج.م)</th>
                  <th className="py-3.5 px-4 text-start">صافي الرصيد (ج.م)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trialBalance.map((row) => (
                  <tr key={row.account_id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">{row.account_code}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{row.account_name}</td>
                    <td className="py-3 px-4 text-muted-foreground capitalize">{row.account_type}</td>
                    <td className="py-3 px-4 font-mono text-foreground font-semibold">
                      {formatCurrency(row.debit_sum_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                    </td>
                    <td className="py-3 px-4 font-mono text-foreground font-semibold">
                      {formatCurrency(row.credit_sum_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {formatCurrency(row.net_balance_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/60 font-bold border-t border-border">
                <tr>
                  <td colSpan={3} className="py-3.5 px-4 text-start">
                    الإجمالي العام لميزان المراجعة
                  </td>
                  <td className="py-3.5 px-4 font-mono text-emerald-600">
                    {formatCurrency(tbTotalDebit, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-emerald-600">
                    {formatCurrency(tbTotalCredit, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-primary">
                    {formatCurrency(tbTotalDebit - tbTotalCredit, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: COA */}
      {activeTab === 'coa' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-start text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-start">الكود المحاسبي</th>
                <th className="py-3.5 px-4 text-start">اسم الحساب</th>
                <th className="py-3.5 px-4 text-start">نوع الحساب</th>
                <th className="py-3.5 px-4 text-start">حساب تسوية</th>
                <th className="py-3.5 px-4 text-start">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-foreground">{acc.code}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{acc.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground">
                      {acc.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{acc.is_reconciled ? 'نعم' : 'لا'}</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">نشط</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Journal Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>تسجيل قيد يومية يدوي (Double-Entry Journal Entry)</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">دفتر اليومية *</label>
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
                  <label className="block text-muted-foreground font-medium mb-1">تاريخ القيد</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">المرجع / السند</label>
                  <input
                    type="text"
                    value={formData.origin || ''}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="مثال: INIT/001"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">البيان العام للقيد</label>
                <input
                  type="text"
                  value={formData.note || ''}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="وصف المعاملة المالية..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>

              {/* Lines Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-foreground text-xs">أطراف القيد (المدين والدائن)</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="flex items-center gap-1 text-primary hover:underline font-semibold text-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>إضافة طرف قيد</span>
                  </button>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-start">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2 px-3 text-start">الحساب المحاسبي</th>
                        <th className="py-2 px-3 text-start">البيان الفرعي</th>
                        <th className="py-2 px-3 text-start w-32">مدين (Debit)</th>
                        <th className="py-2 px-3 text-start w-32">دائن (Credit)</th>
                        <th className="py-2 px-2 text-center w-10">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {formData.lines.map((line, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={line.account_id}
                              onChange={(e) => handleLineChange(idx, 'account_id', Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded border border-border bg-background"
                            >
                              {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.code} - {acc.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={line.name}
                              onChange={(e) => handleLineChange(idx, 'name', e.target.value)}
                              placeholder="شرح السطر..."
                              className="w-full px-2 py-1.5 rounded border border-border bg-background"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={((line.debit_cents || 0) / 100).toFixed(2)}
                              onChange={(e) =>
                                handleLineChange(
                                  idx,
                                  'debit_cents',
                                  Math.round(parseFloat(e.target.value || '0') * 100)
                                )
                              }
                              className="w-full px-2 py-1.5 rounded border border-border bg-background text-center font-mono font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={((line.credit_cents || 0) / 100).toFixed(2)}
                              onChange={(e) =>
                                handleLineChange(
                                  idx,
                                  'credit_cents',
                                  Math.round(parseFloat(e.target.value || '0') * 100)
                                )
                              }
                              className="w-full px-2 py-1.5 rounded border border-border bg-background text-center font-mono font-bold"
                            />
                          </td>
                          <td className="p-2 text-center">
                            {formData.lines.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Balance Validation Card */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono ${
                  isBalanced
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                    : 'bg-destructive/10 border-destructive/20 text-destructive'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isBalanced ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  <span className="font-bold">
                    {isBalanced ? 'القيد متوازن وصالح للترحيل' : 'القيد غير متوازن (مجموع المدين != مجموع الدائن)'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    إجمالي المدين: <span className="font-bold">{formatCurrency(totalDebit, 'EGP', 'ar-EG')}</span>
                  </div>
                  <div>
                    إجمالي الدائن: <span className="font-bold">{formatCurrency(totalCredit, 'EGP', 'ar-EG')}</span>
                  </div>
                </div>
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
                  disabled={!isBalanced}
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  ترحيل وتأكيد القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
