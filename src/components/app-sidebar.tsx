'use client'
import * as React from "react"

import { SearchForm } from "@/components/search-form"
import { VersionSwitcher } from "@/components/version-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { LinkLoader } from "./link-loader"
import { useSession } from "@/lib/auth-client"

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Users Module",
      url: "/admin",
      items: [
        {
          title: "Manage Users",
          url: "/admin/users",
        },
        {
          title: "Manage Requests",
          url: "/admin/requests",
        },
      ],
    },
    {
      title: "Grave Module",
      url: "/admin/graves",
      items: [
        {
          title: "Manage Graves",
          url: "/admin/graves",
        },
        {
          title: "Manage Clusters",
          url: "/admin/graves/clusters",
        },
      ],
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const path = usePathname()
  const { data: userData } = useSession()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        {userData?.user.name}
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.url === path}>
                      {/* @ts-expect-error - TODO: Fix this */}
                      <Link href={item.url} className="flex gap-2">
                        {item.title}
                        <LinkLoader />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
