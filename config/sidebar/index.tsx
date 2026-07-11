import { INavItem } from "@/types";

export interface SidebarCategory {
    label?: string;
    items: INavItem[];
}

export const sidebarNav: SidebarCategory[] = [
    {
        items: [
            {
                href: '/dashboard',
                title: 'dashboard',
                icon: 'LuLayoutDashboard',
                access: ['SUPERADMIN', 'ADMIN']
            },
            {
                href: '/reviews',
                title: 'reviews',
                icon: 'FaChartSimple',
                access: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
            },
        ]
    }
];

export const secondaryNavItems: INavItem[] = [
    {
        href: '/settings',
        title: 'settings',
        icon: 'LuSettings2',
        access: ['SUPERADMIN', 'ADMIN', 'MANAGER']
    },
    {
        href: '/help',
        title: 'help',
        icon: 'LuCircleHelp',
        access: ['SUPERADMIN', 'ADMIN', 'MANAGER']
    },
    {
        href: '/search',
        title: 'search',
        icon: 'LuSearch',
        access: ['SUPERADMIN', 'ADMIN', 'MANAGER']
    },
];
