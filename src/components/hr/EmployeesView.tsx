import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users2,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  X,
  FileText,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import {
  Employee,
  Department,
  JobPosition,
  Contract,
  CreateEmployeeInput,
  CreateContractInput,
} from '../../types';
import { formatCurrency } from '../../lib/utils';

export const EmployeesView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { activeCompanyId } = useAuthStore();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [activeEmployeeForContract, setActiveEmployeeForContract] = useState<Employee | null>(null);

  const [formData, setFormData] = useState<CreateEmployeeInput>({
    company_id: activeCompanyId,
    name: '',
    work_email: '',
    work_phone: '',
    department_id: 2,
    job_id: 1,
    manager_id: null,
    hire_date: new Date().toISOString().split('T')[0],
    national_id: '',
  });

  const [contractForm, setContractForm] = useState<CreateContractInput>({
    company_id: activeCompanyId,
    employee_id: 1,
    wage_cents: 2500000,
    date_start: new Date().toISOString().split('T')[0],
    date_end: null,
    working_hours_per_week: 40,
    notes: 'عقد عمل بدوام كامل',
  });

  const loadData = async () => {
    try {
      const [empList, deptList, jobList, conList] = await Promise.all([
        api.listEmployees(
          activeCompanyId,
          selectedDept === 'all' ? undefined : Number(selectedDept),
          selectedStatus === 'all' ? undefined : selectedStatus
        ),
        api.listDepartments(activeCompanyId),
        api.listJobs(activeCompanyId),
        api.listContracts(activeCompanyId),
      ]);
      setEmployees(empList);
      setDepartments(deptList);
      setJobs(jobList);
      setContracts(conList);
    } catch (err) {
      console.error('Failed to load HR data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId, selectedDept, selectedStatus]);

  const handleOpenCreate = () => {
    setFormData({
      company_id: activeCompanyId,
      name: '',
      work_email: '',
      work_phone: '',
      department_id: departments[0]?.id || 1,
      job_id: jobs[0]?.id || 1,
      manager_id: employees[0]?.id || null,
      hire_date: new Date().toISOString().split('T')[0],
      national_id: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEmployee(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to create employee:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف من السجلات؟')) {
      try {
        await api.deleteEmployee(id);
        loadData();
      } catch (err) {
        console.error('Failed to delete employee:', err);
      }
    }
  };

  const handleOpenContractModal = (emp: Employee) => {
    setActiveEmployeeForContract(emp);
    const existing = contracts.find((c) => c.employee_id === emp.id);
    setContractForm({
      company_id: activeCompanyId,
      employee_id: emp.id,
      wage_cents: existing ? existing.wage_cents : 2500000,
      date_start: existing ? existing.date_start : emp.hire_date,
      date_end: existing ? existing.date_end : null,
      working_hours_per_week: existing ? existing.working_hours_per_week : 40,
      notes: existing ? existing.notes || '' : 'عقد عمل بدوام كامل',
    });
    setIsContractModalOpen(true);
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createContract(contractForm);
      setIsContractModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to create contract:', err);
    }
  };

  const filteredEmployees = employees.filter((e) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(term) ||
      (e.work_email && e.work_email.toLowerCase().includes(term)) ||
      (e.work_phone && e.work_phone.toLowerCase().includes(term)) ||
      (e.job_name && e.job_name.toLowerCase().includes(term)) ||
      (e.department_name && e.department_name.toLowerCase().includes(term))
    );
  });

  const totalPayrollMonthly = contracts
    .filter((c) => c.state === 'open')
    .reduce((s, c) => s + c.wage_cents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Users2 className="w-5 h-5" />
            <span>{t('hr.title', 'الموارد البشرية ودليل الموظفين')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">
            {t('hr.title', 'دليل الموظفين والهيكل الإداري')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('hr.subtitle', 'إدارة بيانات الموظفين، الأقسام، المسميات الوظيفية، وعقود العمل والرواتب')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة موظف جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">إجمالي عدد الموظفين</div>
            <div className="text-lg font-bold text-foreground">{employees.length} موظف</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">إجمالي الرواتب الشهرية الأساسية</div>
            <div className="text-lg font-bold text-foreground">
              {formatCurrency(totalPayrollMonthly, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">عدد الأقسام والإدارات</div>
            <div className="text-lg font-bold text-foreground">{departments.length} إدارة</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background"
          >
            <option value="all">جميع الأقسام والإدارات</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">على رأس العمل (نشط)</option>
            <option value="on_leave">في إجازة</option>
            <option value="terminated">منتهي الخدمة</option>
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، البريد، الوظيفة، الهاتف..."
            className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Employees Grid / Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-start text-xs">
          <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
            <tr>
              <th className="py-3.5 px-4 text-start">الموظف</th>
              <th className="py-3.5 px-4 text-start">الوظيفة والقسم</th>
              <th className="py-3.5 px-4 text-start">بيانات الاتصال</th>
              <th className="py-3.5 px-4 text-start">تاريخ التعيين</th>
              <th className="py-3.5 px-4 text-start">الراتب الأساسي</th>
              <th className="py-3.5 px-4 text-start">الحالة</th>
              <th className="py-3.5 px-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  <Users2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>لا يوجد موظفون مطابقون لمعايير البحث</p>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => {
                const contract = contracts.find((c) => c.employee_id === emp.id);

                return (
                  <tr key={emp.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <div>{emp.name}</div>
                      {emp.national_id && (
                        <span className="text-[10px] text-muted-foreground font-normal">
                          الرقم القومي: {emp.national_id}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <div className="font-semibold text-foreground">{emp.job_name || 'غير محدد'}</div>
                      <div className="text-[10px]">{emp.department_name || 'إدارة عامة'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span>{emp.work_email || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span>{emp.work_phone || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">{emp.hire_date}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {contract
                        ? formatCurrency(contract.wage_cents, 'EGP', i18n.language === 'ar' ? 'ar-EG' : 'en-EG')
                        : 'غير مسجل'}
                    </td>
                    <td className="py-3.5 px-4">
                      {emp.status === 'active' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          على رأس العمل
                        </span>
                      )}
                      {emp.status === 'on_leave' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          في إجازة
                        </span>
                      )}
                      {emp.status === 'terminated' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                          منتهي الخدمة
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenContractModal(emp)}
                          className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-[10px] flex items-center gap-1 border border-border"
                          title="عقد العمل والراتب"
                        >
                          <FileText className="w-3 h-3" />
                          <span>العقد</span>
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          title="حذف الموظف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <Users2 className="w-5 h-5 text-primary" />
                <span>إضافة ملف موظف جديد</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">الاسم الكامل للموظف *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: أحمد محمود القاضي"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">الرقم القومي (14 رقم)</label>
                  <input
                    type="text"
                    value={formData.national_id || ''}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    placeholder="29001011234567"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">البريد الإلكتروني للعمل</label>
                  <input
                    type="email"
                    value={formData.work_email || ''}
                    onChange={(e) => setFormData({ ...formData, work_email: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">رقم هاتف العمل</label>
                  <input
                    type="text"
                    value={formData.work_phone || ''}
                    onChange={(e) => setFormData({ ...formData, work_phone: e.target.value })}
                    placeholder="+201011122233"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">القسم / الإدارة</label>
                  <select
                    value={formData.department_id || 1}
                    onChange={(e) => setFormData({ ...formData, department_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">المسمى الوظيفي</label>
                  <select
                    value={formData.job_id || 1}
                    onChange={(e) => setFormData({ ...formData, job_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">المدير المباشر</label>
                  <select
                    value={formData.manager_id || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        manager_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="">بدون مدير مباشر</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">تاريخ مباشرة العمل</label>
                  <input
                    type="date"
                    value={formData.hire_date || ''}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  />
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
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm"
                >
                  حفظ وتأكيد الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Modal */}
      {isContractModalOpen && activeEmployeeForContract && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-foreground">
                <FileText className="w-5 h-5 text-primary" />
                <span>عقد العمل والراتب: {activeEmployeeForContract.name}</span>
              </div>
              <button
                onClick={() => setIsContractModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground font-medium mb-1">الراتب الشهري الأساسي (ج.م) *</label>
                <input
                  type="number"
                  step="100"
                  value={((contractForm.wage_cents || 0) / 100).toFixed(2)}
                  onChange={(e) =>
                    setContractForm({
                      ...contractForm,
                      wage_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono font-bold text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">تاريخ بداية العقد</label>
                  <input
                    type="date"
                    value={contractForm.date_start || ''}
                    onChange={(e) => setContractForm({ ...contractForm, date_start: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">ساعات العمل أسبوعياً</label>
                  <input
                    type="number"
                    value={contractForm.working_hours_per_week || 40}
                    onChange={(e) =>
                      setContractForm({
                        ...contractForm,
                        working_hours_per_week: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">ملاحظات وبنود إضافية للعقد</label>
                <textarea
                  rows={3}
                  value={contractForm.notes || ''}
                  onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })}
                  placeholder="البدلات، الحوافز، الشروط الخاصة..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-foreground font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm"
                >
                  حفظ وتفعيل العقد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
