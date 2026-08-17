import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./locales/ar.json";
import en from "./locales/en.json";

export const defaultNS = "translation";
export const resources = {
  ar: { translation: ar },
  en: { translation: en },
} as const;

i18n.use(initReactI18next).init({
  lng: "ar", // Arabic is default
  fallbackLng: "en",
  resources,
  defaultNS,
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

// Update document direction on language change
i18n.on("languageChanged", (lng) => {
  const dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
});

// Initialize direction
document.documentElement.dir = "rtl";
document.documentElement.lang = "ar";

export default i18n;
