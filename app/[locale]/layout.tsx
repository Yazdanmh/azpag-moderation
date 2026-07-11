import type { Metadata } from "next";
import "../globals.css";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import localFont from 'next/font/local';
import { cn } from "@/lib/utils";
import Providers from "@/context";
import { routing } from "@/i18n/routing";


const geistSans = localFont({
  src: '../../fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900'
});
const geistMono = localFont({
  src: '../../fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900'
});

// Dari (Farsi) font - IranSans
const dariFont = localFont({
  src: '../../fonts/IRANSans-Edit.ttf',
  variable: '--font-dari',
  weight: '100 700 900',
  display: 'swap'
});

// English font - Geist Sans
const englishFont = localFont({
  src: '../../fonts/GeistVF.woff',
  variable: '--font-english',
  weight: '100 900',
  display: 'swap'
});

// Pashto font
const pashtoFont = localFont({
  src: '../../fonts/Pashto.ttf',
  variable: '--font-pashto',
  weight: '100 700 900',
  display: 'swap'
});

export const metadata: Metadata = {
  title: "Azpag Analytics",
  description: "Azpag, Afghanistan Online Marketplace",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html
      data-scroll-behavior="smooth"
      className='scroll-smooth'
      suppressHydrationWarning
      lang={locale}
      dir={locale === 'en' ? 'ltr' : 'rtl'}
    >
      <body className={cn(
        `relative ${geistSans.variable} ${dariFont.variable} ${pashtoFont.variable} ${geistMono.variable} ${englishFont.variable} bg-background text-foreground antialiased`,
        locale === 'fa' && 'font-dari',
        locale === 'ps' && 'font-pashto',
        locale === 'en' && 'font-english'
      )}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers locale={locale}>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
