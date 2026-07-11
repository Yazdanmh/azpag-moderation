import * as z from 'zod';

export const RestoreAccountSchema = (t: (key: string) => string) =>
    z.object({
        email: z
            .string({
                message: t('form.auth.validation.email.required')
            })
            .email({
                message: t('form.auth.validation.email.invalid')
            })
    });
