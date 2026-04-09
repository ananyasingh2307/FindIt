import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, User, ArrowRight, Shield, Loader2, Sparkles } from "lucide-react";
import ChatWindow from "@/components/ChatWindow"; 
import Navbar from "@/components/Navbar"; 
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from("messages")
        .select(`
          *,
          items (id, title, type, submitted_by)
        `);

      // Admin Broadcast Logic: Admins see all support (null item_id) + their own chats
      if (user.role === 'admin') {
        query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id},item_id.is.null`);
      } else {
        query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const grouped = data.reduce((acc: any[], current: any) => {
          const isExisting = acc.find(c => {
            if (current.item_id !== null) {
              return c.item_id === current.item_id;
            } else {
              // Group support chats by the "other" person involved
              const currentOther = current.sender_id === user.id ? current.receiver_id : current.sender_id;
              const existingOther = c.sender_id === user.id ? c.receiver_id : c.sender_id;
              return c.item_id === null && currentOther === existingOther;
            }
          });
          
          if (!isExisting) acc.push(current);
          return acc;
        }, []);
        
        setConversations(grouped);
      }
    } catch (error: any) {
      console.error("Inbox Error:", error);
      toast.error("Could not sync messages");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleContactAdmin = async () => {
    try {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (!admins || admins.length === 0) {
        toast.error("No admins available.");
        return;
      }

      setSelectedChat({
        item_id: null,
        sender_id: user?.id,
        receiver_id: admins[0].id,
        items: { title: "Admin Support" },
        content: "New Support Inquiry"
      });
    } catch (err) {
      toast.error("Connection failed.");
    }
  };

  useEffect(() => {
    fetchMessages();

    // GLOBAL SUBSCRIPTION: Listen for any insert in the messages table
    // The RLS policy we set in the DB will ensure the Admin only "hears" what they are allowed to
    const channel = supabase
      .channel('global-inbox-listener')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
          console.log("New message detected in real-time:", payload.new);
          fetchMessages(); 
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [user, fetchMessages]);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      <Navbar />

      <main className="container max-w-4xl py-10 px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
              <Sparkles className="w-3 h-3" />
              Real-time Messenger
            </div>
            <h1 className="text-5xl font-black font-display tracking-tight text-foreground leading-none">
              Inbox
            </h1>
            <p className="text-muted-foreground font-medium text-lg text-balance">
              Manage your item inquiries and support tickets.
            </p>
          </div>

          <AnimatePresence>
            {user?.role !== 'admin' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <Button 
                  onClick={handleContactAdmin}
                  className="rounded-2xl bg-primary text-primary-foreground font-bold gap-3 h-14 px-8 hover:scale-105 transition-all shadow-xl shadow-primary/25"
                >
                  <Shield className="w-5 h-5" />
                  Contact Admin
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Syncing Database</p>
          </div>
        ) : conversations.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-32 bg-card/30 rounded-[3.5rem] border-2 border-dashed border-border/50">
            <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Inbox is empty</h3>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto text-center text-sm font-medium">
              {user?.role === 'admin' 
                ? "No active support tickets or inquiries at the moment." 
                : "Start a conversation by messaging a reporter or contacting admin."}
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {conversations.map((chat, index) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedChat(chat)}
                className="bg-card border border-border/40 p-6 flex items-center justify-between group cursor-pointer rounded-[2.5rem] hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute -left-20 -top-20 w-40 h-40 bg-primary/5 blur-[100px] group-hover:bg-primary/10 transition-colors" />
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center transition-all duration-500 ${
                    chat.item_id === null 
                      ? 'bg-primary/10 text-primary shadow-inner shadow-primary/20' 
                      : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    {chat.item_id === null ? <Shield className="w-9 h-9" /> : <User className="w-9 h-9" />}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border ${
                        chat.item_id === null 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : chat.items?.type === 'found'
                            ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                            : 'bg-red-500/10 text-red-600 border-red-500/20'
                      }`}>
                        {chat.item_id === null ? "System Support" : chat.items?.title}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground/30 tabular-nums">
                        {new Date(chat.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-foreground/90 line-clamp-1 leading-tight">
                      {chat.content}
                    </p>
                  </div>
                </div>

                <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm relative z-10">
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {selectedChat && (
            <ChatWindow
              itemId={selectedChat.item_id}
              itemTitle={selectedChat.item_id === null ? "Admin Support" : selectedChat.items?.title}
              receiverId={selectedChat.sender_id === user?.id ? selectedChat.receiver_id : selectedChat.sender_id}
              onClose={() => setSelectedChat(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Messages;