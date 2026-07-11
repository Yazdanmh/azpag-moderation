import { StateBlock } from "@/components/shared/state-block";
import { getTranslations } from "next-intl/server";

export default async function ErrorPage() {
    const t = await getTranslations("errors.access_denied");

    return (
        <main className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center max-w-md">
                <StateBlock
                    title={t("title")}
                    description={t("description")}
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="34"
                            height="34"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-foreground/25 relative"
                        >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <rect x="9" y="10" width="6" height="5" rx="1" />
                            <path d="M10 10V8a2 2 0 0 1 4 0v2" />
                        </svg>
                    }
                    label={t("action")}
                    link="/"
                />
            </div>
        </main>
    );
}