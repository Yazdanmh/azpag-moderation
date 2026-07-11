import * as z from 'zod';

export const ChangeEmailSchema = (t: (key: string) => string) =>
    z.object({
        password: z
            .string({
                message: t('form.auth.validation.password.required')
            })
            .min(8, {
                message: t('form.auth.validation.password.min')
            }),
        id: z
            .string({
                message: t('form.auth.validation.id.required')
            })
            .min(1, {
                message: t('form.auth.validation.id.required')
            })
    });
