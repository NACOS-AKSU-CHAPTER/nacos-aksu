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
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const commonItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Profile", url: "/dashboard/profile", icon: UserCircle },
];

const staffExtras = [
  { title: "Executives", url: "/dashboard/executives", icon: Users },
  { title: "Courses", url: "/dashboard/courses", icon: BookOpen },
  { title: "Materials", url: "/dashboard/materials", icon: FileText },
  { title: "Events", url: "/dashboard/events", icon: Calendar },
  { title: "News", url: "/dashboard/news", icon: Newspaper },
  { title: "Gallery", url: "/dashboard/gallery", icon: ImageIcon },
  { title: "Calendar", url: "/dashboard/calendar", icon: CalendarDays },
  { title: "Suggestions", url: "/dashboard/suggestions", icon: Inbox },
  { title: "Signups", url: "/dashboard/signups", icon: UserPlus },
];

const repExtras = [
  { title: "My Materials", url: "/dashboard/materials", icon: FileText },
];

export const DashboardSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isStaff, isAdmin } = useAuth();
  const location = useLocation();
  const items = [...commonItems, ...(isStaff ? staffExtras : repExtras)];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={cn(
                          "flex items-center gap-2",
                          active ? "bg-accent-soft text-primary font-medium" : "hover:bg-secondary"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
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
                          "flex items-center gap-2",
                          location.pathname === "/dashboard/positions"
                            ? "bg-accent-soft text-primary font-medium"
                            : "hover:bg-secondary"
                        )}
                      >
                        <Briefcase className="h-4 w-4" />
                        {!collapsed && <span>Positions</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/dashboard/users"
                        end
                        className={cn(
                          "flex items-center gap-2",
                          location.pathname === "/dashboard/users"
                            ? "bg-accent-soft text-primary font-medium"
                            : "hover:bg-secondary"
                        )}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {!collapsed && <span>Users & Roles</span>}
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
