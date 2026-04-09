import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { User, Mail, Shield, Trash2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="mb-10">
          <h1 className="text-4xl font-black font-display tracking-tight text-foreground">Campus Users</h1>
          <p className="text-muted-foreground font-medium mt-1">Manage registration and permissions for all members.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Fetching Profiles</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {users.map((u, index) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border/50 p-6 rounded-[2rem] flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <User className="w-7 h-7 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg text-foreground">{u.full_name}</h3>
                      <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg border ${
                        u.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Mail className="w-3 h-3" /> {u.id.substring(0, 12)}... (UUID)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <button className="p-3 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminUsers;