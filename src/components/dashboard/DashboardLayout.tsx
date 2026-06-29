import { Link, Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

export const DashboardLayout = () => {
  const { signOut, user, roles, membershipId, photoUrl } = useAuth();
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
            <div className="flex items-center gap-4">
              {/* NACOS ID */}
              {membershipId && (
                <div className="flex flex-col items-end text-right">
                  <span className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider">NACOS ID</span>
                  <span className="font-mono text-xs font-bold text-primary">{membershipId}</span>
                </div>
              )}
              
              {/* Divider */}
              <div className="h-8 w-[1px] bg-border" />

              {/* User Info & Avatar */}
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end text-xs leading-tight">
                  <span className="font-medium truncate max-w-[150px]">{user?.email?.split("@")[0]}</span>
                  <span className="text-muted-foreground text-[10px] capitalize">
                    {roles.length ? roles.map(r => r.replace("_", " ")).join(", ") : "Student"}
                  </span>
                </div>
                
                {/* Profile Picture */}
                <div className="h-9 w-9 rounded-full overflow-hidden border bg-muted flex items-center justify-center shrink-0 shadow-sm">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/5 text-primary text-xs font-bold">
                      {user?.email?.[0].toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
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
