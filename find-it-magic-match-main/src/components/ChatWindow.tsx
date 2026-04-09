import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MessageSquare, Shield, Clock, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useItems } from "@/context/ItemsContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ChatProps {
  itemId: string | null; // Changed to allow null for Admin Support
  itemTitle: string;
  receiverId: string;
  onClose: () => void;
}

const ChatWindow = ({ itemId, itemTitle, receiverId, onClose }: ChatProps) => {
  const { user } = useAuth();
  const { sendMessage } = useItems();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    scrollRef.current?.scrollIntoView({ behavior });
  };

  // 1. Initial Fetch
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        
        let query = supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`);
        
        // Handle Support vs Item Inquiry
        if (itemId) {
          query = query.eq('item_id', itemId);
        } else {
          query = query.is('item_id', null);
        }

        const { data, error } = await query.order('created_at', { ascending: true });
        
        if (data) {
          setMessages(data);
          setTimeout(() => scrollToBottom("auto"), 100);
        }
        if (error) throw error;
      } catch (err) {
        console.error("Chat fetch error:", err);
      } finally {
        setIsLoading(false); // Ensures loading dots disappear
      }
    };

    fetchMessages();

    // 2. Real-time subscription
    const channelId = itemId ? `chat:${itemId}` : `support:${user.id}:${receiverId}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, 
        (payload) => {
          const msg = payload.new;
          // Verify this message belongs in this specific window
          const isCorrectParticipants = 
            (msg.sender_id === user.id || msg.receiver_id === user.id) &&
            (msg.sender_id === receiverId || msg.receiver_id === receiverId);
          
          const isCorrectContext = itemId ? msg.item_id === itemId : msg.item_id === null;

          if (isCorrectParticipants && isCorrectContext) {
            setMessages((prev) => {
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            setTimeout(scrollToBottom, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId, user, receiverId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !user || isSending) return;
    
    const content = newMsg.trim();
    setNewMsg(""); 
    setIsSending(true);
    
    try {
      await sendMessage(itemId as string, receiverId, content);
      scrollToBottom();
    } catch (error) {
      setNewMsg(content); 
      console.error("Failed to send:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 right-6 w-[350px] md:w-[420px] h-[580px] bg-card border border-border shadow-2xl rounded-[2rem] flex flex-col z-[100] overflow-hidden ring-1 ring-black/5"
    >
      <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
            {itemId ? <MessageSquare className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">
              {itemId ? "Item Inquiry" : "Staff Support"}
            </p>
            <h4 className="text-sm font-bold truncate leading-none">{itemTitle}</h4>
            <div className="flex items-center gap-1 mt-1">
               <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
               <span className="text-[10px] opacity-80 font-medium">Messenger Active</span>
            </div>
          </div>
        </div>
        
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-1.5 border-b border-amber-100 dark:border-amber-900/30 flex items-center gap-2">
        <Shield className="w-3 h-3 text-amber-600" />
        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-500">Meet in public campus areas only.</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-10">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h5 className="text-sm font-bold text-foreground">No messages yet</h5>
            <p className="text-xs text-muted-foreground mt-1">
              {itemId 
                ? "Ask the reporter about the item's condition or arrange a meeting place."
                : "Describe your issue to the campus administrator."}
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isMe = m.sender_id === user?.id;
            const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return (
              <motion.div 
                key={m.id || i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                  isMe 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-card text-foreground rounded-tl-none border border-border"
                }`}>
                  {m.content}
                </div>
                <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
                  <span className="text-[9px] text-muted-foreground font-medium">{time}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-primary opacity-60" />}
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-background border-t border-border">
        <form onSubmit={handleSend} className="flex items-end gap-2 bg-muted/30 rounded-2xl p-1 pr-2 border border-transparent focus-within:border-primary/20 focus-within:bg-background transition-all">
          <textarea
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Type a message..."
            className="flex-1 min-h-[44px] max-h-32 bg-transparent border-none focus:ring-0 text-sm p-3 resize-none custom-scrollbar"
            rows={1}
          />
          <Button 
            type="submit" 
            disabled={!newMsg.trim() || isSending}
            size="icon"
            className="h-9 w-9 rounded-xl shrink-0 mb-1"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </motion.div>
  );
};

export default ChatWindow;