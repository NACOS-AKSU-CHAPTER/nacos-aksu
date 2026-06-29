import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, BookOpen, HelpCircle, Check, Circle } from "lucide-react";

interface Course {
  id: string;
  code: string;
  title: string;
}

interface Quiz {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  courses: Course | null;
}

interface Option {
  id?: string;
  option_text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  question_text: string;
  points: number;
  display_order: number;
  quiz_options: Option[];
}

export const ManageQuizzes = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Quiz Modal State
  const [quizOpen, setQuizOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz>>({});

  // Question Management State
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Question Modal State
  const [questionOpen, setQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question>>({});
  const [options, setOptions] = useState<Option[]>([
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesRes, quizzesRes] = await Promise.all([
        supabase.from("courses").select("id, code, title").order("code"),
        supabase.from("quizzes").select("id, course_id, title, description, courses(id, code, title)").order("created_at", { ascending: false }),
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (quizzesRes.error) throw quizzesRes.error;

      setCourses(coursesRes.data as Course[]);
      setQuizzes(quizzesRes.data as any[]);
    } catch (e: any) {
      toast.error(e.message || "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const saveQuiz = async () => {
    if (!editingQuiz.title || !editingQuiz.course_id) {
      toast.error("Title and course are required");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        title: editingQuiz.title,
        description: editingQuiz.description || null,
        course_id: editingQuiz.course_id,
      };

      if (editingQuiz.id) {
        const { error } = await supabase.from("quizzes").update(payload).eq("id", editingQuiz.id);
        if (error) throw error;
        toast.success("Quiz updated");
      } else {
        const { error } = await supabase.from("quizzes").insert(payload);
        if (error) throw error;
        toast.success("Quiz created");
      }

      setQuizOpen(false);
      setEditingQuiz({});
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Failed to save quiz");
    } finally {
      setBusy(false);
    }
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz and all its questions/attempts?")) return;
    try {
      const { error } = await supabase.from("quizzes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Quiz deleted");
      if (selectedQuiz?.id === id) setSelectedQuiz(null);
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete quiz");
    }
  };

  // ==========================================
  // QUESTION ACTIONS
  // ==========================================
  const openManageQuestions = async (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setQuestionsLoading(true);
    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("id, question_text, points, display_order, quiz_options(id, option_text, is_correct)")
        .eq("quiz_id", quiz.id)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setQuestions((data ?? []) as any[]);
    } catch (e: any) {
      toast.error(e.message || "Failed to load questions");
    } finally {
      setQuestionsLoading(false);
    }
  };

  const openAddQuestion = () => {
    setEditingQuestion({ points: 1 });
    setOptions([
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
    ]);
    setQuestionOpen(true);
  };

  const openEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setOptions(q.quiz_options.map((o) => ({ option_text: o.option_text, is_correct: o.is_correct })));
    setQuestionOpen(true);
  };

  const saveQuestion = async () => {
    if (!selectedQuiz) return;
    if (!editingQuestion.question_text) {
      toast.error("Question text is required");
      return;
    }

    // Validate options
    const filledOptions = options.filter((o) => o.option_text.trim() !== "");
    if (filledOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }
    const hasCorrect = filledOptions.some((o) => o.is_correct);
    if (!hasCorrect) {
      toast.error("Please select one correct option");
      return;
    }

    setBusy(true);
    try {
      let questionId = editingQuestion.id;

      // 1. Save or Update Question
      const qPayload = {
        quiz_id: selectedQuiz.id,
        question_text: editingQuestion.question_text,
        points: editingQuestion.points ?? 1,
        display_order: editingQuestion.display_order ?? questions.length,
      };

      if (questionId) {
        const { error } = await supabase.from("quiz_questions").update(qPayload).eq("id", questionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("quiz_questions").insert(qPayload).select("id").single();
        if (error) throw error;
        questionId = data.id;
      }

      // 2. Clear old options if editing, then insert new ones
      if (editingQuestion.id) {
        const { error: delErr } = await supabase.from("quiz_options").delete().eq("question_id", questionId);
        if (delErr) throw delErr;
      }

      const optPayloads = filledOptions.map((o) => ({
        question_id: questionId,
        option_text: o.option_text,
        is_correct: o.is_correct,
      }));

      const { error: optErr } = await supabase.from("quiz_options").insert(optPayloads);
      if (optErr) throw optErr;

      toast.success("Question saved");
      setQuestionOpen(false);
      openManageQuestions(selectedQuiz);
    } catch (e: any) {
      toast.error(e.message || "Failed to save question");
    } finally {
      setBusy(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
      if (error) throw error;
      toast.success("Question deleted");
      if (selectedQuiz) openManageQuestions(selectedQuiz);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete question");
    }
  };

  const handleOptionChange = (idx: number, text: string) => {
    const next = [...options];
    next[idx].option_text = text;
    setOptions(next);
  };

  const handleSelectCorrect = (idx: number) => {
    const next = options.map((o, i) => ({
      ...o,
      is_correct: i === idx,
    }));
    setOptions(next);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. QUIZZES LIST */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-semibold">Quiz List</h2>
          <Button size="sm" onClick={() => { setEditingQuiz({}); setQuizOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Create Quiz
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : quizzes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 border rounded-xl border-dashed bg-card">No quizzes created yet.</p>
        ) : (
          <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
            {quizzes.map((q) => (
              <Card 
                key={q.id} 
                className={`cursor-pointer transition-all hover:border-primary/50 ${selectedQuiz?.id === q.id ? "border-primary bg-primary-glow/5 shadow-sm" : ""}`}
                onClick={() => openManageQuestions(q)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        {q.courses?.code || "No Course"}
                      </span>
                      <h3 className="font-semibold text-sm md:text-base truncate mt-1.5">{q.title}</h3>
                      {q.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{q.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1 border-t border-dashed">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); setEditingQuiz(q); setQuizOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); deleteQuiz(q.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 2. QUESTION BUILDER */}
      <div className="lg:col-span-2 space-y-4">
        {selectedQuiz ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-display font-semibold">Questions for {selectedQuiz.title}</h2>
                <p className="text-xs text-muted-foreground">Course: {selectedQuiz.courses?.code} — {selectedQuiz.courses?.title}</p>
              </div>
              <Button size="sm" onClick={openAddQuestion} variant="hero">
                <Plus className="h-4 w-4 mr-1" /> Add Question
              </Button>
            </div>

            {questionsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border rounded-xl border-dashed bg-card text-center space-y-2">
                <HelpCircle className="h-8 w-8 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">This quiz has no questions yet.</p>
                <Button size="sm" onClick={openAddQuestion} variant="outline">Add your first question</Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {questions.map((q, index) => (
                  <Card key={q.id}>
                    <CardHeader className="py-4 flex flex-row items-start justify-between space-y-0 gap-4">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-muted-foreground">Question {index + 1} ({q.points} pts)</span>
                        <h4 className="font-semibold text-base mt-0.5">{q.question_text}</h4>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditQuestion(q)}>
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteQuestion(q.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.quiz_options.map((option) => (
                        <div 
                          key={option.id} 
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${option.is_correct ? "border-green-500 bg-green-500/5 text-green-700 font-medium" : "border-muted/50 bg-secondary/30"}`}
                        >
                          {option.is_correct ? <Check className="h-3.5 w-3.5 text-green-600 shrink-0" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />}
                          <span className="truncate">{option.option_text}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[350px] border rounded-xl border-dashed bg-card text-center p-6 space-y-2">
            <BookOpen className="h-10 w-10 text-muted-foreground opacity-30" />
            <h3 className="font-semibold text-lg">No Quiz Selected</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Select a quiz from the list on the left to manage its questions or create a new one.</p>
          </div>
        )}
      </div>

      {/* 3. QUIZ MODAL */}
      <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingQuiz.id ? "Edit Quiz" : "Create Quiz"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="quiz-title">Quiz Title *</Label>
              <Input id="quiz-title" placeholder="e.g. Introduction to Programming Quiz" value={editingQuiz.title ?? ""} onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiz-desc">Description</Label>
              <Textarea id="quiz-desc" placeholder="Provide instructions or info about the quiz." rows={3} value={editingQuiz.description ?? ""} onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiz-course">Course *</Label>
              <Select value={editingQuiz.course_id} onValueChange={(v) => setEditingQuiz({ ...editingQuiz, course_id: v })}>
                <SelectTrigger id="quiz-course"><SelectValue placeholder="Select Course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.code} — {c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={saveQuiz} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Save Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. QUESTION MODAL */}
      <Dialog open={questionOpen} onOpenChange={setQuestionOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion.id ? "Edit Question" : "Add Question"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="q-text">Question Text *</Label>
              <Textarea id="q-text" placeholder="e.g. Which of the following is an OOP language?" rows={3} value={editingQuestion.question_text ?? ""} onChange={(e) => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-points">Points</Label>
              <Input id="q-points" type="number" min={1} value={editingQuestion.points ?? 1} onChange={(e) => setEditingQuestion({ ...editingQuestion, points: Number(e.target.value) })} />
            </div>

            <div className="space-y-3">
              <Label>Options (Enter text and select the correct answer) *</Label>
              {options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => handleSelectCorrect(idx)}
                    className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 transition-all
                      ${option.is_correct ? "border-green-500 bg-green-500 text-white" : "border-muted hover:border-muted-foreground"}`}
                  >
                    {option.is_correct && <Check className="h-4 w-4" />}
                  </button>
                  <Input 
                    placeholder={`Option ${idx + 1}`} 
                    value={option.option_text} 
                    onChange={(e) => handleOptionChange(idx, e.target.value)} 
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={saveQuestion} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Save Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
