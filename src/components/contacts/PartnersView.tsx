import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users2,
  Plus,
  Search,
  Building,
  User,
  Edit2,
  Trash2,
  MessageSquare,
  X,
  Send,
} from 'lucide-react';
import { Partner, PartnerSubType, ActivityLog } from '../../types';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../lib/utils';

export const PartnersView: React.FC = () => {
  const { t } = useTranslation();
  const { activeCompanyId, hasPermission } = useAuthStore();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedTab, setSelectedTab] = useState<PartnerSubType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  // Chatter Drawer State
  const [selectedPartnerForChatter, setSelectedPartnerForChatter] = useState<Partner | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [newComment, setNewComment] = useState('');

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    sub_type: PartnerSubType;
    is_company: boolean;
    email: string;
    phone: string;
    mobile: string;
    tax_id: string;
    commercial_registry: string;
    street: string;
    city: string;
    state: string;
    country: string;
    credit_limit_egp: string; // minor unit converter
    notes: string;
  }>({
    name: '',
    sub_type: 'customer',
    is_company: true,
    email: '',
    phone: '',
    mobile: '',
    tax_id: '',
    commercial_registry: '',
    street: '',
    city: 'القاهرة',
    state: 'القاهرة',
    country: 'EG',
    credit_limit_egp: '0',
    notes: '',
  });

  const loadPartners = async () => {
    setLoading(true);
    try {
      const data = await api.listPartners({
        company_id: activeCompanyId,
        sub_type: selectedTab === 'all' ? undefined : selectedTab,
        search: searchQuery || undefined,
        is_active: true,
      });
      setPartners(data);
    } catch (err) {
      console.error('Failed to load partners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, [selectedTab, searchQuery, activeCompanyId]);

  const handleOpenAdd = () => {
    setEditingPartner(null);
    setFormData({
      name: '',
      sub_type: selectedTab === 'all' ? 'customer' : selectedTab,
      is_company: true,
      email: '',
      phone: '',
      mobile: '',
      tax_id: '',
      commercial_registry: '',
      street: '',
      city: 'القاهرة',
      state: 'القاهرة',
      country: 'EG',
      credit_limit_egp: '0',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      sub_type: partner.sub_type,
      is_company: partner.is_company === 1,
      email: partner.email || '',
      phone: partner.phone || '',
      mobile: partner.mobile || '',
      tax_id: partner.tax_id || '',
      commercial_registry: partner.commercial_registry || '',
      street: partner.street || '',
      city: partner.city || '',
      state: partner.state || '',
      country: partner.country || 'EG',
      credit_limit_egp: (partner.credit_limit_cents / 100).toString(),
      notes: partner.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const creditCents = Math.round(parseFloat(formData.credit_limit_egp || '0') * 100);

    try {
      if (editingPartner) {
        await api.updatePartner({
          id: editingPartner.id,
          company_id: activeCompanyId,
          name: formData.name,
          sub_type: formData.sub_type,
          is_company: formData.is_company ? 1 : 0,
          email: formData.email || null,
          phone: formData.phone || null,
          mobile: formData.mobile || null,
          tax_id: formData.tax_id || null,
          commercial_registry: formData.commercial_registry || null,
          street: formData.street || null,
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country,
          credit_limit_cents: creditCents,
          notes: formData.notes || null,
          is_active: 1,
        });
      } else {
        await api.createPartner({
          company_id: activeCompanyId,
          parent_id: null,
          name: formData.name,
          sub_type: formData.sub_type,
          is_company: formData.is_company,
          email: formData.email || null,
          phone: formData.phone || null,
          mobile: formData.mobile || null,
          tax_id: formData.tax_id || null,
          commercial_registry: formData.commercial_registry || null,
          street: formData.street || null,
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country,
          credit_limit_cents: creditCents,
          notes: formData.notes || null,
        });
      }

      setIsModalOpen(false);
      loadPartners();
    } catch (err) {
      console.error('Failed to save partner:', err);
    }
  };

  const handleDelete = async (partner: Partner) => {
    if (window.confirm(t('contacts.delete_confirm'))) {
      try {
        await api.deletePartner(partner.id);
        loadPartners();
      } catch (err) {
        console.error('Failed to delete partner:', err);
      }
    }
  };

  const openChatter = async (partner: Partner) => {
    setSelectedPartnerForChatter(partner);
    try {
      const logs = await api.getEntityActivities(activeCompanyId, 'partner', partner.id);
      setActivities(logs);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedPartnerForChatter) return;
    try {
      // Direct activity logging
      const commentLog: ActivityLog = {
        id: Date.now(),
        company_id: activeCompanyId,
        entity_type: 'partner',
        entity_id: selectedPartnerForChatter.id,
        user_id: 1,
        action: 'commented',
        summary: newComment.trim(),
        details_json: null,
        created_at: new Date().toISOString(),
      };
      setActivities([commentLog, ...activities]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Users2 className="w-5 h-5" />
            <span>{t('contacts.title')}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-1">
            {t('contacts.title')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('contacts.subtitle')}
          </p>
        </div>

        {hasPermission('contacts.create') && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('contacts.add_contact')}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-lg border border-border/60">
          {(
            [
              { id: 'all', label: t('contacts.tabs.all') },
              { id: 'customer', label: t('contacts.tabs.customers') },
              { id: 'vendor', label: t('contacts.tabs.vendors') },
              { id: 'contact', label: t('contacts.tabs.contacts') },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-3 py-2 rounded-lg border border-input bg-card text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Partners Data Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4 text-start">{t('contacts.fields.name')}</th>
                <th className="py-3 px-4 text-start">{t('contacts.fields.sub_type')}</th>
                <th className="py-3 px-4 text-start">{t('contacts.fields.phone')}</th>
                <th className="py-3 px-4 text-start">{t('contacts.fields.city')}</th>
                <th className="py-3 px-4 text-start">{t('contacts.fields.tax_id')}</th>
                <th className="py-3 px-4 text-start">{t('contacts.fields.credit_limit')}</th>
                <th className="py-3 px-4 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    {t('contacts.empty')}
                  </td>
                </tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center text-xs ${
                            partner.is_company
                              ? 'bg-primary/10 text-primary'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          {partner.is_company ? (
                            <Building className="w-3.5 h-3.5" />
                          ) : (
                            <User className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{partner.name}</div>
                          {partner.email && (
                            <div className="text-[11px] text-muted-foreground">{partner.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          partner.sub_type === 'customer'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : partner.sub_type === 'vendor'
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-purple-500/10 text-purple-600'
                        }`}
                      >
                        {partner.sub_type === 'customer'
                          ? 'عميل / Customer'
                          : partner.sub_type === 'vendor'
                          ? 'مورد / Vendor'
                          : 'جهة اتصال'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {partner.phone || partner.mobile || '-'}
                    </td>
                    <td className="py-3 px-4 text-foreground/80">{partner.city || '-'}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {partner.tax_id || '-'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {formatCurrency(partner.credit_limit_cents, 'EGP')}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openChatter(partner)}
                          title={t('contacts.chatter')}
                          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {hasPermission('contacts.edit') && (
                          <button
                            onClick={() => handleOpenEdit(partner)}
                            title={t('common.edit')}
                            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {hasPermission('contacts.delete') && (
                          <button
                            onClick={() => handleDelete(partner)}
                            title={t('common.delete')}
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                {editingPartner ? t('contacts.edit_contact') : t('contacts.add_contact')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {t('contacts.fields.name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {t('contacts.fields.sub_type')}
                  </label>
                  <select
                    value={formData.sub_type}
                    onChange={(e) =>
                      setFormData({ ...formData, sub_type: e.target.value as PartnerSubType })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                  >
                    <option value="customer">{t('contacts.tabs.customers')}</option>
                    <option value="vendor">{t('contacts.tabs.vendors')}</option>
                    <option value="contact">{t('contacts.tabs.contacts')}</option>
                    <option value="partner">شريك عام / Partner</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {t('contacts.fields.phone')}
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {t('contacts.fields.email')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {t('contacts.fields.tax_id')}
                  </label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {t('contacts.fields.credit_limit')} (EGP)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.credit_limit_egp}
                    onChange={(e) =>
                      setFormData({ ...formData, credit_limit_egp: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {t('contacts.fields.city')}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {t('contacts.fields.street')}
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t('contacts.fields.notes')}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chatter / Activity Log Drawer */}
      {selectedPartnerForChatter && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-md bg-card border-s border-border h-full shadow-2xl flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  {t('contacts.chatter')} • {selectedPartnerForChatter.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPartnerForChatter(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Post Note Input */}
            <div className="space-y-2">
              <div className="relative">
                <textarea
                  rows={2}
                  placeholder="أضف ملاحظة أو متابعة داخلية..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-ring resize-none"
                />
                <button
                  onClick={handlePostComment}
                  className="absolute bottom-2.5 end-2.5 p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Activity Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 pt-2">
              {activities.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  لا توجد ملاحظات أو أنشطة مسجلة بعد
                </p>
              ) : (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-lg border border-border/80 bg-secondary/30 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="font-semibold text-primary capitalize">{act.action}</span>
                      <span>{new Date(act.created_at).toLocaleTimeString('ar-EG')}</span>
                    </div>
                    <p className="text-foreground/90 font-medium">{act.summary}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
