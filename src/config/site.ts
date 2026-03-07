export const siteConfig = {
  name: "Agri-ERP",
  description: "Hệ thống Quản lý Dịch vụ Nông nghiệp",
  tagline: "Quản lý toàn diện đơn hàng, công việc, hóa đơn và lương bổng",
  version: "1.0.0",
  author: "Agri-ERP Team",

  // Business settings
  currency: "VND",
  currencySymbol: "đ",
  locale: "vi-VN",

  // UI Settings
  defaultPageSize: 20,
  maxPageSize: 100,

  // Feature flags
  features: {
    darkMode: true,
    notifications: true,
    exportData: true,
    advancedSearch: true,
  },
};

export type SiteConfig = typeof siteConfig;
