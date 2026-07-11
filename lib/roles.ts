/**
 * Role Management and Authorization Utilities
 * Provides dynamic role-based access control and redirects
 */

export type UserRole = 'manager' | 'admin' | 'superadmin' | string;

/**
 * Role configuration with permissions and settings
 */
interface RoleConfig {
    allowedRoutes: string[];
    defaultRedirect: string;
    description: string;
}

/**
 * Role configuration mapping
 * Define roles, their accessible routes, and default redirect paths
 */
export const roleConfig: Record<string, RoleConfig> = {
    manager: {
        allowedRoutes: ['/reviews'],
        defaultRedirect: '/reviews',
        description: 'Manager role - can access reviews',
    },
    admin: {
        allowedRoutes: ['/dashboard', '/reviews'],
        defaultRedirect: '/dashboard',
        description: 'Admin role - can access dashboard and reviews',
    },
    superadmin: {
        allowedRoutes: ['/dashboard', '/reviews'],
        defaultRedirect: '/dashboard',
        description: 'SuperAdmin role - can access dashboard and reviews',
    },
};

/**
 * Route protection mapping
 * Define which routes require which roles
 */
export const routeProtection: Record<string, string[]> = {
    '/dashboard': ['admin', 'superadmin'],
    '/reviews': ['manager', 'admin', 'superadmin'],
};

/**
 * Check if a role is restricted from accessing protected routes
 * @param role - User role to check
 * @returns true if the role is restricted
 */
export const isRoleRestricted = (role: UserRole): boolean => {
    const normalizedRole = role?.toLowerCase();
    
    // Check if role has any allowed routes configured
    const config = roleConfig[normalizedRole];
    return !config || config.allowedRoutes.length === 0;
};

/**
 * Check if a role can access a specific route
 * @param role - User role
 * @param route - Route to check access for
 * @returns true if the role can access the route
 */
export const canAccessRoute = (role: UserRole, route: string): boolean => {
    const normalizedRole = role?.toLowerCase();
    const allowedRoles = routeProtection[route];
    
    if (!allowedRoles) {
        // Route not in protection list, assume public
        return true;
    }
    
    return allowedRoles.includes(normalizedRole);
};

/**
 * Get the default redirect path based on user role
 * @param role - User role
 * @param locale - Current locale (e.g., 'en', 'fa', 'ps')
 * @returns The default path to redirect the user to
 */
export const getDefaultRedirectByRole = (role: UserRole, locale: string = 'en'): string => {
    const normalizedRole = role?.toLowerCase();
    const config = roleConfig[normalizedRole];
    
    if (!config) {
        // Default fallback for unknown roles
        return `/${locale}/dashboard`;
    }
    
    return `/${locale}${config.defaultRedirect}`;
};

/**
 * Get the first allowed route for a role (fallback redirect)
 * @param role - User role
 * @param locale - Current locale
 * @returns The first allowed route for the role, or default dashboard
 */
export const getFirstAllowedRoute = (role: UserRole, locale: string = 'en'): string => {
    const normalizedRole = role?.toLowerCase();
    const config = roleConfig[normalizedRole];
    
    if (!config || config.allowedRoutes.length === 0) {
        return `/${locale}/dashboard`;
    }
    
    const firstRoute = config.allowedRoutes[0];
    return `/${locale}${firstRoute}`;
};

/**
 * Get all allowed routes for a role
 * @param role - User role
 * @returns Array of routes the role can access
 */
export const getAllowedRoutes = (role: UserRole): string[] => {
    const normalizedRole = role?.toLowerCase();
    const config = roleConfig[normalizedRole];
    
    return config?.allowedRoutes || [];
};

/**
 * Redirect to forbidden page if user lacks access
 * @param role - User role
 * @param requestedRoute - Route the user tried to access
 * @param locale - Current locale
 * @returns The appropriate redirect path (403 if forbidden, or user's default route)
 */
export const getRedirectForUnauthorizedAccess = (
    role: UserRole,
    requestedRoute: string,
    locale: string = 'en'
): string => {
    // If user can access the route, no redirect needed
    if (canAccessRoute(role, requestedRoute)) {
        return requestedRoute;
    }
    
    // Check if user has any allowed routes
    const firstAllowed = getFirstAllowedRoute(role, locale);
    
    // If user has allowed routes, redirect to first one
    if (firstAllowed !== `/${locale}/dashboard`) {
        return firstAllowed;
    }
    
    // Otherwise redirect to 403 forbidden page
    return `/${locale}/403`;
};

/**
 * Check if a user has admin or superadmin role
 * @param role - User role
 * @returns true if user is admin or superadmin
 */
export const isAdmin = (role: UserRole): boolean => {
    const normalizedRole = role?.toLowerCase();
    return normalizedRole === 'admin' || normalizedRole === 'superadmin';
};

/**
 * Check if a user is a manager
 * @param role - User role
 * @returns true if user is manager
 */
export const isManager = (role: UserRole): boolean => {
    return role?.toLowerCase() === 'manager';
};

/**
 * Check if a user is a superadmin
 * @param role - User role
 * @returns true if user is superadmin
 */
export const isSuperAdmin = (role: UserRole): boolean => {
    return role?.toLowerCase() === 'superadmin';
};
