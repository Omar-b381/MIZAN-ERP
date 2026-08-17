import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Plus,
  Search,
  Calendar,
  UserCheck,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { AttendanceRecord, Employee, RecordAttendanceInput } from '../../types';

export const AttendanceView: React.FC = () => {
  const { t } = useTranslation();
  const { activeCompanyId } = useAuthStore();

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<RecordAttendanceInput>({
    company_id: activeCompanyId,
    employee_id: 1,
    date: new Date().toISOString().split('T')[0],
    check_in: `${new Date().toISOString().split('T')[0]} 09:00:00`,
    check_out: `${new Date().toISOString().split('T')[0]} 17:00:00`,
    notes: 'حضور يومي اعتيادي',
  });

  const loadData = async () => {
    try {
      const [attList, empList] = await Promise.all([
        api.listAttendances(activeCompanyId, undefined, selectedDate || undefined),
        api.listEmployees(activeCompanyId),
      ]);
      setAttendances(attList);
      setEmployees(empList);
    } catch (err) {
      console.error('Failed to load attendances:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId, selectedDate]);

  const handleOpenCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      company_id: activeCompanyId,
      employee_id: employees[0]?.id || 1,
      date: today,
      check_in: `${today} 09:00:00`,
      check_out: `${today} 17:00:00`,
      notes: 'حضور يومي اعتيادي',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordAttendance(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to record attendance:', err);
    }
  };

  const filteredAttendances = attendances.filter((a) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      (a.employee_name && a.employee_name.toLowerCase().includes(term)) ||
      (a.notes && a.notes.toLowerCase().includes(term))
    );
  });

  const totalWorkedHoursToday = attendances.reduce(
    (s, a) => s + a.worked_hours_milli,
    0
  ) / 1000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Clock className="w-5 h-5" />
            <span>{t('attendance.title', 'الحضور والانصراف وتتبع الساعات')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">
            {t('attendance.title', 'سجل الحضور والانصراف اليومي')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('attendance.subtitle', 'تسجيل مواعيد الحضور والانصراف، احتساب ساعات العمل، ومتابعة التأخير')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ تسجيل حضور / انصراف</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">عدد الحاضرين اليوم</div>
            <div className="text-lg font-bold text-foreground">{attendances.length} موظف</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">إجمالي ساعات العمل المنجزة</div>
            <div className="text-lg font-bold text-foreground">
              {totalWorkedHoursToday.toFixed(1)} ساعة عمل
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">تاريخ العرض المحدد</div>
            <div className="text-lg font-bold text-foreground font-mono">{selectedDate}</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">تصفية بالتاريخ:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background font-mono"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-[10px] text-muted-foreground hover:text-foreground underline px-1"
            >
              عرض كافة الأيام
            </button>
          )}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالموظف أو الملاحظات..."
            className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-start text-xs">
          <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
            <tr>
              <th className="py-3.5 px-4 text-start">الموظف</th>
              <th className="py-3.5 px-4 text-start">التاريخ</th>
              <th className="py-3.5 px-4 text-start">وقت الحضور</th>
              <th className="py-3.5 px-4 text-start">وقت الانصراف</th>
              <th className="py-3.5 px-4 text-start">الساعات المنجزة</th>
              <th className="py-3.5 px-4 text-start">الحالة</th>
              <th className="py-3.5 px-4 text-start">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredAttendances.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>لا توجد سجلات حضور مسجلة لهذا التاريخ</p>
                </td>
              </tr>
            ) : (
              filteredAttendances.map((att) => (
                <tr key={att.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    {att.employee_name || `موظف #${att.employee_id}`}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground font-mono">{att.date}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-emerald-600">
                    {att.check_in.split(' ')[1] || att.check_in}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                    {att.check_out ? att.check_out.split(' ')[1] || att.check_out : 'جاري العمل...'}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    {(att.worked_hours_milli / 1000).toFixed(2)} س
                  </td>
                  <td className="py-3.5 px-4">
                    {att.status === 'present' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        حضور تام
                      </span>
                    )}
                    {att.status === 'late' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        تأخير
                      </span>
                    )}
                    {att.status === 'absent' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                        غياب
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">{att.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Attendance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <Clock className="w-5 h-5 text-primary" />
                <span>تسجيل حضور وانصراف</span>
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
                <label className="block text-muted-foreground font-medium mb-1">التاريخ</label>
                <input
                  type="date"
                  required
                  value={formData.date || ''}
                  onChange={(e) => {
                    const d = e.target.value;
                    setFormData({
                      ...formData,
                      date: d,
                      check_in: `${d} 09:00:00`,
                      check_out: `${d} 17:00:00`,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">موعد الحضور</label>
                  <input
                    type="text"
                    required
                    value={formData.check_in}
                    onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                    placeholder="YYYY-MM-DD HH:MM:SS"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">موعد الانصراف</label>
                  <input
                    type="text"
                    value={formData.check_out || ''}
                    onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                    placeholder="YYYY-MM-DD HH:MM:SS"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات أو سبب التأخير..."
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
                  تسجيل الحضور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
