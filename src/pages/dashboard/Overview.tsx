import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, BookOpen, FileText, Calendar, Inbox, UserPlus, ArrowRight, Award, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentAttempt {
  id: string;
  score: number;
  total_points: number;
  completed_at: string;
  quizzes: {
    title: string;
    courses: {
      code: string;
    } | null;
  } | null;
}

const DashboardOverview = () => {
  const { user, roles, isStaff, isCourseRep, assignedLevel, membershipId } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Executive stats
  const [counts, setCounts] = useState({
    executives: 0,
    courses: 0,
    materials: 0,
    events: 0,
    suggestions: 0,
    signups: 0,
  });

  // Student stats
  const [studentStats, setStudentStats] = useState({
    materialsCount: 0,
    quizzesCompleted: 0,
  });
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);

  useEffect(() => {
    document.title = "Dashboard — NACOS AKSU";
  }, []);

  useEffect(() => {
    const loadStaffData = async () => {
      try {
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
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      }
    };

    const loadStudentData = async () => {
      if (!user) return;
      try {
        // 1. Count materials for student's level
        let materialsCount = 0;
        if (assignedLevel) {
          const { count } = await supabase
            .from("course_materials")
            .select("id, courses!inner(level)", { count: "exact", head: true })
            .eq("courses.level", assignedLevel as any);
          materialsCount = count ?? 0;
        }

        // 2. Count completed quizzes
        const { count: quizzesCompleted } = await supabase
          .from("quiz_attempts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        setStudentStats({
          materialsCount,
          quizzesCompleted: quizzesCompleted ?? 0,
        });

        // 3. Fetch recent attempts
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select(`
            id, 
            score, 
            total_points, 
            completed_at, 
            quizzes (
              title, 
              courses (
                code
              )
            )
          `)
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(5);

        setRecentAttempts((attempts ?? []) as any[]);
      } catch (error) {
        console.error("Error loading student stats:", error);
      }
    };

    const loadAll = async () => {
      setLoading(true);
      if (isStaff) {
        await loadStaffData();
      } else {
        await loadStudentData();
      }
      setLoading(false);
    };

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, user, assignedLevel]);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Student";

  // ==========================================
  // STUDENT / COURSE REP VIEW
  // ==========================================
  if (!isStaff) {
    return (
      <div className="max-w-5xl space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border bg-card shadow-sm">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold">Welcome, {displayName}!</h1>
            <p className="text-sm text-muted-foreground">
              {assignedLevel ? `${assignedLevel} Level` : "Student"} • Department of Computing
            </p>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 shrink-0 text-right md:text-left">
            <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">NACOS Membership ID</div>
            <div className="text-lg font-mono font-bold text-primary">{membershipId || "Assigning..."}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Available Materials</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentStats.materialsCount}</div>
              <p className="text-xs text-muted-foreground">PDFs and slides for {assignedLevel}L</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Quizzes Completed</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentStats.quizzesCompleted}</div>
              <p className="text-xs text-muted-foreground">Practice assessments taken</p>
            </CardContent>
          </Card>
          {isCourseRep && (
            <Card className="border-accent/30 bg-accent-soft/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-accent">Course Rep Account</CardTitle>
                <GraduationCap className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">Active Level: {assignedLevel}L</div>
                <p className="text-xs text-muted-foreground mt-1">You can upload materials for your level.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-display font-semibold">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" /> Read Courses
                  </CardTitle>
                  <CardDescription>Browse courses and download lecture notes for your level.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full" variant="outline">
                    <Link to="/dashboard/courses">Go to Courses <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" /> Take Quizzes
                  </CardTitle>
                  <CardDescription>Test your knowledge with courses-based practice quizzes.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link to="/dashboard/quizzes">View Quizzes <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>

              {isCourseRep && (
                <Card className="hover:shadow-md transition-shadow sm:col-span-2 border-accent/20">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-accent">
                      <FileText className="h-5 w-5" /> Manage Materials
                    </CardTitle>
                    <CardDescription>Upload new PDFs, slides, and academic resources for {assignedLevel}L students.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full" variant="hero">
                      <Link to="/dashboard/materials">Upload Materials <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Recent Quiz Attempts */}
          <div className="space-y-4">
            <h2 className="text-xl font-display font-semibold">Recent Quizzes</h2>
            <Card className="h-[280px] overflow-y-auto">
              <CardContent className="p-4">
                {recentAttempts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground p-4">
                    <Award className="h-8 w-8 opacity-30 mb-2" />
                    <p className="text-sm">No quizzes taken yet.</p>
                    <Link to="/dashboard/quizzes" className="text-xs text-primary underline mt-1">Take your first quiz</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentAttempts.map((attempt) => (
                      <div key={attempt.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-sm">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{attempt.quizzes?.title}</p>
                          <p className="text-xs text-muted-foreground">{attempt.quizzes?.courses?.code}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-primary">{attempt.score}/{attempt.total_points}</span>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(attempt.completed_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STAFF (EXCO / ADMIN) VIEW
  // ==========================================
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
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border bg-card shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-display font-bold">Welcome, {displayName}!</h1>
          <p className="text-sm text-muted-foreground">
            {roles.includes("admin") ? "Admin" : "Executive"} Portal • NACOS AKSU Leadership
          </p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 shrink-0 text-right md:text-left">
          <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">NACOS ID</div>
          <div className="text-lg font-mono font-bold text-primary">{membershipId || "Assigning..."}</div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-display font-semibold mb-2">Administrative Overview</h2>
        <p className="text-sm text-muted-foreground">Dashboard statistics and quick actions</p>
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
