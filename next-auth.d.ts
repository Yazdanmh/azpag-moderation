// Ref: https://next-auth.js.org/getting-started/typescript#module-augmentation
import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT, JWT } from 'next-auth/jwt';

declare module 'next-auth' {
    interface Session {
        user?: {
            id: string;
            role: string;
            email: string;
            name: string;
            image: string;
            profile?: string;
            provider?: string;
            acc: string;
            type?: string;
            isTypeUpdated?: boolean;
        } & DefaultUser;
    }

    interface User extends DefaultUser {
        role: string;
        acc: string;
        isTypeUpdated?: boolean;
        profile?: string;
    }

    interface JWT {
        access_token?: string;
        refresh_token?: string;
        user?: User;
    }
}

declare module 'next-auth/jwt' {
    interface JWT extends DefaultJWT {
        access_token?: string;
        refresh_token?: string;
        user?: {
            id: string;
            role: string;
            email: string;
            name: string;
            image: string;
            profile?: string;
            acc: string;
            type?: string;
            isTypeUpdated?: boolean;
        };
    }
}
