import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'fa', 'ps'],
  defaultLocale: 'fa', 
  localePrefix:'as-needed'
});