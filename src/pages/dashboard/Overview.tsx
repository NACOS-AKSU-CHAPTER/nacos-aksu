import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, FileText, Calendar, Inbox, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const DashboardOverview = () => {
  const { user, roles, isStaff, isCourseRep } = useAuth();
  const [counts, setCounts] = useState({
    executives: 0,
    courses: 0,
    materials: 0,
    events: 0,
    suggestions: 0,
    signups: 0,
  });

  useEffect(() => {
    document.title = "Dashboard — NACOS AKSU";
  }, []);

  useEffect(() => {
    const load = async () => {
      const tables = ["executives", "courses", "course_materials", "events", "suggestions", "membership_signups"] as const;
      const keys = ["executives", "courses", "materials", "events", "suggestions", "signups"] as const;
      const results = await Promise.all(
        tables.map((t) => supabase.from(t).select("*", { count: "exact", head: true }))
      );
      const next = { ...counts };
      results.forEach((r, i) => {
        (next as any)[keys[i]] = r.count ?? 0;
      });
      setCounts(next);
    };
    if (isStaff) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff]);

  const noRole = roles.length === 0;

  if (noRole) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Welcome 👋</CardTitle>
            <CardDescription>Your account is set up but no role has been assigned yet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Signed in as <span className="font-medium">{user?.email}</span>.
            </p>
            <p className="text-muted-foreground">
              An admin needs to assign you a role (exec or course rep) before you can manage content.
              Reach out to the Director of Software to get started.
            </p>
            <Button asChild variant="outline">
              <Link to="/">Back to site</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCourseRep && !isStaff) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Course Rep Dashboard</h1>
          <p className="text-sm text-muted-foreground">Upload and manage materials for your level.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>Add slides, PDFs, or links for the courses in your assigned level.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="hero">
              <Link to="/dashboard/materials">Manage materials</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    { label: "Executives", value: counts.executives, icon: Users, link: "/dashboard/executives" },
    { label: "Courses", value: counts.courses, icon: BookOpen, link: "/dashboard/courses" },
    { label: "Materials", value: counts.materials, icon: FileText, link: "/dashboard/materials" },
    { label: "Events", value: counts.events, icon: Calendar, link: "/dashboard/events" },
    { label: "Suggestions", value: counts.suggestions, icon: Inbox, link: "/dashboard/suggestions" },
    { label: "Signups", value: counts.signups, icon: UserPlus, link: "/dashboard/signups" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.email}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.link}>
            <Card className="hover:shadow-card-soft transition-smooth">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-accent-soft text-primary flex items-center justify-center">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardOverview;
