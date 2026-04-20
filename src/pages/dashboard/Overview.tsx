import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, BookOpen, FileText, Calendar, Inbox, UserPlus, ArrowRight } from "lucide-react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Dashboard — NACOS AKSU";
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const tables = ["executives", "courses", "course_materials", "events", "suggestions", "membership_signups"] as const;
        const keys = ["executives", "courses", "materials", "events", "suggestions", "signups"] as const;
        const results = await Promise.all(
          tables.map((t) => supabase.from(t).select("*", { count: "exact", head: true }))
        );
        const next = { ...counts };
        results.forEach((r, i) => {
          if (r.error) {
            console.error(`Error fetching ${tables[i]}:`, r.error);
          }
          (next as any)[keys[i]] = r.count ?? 0;
        });
        setCounts(next);
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    if (isStaff) {
      load();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff]);

  const noRole = roles.length === 0;

  if (noRole) {
    return (
      <div className="max-w-xl">
        <div className="border rounded-xl p-8 bg-card space-y-4">
          <h1 className="text-2xl font-semibold">Welcome</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user?.email}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            No role assigned yet. Contact an admin to get started.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/">Back to site</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isCourseRep && !isStaff) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Course Rep</h1>
          <p className="text-muted-foreground">Manage materials for your level</p>
        </div>
        <div className="border rounded-xl p-6 bg-card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Materials</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload and manage course materials</p>
          <Button asChild className="w-full">
            <Link to="/dashboard/materials">Go to Materials</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Executives", value: counts.executives, icon: Users, link: "/dashboard/executives", gradient: "from-blue-500/10 to-blue-600/10" },
    { label: "Courses", value: counts.courses, icon: BookOpen, link: "/dashboard/courses", gradient: "from-green-500/10 to-green-600/10" },
    { label: "Materials", value: counts.materials, icon: FileText, link: "/dashboard/materials", gradient: "from-purple-500/10 to-purple-600/10" },
    { label: "Events", value: counts.events, icon: Calendar, link: "/dashboard/events", gradient: "from-orange-500/10 to-orange-600/10" },
    { label: "Suggestions", value: counts.suggestions, icon: Inbox, link: "/dashboard/suggestions", gradient: "from-pink-500/10 to-pink-600/10" },
    { label: "Signups", value: counts.signups, icon: UserPlus, link: "/dashboard/signups", gradient: "from-indigo-500/10 to-indigo-600/10" },
  ];

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Overview</h1>
        <p className="text-muted-foreground">Dashboard statistics and quick actions</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-xl p-6 bg-card animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-muted" />
                <div className="h-5 w-5 bg-muted rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-8 w-16 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((s) => (
            <Link key={s.label} to={s.link} className="group">
              <div className="border rounded-xl p-6 bg-card hover:shadow-lg hover:border-primary/50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                    <s.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
