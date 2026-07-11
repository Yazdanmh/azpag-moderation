'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
    params,
}: Readonly<{
    error: Error & { digest?: string };
    reset: () => void;
    params: { locale: string };
}>) {
    const t = useTranslations();

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="bg-destructive/10 p-4 rounded-full">
                        <AlertCircle className="w-12 h-12 text-destructive" />
                    </div>
                </div>

                <h1 className="text-6xl font-bold mb-2 text-destructive">
                    {t('errors.server_error.code')}
                </h1>

                <h2 className="text-3xl font-semibold mb-4">
                    {t('errors.server_error.title')}
                </h2>

                <p className="text-muted-foreground mb-8 leading-relaxed">
                    {t('errors.server_error.description')}
                </p>

                {error.digest && (
                    <p className="text-xs text-muted-foreground mb-6 font-mono break-all">
                        Error ID: {error.digest}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => reset()}
                        className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                        {t('errors.server_error.retry')}
                    </button>

                    <Link
                        href={`/${params.locale}/dashboard`}
                        className="inline-flex items-center justify-center px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                        {t('errors.server_error.action')}
                    </Link>
                </div>
            </div>
        </main>
    );
}
