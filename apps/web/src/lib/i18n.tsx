'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type Locale = 'fr' | 'ar';

const translations = {
  fr: {
    // Sidebar
    nav_dashboard: 'Tableau de bord',
    nav_vehicles: 'Véhicules',
    nav_alerts: 'Alertes',
    nav_reports: 'Rapports',
    nav_billing: 'Abonnement',
    nav_admin: 'Admin',
    nav_branding: 'Personnalisation',
    // Branding settings
    branding_title: 'Personnalisation de la marque',
    branding_logo_url: 'URL du logo',
    branding_logo_placeholder: 'https://example.com/logo.png',
    branding_color: 'Couleur principale',
    branding_save: 'Enregistrer',
    branding_saving: 'Enregistrement…',
    branding_saved: 'Modifications enregistrées',
    branding_preview: 'Aperçu',
    theme_dark: '☾ Mode sombre',
    theme_light: '☀ Mode clair',
    theme_dark_label: 'Sombre',
    theme_light_label: 'Clair',
    lang_switch: 'العربية',
    // Login
    login_title: 'Connexion',
    login_subtitle: 'Entrez vos identifiants pour accéder à votre flotte',
    login_email: 'Adresse email',
    login_password: 'Mot de passe',
    login_submit: 'Se connecter',
    login_loading: 'Connexion…',
    login_error: 'Email ou mot de passe incorrect.',
    // Dashboard
    dashboard_title: 'Carte en direct',
    dashboard_subtitle: 'Positions des véhicules en temps réel',
    status_active: 'En marche',
    status_idle: 'À l\'arrêt',
    status_offline: 'Hors ligne',
    vehicles_tracked_one: 'véhicule suivi',
    vehicles_tracked_many: 'véhicules suivis',
    // Vehicles
    vehicles_title: 'Véhicules',
    vehicles_registered_one: 'enregistré',
    vehicles_registered_many: 'enregistrés',
    vehicles_add: 'Ajouter un véhicule',
    vehicles_empty: 'Aucun véhicule. Ajoutez le premier.',
    col_name: 'Nom',
    col_plate: 'Immatriculation',
    col_imei: 'IMEI',
    col_make_model: 'Marque / Modèle',
    col_status: 'Statut',
    col_actions: 'Actions',
    btn_edit: 'Modifier',
    btn_delete: 'Supprimer',
    btn_cancel: 'Annuler',
    btn_save: 'Enregistrer',
    btn_saving: 'Enregistrement…',
    modal_add_title: 'Ajouter un véhicule',
    modal_edit_title: 'Modifier le véhicule',
    field_vehicle_name: 'Nom du véhicule',
    field_plate: 'Immatriculation',
    field_imei: 'IMEI du boîtier GPS',
    field_make: 'Marque',
    field_model: 'Modèle',
    field_year: 'Année',
    ph_name: 'ex. Camion #1',
    ph_plate: 'ex. 12345-A-7',
    ph_imei: 'IMEI à 15 chiffres',
    ph_make: 'ex. Mercedes',
    ph_model: 'ex. Sprinter',
    ph_year: '2024',
    // Alerts
    alerts_title: 'Alertes',
    alerts_subtitle: 'Alertes en temps réel',
    alerts_empty: 'Aucune alerte pour l\'instant',
    // Reports
    reports_title: 'Rapports',
    reports_subtitle: 'Performance de la flotte par période',
    reports_range_7d: '7 jours',
    reports_range_30d: '30 jours',
    reports_range_90d: '90 jours',
    reports_stat_trips: 'Trajets',
    reports_stat_distance: 'Distance',
    reports_stat_speed: 'Vitesse moy.',
    reports_stat_fuel: 'Carburant',
    reports_chart_distance: 'Distance par véhicule',
    reports_chart_speed: 'Vitesse moy. par véhicule',
    reports_chart_fuel: 'Carburant par véhicule',
    reports_no_data: 'Aucune donnée',
    reports_trips_title: 'Historique des trajets',
    reports_no_trips: 'Aucun trajet enregistré',
    reports_col_vehicle: 'Véhicule',
    reports_col_departure: 'Départ',
    reports_col_duration: 'Durée',
    reports_col_distance: 'Distance',
    reports_col_max_speed: 'Vit. max',
    reports_col_avg_speed: 'Vit. moy.',
    // Common
    loading: 'Chargement…',
  },
  ar: {
    // Sidebar
    nav_dashboard: 'لوحة القيادة',
    nav_vehicles: 'المركبات',
    nav_alerts: 'التنبيهات',
    nav_reports: 'التقارير',
    nav_billing: 'الاشتراك',
    nav_admin: 'الإدارة',
    nav_branding: 'التخصيص',
    // Branding settings
    branding_title: 'تخصيص العلامة التجارية',
    branding_logo_url: 'رابط الشعار',
    branding_logo_placeholder: 'https://example.com/logo.png',
    branding_color: 'اللون الأساسي',
    branding_save: 'حفظ',
    branding_saving: 'جارٍ الحفظ…',
    branding_saved: 'تم حفظ التغييرات',
    branding_preview: 'معاينة',
    theme_dark: '☾ الوضع الداكن',
    theme_light: '☀ الوضع الفاتح',
    theme_dark_label: 'داكن',
    theme_light_label: 'فاتح',
    lang_switch: 'Français',
    // Login
    login_title: 'تسجيل الدخول',
    login_subtitle: 'أدخل بيانات اعتمادك للوصول إلى أسطولك',
    login_email: 'البريد الإلكتروني',
    login_password: 'كلمة المرور',
    login_submit: 'تسجيل الدخول',
    login_loading: 'جارٍ التسجيل…',
    login_error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    // Dashboard
    dashboard_title: 'الخريطة المباشرة',
    dashboard_subtitle: 'مواقع المركبات في الوقت الفعلي',
    status_active: 'في الحركة',
    status_idle: 'متوقف',
    status_offline: 'غير متصل',
    vehicles_tracked_one: 'مركبة مُتابَعة',
    vehicles_tracked_many: 'مركبات مُتابَعة',
    // Vehicles
    vehicles_title: 'المركبات',
    vehicles_registered_one: 'مسجلة',
    vehicles_registered_many: 'مسجلة',
    vehicles_add: 'إضافة مركبة',
    vehicles_empty: 'لا توجد مركبات. أضف الأولى.',
    col_name: 'الاسم',
    col_plate: 'لوحة الترقيم',
    col_imei: 'IMEI',
    col_make_model: 'الماركة / الطراز',
    col_status: 'الحالة',
    col_actions: 'الإجراءات',
    btn_edit: 'تعديل',
    btn_delete: 'حذف',
    btn_cancel: 'إلغاء',
    btn_save: 'حفظ',
    btn_saving: 'جارٍ الحفظ…',
    modal_add_title: 'إضافة مركبة',
    modal_edit_title: 'تعديل المركبة',
    field_vehicle_name: 'اسم المركبة',
    field_plate: 'لوحة الترقيم',
    field_imei: 'IMEI جهاز GPS',
    field_make: 'الماركة',
    field_model: 'الطراز',
    field_year: 'السنة',
    ph_name: 'مثال: شاحنة #1',
    ph_plate: 'مثال: 12345-أ-7',
    ph_imei: 'IMEI مكون من 15 رقمًا',
    ph_make: 'مثال: مرسيدس',
    ph_model: 'مثال: سبرنتر',
    ph_year: '2024',
    // Alerts
    alerts_title: 'التنبيهات',
    alerts_subtitle: 'تنبيهات في الوقت الفعلي',
    alerts_empty: 'لا توجد تنبيهات حاليًا',
    // Reports
    reports_title: 'التقارير',
    reports_subtitle: 'أداء الأسطول حسب الفترة الزمنية',
    reports_range_7d: '7 أيام',
    reports_range_30d: '30 يومًا',
    reports_range_90d: '90 يومًا',
    reports_stat_trips: 'الرحلات',
    reports_stat_distance: 'المسافة',
    reports_stat_speed: 'متوسط السرعة',
    reports_stat_fuel: 'الوقود',
    reports_chart_distance: 'المسافة لكل مركبة',
    reports_chart_speed: 'متوسط السرعة لكل مركبة',
    reports_chart_fuel: 'الوقود لكل مركبة',
    reports_no_data: 'لا توجد بيانات',
    reports_trips_title: 'سجل الرحلات',
    reports_no_trips: 'لا توجد رحلات مسجلة',
    reports_col_vehicle: 'المركبة',
    reports_col_departure: 'الانطلاق',
    reports_col_duration: 'المدة',
    reports_col_distance: 'المسافة',
    reports_col_max_speed: 'أقصى سرعة',
    reports_col_avg_speed: 'متوسط السرعة',
    // Common
    loading: 'جارٍ التحميل…',
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;

type LocaleContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LocaleContext = createContext<LocaleContextType>({
  locale: 'fr',
  setLocale: () => {},
  t: (key) => translations.fr[key],
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('fr');
  const t = (key: TranslationKey): string => translations[locale][key];
  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
