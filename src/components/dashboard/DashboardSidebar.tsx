import { Link, NavLink, useLocation } from "react-router-dom";
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
  Award,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  show: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export const DashboardSidebar = () => {
  const {
    isAdmin,
    roles,
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

  const sections: NavSection[] = [
    {
      label: "General",
      items: [
        { title: "Overview", url: "/dashboard", icon: LayoutDashboard, show: true },
        { title: "My Profile", url: "/dashboard/profile", icon: UserCircle, show: true },
      ],
    },
    {
      label: "Academics",
      items: [
        { title: "Courses", url: "/dashboard/courses", icon: BookOpen, show: canAccessCourses },
        { title: "Quizzes", url: "/dashboard/quizzes", icon: Award, show: true },
        { title: "Materials", url: "/dashboard/materials", icon: FileText, show: canAccessMaterials },
      ],
    },
    {
      label: "Community & Media",
      items: [
        { title: "Events", url: "/dashboard/events", icon: Calendar, show: canAccessEvents },
        { title: "News", url: "/dashboard/news", icon: Newspaper, show: canAccessNews },
        { title: "Gallery", url: "/dashboard/gallery", icon: ImageIcon, show: canAccessGallery },
        { title: "Calendar", url: "/dashboard/calendar", icon: CalendarDays, show: canAccessCalendar },
        { title: "Executives", url: "/dashboard/executives", icon: Users, show: canAccessExecutives },
      ],
    },
    {
      label: "Outreach",
      items: [
        { title: "Suggestions", url: "/dashboard/suggestions", icon: Inbox, show: canAccessSuggestions },
        { title: "Signups", url: "/dashboard/signups", icon: UserPlus, show: canAccessSignups },
      ],
    },
    {
      label: "Administration",
      items: [
        { title: "Positions", url: "/dashboard/positions", icon: Briefcase, show: isAdmin },
        { title: "Users & Roles", url: "/dashboard/users", icon: ShieldCheck, show: isAdmin },
      ],
    },
  ];

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.show),
    }))
    .filter((section) => section.items.length > 0);

  const primaryRole = roles.length
    ? roles.map((r) => r.replace("_", " ")).join(", ")
    : "Student";

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      <SidebarHeader className="h-16 px-4 flex-row items-center gap-3 border-b border-border/60">
        <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <img
            src="/logo.png"
            alt="NACOS AKSU"
            className="h-8 w-8 object-contain shrink-0"
          />
          <div className="leading-tight truncate group-data-[collapsible=icon]:hidden">
            <div className="font-display font-bold text-sm text-foreground">NACOS AKSU</div>
            <div className="text-[11px] text-muted-foreground capitalize truncate">{primaryRole} Portal</div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 gap-1">
        {visibleSections.map((section, idx) => (
          <SidebarGroup key={section.label} className="py-1">
            {idx > 0 && <SidebarSeparator className="mb-2 bg-border/60 group-data-[collapsible=icon]:hidden" />}
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2.5 mb-1">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {section.items.map((item) => {
                  const active = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          "h-9 rounded-lg px-2.5 transition-all",
                          active
                            ? "bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary/95 hover:text-primary-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <NavLink to={item.url} end>
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Back to Website"
              className="h-9 rounded-lg px-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <Link to="/">
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span>Back to Website</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
