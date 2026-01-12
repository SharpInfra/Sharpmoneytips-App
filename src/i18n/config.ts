/**
 * i18n configuration placeholder
 * Ready for integration with i18n library (e.g., i18next, react-i18next)
 */

export const i18nConfig = {
  defaultLocale: 'en',
  supportedLocales: ['en', 'es', 'fr', 'de'] as const,
  fallbackLocale: 'en',
};

export type SupportedLocale = (typeof i18nConfig.supportedLocales)[number];

/**
 * Placeholder translation function
 * To be replaced with actual i18n library
 */
export const t = (key: string): string => {
  return key;
};
