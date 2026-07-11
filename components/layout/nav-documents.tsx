"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { usePathname } from "@/i18n/navigation"

export function NavDocuments({
  title,
  items,
}: {
  title?: string
  items: {
    name: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const active = pathname.startsWith(item.url)
          return (
            <SidebarMenuItem key={item.name} className="">
              <SidebarMenuButton asChild isActive={active}>
                <a href={item.url} className="py-5">
                  {item.icon}
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>

            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
