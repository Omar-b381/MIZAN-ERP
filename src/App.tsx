import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { api } from './lib/api';
import { ModuleRecord, TrialStatus } from './types';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { PartnersView } from './components/contacts/PartnersView';
import { CompaniesView } from './components/companies/CompaniesView';
import { UsersView } from './components/users/UsersView';
import { ModuleManagerView } from './components/modules/ModuleManagerView';
import { SettingsView } from './components/settings/SettingsView';
import { ActivityLogView } from './components/activity/ActivityLogView';
import { ProductsView } from './components/products/ProductsView';
import { InventoryStockView } from './components/inventory/InventoryStockView';
import { TransfersView } from './components/inventory/TransfersView';
import { InventoryAdjustmentsView } from './components/inventory/InventoryAdjustmentsView';
import { LocationsView } from './components/inventory/LocationsView';
import { SalesOrdersView } from './components/sales/SalesOrdersView';
import { PurchasesOrdersView } from './components/purchases/PurchasesOrdersView';
import { InvoicesView } from './components/accounting/InvoicesView';
import { JournalEntriesView } from './components/accounting/JournalEntriesView';
import { PaymentsView } from './components/accounting/PaymentsView';
import { EmployeesView } from './components/hr/EmployeesView';
import { LeavesView } from './components/hr/LeavesView';
import { AttendanceView } from './components/hr/AttendanceView';
import { TrialBanner } from './components/licensing/TrialBanner';
import { TrialExpiredModal } from './components/licensing/TrialExpiredModal';

export function App() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const activeView = useAuthStore((s) => s.activeView);
  const setActiveView = useAuthStore((s) => s.setActiveView);
  const setCompanies = useAuthStore((s) => s.setCompanies);

  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [licenseStatus, setLicenseStatus] = useState<TrialStatus | null>(null);

  const fetchInitialData = async () => {
    try {
      const [mList, cList, lic] = await Promise.all([
        api.getModules(),
        api.listCompanies(),
        api.getLicenseInfo(),
      ]);
      setModules(mList);
      setCompanies(cList);
      setLicenseStatus(lic);
    } catch (err) {
      console.error('Failed to load initial app data:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  if (!currentUser || activeView === 'login') {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardOverview modules={modules} />;
      case 'contacts':
        return <PartnersView />;
      case 'companies':
        return <CompaniesView />;
      case 'users':
        return <UsersView />;
      case 'modules':
        return <ModuleManagerView modules={modules} onRefresh={fetchInitialData} />;
      case 'settings':
        return <SettingsView />;
      case 'activity':
        return <ActivityLogView />;
      case 'products':
        return <ProductsView />;
      case 'inventory_stock':
        return <InventoryStockView />;
      case 'transfers':
        return <TransfersView />;
      case 'adjustments':
        return <InventoryAdjustmentsView />;
      case 'locations':
        return <LocationsView />;
      case 'sales':
        return <SalesOrdersView />;
      case 'purchases':
        return <PurchasesOrdersView />;
      case 'invoices':
        return <InvoicesView />;
      case 'journal_entries':
      case 'accounting':
        return <JournalEntriesView />;
      case 'payments':
        return <PaymentsView />;
      case 'employees':
      case 'hr':
        return <EmployeesView />;
      case 'leaves':
        return <LeavesView />;
      case 'attendance':
        return <AttendanceView />;
      default:
        return <DashboardOverview modules={modules} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
      {/* Trial Countdown Banner */}
      <TrialBanner
        status={licenseStatus}
        onOpenActivation={() => setActiveView('settings')}
      />

      {/* Brand Header */}
      <Header />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Module Navigation */}
        <Sidebar modules={modules} />

        {/* View Surface */}
        <main className="flex-1 overflow-y-auto p-6 bg-secondary/10">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Trial Expired Full Blocking Overlay Modal */}
      {licenseStatus?.is_expired && (
        <TrialExpiredModal
          status={licenseStatus}
          onActivated={(updated) => setLicenseStatus(updated)}
        />
      )}
    </div>
  );
}

export default App;
