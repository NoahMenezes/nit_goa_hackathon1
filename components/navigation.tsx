"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Map,
  Users,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Home,
  Shield,
  Mic,
  Github,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Dock, DockIcon } from "@/components/magicui/dock";

export function Navigation() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const centerNavItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/report", label: "Report Issue", icon: PlusCircle },
    { href: "/map", label: "Map", icon: Map },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/voice-agent", label: "Voice Agent", icon: Mic },
    { href: "/team", label: "Team", icon: Users },
  ];

  const authItems = [
    { href: "/login", label: "Login" },
    { href: "/signup", label: "Sign Up" },
  ];

  return (
    <header className="sticky top-0 z-[100] w-full bg-white/95 dark:bg-black/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo - Left */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative size-10 transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="OurStreet Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-lg font-semibold text-black dark:text-white">
            OurStreet
          </span>
        </Link>

        {/* Center Navigation - Map, Dashboard, Team with Dock Animation */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <TooltipProvider>
            <Dock direction="middle" magnification={50} distance={120}>
              {centerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <DockIcon key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          aria-label={item.label}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "size-10 rounded-full",
                            isActive &&
                              "bg-gray-100 dark:bg-gray-900 text-black dark:text-white",
                          )}
                        >
                          <Icon className="size-4" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </DockIcon>
                );
              })}
            </Dock>
          </TooltipProvider>
        </div>

        {/* Right Side - Admin Button, Report Issue, Auth & Theme Toggle */}
        <div className="flex items-center gap-2 relative z-20">
          {isAuthenticated && user?.role === "admin" && (
            <Link href="/admin" className="relative z-20">
              <Button
                size="sm"
                variant="outline"
                className="font-medium border-2 hover:bg-gray-100 dark:hover:bg-gray-900 bg-white dark:bg-black"
              >
                <Shield className="mr-1.5 size-4" />
                Admin Panel
              </Button>
            </Link>
          )}
          {isAuthenticated && (
            <Link href="/report" className="relative z-20">
              <Button
                size="sm"
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-medium"
              >
                <PlusCircle className="mr-1.5 size-4" />
                Report Issue
              </Button>
            </Link>
          )}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 relative z-20">
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="font-medium bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <LogOut className="mr-1.5 size-4" />
                Logout
              </Button>
            </div>
          ) : (
            <NavigationMenu className="relative z-20">
              <NavigationMenuList>
                {authItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <NavigationMenuItem key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "font-medium relative z-20",
                          isActive &&
                            "bg-gray-100 dark:bg-gray-900 text-black dark:text-white",
                          item.label === "Sign Up" &&
                            "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200",
                        )}
                      >
                        {item.label}
                      </Link>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          )}
          <a
            href="https://github.com/NoahMenezes/nit_goa_hackathon1"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "size-10 rounded-full",
            )}
          >
            <Github className="size-5" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
