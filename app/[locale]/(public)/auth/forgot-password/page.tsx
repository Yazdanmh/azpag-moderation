import { AuthForgotPasswordForm } from '@/components/modules/auth/components/forms/forgot-password';
import { getTranslations, getLocale } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: 'seo.forgot_password' });

    return {
        title: t('title'),
        description: t('description')
    };
}

const page = () => {
    return (
        <div className=''>
            <AuthForgotPasswordForm />
        </div>
    );
};

export default page;
