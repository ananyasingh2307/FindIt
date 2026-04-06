import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ItemsProvider } from "@/context/ItemsContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ReportItem from "./pages/ReportItem";
import MyRequests from "./pages/MyRequests";
import Messages from "./pages/Messages"; // 1. Added the Import
import AdminDashboard from "./pages/AdminDashboard";
import AdminQueue from "./pages/AdminQueue";
import AdminUsers from "./pages/AdminUsers";
import ReunionWall from "./pages/ReunionWall";
import NotFound from "./pages/NotFound";
import HomeRedirect from "./pages/HomeRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ItemsProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/report" element={<ReportItem />} />
              <Route path="/my-requests" element={<MyRequests />} />
              {/* 2. Added the Messages Route */}
              <Route path="/messages" element={<Messages />} /> 
              
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/queue" element={<AdminQueue />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/reunion" element={<ReunionWall />} />
              
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