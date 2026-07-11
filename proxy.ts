import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { 
  canAccessRoute, 
  getDefaultRedirectByRole, 
  getFirstAllowedRoute,
  roleConfig 
} from './lib/roles';

const intlMiddleware = createMiddleware(routing);

/**
 * Extract locale from pathname
 * @param pathname - Full pathname including locale
 * @returns locale string or null if not found
 */
function getLocaleFromPathname(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0];
  return ['en', 'fa', 'ps'].includes(locale) ? locale : null;
}

/**
 * Get route path without locale prefix
 * @param pathname - Full pathname
 * @returns Route path without locale
 */
function getRouteWithoutLocale(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return pathname;
  return '/' + pathname.split('/').slice(2).join('/');
}

/**
 * Check if pathname is a protected route
 * @param pathname - Route path without locale
 * @returns true if route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  // Get all protected routes from roleConfig
  const protectedRoutes = Object.keys(roleConfig)
    .flatMap(role => roleConfig[role].allowedRoutes);
  
  // Remove duplicates
  const uniqueProtectedRoutes = [...new Set(protectedRoutes)];
  
  return uniqueProtectedRoutes.some(route => pathname.startsWith(route));
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const locale = getLocaleFromPathname(pathname);

  // Allow authentication pages
  if (
    pathname.includes('/auth/login') ||
    pathname.includes('/auth/forgot-password') ||
    pathname.includes('/auth/reset-password')
  ) {
    return intlMiddleware(req);
  }

  // Get the route without locale
  const routeWithoutLocale = getRouteWithoutLocale(pathname);

  // Authentication
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    // User not authenticated
    const loginPath = locale
      ? `/${locale}/auth/login`
      : '/en/auth/login';

    return NextResponse.redirect(new URL(loginPath, req.url));
  }

  // User is authenticated, check authorization
  const userRole = (token.user?.role as string | undefined)?.toLowerCase();

  if (isProtectedRoute(routeWithoutLocale)) {

    if (!userRole) {
      return NextResponse.redirect(
        new URL('/403', req.url)
      );
    }

    if (!canAccessRoute(userRole, routeWithoutLocale)) {
      const defaultPath = getDefaultRedirectByRole(
        userRole,
        locale || 'en'
      );

      return NextResponse.redirect(
        new URL(defaultPath, req.url)
      );
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};