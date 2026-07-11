import './globals.css'
import { useLocale } from "next-intl";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";
import { StateBlock } from "@/components/shared/state-block";

const geistSans = localFont({
    src: '../fonts/GeistVF.woff',
    variable: '--font-geist-sans',
    weight: '100 900'
});
const geistMono = localFont({
    src: '../fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900'
});

// Dari (Farsi) font - IranSans
const dariFont = localFont({
    src: '../fonts/IRANSans-Edit.ttf',
    variable: '--font-dari',
    weight: '100 700 900',
    display: 'swap'
});

// English font - Geist Sans
const englishFont = localFont({
    src: '../fonts/GeistVF.woff',
    variable: '--font-english',
    weight: '100 900',
    display: 'swap'
});

// Pashto font
const pashtoFont = localFont({
    src: '../fonts/Pashto.ttf',
    variable: '--font-pashto',
    weight: '100 700 900',
    display: 'swap'
});

export default function NotFound() {
    const locale = useLocale();

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
                <main className="min-h-screen flex items-center justify-center bg-background px-4">
                    <div className="text-center max-w-md">
                        <StateBlock
                            title="Page Not Found"
                            description="Sorry, the page you are looking for does not exist or may have been moved. Please check the URL or return to the homepage."
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="34"
                                    height="34"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-foreground/25 relative"
                                >
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                            }
                            label="Go to Home"
                            link="/"
                        />
                    </div>
                </main>

            </body>
        </html>
    );
}