"use client";

import { ReactNode } from "react";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DirectionProvider } from "@/components/ui/direction";
import AuthProvider from "./auth.provider";
import type { Session } from "next-auth";

export default function ProvidersClient({
    children,
    session,
    direction,
}: {
    children: ReactNode;
    session: Session | null;
    direction: "ltr" | "rtl";
}) {
    return (
        <TooltipProvider>
            <AuthProvider session={session}>
                <DirectionProvider dir={direction}>
                    <NextTopLoader color="#FF6600" showSpinner={false} />
                    {children}
                    <Toaster />
                </DirectionProvider>
            </AuthProvider>
        </TooltipProvider>
    );
}
