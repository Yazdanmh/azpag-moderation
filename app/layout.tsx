import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/app-providers";
import { cookies } from "next/headers";
import { dictionaries, directionFor, isLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const savedLocale = (await cookies()).get("azpag_locale")?.value;
  const locale = isLocale(savedLocale) ? savedLocale : "fa";
  const dictionary = dictionaries[locale];

  return {
    title: dictionary.metadataTitle,
    description: dictionary.metadataDescription,
  };
}

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
