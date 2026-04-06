import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import { UserX, UserCheck, ShieldAlert, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch real users from your 'profiles' table
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) {
      toast.error("Failed to load users");
      console.error(error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. The Ban/Unban Logic
  const toggleUserBan = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "banned" ? "active" : "banned";
    
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", userId);

    if (!error) {
      toast.success(newStatus === "banned" ? "User Access Restricted" : "User Access Restored");
      // Local state update so the UI changes instantly
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } else {
      toast.error("Action failed: Check your Admin permissions");
    }
  };

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
             <ShieldAlert className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-black text-foreground tracking-tight">User Management</h1>
        </div>
        <p className="text-muted-foreground text-base font-medium">
          Monitor community members and restrict false reporters.
        </p>
      </motion.div>

      <div className="grid gap-4">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-muted-foreground font-bold uppercase tracking-widest text-xs">
            Synchronizing User Records...
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed rounded-[2.5rem] border-muted">
             <p className="text-muted-foreground">No users found in the database.</p>
          </div>
        ) : (
          <AnimatePresence>
            {users.map((u, i) => (
              <motion.div
                key={u.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-6 rounded-[2rem] border-2 transition-all duration-300 flex items-center justify-between shadow-sm ${
                  u.status === "banned" 
                    ? "bg-destructive/[0.03] border-destructive/20 grayscale-[0.5]" 
                    : "bg-card border-border/60 hover:border-primary/20"
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner ${
                    u.status === "banned" ? "bg-destructive text-white" : "bg-primary/10 text-primary"
                  }`}>
                    {u.full_name ? u.full_name[0].toUpperCase() : "?"}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-bold text-lg ${u.status === "banned" ? "text-destructive" : "text-foreground"}`}>
                        {u.full_name}
                      </p>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                        u.role === 'admin' ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        {u.role}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email || "No email linked"}</span>
                      {u.status === 'banned' && (
                        <span className="flex items-center gap-1 text-destructive font-bold">
                          <AlertTriangle className="w-3 h-3" /> Account Restricted
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Admins shouldn't be able to ban themselves */}
                  {u.id !== user?.id && (
                    <Button 
                      variant={u.status === "banned" ? "outline" : "destructive"}
                      className={`rounded-xl font-bold h-11 px-6 transition-all active:scale-95 ${
                        u.status === "banned" ? "border-success/20 text-success hover:bg-success/5" : ""
                      }`}
                      onClick={() => toggleUserBan(u.id, u.status)}
                    >
                      {u.status === "banned" ? (
                        <><UserCheck className="w-4 h-4 mr-2" /> Restore Access</>
                      ) : (
                        <><UserX className="w-4 h-4 mr-2" /> Ban User</>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </Layout>
  );
};

export default AdminUsers;