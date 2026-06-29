import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, XCircle, Award } from "lucide-react";
import { toast } from "sonner";

interface Option {
  id: string;
  option_text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  question_text: string;
  points: number;
  quiz_options: Option[];
}

interface TakeQuizProps {
  quizId: string;
  quizTitle: string;
  onClose: () => void;
}

export const TakeQuiz = ({ quizId, quizTitle, onClose }: TakeQuizProps) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const loadQuiz = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("quiz_questions")
          .select("id, question_text, points, quiz_options(id, option_text, is_correct)")
          .eq("quiz_id", quizId)
          .order("display_order", { ascending: true });

        if (error) throw error;
        setQuestions((data ?? []) as any[]);
      } catch (e: any) {
        toast.error(e.message || "Failed to load quiz questions");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, onClose]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (submitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionId,
    });
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = questions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      if (!confirm(`You have ${unanswered.length} unanswered question(s). Do you still want to submit?`)) {
        return;
      }
    }

    setSaving(true);
    let finalScore = 0;
    let finalTotalPoints = 0;

    questions.forEach((q) => {
      finalTotalPoints += q.points;
      const selectedOptionId = selectedAnswers[q.id];
      const correctOption = q.quiz_options.find((o) => o.is_correct);
      if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
        finalScore += q.points;
      }
    });

    setScore(finalScore);
    setTotalPoints(finalTotalPoints);

    if (user) {
      try {
        const { error } = await supabase.from("quiz_attempts").insert({
          user_id: user.id,
          quiz_id: quizId,
          score: finalScore,
          total_points: finalTotalPoints,
        });
        if (error) throw error;
        setSubmitted(true);
      } catch (e: any) {
        toast.error(e.message || "Failed to save quiz score");
      } finally {
        setSaving(false);
      }
    } else {
      setSubmitted(true);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading quiz questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted-foreground">This quiz has no questions yet.</p>
        <Button onClick={onClose}>Back to Quizzes</Button>
      </div>
    );
  }

  // ==========================================
  // RESULTS SCREEN
  // ==========================================
  if (submitted) {
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="border-primary/20 bg-primary-glow/5">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display font-bold">Quiz Completed!</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{quizTitle}</p>
          </CardHeader>
          <CardContent className="text-center p-6 space-y-2">
            <div className="text-5xl font-extrabold text-primary">{percentage}%</div>
            <p className="text-lg font-medium">
              You scored <span className="text-primary">{score}</span> out of <span className="font-semibold">{totalPoints}</span> points.
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {percentage >= 70 
                ? "Excellent job! You have a strong grasp of this course material." 
                : percentage >= 40 
                  ? "Good effort! Review the incorrect answers below to improve your score." 
                  : "Keep studying and try again. Practice makes perfect!"}
            </p>
          </CardContent>
          <CardFooter className="justify-center gap-3">
            <Button onClick={onClose} className="w-40">Done</Button>
          </CardFooter>
        </Card>

        {/* Question Review */}
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold">Review Answers</h3>
          {questions.map((q, idx) => {
            const selectedOptionId = selectedAnswers[q.id];
            const correctOption = q.quiz_options.find((o) => o.is_correct);
            const isCorrect = selectedOptionId === correctOption?.id;

            return (
              <Card key={q.id} className={`border ${isCorrect ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                <CardHeader className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground">Question {idx + 1}</span>
                      <h4 className="font-semibold text-base mt-0.5">{q.question_text}</h4>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background text-xs font-medium border">
                      {isCorrect ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-green-600">Correct (+{q.points} pts)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-red-600">Incorrect (0/{q.points} pts)</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pb-4">
                  {q.quiz_options.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    const isOptionCorrect = option.is_correct;
                    
                    let optionStyle = "border-muted/50 bg-background";
                    if (isOptionCorrect) {
                      optionStyle = "border-green-500 bg-green-500/10 text-green-700 font-medium";
                    } else if (isSelected && !isOptionCorrect) {
                      optionStyle = "border-red-500 bg-red-500/10 text-red-700";
                    }

                    return (
                      <div
                        key={option.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${optionStyle}`}
                      >
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center text-xs shrink-0
                          ${isOptionCorrect ? "border-green-600 bg-green-600 text-white" : isSelected ? "border-red-600 bg-red-600 text-white" : "border-muted"}`}
                        >
                          {isOptionCorrect ? "✓" : isSelected ? "✗" : ""}
                        </div>
                        <div>{option.option_text}</div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE QUIZ PLAYING SCREEN
  // ==========================================
  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{quizTitle}</span>
          <span>Question {currentIndex + 1} of {questions.length}</span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="text-xs font-semibold text-primary uppercase tracking-wider">
            Points: {currentQuestion.points}
          </div>
          <CardTitle className="text-lg md:text-xl font-display font-bold mt-1">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.quiz_options.map((option) => {
            const isSelected = selectedAnswers[currentQuestion.id] === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 text-sm md:text-base
                  ${isSelected 
                    ? "border-primary bg-primary/5 shadow-sm text-primary font-medium" 
                    : "border-border hover:bg-accent hover:border-muted-foreground/30"}`}
              >
                <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0
                  ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}
                >
                  {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <div>{option.option_text}</div>
              </button>
            );
          })}
        </CardContent>
        <CardFooter className="justify-between border-t p-4 bg-secondary/20">
          <Button
            variant="ghost"
            onClick={() => setCurrentIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Previous
          </Button>
          
          {currentIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              disabled={!selectedAnswers[currentQuestion.id]}
            >
              Next <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              variant="hero"
              disabled={saving || !selectedAnswers[currentQuestion.id]}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Submit Quiz
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
          Cancel and Exit Quiz
        </Button>
      </div>
    </div>
  );
};
