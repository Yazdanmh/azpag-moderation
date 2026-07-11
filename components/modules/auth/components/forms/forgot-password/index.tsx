'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notify } from '@/components/shared/notification';
import { forgotPassword, resendOtp, resetPassword } from '../../../lib/services';
import { cn, safeRedirect } from '@/lib/utils';
import { useRateLimiter } from '@/hooks/use-rate-limiter';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { ForgotPasswordEmailSchema } from '../../../lib/validation/forgot-password';
import { ResetPasswordSchema } from '../../../lib/validation/reset-password';

interface AuthForgotPasswordFormProps extends React.HTMLAttributes<HTMLDivElement> {
    mode?: 'page' | 'modal';
    onSuccess?: () => void;
}


// Step 2: OTP + Password Reset Schema (Combined)

type Step = 'email' | 'reset-password';

export function AuthForgotPasswordForm({ className, mode = 'page', onSuccess, ...props }: AuthForgotPasswordFormProps) {
    const t = useTranslations();
    const router = useRouter();
    const searchParams = useSearchParams();

    // State management
    const [currentStep, setCurrentStep] = React.useState<Step>(() => {
        // Initialize step from URL parameter
        const step = searchParams.get('step');
        return step === 'reset' ? 'reset-password' : 'email';
    });
    const [email, setEmail] = React.useState<string>('');
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [timer, setTimer] = React.useState<number>(0);
    const timerIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
    const { isBlocked, remainingMs, recordAttempt } = useRateLimiter();

    // Step 1 Form
    const emailSchema = React.useMemo(() => ForgotPasswordEmailSchema(t), [t]);
    const {
        register: registerEmail,
        handleSubmit: handleEmailSubmit,
        formState: { errors: emailErrors, isValid: emailIsValid }
    } = useForm<z.infer<typeof emailSchema>>({
        mode: 'onChange',
        resolver: zodResolver(emailSchema)
    });

    // Step 2 Form (Combined OTP + Password Reset)
    const resetPasswordSchema = React.useMemo(() => ResetPasswordSchema(t), [t]);
    const {
        register: registerReset,
        handleSubmit: handleResetSubmit,
        formState: { errors: resetErrors, isValid: resetIsValid }
    } = useForm<z.infer<typeof resetPasswordSchema>>({
        mode: 'onChange',
        resolver: zodResolver(resetPasswordSchema)
    });

    // UX-only countdown timer. Security rate limiting is enforced server-side (429 responses).
    // The client timer prevents accidental rapid clicks but is trivially bypassable.
    React.useEffect(() => {
        if (timer <= 0) {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
            return;
        }

        timerIntervalRef.current = setInterval(() => {
            setTimer(prev => prev - 1);
        }, 1000);

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [timer]);

    // Step 1: Submit email and send OTP
    async function onEmailSubmit(data: z.infer<typeof emailSchema>) {
        if (isBlocked) {
            notify.error({
                title: t('form.auth.message.forgot_password.error.tooManyRequests.title'),
                description: t('form.auth.message.forgot_password.error.tooManyRequests.description'),
            });
            return;
        }

        try {
            setIsLoading(true);

            const response = await forgotPassword({ email: data.email.toLowerCase(), access_level: 'PRIVATE' });

            if (response?.status === 200 || response?.status === 201) {
                recordAttempt(false);
                notify.success({
                    title: t('form.auth.message.forgot_password.success.title'),
                    description: t('form.auth.message.forgot_password.success.description'),
                });

                setEmail(data.email.toLowerCase());
                setTimer(60);
                setCurrentStep('reset-password');
                // Update URL with step parameter for better UX
                router.push(`/auth/forgot-password?step=reset`, { scroll: false });
                return;
            }

            recordAttempt(true);
            const status = response?.status || 500;

            const statusMessages: Record<number, { titleKey: string; descKey: string }> = {
                400: {
                    titleKey: 'form.auth.message.forgot_password.error.invalid.title',
                    descKey: 'form.auth.message.forgot_password.error.invalid.description'
                },
                404: {
                    titleKey: 'form.auth.message.forgot_password.error.not_found.title',
                    descKey: 'form.auth.message.forgot_password.error.not_found.description'
                },
                422: {
                    titleKey: 'form.auth.message.forgot_password.error.invalid.title',
                    descKey: 'form.auth.message.forgot_password.error.invalid.description'
                },
                429: {
                    titleKey: 'form.auth.message.forgot_password.error.tooManyRequests.title',
                    descKey: 'form.auth.message.forgot_password.error.tooManyRequests.description'
                },
                500: {
                    titleKey: 'form.auth.message.forgot_password.error.title',
                    descKey: 'form.auth.message.forgot_password.error.description'
                }
            };

            const message = statusMessages[status] || statusMessages[500];
            notify.error({
                title: t(message.titleKey),
                description: t(message.descKey)
            });
        } catch (error: any) {
            const status = error?.response?.status;

            const statusMessages: Record<number, { titleKey: string; descKey: string }> = {
                400: {
                    titleKey: 'form.auth.message.forgot_password.error.invalid.title',
                    descKey: 'form.auth.message.forgot_password.error.invalid.description'
                },
                404: {
                    titleKey: 'form.auth.message.forgot_password.error.not_found.title',
                    descKey: 'form.auth.message.forgot_password.error.not_found.description'
                },
                422: {
                    titleKey: 'form.auth.message.forgot_password.error.invalid.title',
                    descKey: 'form.auth.message.forgot_password.error.invalid.description'
                },
                429: {
                    titleKey: 'form.auth.message.forgot_password.error.tooManyRequests.title',
                    descKey: 'form.auth.message.forgot_password.error.tooManyRequests.description'
                },
                500: {
                    titleKey: 'form.auth.message.forgot_password.error.title',
                    descKey: 'form.auth.message.forgot_password.error.description'
                }
            };

            const message = statusMessages[status] || statusMessages[500];
            notify.error({
                title: t(message.titleKey),
                description: t(message.descKey)
            });
        } finally {
            setIsLoading(false);
        }
    }

    // Step 2: Submit OTP + New Password
    async function onResetSubmit(data: z.infer<typeof resetPasswordSchema>) {
        try {
            setIsLoading(true);
            const response = await resetPassword({
                email,
                password: data.password,
                code: data.code
            });

            if (response?.status === 200 || response?.status === 201) {
                notify.success({
                    title: t('form.auth.message.reset_password.success.title'),
                    description: t('form.auth.message.reset_password.success.description'),
                });

                setTimeout(() => {
                    router.push('/auth/login');
                }, 2000);
            }
        } catch (error: any) {
            const status = error?.response?.status;

            const statusMessages: Record<number, { titleKey: string; descKey: string }> = {
                400: {
                    titleKey: 'form.auth.message.reset_password.error.invalid.title',
                    descKey: 'form.auth.message.reset_password.error.invalid.description'
                },
                422: {
                    titleKey: 'form.auth.message.reset_password.error.invalid.title',
                    descKey: 'form.auth.message.reset_password.error.invalid.description'
                },
                500: {
                    titleKey: 'form.auth.message.reset_password.error.title',
                    descKey: 'form.auth.message.reset_password.error.description'
                }
            };

            const message = statusMessages[status] || statusMessages[500];
            notify.error({
                title: t(message.titleKey),
                description: t(message.descKey)
            });
        } finally {
            setIsLoading(false);
        }
    }

    // Handle resend OTP
    async function handleResendOtp() {
        if (isBlocked) {
            notify.error({
                title: t('form.auth.message.otp.error.tooManyRequests.title'),
                description: t('form.auth.message.otp.error.tooManyRequests.description'),
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await resendOtp(email);

            if (response?.status === 429) {
                recordAttempt(true);
                notify.error({
                    title: t('form.auth.message.otp.error.tooManyRequests.title'),
                    description: t('form.auth.message.otp.error.tooManyRequests.description'),
                });
                return;
            }

            if (response?.status === 200 || response?.status === 201) {
                recordAttempt(false);
                notify.success({
                    title: t('form.auth.message.otp.resend.title'),
                    description: t('form.auth.message.otp.resend.description'),
                });
                setTimer(60);
            }
        } catch (error: any) {
            notify.error({
                title: t('form.auth.message.otp.error.title'),
                description: t('form.auth.message.otp.error.description'),
            });
        } finally {
            setIsLoading(false);
        }
    }

    // Handle going back
    function handleGoBack() {
        if (currentStep === 'reset-password') {
            setCurrentStep('email');
            setTimer(0);
            // Clear the step parameter from URL when going back
            router.push('/auth/forgot-password', { scroll: false });
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
                        {currentStep === 'email' && (
                            <>
                                <h1 className="text-xl font-semibold tracking-tight">
                                    {t("form.auth.forgot_password.title")}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {t("form.auth.forgot_password.subtitle")}
                                </p>
                            </>
                        )}
                        {currentStep === 'reset-password' && (
                            <>
                                <h1 className="text-xl font-semibold tracking-tight">
                                    {t("form.auth.reset_password.title")}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {t("form.auth.reset_password.subtitle")}
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Card */}
                <div className="px-6 space-y-6">
                    {/* Step 1: Email */}
                    {currentStep === 'email' && (
                        <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-4">
                            {/* Email */}
                            <div className="space-y-1">
                                <Label htmlFor="email">
                                    {t("form.auth.field.email.label")}
                                </Label>
                                <Input
                                    autoFocus
                                    id="email"
                                    placeholder={t("form.auth.field.email.placeholder")}
                                    type="email"
                                    autoComplete="email"
                                    disabled={isLoading}
                                    {...registerEmail("email")}
                                />
                                {emailErrors?.email && (
                                    <p className="text-xs text-red-600">
                                        {emailErrors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Submit */}
                            <Button
                                variant="default"
                                isLoading={isLoading}
                                icon={isLoading ? "LuLoaderCircle" : "LuMail"}
                                disabled={isLoading || !emailIsValid}
                                className="w-full"
                                type="submit"
                            >
                                {isLoading
                                    ? t("form.auth.action.loading")
                                    : t("form.auth.action.send")}
                            </Button>

                            {/* Back to Login Link */}
                            <div className="text-center">
                                <Link
                                    href="/auth/login"
                                    className="text-sm text-primary hover:underline transition-colors"
                                >
                                    {t("form.auth.action.back_to_login")}
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* Step 2: OTP + Password Reset */}
                    {currentStep === 'reset-password' && (
                        <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-4">
                            {/* OTP Code */}
                            <div className="space-y-1">
                                <Label htmlFor="code">
                                    {t("form.auth.field.otp.label")}
                                </Label>
                                <Input
                                    autoFocus
                                    id="code"
                                    placeholder={t("form.auth.field.otp.placeholder")}
                                    type="text"
                                    maxLength={6}
                                    disabled={isLoading}
                                    className="text-center text-2xl tracking-widest"
                                    {...registerReset("code")}
                                />
                                {resetErrors?.code && (
                                    <p className="text-xs text-red-600">
                                        {resetErrors.code.message}
                                    </p>
                                )}
                            </div>

                            {/* Timer and Resend */}
                            <div className="text-center space-y-2">
                                {timer > 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        {t("form.auth.message.otp.resend_in")} {timer}s
                                    </p>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResendOtp}
                                        disabled={isLoading}
                                        className="w-full"
                                        type="button"
                                    >
                                        {t("form.auth.action.resend")}
                                    </Button>
                                )}
                            </div>

                            {/* New Password */}
                            <div className="space-y-1">
                                <Label htmlFor="password">
                                    {t("form.auth.field.password.label")}
                                </Label>
                                <PasswordInput
                                    id="password"
                                    placeholder={t("form.auth.field.password.placeholder")}
                                    disabled={isLoading}
                                    {...registerReset("password")}
                                />
                                {resetErrors?.password && (
                                    <p className="text-xs text-red-600">
                                        {resetErrors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1">
                                <Label htmlFor="confirmPassword">
                                    {t("form.auth.field.confirm_password.label")}
                                </Label>
                                <PasswordInput
                                    id="confirmPassword"
                                    placeholder={t("form.auth.field.confirm_password.placeholder")}
                                    disabled={isLoading}
                                    {...registerReset("confirmPassword")}
                                />
                                {resetErrors?.confirmPassword && (
                                    <p className="text-xs text-red-600">
                                        {resetErrors.confirmPassword.message}
                                    </p>
                                )}
                            </div>

                            {/* Submit */}
                            <Button
                                variant="default"
                                isLoading={isLoading}
                                icon={isLoading ? "LuLoaderCircle" : "LuLock"}
                                disabled={isLoading || !resetIsValid}
                                className="w-full"
                                type="submit"
                            >
                                {isLoading
                                    ? t("form.auth.action.loading")
                                    : t("form.auth.action.reset_password")}
                            </Button>

                            {/* Back Button */}
                            <Button
                                variant="outline"
                                onClick={handleGoBack}
                                disabled={isLoading}
                                className="w-full"
                                type="button"
                            >
                                {t("form.auth.action.back")}
                            </Button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground">
                    {t('form.auth.footer.rights', { year: new Date().getFullYear() })}
                </p>
            </div>
        </div>
    );
}
