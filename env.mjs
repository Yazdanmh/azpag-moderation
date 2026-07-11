import { createEnv } from '@t3-oss/env-nextjs';

import { z } from 'zod';

export const env = createEnv({
    server: {
        NEXTAUTH_URL: z.string().url(),
        NEXTAUTH_SECRET: z
          .string()
          .min(32, 'NEXTAUTH_SECRET must be at least 32 characters (generate one with: openssl rand -base64 32)')
          .regex(/^[A-Za-z0-9+/=_-]+$/, 'NEXTAUTH_SECRET contains invalid characters'),
        BACKEND_URL: z.string().min(1),
    },
    client: {
        NEXT_PUBLIC_BACKEND_URL: z.string().min(1),
        NEXT_PUBLIC_APP_URL: z.string().min(1),
    },
    runtimeEnv: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        BACKEND_URL: process.env.BACKEND_URL,
    }
});
