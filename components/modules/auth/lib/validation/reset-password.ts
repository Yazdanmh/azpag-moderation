import * as z from 'zod';

export const ResetPasswordSchema = (t: (key: string) => string) =>
    z.object({
        code: z
            .string({
                message: t('form.auth.validation.otp.required')
            })
            .min(6, {
                message: t('form.auth.validation.otp.invalid')
            }),
        password: z
            .string({
                message: t('form.auth.validation.password.required')
            })
            .min(8, {
                message: t('form.auth.validation.password.min')
            }),
        confirmPassword: z
            .string({
                message: t('form.auth.validation.password.required')
            })
    }).refine((data) => data.password === data.confirmPassword, {
        message: t('form.auth.validation.password.mismatch'),
        path: ["confirmPassword"],
    });
