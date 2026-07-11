import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isRoleRestricted } from '@/lib/roles';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/sidebar';

import { SiteHeader } from '@/components/layout/site-header';
export default async function ProtectedLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;
    const session = await getSession();

    const rtl = locale !== 'en';


    // Check if user has valid session
    if (!session) {
        redirect(`/${locale}/auth/login`);
    }

    // Check if user role is restricted
    if (session.user?.role && isRoleRestricted(session.user.role)) {
        redirect(`/${locale}/auth/login?error=account_not_found&message=Your account does not exist`);
    }

    return (
        <div className="flex flex-col min-h-screen">

            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 60)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }
            >
                <AppSidebar variant="inset" dir={rtl ? "rtl" : "ltr"} />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex flex-1 flex-col">
                        <div className="@container/main flex flex-1 flex-col gap-2">
                            {children}
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
