import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SettingsPage({
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
                    Settings ⚙️
                </h1>
                <p className="text-muted-foreground text-lg mt-2">
                    Manage your account preferences and settings.
                </p>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6 max-w-2xl">
                {/* Security Settings */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Security</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Change Password</p>
                                <p className="text-sm text-muted-foreground">
                                    Update your password regularly
                                </p>
                            </div>
                            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                                Change
                            </button>
                        </div>
                        <hr className="border-border" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Two-Factor Authentication</p>
                                <p className="text-sm text-muted-foreground">
                                    Add an extra layer of security
                                </p>
                            </div>
                            <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted">
                                Enable
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Notifications</h2>
                    <div className="space-y-4">
                        {[
                            { label: 'Email Notifications', description: 'Receive updates via email' },
                            { label: 'Push Notifications', description: 'Browser push notifications' },
                            { label: 'Activity Alerts', description: 'Get notified about account activity' },
                        ].map((setting) => (
                            <div key={setting.label} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{setting.label}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {setting.description}
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="w-4 h-4 rounded"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Privacy Settings */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Privacy</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Profile Visibility</p>
                                <p className="text-sm text-muted-foreground">
                                    Who can see your profile
                                </p>
                            </div>
                            <select className="px-3 py-2 border border-border rounded-lg bg-background">
                                <option>Private</option>
                                <option>Team Only</option>
                                <option>Public</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-red-900 mb-4">
                        Danger Zone
                    </h2>
                    <p className="text-sm text-red-800 mb-4">
                        Be careful with these actions. They cannot be undone.
                    </p>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}
