"use client"

import { useMemo } from "react"
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { NavDocuments } from "@/components/layout/nav-documents"
import { NavSecondary } from "@/components/layout/nav-secondary"
import { Icon } from "@/components/shared/icon"
import { sidebarNav, secondaryNavItems } from "@/config/sidebar"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { useAuth } from "@/context/auth.provider"

export function AppSidebar({ dir, ...props }: React.ComponentProps<typeof Sidebar> & { dir?: "ltr" | "rtl" }) {
  const t = useTranslations("sidebar")
  const { session } = useAuth()
  const role = session?.user?.role as string | undefined

  const filteredCategories = useMemo(() => {
    return sidebarNav
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => !item.access || (role && item.access.some((a) => a.toLowerCase() === role.toLowerCase()))),
      }))
      .filter((category) => category.items.length > 0)
  }, [role])

  const secondary = useMemo(
    () =>
      secondaryNavItems
        .filter((item) => !item.access || (role && item.access.some((a) => a.toLowerCase() === role.toLowerCase())))
        .map((item) => ({
          title: t(item.title ?? ''),
          url: item.href,
          icon: item.icon ? <Icon name={item.icon} size={20} /> : null,
        })),
    [role, t]
  )

  return (
    <Sidebar collapsible="offcanvas" dir={dir} {...props}>
      <SidebarHeader>
        <div className="flex flex-col items-start gap-1  py-4">
          <Image
            src="https://ganjyab.s3.eu-north-1.amazonaws.com/9fd8662c-32b1-4e95-b592-72b4fad41c16_large.png"
            alt="Azpag"
            width={80}
            height={56}
            className="object-contain"
            unoptimized
          />
          <span className="text-sm font-medium text-muted-foreground">{t('welcome')}</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {filteredCategories.map((category, i) => (
          <NavDocuments
            key={i}
            title={category.label ? t(category.label) : undefined}
            items={category.items.map((item) => ({
              name: t(item.title ?? ''),
              url: item.href,
              icon: item.icon ? <Icon name={item.icon} size={20} /> : null,
            }))}
          />
        ))}
        {secondary.length > 0 && <NavSecondary items={secondary} className="mt-auto" />}
      </SidebarContent>
    </Sidebar>
  )
}
