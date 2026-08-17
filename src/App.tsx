import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { api } from './lib/api';
import { ModuleRecord } from './types';
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

export function App() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const activeView = useAuthStore((s) => s.activeView);
  const setCompanies = useAuthStore((s) => s.setCompanies);

  const [modules, setModules] = useState<ModuleRecord[]>([]);

  const fetchInitialData = async () => {
    try {
      const [mList, cList] = await Promise.all([
        api.getModules(),
        api.listCompanies(),
      ]);
      setModules(mList);
      setCompanies(cList);
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
      default:
        return <DashboardOverview modules={modules} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
      {/* Brand Header */}
      <Header />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar modules={modules} />

        {/* Content Viewport */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-muted/20">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>
    </div>
  );
}

export default App;
