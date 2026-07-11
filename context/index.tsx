import { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import ProvidersClient from "./providers-client";

export default async function Providers({
    children,
    locale,
}: {
    children: ReactNode;
    locale?: string;
}) {
    const direction = locale === "fa" || locale === "ar" || locale === "ps"
        ? "rtl"
        : "ltr";

    const session = await getSession();
    
    return (
        <ProvidersClient session={session} direction={direction}>
            {children}
        </ProvidersClient>
    );
}