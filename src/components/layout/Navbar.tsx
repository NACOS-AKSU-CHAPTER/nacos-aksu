import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowRight, LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

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
  const [scrolled, setScrolled] = useState(false);
  const [indicator, setIndicator] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  });

  const navRef = useRef<HTMLElement | null>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const location = useLocation();
  const { user } = useAuth();

  const updateIndicator = useCallback(() => {
    const activeItem = navItems.find((item) =>
      item.to === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.to)
    );
    const activeEl = activeItem ? linkRefs.current[activeItem.to] : null;
    if (!activeEl) {
      setIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    setIndicator({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
      visible: true,
    });
  }, [location.pathname]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-lg transition-all duration-300",
        scrolled
          ? "bg-background/95 border-border shadow-sm"
          : "bg-background/80 border-border/50"
      )}
    >
      <div className="container mx-auto container-px flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <img
            src="/logo.png"
            alt="NACOS AKSU Logo"
            className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <div className="leading-tight">
            <div className="font-display font-bold text-base tracking-tight text-foreground">
              NACOS
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              AKSU Chapter
            </div>
          </div>
        </Link>

        <nav
          ref={navRef}
          aria-label="Main navigation"
          className="relative hidden lg:flex items-center gap-1 rounded-full bg-secondary/70 p-1 border border-border/60"
        >
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-1 bottom-1 left-0 rounded-full bg-background shadow-sm transition-all duration-300 ease-out",
              indicator.visible ? "opacity-100" : "opacity-0"
            )}
            style={{
              transform: `translateX(${indicator.left}px)`,
              width: `${indicator.width}px`,
            }}
          />
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              ref={(el) => {
                linkRefs.current[item.to] = el;
              }}
              className={({ isActive }) =>
                cn(
                  "relative z-10 px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors duration-200",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {user ? (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-1.5" />
                Sign in
              </Link>
            </Button>
          )}
          <Button asChild variant="hero" size="sm" className="rounded-full px-4">
            <Link to="/contact">
              Join NACOS
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border border-border/60 bg-secondary/50 hover:bg-secondary transition-colors"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="transition-transform duration-200">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </span>
        </button>
      </div>

      <div
        className={cn(
          "lg:hidden grid transition-all duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100 border-t border-border" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        )}
      >
        <div className="overflow-hidden bg-background/95 backdrop-blur-lg">
          <nav
            aria-label="Mobile navigation"
            className="container mx-auto container-px py-4 flex flex-col gap-1"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200",
                    isActive
                      ? "text-primary bg-accent-soft font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="my-2 border-t border-border/60" />

            <div className="grid grid-cols-2 gap-2 pt-1">
              {user ? (
                <Button asChild variant="outline" size="sm" className="rounded-lg">
                  <Link to="/dashboard" onClick={() => setOpen(false)}>
                    <LayoutDashboard className="h-4 w-4 mr-1.5" />
                    Dashboard
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm" className="rounded-lg">
                  <Link to="/auth" onClick={() => setOpen(false)}>
                    <LogIn className="h-4 w-4 mr-1.5" />
                    Sign in
                  </Link>
                </Button>
              )}
              <Button asChild variant="hero" size="sm" className="rounded-lg">
                <Link to="/contact" onClick={() => setOpen(false)}>
                  Join NACOS
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
