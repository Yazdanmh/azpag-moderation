'use client';

import * as React from 'react';

import { signIn } from 'next-auth/react';
import * as z from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { getDefaultRedirectByRole } from '@/lib/roles';
import { safeRedirect } from '@/lib/utils';
import { useRateLimiter } from '@/hooks/use-rate-limiter';
import { AuthLoginSchema } from '../../../lib/validation/login';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notify } from '@/components/shared/notification';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

interface AuthLoginFormProps extends React.HTMLAttributes<HTMLDivElement> {
    mode?: 'page' | 'modal';
    onSuccess?: () => void;
}

export function AuthLoginForm({ className, mode = 'page', onSuccess, ...props }: AuthLoginFormProps) {
    const t = useTranslations('form');
    const locale = useLocale();
    const { data: session, update: updateSession } = useSession();

    const schema = React.useMemo(() => AuthLoginSchema(t), [t]);
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid }
    } = useForm<z.infer<typeof schema>>({
        mode: 'onChange',
        resolver: zodResolver(schema)
    });


    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const { isBlocked, remainingMs, recordAttempt } = useRateLimiter();


    async function onSubmit(data: z.infer<typeof schema>) {
        if (isBlocked) {
            notify.error({
                title: t('auth.message.login.error.tooManyRequests.title'),
                description: t('auth.message.login.error.tooManyRequests.description', { seconds: Math.ceil(remainingMs / 1000) }),
            });
            return;
        }
        try {
            setIsLoading(true);

            const signInResult = await signIn('credentials', {
                email: data.email.toLowerCase(),
                password: data.password,
                redirect: false
            });

            if (signInResult?.status === 200 || signInResult?.status === 201) {
                recordAttempt(false);
                notify.success({
                    title: t('auth.message.login.success.title'),
                    description: t('auth.message.login.success.description'),
                });

                // Update session to get the latest user data with role
                const updatedSession = await updateSession();
                
                const redirectPath = updatedSession?.user?.role
                    ? getDefaultRedirectByRole(updatedSession.user.role, locale)
                    : null;
                window.location.href = safeRedirect(redirectPath, `/${locale}/dashboard`);

            }

            if (signInResult?.error) {
                const errorObj = JSON.parse(signInResult.error);
                const isRateLimited = errorObj.status === 429;

                recordAttempt(true);

                if (isRateLimited) {
                    notify.error({
                        title: t('auth.message.login.error.tooManyRequests.title'),
                        description: t('auth.message.login.error.tooManyRequests.description')
                    });
                } else {
                    notify.error({
                        title: t('auth.message.login.error.unauthorized.title'),
                        description: t('auth.message.login.error.unauthorized.description')
                    });
                }
            }
        } catch (error) {
            notify.error({
                title: t('auth.message.login.error.title'),
                description: t('auth.message.login.error.description')
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div
            className={cn(
                "min-h-screen flex items-center justify-center bg-background px-4",
                className
            )}
            {...props}
        >
            <div className="w-full max-w-md space-y-8">
                {/* Logo + Header */}
                <div className="text-center space-y-3">

                    {/* Logo */}
                    <div className="flex justify-center">
                        <div className="relative h-20 w-20">
                            <Image
                                src="/images/logo.png"
                                alt="Azpag Logo"
                                fill
                                sizes="80px"
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>

                    {/* Title and Subtitle */}
                    <div className="space-y-2">
                        <h1 className="text-xl font-semibold tracking-tight">
                            {t("auth.login.title")}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t("auth.login.subtitle")}
                        </p>
                    </div>
                </div>

                {/* Card */}
                <div className="px-6 space-y-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1">
                            <Label htmlFor="email">
                                {t("auth.field.email.label")}
                            </Label>
                            <Input
                                autoFocus
                                id="email"
                                placeholder={t("auth.field.email.placeholder")}
                                type="email"
                                autoComplete="email"
                                disabled={isLoading}
                                className=""
                                {...register("email")}
                            />
                            {errors?.email && (
                                <p className="text-xs text-red-600">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <Label htmlFor="password">
                                {t("auth.field.password.label")}
                            </Label>
                            <PasswordInput
                                id="password"
                                placeholder={t("auth.field.password.placeholder")}
                                autoComplete="current-password"
                                disabled={isLoading}
                                {...register("password")}
                            />
                            {errors?.password && (
                                <p className="text-xs text-red-600">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <Button
                            variant="default"
                            isLoading={isLoading}
                            icon={isLoading ? "LuLoaderCircle" : "LuLogIn"}
                            disabled={isLoading || !isValid || isBlocked}
                            className="w-full"
                            type="submit"
                        >
                            {isLoading
                                ? t("auth.action.loading")
                                : t("auth.action.login")}
                        </Button>

                        {/* Forgot Password Link */}
                        <div className="text-center">
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm text-primary hover:underline transition-colors"
                            >
                                {t("auth.action.forgot")}
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground">
                    {t('auth.footer.rights', { year: new Date().getFullYear() })}
                </p>
            </div>
        </div>
    );
}
