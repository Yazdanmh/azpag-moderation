import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { cookies } from "next/headers";
import { directionFor, isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Azpag Moderation",
  description: "Azpag moderation dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const savedLocale = (await cookies()).get("azpag_locale")?.value;
  const locale = isLocale(savedLocale) ? savedLocale : "fa";
  return (
    <html lang={locale} dir={directionFor(locale)} suppressHydrationWarning>
      <body><Providers initialLocale={locale}>{children}</Providers></body>
    </html>
  );
}
