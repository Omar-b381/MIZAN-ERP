import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { LeaveRequest, Employee, CreateLeaveInput, LeaveType } from '../../types';

export const LeavesView: React.FC = () => {
  const { t } = useTranslation();
  const { activeCompanyId, currentUser } = useAuthStore();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<CreateLeaveInput>({
    company_id: activeCompanyId,
    employee_id: 1,
    leave_type: 'annual',
    date_from: new Date().toISOString().split('T')[0],
    date_to: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration_days_milli: 3000,
    reason: '',
  });

  const loadData = async () => {
    try {
      const [lList, empList] = await Promise.all([
        api.listLeaves(
          activeCompanyId,
          undefined,
          selectedState === 'all' ? undefined : selectedState
        ),
        api.listEmployees(activeCompanyId),
      ]);
      setLeaves(lList);
      setEmployees(empList);
    } catch (err) {
      console.error('Failed to load leaves data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId, selectedState]);

  const handleOpenCreate = () => {
    setFormData({
      company_id: activeCompanyId,
      employee_id: employees[0]?.id || 1,
      leave_type: 'annual',
      date_from: new Date().toISOString().split('T')[0],
      date_to: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration_days_milli: 3000,
      reason: '',
    });
    setIsModalOpen(true);
  };

  const handleValidate = async (id: number) => {
    try {
      await api.validateLeave(id, currentUser?.id || 1);
      loadData();
    } catch (err) {
      console.error('Failed to validate leave:', err);
    }
  };

  const handleRefuse = async (id: number) => {
    try {
      await api.refuseLeave(id);
      loadData();
    } catch (err) {
      console.error('Failed to refuse leave:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLeave(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to create leave:', err);
    }
  };

  const filteredLeaves = leaves.filter((l) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      (l.employee_name && l.employee_name.toLowerCase().includes(term)) ||
      (l.reason && l.reason.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <CalendarDays className="w-5 h-5" />
            <span>{t('leaves.title', 'الإجازات والعطلات')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">
            {t('leaves.title', 'إدارة طلبات الإجازات')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('leaves.subtitle', 'تقديم واعتماد الإجازات السنوية، المرضية، والطارئة')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ تقديم طلب إجازة</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          {['all', 'confirm', 'validate', 'refuse'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                selectedState === st
                  ? 'bg-secondary text-foreground border border-border'
                  : 'text-muted-foreground hover:bg-secondary/40'
              }`}
            >
              {st === 'all' && 'جميع الطلبات'}
              {st === 'confirm' && 'بانتظار الاعتماد'}
              {st === 'validate' && 'معتمدة'}
              {st === 'refuse' && 'مرفوضة'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالموظف أو السبب..."
            className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Leaves Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-start text-xs">
          <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
            <tr>
              <th className="py-3.5 px-4 text-start">الموظف</th>
              <th className="py-3.5 px-4 text-start">نوع الإجازة</th>
              <th className="py-3.5 px-4 text-start">من تاريخ</th>
              <th className="py-3.5 px-4 text-start">إلى تاريخ</th>
              <th className="py-3.5 px-4 text-start">المدة (أيام)</th>
              <th className="py-3.5 px-4 text-start">السبب</th>
              <th className="py-3.5 px-4 text-start">الحالة</th>
              <th className="py-3.5 px-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLeaves.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>لا توجد طلبات إجازة مسجلة</p>
                </td>
              </tr>
            ) : (
              filteredLeaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    {leave.employee_name || `موظف #${leave.employee_id}`}
                  </td>
                  <td className="py-3.5 px-4">
                    {leave.leave_type === 'annual' && <span className="text-blue-600 font-medium">سنوية اعتيادية</span>}
                    {leave.leave_type === 'sick' && <span className="text-amber-600 font-medium">مرضية</span>}
                    {leave.leave_type === 'emergency' && <span className="text-red-600 font-medium">عارضة / طارئة</span>}
                    {leave.leave_type === 'unpaid' && <span className="text-muted-foreground font-medium">بدون راتب</span>}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground font-mono">{leave.date_from}</td>
                  <td className="py-3.5 px-4 text-muted-foreground font-mono">{leave.date_to}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    {(leave.duration_days_milli / 1000).toFixed(0)} يوم
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">{leave.reason || '-'}</td>
                  <td className="py-3.5 px-4">
                    {leave.state === 'validate' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        معتمدة ومقبولة
                      </span>
                    )}
                    {leave.state === 'confirm' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        بانتظار المدير
                      </span>
                    )}
                    {leave.state === 'refuse' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                        مرفوضة
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {leave.state === 'confirm' && (
                        <>
                          <button
                            onClick={() => handleValidate(leave.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] shadow-sm"
                          >
                            اعتماد
                          </button>
                          <button
                            onClick={() => handleRefuse(leave.id)}
                            className="px-2.5 py-1 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive font-semibold text-[10px]"
                          >
                            رفض
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Request Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <CalendarDays className="w-5 h-5 text-primary" />
                <span>تقديم طلب إجازة جديد</span>
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
                <label className="block text-muted-foreground font-medium mb-1">الموظف *</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">نوع الإجازة *</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value as LeaveType })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="annual">سنوية اعتيادية (Annual)</option>
                  <option value="sick">مرضية (Sick Leave)</option>
                  <option value="emergency">عارضة / طارئة (Emergency)</option>
                  <option value="unpaid">بدون راتب (Unpaid)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">من تاريخ</label>
                  <input
                    type="date"
                    required
                    value={formData.date_from}
                    onChange={(e) => setFormData({ ...formData, date_from: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">إلى تاريخ</label>
                  <input
                    type="date"
                    required
                    value={formData.date_to}
                    onChange={(e) => setFormData({ ...formData, date_to: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">المدة بالأيام</label>
                <input
                  type="number"
                  step="0.5"
                  value={(formData.duration_days_milli / 1000).toString()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_days_milli: Math.round(parseFloat(e.target.value || '1') * 1000),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">سبب الإجازة</label>
                <textarea
                  rows={2}
                  value={formData.reason || ''}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="سبب وتفاصيل طلب الإجازة..."
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
                  إرسال الطلب للاعتماد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
