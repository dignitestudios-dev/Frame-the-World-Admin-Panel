"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Ticket,
  ShieldAlert,
  Bot,
  Trophy,
  Award,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

import { NavMain } from "@/components/nav-main";
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

const data = {
  navGroups: [
    {
      label: "Main",
      items: [
        {
          title: "Overview",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "User Management",
      items: [
        {
          title: "Users",
          url: "/dashboard/users",
          icon: Users,
        },
      ],
    },
    {
      label: "Analytics",
      items: [
        {
          title: "Advanced Analytics",
          url: "/dashboard/analytics",
          icon: BarChart3,
        },
      ],
    },
    {
      label: "Promotions",
      items: [
        {
          title: "Promo Codes",
          url: "/dashboard/promo-codes",
          icon: Ticket,
        },
      ],
    },
    {
      label: "Content",
      items: [
        {
          title: "Content Moderation",
          url: "/dashboard/content-moderation",
          icon: ShieldAlert,
        },
      ],
    },
    {
      label: "Tools & Insights",
      items: [
        {
          title: "AI Tools",
          url: "/dashboard/ai-tools",
          icon: Bot,
        },
        {
          title: "Leaderboard",
          url: "/dashboard/leaderboard",
          icon: Trophy,
        },
        {
          title: "Badges",
          url: "/dashboard/badges",
          icon: Award,
          items: [
            { title: "Overview", url: "/dashboard/badges" },
            { title: "Manage Badges", url: "/dashboard/badges/management" },
          ],
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useSelector((state: RootState) => state.auth.user);

  const userData = user
    ? { name: user.email, email: user.email, avatar: "" }
    : { name: "Admin", email: "", avatar: "" };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-brand-gradient">
                  <Image
                    src="/images/app_logo.png"
                    alt="Frame The World"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Frame The World</span>
                  <span className="truncate text-xs text-muted-foreground">Admin Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}

