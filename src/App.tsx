import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { useKeepAlive } from "@/hooks/useKeepAlive";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index.tsx";

const About = lazy(() => import("./pages/About.tsx"));
const Executives = lazy(() => import("./pages/Executives.tsx"));
const Studies = lazy(() => import("./pages/Studies.tsx"));
const Events = lazy(() => import("./pages/Events.tsx"));
const NewsDetail = lazy(() => import("./pages/NewsDetail.tsx"));
const Gallery = lazy(() => import("./pages/Gallery.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const DashboardLayout = lazy(() =>
  import("@/components/dashboard/DashboardLayout").then((m) => ({ default: m.DashboardLayout }))
);
const DashOverview = lazy(() => import("./pages/dashboard/Overview.tsx"));
const DashExecutives = lazy(() => import("./pages/dashboard/Executives.tsx"));
const DashCourses = lazy(() => import("./pages/dashboard/Courses.tsx"));
const DashMaterials = lazy(() => import("./pages/dashboard/Materials.tsx"));
const DashEvents = lazy(() => import("./pages/dashboard/Events.tsx"));
const DashNews = lazy(() => import("./pages/dashboard/News.tsx"));
const DashGallery = lazy(() => import("./pages/dashboard/Gallery.tsx"));
const DashCalendar = lazy(() => import("./pages/dashboard/Calendar.tsx"));
const DashSuggestions = lazy(() => import("./pages/dashboard/Suggestions.tsx"));
const DashSignups = lazy(() => import("./pages/dashboard/Signups.tsx"));
const DashUsers = lazy(() => import("./pages/dashboard/Users.tsx"));
const DashMyProfile = lazy(() => import("./pages/dashboard/MyProfile.tsx"));
const DashPositions = lazy(() => import("./pages/dashboard/Positions.tsx"));
const DashQuizzes = lazy(() => import("./pages/dashboard/Quizzes.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-label="Loading page" />
  </div>
);

const AppContent = () => {
  // Keep Supabase project active
  useKeepAlive();

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/executives" element={<Executives />} />
            <Route path="/studies" element={<Studies />} />
            <Route path="/events" element={<Events />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
          </Route>
          <Route path="/auth" element={<Auth />} />
          <Route path="/exco/auth" element={<Auth />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashOverview />} />
            <Route path="profile" element={<DashMyProfile />} />
            <Route path="positions" element={<ProtectedRoute requireRoles={["admin"]}><DashPositions /></ProtectedRoute>} />
            <Route path="executives" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashExecutives /></ProtectedRoute>} />
            <Route path="courses" element={<ProtectedRoute requireRoles={["admin", "exec", "course_rep"]}><DashCourses /></ProtectedRoute>} />
            <Route path="quizzes" element={<DashQuizzes />} />
            <Route path="materials" element={<ProtectedRoute requireRoles={["admin", "exec", "course_rep"]}><DashMaterials /></ProtectedRoute>} />
            <Route path="events" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashEvents /></ProtectedRoute>} />
            <Route path="news" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashNews /></ProtectedRoute>} />
            <Route path="gallery" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashGallery /></ProtectedRoute>} />
            <Route path="calendar" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashCalendar /></ProtectedRoute>} />
            <Route path="suggestions" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashSuggestions /></ProtectedRoute>} />
            <Route path="signups" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashSignups /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute requireRoles={["admin"]}><DashUsers /></ProtectedRoute>} />
          </Route>

          {/* Redirect /admin to /dashboard */}
          <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
