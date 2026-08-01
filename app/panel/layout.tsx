import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <SidebarProvider
      className="max-w-full overflow-x-hidden"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 16)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        user={{
          name: session.name,
          email: session.email,
          image: session.image,
          roles: session.roles,
        }}
        variant="inset"
      />
      <SidebarInset className="min-w-0 max-w-full overflow-x-hidden">
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
