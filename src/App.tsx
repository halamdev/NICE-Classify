import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import SearchPage from "./pages/SearchPage";
import Dashboard from "./pages/Dashboard";
import HistoryPage from "./pages/HistoryPage";
import SavedPage from "./pages/SavedPage";
import BatchPage from "./pages/BatchPage";
import PortfolioPage from "./pages/PortfolioPage";
import TrendsPage from "./pages/TrendsPage";
import DataManagement from "./pages/admin/DataManagement";
import UserManagement from "./pages/admin/UserManagement";
import FeedbackPage from "./pages/admin/FeedbackPage";
import AdminSettings from "./pages/admin/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/search" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthRoute />} />
              <Route path="/" element={<Navigate to="/search" replace />} />
              <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
              <Route path="/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
              <Route path="/batch" element={<ProtectedRoute><BatchPage /></ProtectedRoute>} />
              <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
              <Route path="/trends" element={<ProtectedRoute><TrendsPage /></ProtectedRoute>} />
              <Route path="/admin/data" element={<ProtectedRoute><DataManagement /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
              <Route path="/admin/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
