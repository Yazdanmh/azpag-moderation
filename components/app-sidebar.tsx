"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { FileCheck2Icon, LayoutDashboardIcon } from "lucide-react"
import { useI18n } from "@/components/providers"

import { NavUser } from "@/components/nav-user"
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
  user: { name: string; email: string; image: string }
}) {
  const pathname = usePathname()
  const { locale, dictionary: t } = useI18n()
  const navigation = [
    { title: t.dashboard, href: "/panel", icon: LayoutDashboardIcon },
    { title: t.reviews, href: "/panel/reviews", icon: FileCheck2Icon },
  ]

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
              render={<Link href="/panel" />}
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
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.title}
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
