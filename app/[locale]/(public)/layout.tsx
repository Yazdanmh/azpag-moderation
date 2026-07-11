import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDefaultRedirectByRole } from '@/lib/roles';

export default async function PublicLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;
    const session = await getSession();

    // If user is already authenticated, redirect them based on their role
    if (session?.user) {
        const redirectPath = getDefaultRedirectByRole(session.user.role, locale);
        redirect(redirectPath);
    }

    return <>{children}</>;
}
