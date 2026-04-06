import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
// Added MessageSquare to the imports
import { Search, Home, PlusCircle, History, LayoutDashboard, Users, CheckSquare, PartyPopper, LogOut, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const studentLinks = [
    { to: "/dashboard", label: "Home", icon: Home },
    { to: "/report", label: "Report Item", icon: PlusCircle },
    { to: "/my-requests", label: "My History", icon: History },
    { to: "/messages", label: "Messages", icon: MessageSquare }, // Added this
    { to: "/reunion", label: "Reunion Wall", icon: PartyPopper },
  ];

  const adminLinks = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/queue", label: "Approval Queue", icon: CheckSquare },
    { to: "/messages", label: "Messages", icon: MessageSquare }, // Added this for admins too
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/reunion", label: "Reunion Wall", icon: PartyPopper },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Search className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground tracking-tight">Find It</span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/dashboard" || link.to === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
              }
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full bg-muted/50 border border-border/50">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <span className="text-sm font-semibold text-foreground pr-2">{user.name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={() => { logout(); navigate("/login"); }}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile nav - now with scroll support for the extra link */}
      <nav className="md:hidden flex overflow-x-auto border-t border-border px-4 py-2 gap-1 no-scrollbar">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/dashboard" || link.to === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`
            }
          >
            <link.icon className="w-3.5 h-3.5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

export default Navbar;