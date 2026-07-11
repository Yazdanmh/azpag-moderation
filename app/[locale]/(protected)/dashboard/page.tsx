import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default async function Dashboard({
    params,
}: Readonly<{
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;
    const session = await getSession();

    // Extra safety check - only admin and superadmin should access this
    const userRole = session?.user?.role?.toLowerCase();
    if (userRole !== 'admin' && userRole !== 'superadmin') {
        redirect(`/${locale}/403`);
    }

    return (
        <div className="space-y-6 p-4 sm:p-6">
            dashboard
        </div>
    );
}