import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProfilePage({
    params,
}: Readonly<{
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;
    const session = await getSession();

    if (!session) {
        redirect(`/${locale}/auth/login`);
    }

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                    My Profile 👤
                </h1>
                <p className="text-muted-foreground text-lg mt-2">
                    Manage your account settings and profile information.
                </p>
            </div>

            {/* Profile Card */}
            <div className="bg-card border border-border rounded-lg p-6 max-w-2xl">
                <div className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">
                                {session?.user?.name || 'User'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {session?.user?.email}
                            </p>
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-border pt-6">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Full Name
                            </label>
                            <p className="mt-1 text-foreground">
                                {session?.user?.name || 'Not set'}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Email
                            </label>
                            <p className="mt-1 text-foreground">
                                {session?.user?.email}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Role
                            </label>
                            <p className="mt-1 text-foreground capitalize">
                                {session?.user?.role || 'Not set'}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Account Status
                            </label>
                            <p className="mt-1">
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                                    Active
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Coming Soon */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl">
                <h3 className="font-semibold text-blue-900 mb-2">
                    📝 Edit Profile Coming Soon
                </h3>
                <p className="text-sm text-blue-800">
                    Profile editing functionality will be available soon. Contact your administrator for profile changes.
                </p>
            </div>
        </div>
    );
}
