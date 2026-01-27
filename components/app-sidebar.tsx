"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconMap,
  IconMapPin,
  IconPlus,
  IconSettings,
  IconUsers,
  IconHistory,
  IconTrendingUp,
  IconHome,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";

const navData = {
  main: [
    {
      title: "Home",
      url: "/",
      icon: IconHome,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Report Issue",
      url: "/report",
      icon: IconPlus,
    },
    {
      title: "Map View",
      url: "/map",
      icon: IconMap,
    },
    {
      title: "My Reports",
      url: "/dashboard",
      icon: IconHistory,
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: IconTrendingUp,
    },
    {
      title: "Transparency",
      url: "/transparency",
      icon: IconChartBar,
    },
  ],
  secondary: [
    {
      title: "Team",
      url: "/team",
      icon: IconUsers,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Help & Support",
      url: "#",
      icon: IconHelp,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const userData = user
    ? {
        name: user.name,
        email: user.email,
        avatar: user.avatar || "/avatars/default.jpg",
      }
    : {
        name: "Guest User",
        email: "guest@ourstreet.app",
        avatar: "/avatars/default.jpg",
      };

  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[slot=sidebar-menu-button]:!p-2"
            >
              <Link href="/" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <IconMapPin className="!size-5" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">OurStreet</span>
                  <span className="text-xs text-sidebar-foreground/70">
                    Civic Reporting
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <NavMain items={navData.main} />
        <div className="mt-auto">
          <NavSecondary items={navData.secondary} />
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
