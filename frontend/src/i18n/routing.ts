import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'vi'],
  defaultLocale: 'vi',
  localeDetection: false
});

export const {Link, redirect, usePathname, useRouter} = createNavigation(routing);
