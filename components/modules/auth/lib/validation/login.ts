import * as z from 'zod';

// Input validation (XSS/SQLi prevention) is enforced server-side only.
// Client-side regex blocks are trivially bypassed and create false security.
// The backend is the sole authority for sanitization and access control.

export const AuthLoginSchema = (t: (t: string) => string) =>
    z.object({
        email: z
            .string({
                message: t('auth.validation.email.required')
            })
            .email({
                message: t('auth.validation.email.invalid')
            }),

        password: z
            .string({ message: t('auth.validation.password.required') })
            .min(2, { message: t('auth.validation.password.min') })
    });