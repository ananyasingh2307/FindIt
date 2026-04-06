import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, User, ArrowRight, Inbox, Shield } from "lucide-react";
import ChatWindow from "@/components/ChatWindow"; 
import Navbar from "@/components/Navbar"; 
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          items (id, title, type, submitted_by)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const grouped = data.reduce((acc: any[], current: any) => {
          const isExisting = acc.find(c => 
            (c.item_id === current.item_id && current.item_id !== null) ||
            (current.item_id === null && c.receiver_id === current.receiver_id && c.sender_id === current.sender_id)
          );
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
  };

  const handleContactAdmin = async () => {
    try {
      // Find the first available admin
      const { data: admins, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'admin')
        .limit(1);

      if (error || !admins || admins.length === 0) {
        toast.error("No admins available at the moment.");
        return;
      }

      // Open a chat window with the admin
      setSelectedChat({
        item_id: null, // No specific item for support
        sender_id: user?.id,
        receiver_id: admins[0].id,
        items: { title: "Admin Support" },
        content: "New Support Inquiry"
      });
    } catch (err) {
      toast.error("Failed to connect to support.");
    }
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('inbox-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        () => { fetchMessages(); }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container max-w-4xl py-10 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.25rem] bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <Inbox className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Campus Messenger</h1>
              <p className="text-sm text-muted-foreground font-medium">Inquiries about your reported items</p>
            </div>
          </div>

          {/* New Admin Support Button */}
          <Button 
            onClick={handleContactAdmin}
            variant="outline"
            className="rounded-2xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-bold gap-2 h-12 px-6 transition-all duration-300"
          >
            <Shield className="w-4 h-4" />
            Contact Admin
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Syncing Inbox</p>
          </div>
        ) : conversations.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-card/50 rounded-[2.5rem] border-2 border-dashed border-border"
          >
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Your inbox is empty</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
              Messages will appear here once you start a conversation.
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
                className="bg-card border border-border/50 p-6 flex items-center justify-between group cursor-pointer rounded-[2rem] hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
                
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    {chat.item_id === null ? (
                      <Shield className="w-8 h-8 text-primary" />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                        chat.item_id === null 
                          ? 'bg-primary/10 text-primary border border-primary/20' 
                          : chat.items?.type === 'found'
                            ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                            : 'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                        {chat.items?.title || "General Inquiry"}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                        {new Date(chat.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors pr-10">
                      {chat.content}
                    </p>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {selectedChat && (
            <ChatWindow
              itemId={selectedChat.item_id}
              itemTitle={selectedChat.items?.title}
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