import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ItemsProvider } from "@/context/ItemsContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ReportItem from "./pages/ReportItem";
import MyRequests from "./pages/MyRequests";
import Messages from "./pages/Messages"; 
import AdminDashboard from "./pages/AdminDashboard";
import AdminQueue from "./pages/AdminQueue";
import AdminUsers from "./pages/AdminUsers";
import ReunionWall from "./pages/ReunionWall";
import NotFound from "./pages/NotFound";
import HomeRedirect from "./pages/HomeRedirect";

const queryClient = new QueryClient();

// A simple wrapper to protect Admin-only routes
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) return null; // Wait for auth to resolve
  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ItemsProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public/Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<HomeRedirect />} />
              
              {/* Authenticated Student Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/report" element={<ReportItem />} />
              <Route path="/my-requests" element={<MyRequests />} />
              <Route path="/messages" element={<Messages />} /> 
              <Route path="/reunion" element={<ReunionWall />} />

              {/* Protected Admin Routes */}
              <Route 
                path="/admin" 
                element={<AdminRoute><AdminDashboard /></AdminRoute>} 
              />
              <Route 
                path="/admin/queue" 
                element={<AdminRoute><AdminQueue /></AdminRoute>} 
              />
              <Route 
                path="/admin/users" 
                element={<AdminRoute><AdminUsers /></AdminRoute>} 
              />
              
              {/* 404 Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ItemsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;