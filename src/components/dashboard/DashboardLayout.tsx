import { Link, Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

export const DashboardLayout = () => {
  const { signOut, user, roles } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between border-b bg-card/50 backdrop-blur-sm px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img
                  src="/logo.png"
                  alt="NACOS"
                  className="h-8 w-8 object-contain"
                />
                <div className="hidden sm:block">
                  <span className="text-sm font-semibold">NACOS AKSU</span>
                  <span className="text-xs text-muted-foreground ml-2">Dashboard</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end text-xs leading-tight">
                <span className="font-medium truncate max-w-[180px]">{user?.email}</span>
                <span className="text-muted-foreground">
                  {roles.length ? roles.join(", ") : "No role"}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-9 w-9 rounded-lg">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
