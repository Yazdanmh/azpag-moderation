"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ChartNoAxesCombinedIcon, FileCheck2Icon, LayoutDashboardIcon } from "lucide-react"
import { useI18n } from "@/components/providers/app-providers"
import { hasModerationRole, isManagerOnly } from "@/lib/moderation/types"

import { NavUser } from "@/components/layout/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; image: string; roles: string[] }
}) {
  const pathname = usePathname()
  const { locale, dictionary: t } = useI18n()
  const managerOnly = isManagerOnly(user.roles)
  const homeHref = managerOnly ? "/panel/reviews/next" : "/panel"
  const mainNavigation = managerOnly
    ? [{ title: t.reviewWorkspace, href: "/panel/reviews/next", icon: FileCheck2Icon }]
    : [
      { title: t.dashboard, href: "/panel", icon: LayoutDashboardIcon },
      ...(hasModerationRole(user.roles)
      ? [
          { title: t.reviews, href: "/panel/reviews", icon: FileCheck2Icon },
          { title: t.reviewWorkspace, href: "/panel/reviews/next", icon: FileCheck2Icon },
          { title: t.qualityReport, href: "/panel/quality", icon: ChartNoAxesCombinedIcon },
        ]
      : []),
    ]
  const navigation = mainNavigation
  const isNavigationActive = (href: string) => {
    if (pathname === href) return true

    if (href === "/panel/reviews") {
      return (
        (pathname.startsWith("/panel/reviews/") && !pathname.startsWith("/panel/reviews/next")) ||
        pathname.startsWith("/panel/posts/")
      )
    }

    if (href === "/panel/quality") {
      return pathname.startsWith("/panel/quality/")
    }

    return false
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      side={locale === "en" ? "left" : "right"}
      dir={locale === "en" ? "ltr" : "rtl"}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href={homeHref} />}
            >
              <Image
                src="/logo.png"
                alt="Azpag"
                width={36}
                height={36}
                className="size-9 shrink-0 object-contain"
                priority
              />
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">{t.brandName}</span>
                <span className="truncate text-xs text-muted-foreground">{t.moderation}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.panel}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isNavigationActive(item.href)}
                    tooltip={item.title}
                    className="h-11 gap-3 rounded-md px-3 text-base font-normal text-sidebar-foreground transition-colors hover:bg-primary/10 hover:text-primary data-active:bg-primary data-active:font-normal data-active:text-primary-foreground [&_svg]:size-4.5 [&_svg]:text-primary data-active:[&_svg]:text-primary-foreground"
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: user.name || t.moderator,
            email: user.email,
            avatar: user.image,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
