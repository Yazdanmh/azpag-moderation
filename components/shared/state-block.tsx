import Link from "next/link";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface StateBlockProps {
    title: string;
    description: string;
    icon: ReactNode;
    label?: string;
    link?: string;
}

export function StateBlock({
    title,
    description,
    icon,
    label,
    link,
}: StateBlockProps) {
    return (
        <div
            className="flex items-center justify-center animate-fade-in"
            style={{ minHeight: "60vh" }}
        >
            <div className="flex flex-col items-center text-center gap-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-foreground/5 rounded-full blur-2xl scale-150 animate-pulse" />

                    <div className="relative w-28 h-28 rounded-full border border-foreground/10 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border border-dashed border-foreground/20 animate-spin-slow" />
                        <div className="absolute inset-3 rounded-full bg-foreground/[0.03]" />

                        {icon}
                    </div>
                </div>

                <div className="space-y-3 max-w-sm">
                    <p className="text-xl font-heading text-foreground/50 tracking-wide">
                        {title}
                    </p>

                    <div className="w-12 h-px bg-foreground/10 mx-auto" />

                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </p>

                    {label && link && (
                        <Button className="mt-2">
                            <Link href={link}>
                                {label}
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}