import { AuthLoginForm } from '@/components/modules/auth/components/forms/login';
import { getTranslations, getLocale } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: 'seo.login' });

    return {
        title: t('title'),
        description: t('description')
    };
}

const page = () => {
    return (
        <div className=''>
            <AuthLoginForm />
        </div>
    );
};

export default page;
