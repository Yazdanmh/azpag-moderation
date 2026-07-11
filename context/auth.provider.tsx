'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import type { Session } from 'next-auth';
import { SessionProvider, useSession } from 'next-auth/react';

// Context type
interface AuthContextProps {
    session: Session | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

// --- FIXED AuthProvider ---
export default function AuthProvider({
    children,
    session: initialSession
}: {
    session: Session | null;
    children: ReactNode;
}) {
    return (
        <SessionProvider session={initialSession}>
            <AuthStateWrapper>{children}</AuthStateWrapper>
        </SessionProvider>
    );
}

// NEW internal wrapper to sync with NextAuth session
function AuthStateWrapper({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();

    return <AuthContext.Provider value={{ session, status }}>{children}</AuthContext.Provider>;
}
