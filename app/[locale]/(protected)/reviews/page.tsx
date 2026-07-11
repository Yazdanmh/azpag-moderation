import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ReviewsPage({
    params,
}: Readonly<{
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;
    const session = await getSession();

    // Extra safety check - only managers and admins should access this
    const userRole = session?.user?.role?.toLowerCase();
    if (userRole !== 'manager' && userRole !== 'admin' && userRole !== 'superadmin') {
        redirect(`/${locale}/403`);
    }

    return (
        <>
            hello
        </>
    );
}
