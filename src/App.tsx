import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Index from "./pages/Index.tsx";
import About from "./pages/About.tsx";
import Executives from "./pages/Executives.tsx";
import Studies from "./pages/Studies.tsx";
import Events from "./pages/Events.tsx";
import Gallery from "./pages/Gallery.tsx";
import Contact from "./pages/Contact.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";

import DashOverview from "./pages/dashboard/Overview.tsx";
import DashExecutives from "./pages/dashboard/Executives.tsx";
import DashCourses from "./pages/dashboard/Courses.tsx";
import DashMaterials from "./pages/dashboard/Materials.tsx";
import DashEvents from "./pages/dashboard/Events.tsx";
import DashNews from "./pages/dashboard/News.tsx";
import DashGallery from "./pages/dashboard/Gallery.tsx";
import DashCalendar from "./pages/dashboard/Calendar.tsx";
import DashSuggestions from "./pages/dashboard/Suggestions.tsx";
import DashSignups from "./pages/dashboard/Signups.tsx";
import DashUsers from "./pages/dashboard/Users.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/executives" element={<Executives />} />
              <Route path="/studies" element={<Studies />} />
              <Route path="/events" element={<Events />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/contact" element={<Contact />} />
            </Route>
            <Route path="/auth" element={<Auth />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashOverview />} />
              <Route path="executives" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashExecutives /></ProtectedRoute>} />
              <Route path="courses" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashCourses /></ProtectedRoute>} />
              <Route path="materials" element={<ProtectedRoute requireRoles={["admin", "exec", "course_rep"]}><DashMaterials /></ProtectedRoute>} />
              <Route path="events" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashEvents /></ProtectedRoute>} />
              <Route path="news" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashNews /></ProtectedRoute>} />
              <Route path="gallery" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashGallery /></ProtectedRoute>} />
              <Route path="calendar" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashCalendar /></ProtectedRoute>} />
              <Route path="suggestions" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashSuggestions /></ProtectedRoute>} />
              <Route path="signups" element={<ProtectedRoute requireRoles={["admin", "exec"]}><DashSignups /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute requireRoles={["admin"]}><DashUsers /></ProtectedRoute>} />
            </Route>

            {/* Redirect /admin to /dashboard for convenience */}
            <Route path="/admin/*" element={<ProtectedRoute requireRoles={["admin"]}><DashboardLayout /></ProtectedRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
