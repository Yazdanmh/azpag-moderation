import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

export default function NotFound() {
    const t = useTranslations();

    return (
        <main className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-full">
                        <Search className="w-12 h-12 text-amber-600 dark:text-amber-400" />
                    </div>
                </div>

                <h1 className="text-6xl font-bold mb-2 text-foreground">
                    {t('errors.not_found.code')}
                </h1>

                <h2 className="text-3xl font-semibold mb-4">
                    {t('errors.not_found.title')}
                </h2>

                <p className="text-muted-foreground mb-8 leading-relaxed">
                    {t('errors.not_found.description')}
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                    {t('errors.not_found.action')}
                </Link>
            </div>
        </main>
    );
}
