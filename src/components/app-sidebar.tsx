'use client'
import * as React from "react"

import { SearchForm } from "@/components/search-form"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { LinkLoader } from "./link-loader"
import { useSession } from "@/lib/auth-client"
import AccountManagementModal from "./account-management-modal"
import LogoutButton from "./logout-button"
import {
  User,
  Settings,
  Search,
  Bell,
  HelpCircle
} from "lucide-react"

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

  // Get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b border-border/40 p-4">
        <div className="flex flex-col space-y-4">
          {/* User Profile Section */}
          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-3 p-2 h-auto hover:bg-accent/50 w-full justify-start"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userData?.user.image ?? ""} alt={userData?.user.name ?? ""} />
                    <AvatarFallback className="text-xs font-medium">
                      {userData?.user.name ? getUserInitials(userData.user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {userData?.user.name ?? "User"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {userData?.user.email ?? ""}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userData?.user.name ?? "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userData?.user.email ?? ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <AccountManagementModal user={userData?.user ?? { id: "", name: "", email: "" }} />
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help & Support</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>

          {/* Search Section */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Search className="h-3 w-3" />
              <span>Quick Search</span>
            </div>
            <SearchForm />
          </div>

          {/* User Status Badge */}
          {userData?.user && (
            <div className="flex items-center justify-center">
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </div>
          )}
        </div>
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
