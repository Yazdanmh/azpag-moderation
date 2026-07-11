'use client';

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { NavUser } from "./nav-user"
import { useAuth } from "@/context/auth.provider";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { GlobeIcon } from "lucide-react";

export function SiteHeader() {
  const { session } = useAuth();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const locales = [
    { code: 'en', label: 'English' },
    { code: 'fa', label: 'فارسی' },
    { code: 'ps', label: 'پښتو' },
  ];

  return (
    <header className="flex h-(--header-height) shrink-0 items-center justify-between border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
      </div>

      <div className="flex items-center gap-2 px-4 lg:px-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-3">
              <GlobeIcon className="size-4" />
              <span className="text-sm font-medium">{locales.find((l) => l.code === locale)?.label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {locales.map((l) => (
              <DropdownMenuItem
                key={l.code}
                className={locale === l.code ? "bg-accent" : ""}
                onClick={() => router.replace(pathname, { locale: l.code })}
              >
                {l.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {session?.user &&
          <NavUser
            user={{
              name: session.user.name ?? "",
              email: session.user.email ?? "",
              avatar: session.user.profile ?? "",
            }}
          />
        }
      </div>
    </header>
  )
}
