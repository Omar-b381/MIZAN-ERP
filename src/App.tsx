import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  ShoppingCart,
  Boxes,
  Landmark,
  UserCheck,
  Blocks,
  Settings,
  Globe,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleInfo {
  key: string;
  nameKey: string;
  icon: typeof LayoutDashboard;
  isActive: boolean;
  category: "core" | "operations" | "finance" | "hr";
}

export function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const toggleLanguage = () => {
    const nextLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(nextLang);
  };

  const isRTL = i18n.language === "ar";

  const modulesList: ModuleInfo[] = [
    { key: "core", nameKey: "modules.core", icon: Blocks, isActive: true, category: "core" },
    { key: "products", nameKey: "modules.products", icon: Boxes, isActive: false, category: "operations" },
    { key: "inventory", nameKey: "modules.inventory", icon: Boxes, isActive: false, category: "operations" },
    { key: "sales", nameKey: "modules.sales", icon: ShoppingBag, isActive: false, category: "operations" },
    { key: "purchases", nameKey: "modules.purchases", icon: ShoppingCart, isActive: false, category: "operations" },
    { key: "accounting", nameKey: "modules.accounting", icon: Landmark, isActive: false, category: "finance" },
    { key: "invoices", nameKey: "modules.invoices", icon: Landmark, isActive: false, category: "finance" },
    { key: "payments", nameKey: "modules.payments", icon: Landmark, isActive: false, category: "finance" },
    { key: "employees", nameKey: "modules.employees", icon: Users, isActive: false, category: "hr" },
    { key: "recruitment", nameKey: "modules.recruitment", icon: UserCheck, isActive: false, category: "hr" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-primary-500 selection:text-white" dir={isRTL ? "rtl" : "ltr"}>
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
              {t("app.title")}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {t("app.tagline")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors text-slate-700"
            title={t("common.language")}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{i18n.language === "ar" ? "English" : "العربية"}</span>
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-inline-end border-slate-200 p-4 flex flex-col justify-between shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-start",
                activeTab === "dashboard"
                  ? "bg-primary-50 text-primary-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <LayoutDashboard className="w-4 h-4 text-primary-600 shrink-0" />
              <span>{t("nav.dashboard")}</span>
            </button>

            <button
              onClick={() => setActiveTab("modules")}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-start",
                activeTab === "modules"
                  ? "bg-primary-50 text-primary-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Blocks className="w-4 h-4 text-primary-600 shrink-0" />
              <span>{t("nav.modules")}</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-start",
                activeTab === "settings"
                  ? "bg-primary-50 text-primary-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Settings className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{t("nav.settings")}</span>
            </button>
          </nav>

          {/* System Status Footnote */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Native Tauri 2.x</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              SQLite WAL Mode • Local-First
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t("app.subtitle")}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {t("modules.description")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Phase 0: Scaffold Ready
                </span>
              </div>
            </div>

            {/* Modules Grid Overview */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">
                {t("modules.title")}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {modulesList.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div
                      key={mod.key}
                      className={cn(
                        "p-5 rounded-xl border transition-all bg-white flex flex-col justify-between",
                        mod.isActive
                          ? "border-primary-200 shadow-sm ring-1 ring-primary-100"
                          : "border-slate-200 opacity-80 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            mod.isActive
                              ? "bg-primary-50 text-primary-600"
                              : "bg-slate-100 text-slate-500"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium",
                            mod.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {mod.isActive ? t("modules.active") : t("modules.inactive")}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm text-slate-900">
                          {t(mod.nameKey)}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 capitalize">
                          {mod.category}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
