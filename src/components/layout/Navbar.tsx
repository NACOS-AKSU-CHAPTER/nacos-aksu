import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/executives", label: "Executives" },
  { to: "/studies", label: "Studies" },
  { to: "/events", label: "Events & News" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-md transition-smooth",
        "bg-background/85 border-border",
      )}
    >
      <div className="container mx-auto container-px flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-hero text-primary-foreground font-display font-bold shadow-card-soft">
            N
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-base text-foreground">NACOS</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AKSU Chapter</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-smooth",
                  isActive
                    ? "text-primary bg-accent-soft"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Button asChild variant="hero" size="sm">
            <Link to="/contact">Join NACOS</Link>
          </Button>
        </div>

        <button
          className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-secondary"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container mx-auto container-px py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2.5 text-sm font-medium rounded-md transition-smooth",
                    isActive
                      ? "text-primary bg-accent-soft"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Button asChild variant="hero" size="sm" className="mt-2">
              <Link to="/contact" onClick={() => setOpen(false)}>Join NACOS</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};
