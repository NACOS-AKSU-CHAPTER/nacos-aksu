import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Calendar,
  Newspaper,
  Image as ImageIcon,
  Inbox,
  UserPlus,
  CalendarDays,
  ShieldCheck,
  UserCircle,
  Briefcase,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const DashboardSidebar = () => {
  const {
    isAdmin,
    canAccessExecutives,
    canAccessCourses,
    canAccessMaterials,
    canAccessEvents,
    canAccessNews,
    canAccessGallery,
    canAccessCalendar,
    canAccessSuggestions,
    canAccessSignups,
  } = useAuth();
  const location = useLocation();

  // Build menu items based on permissions
  const menuItems = [
    { title: "Overview", url: "/dashboard", icon: LayoutDashboard, show: true },
    { title: "My Profile", url: "/dashboard/profile", icon: UserCircle, show: true },
    { title: "Executives", url: "/dashboard/executives", icon: Users, show: canAccessExecutives },
    { title: "Courses", url: "/dashboard/courses", icon: BookOpen, show: canAccessCourses },
    { title: "Materials", url: "/dashboard/materials", icon: FileText, show: canAccessMaterials },
    { title: "Events", url: "/dashboard/events", icon: Calendar, show: canAccessEvents },
    { title: "News", url: "/dashboard/news", icon: Newspaper, show: canAccessNews },
    { title: "Gallery", url: "/dashboard/gallery", icon: ImageIcon, show: canAccessGallery },
    { title: "Calendar", url: "/dashboard/calendar", icon: CalendarDays, show: canAccessCalendar },
    { title: "Suggestions", url: "/dashboard/suggestions", icon: Inbox, show: canAccessSuggestions },
    { title: "Signups", url: "/dashboard/signups", icon: UserPlus, show: canAccessSignups },
  ].filter((item) => item.show);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-3 py-2">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all",
                          active
                            ? "bg-primary text-primary-foreground font-medium shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {isAdmin && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/dashboard/positions"
                        end
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all",
                          location.pathname === "/dashboard/positions"
                            ? "bg-primary text-primary-foreground font-medium shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <Briefcase className="h-4 w-4 shrink-0" />
                        <span>Positions</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/dashboard/users"
                        end
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all",
                          location.pathname === "/dashboard/users"
                            ? "bg-primary text-primary-foreground font-medium shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span>Users & Roles</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
