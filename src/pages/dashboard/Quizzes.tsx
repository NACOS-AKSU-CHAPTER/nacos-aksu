import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Award, Play, CheckCircle, BookOpen, Settings } from "lucide-react";
import { TakeQuiz } from "./TakeQuiz";
import { ManageQuizzes } from "./ManageQuizzes";
import { toast } from "sonner";

interface Course {
  id: string;
  code: string;
  title: string;
  level: string;
}

interface Quiz {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  courses: Course | null;
}

interface Attempt {
  id: string;
  quiz_id: string;
  score: number;
  total_points: number;
  completed_at: string;
  quizzes: {
    title: string;
    courses: {
      code: string;
      title: string;
    } | null;
  } | null;
}

const Quizzes = () => {
  const { user, isStaff, assignedLevel } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quiz playing state
  const [activeQuiz, setActiveQuiz] = useState<{ id: string; title: string } | null>(null);
  
  // View mode for staff (taking vs managing)
  const [viewMode, setViewMode] = useState<"student" | "admin">("student");

  useEffect(() => {
    document.title = "Quizzes — Dashboard";
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [quizzesRes, attemptsRes] = await Promise.all([
        supabase.from("quizzes").select("id, course_id, title, description, courses(id, code, title, level)"),
        supabase.from("quiz_attempts").select(`
          id, 
          quiz_id, 
          score, 
          total_points, 
          completed_at, 
          quizzes (
            title, 
            courses (
              code, 
              title
            )
          )
        `).eq("user_id", user.id).order("completed_at", { ascending: false }),
      ]);

      if (quizzesRes.error) throw quizzesRes.error;
      if (attemptsRes.error) throw attemptsRes.error;

      setQuizzes((quizzesRes.data ?? []) as any[]);
      setAttempts((attemptsRes.data ?? []) as any[]);
    } catch (e: any) {
      toast.error(e.message || "Failed to load quiz data");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizClose = () => {
    setActiveQuiz(null);
    loadData();
  };

  // Filter quizzes based on role and level
  const visibleQuizzes = isStaff 
    ? quizzes 
    : quizzes.filter((q) => q.courses?.level === assignedLevel);

  // Helper to check if student already took a quiz and get their highest score
  const getQuizStatus = (quizId: string) => {
    const quizAttempts = attempts.filter((a) => a.quiz_id === quizId);
    if (quizAttempts.length === 0) return null;
    
    // Find highest score
    const highest = quizAttempts.reduce((prev, current) => {
      const prevPercent = prev.total_points > 0 ? (prev.score / prev.total_points) : 0;
      const currPercent = current.total_points > 0 ? (current.score / current.total_points) : 0;
      return currPercent > prevPercent ? current : prev;
    });

    return {
      completed: true,
      score: highest.score,
      total_points: highest.total_points,
      percent: highest.total_points > 0 ? Math.round((highest.score / highest.total_points) * 100) : 0,
    };
  };

  // If currently taking a quiz, render the TakeQuiz component
  if (activeQuiz) {
    return (
      <div className="py-4">
        <TakeQuiz 
          quizId={activeQuiz.id} 
          quizTitle={activeQuiz.title} 
          onClose={handleQuizClose} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Mode Toggle for Staff */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Practice Quizzes</h1>
          <p className="text-sm text-muted-foreground">
            {isStaff 
              ? "Take quizzes or manage the quiz database." 
              : `Test your knowledge with courses-based quizzes for ${assignedLevel}L.`}
          </p>
        </div>

        {isStaff && (
          <div className="flex bg-secondary p-1 rounded-lg border">
            <Button 
              size="sm" 
              variant={viewMode === "student" ? "default" : "ghost"}
              onClick={() => setViewMode("student")}
              className="h-8 text-xs"
            >
              <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Take Quizzes
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === "admin" ? "default" : "ghost"}
              onClick={() => setViewMode("admin")}
              className="h-8 text-xs"
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" /> Manage Database
            </Button>
          </div>
        )}
      </div>

      {/* RENDER MANAGMENT PORTAL FOR STAFF IF SELECTED */}
      {isStaff && viewMode === "admin" ? (
        <ManageQuizzes />
      ) : (
        /* RENDER STUDENT / TAKER VIEW */
        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available">Available Quizzes</TabsTrigger>
            <TabsTrigger value="attempts">Attempt History</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : visibleQuizzes.length === 0 ? (
              <Card className="p-10 text-center border-dashed text-muted-foreground bg-card">
                No quizzes available for your level yet. Check back later!
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleQuizzes.map((q) => {
                  const status = getQuizStatus(q.id);
                  return (
                    <Card key={q.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <Badge variant="outline">{q.courses?.code}</Badge>
                          {status?.completed && (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-700 hover:bg-green-500/10 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Score: {status.percent}%
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg font-display font-bold mt-2 truncate">
                          {q.title}
                        </CardTitle>
                        {q.description && (
                          <CardDescription className="line-clamp-2 mt-1">
                            {q.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="flex items-center justify-between border-t p-4 bg-secondary/10 rounded-b-lg">
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          Course: {q.courses?.title}
                        </span>
                        <Button 
                          size="sm" 
                          onClick={() => setActiveQuiz({ id: q.id, title: q.title })}
                          className="shrink-0"
                        >
                          <Play className="h-3.5 w-3.5 mr-1.5 fill-current" /> 
                          {status?.completed ? "Retake" : "Start"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="attempts" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : attempts.length === 0 ? (
              <Card className="p-10 text-center border-dashed text-muted-foreground bg-card">
                You haven't taken any quizzes yet.
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {attempts.map((attempt) => {
                      const percentage = attempt.total_points > 0 ? Math.round((attempt.score / attempt.total_points) * 100) : 0;
                      return (
                        <div key={attempt.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm md:text-base truncate">{attempt.quizzes?.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {attempt.quizzes?.courses?.code} — {attempt.quizzes?.courses?.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Completed: {new Date(attempt.completed_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <div className="text-lg font-bold text-primary">{percentage}%</div>
                            <div className="text-xs text-muted-foreground">
                              {attempt.score} / {attempt.total_points} pts
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Quizzes;
