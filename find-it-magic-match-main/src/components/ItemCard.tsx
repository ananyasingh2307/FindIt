import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LostFoundItem } from "@/context/ItemsContext";
import { useAuth } from "@/context/AuthContext";
import { MapPin, Clock, MessageSquare, UserCheck, History, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatWindow from "./ChatWindow";

const categoryIcons: Record<string, string> = {
  electronics: "💻",
  bottles: "🧴",
  cards: "🪪",
  accessories: "🎒",
  clothing: "👕",
  keys: "🔑",
  books: "📚",
  other: "📦",
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  approved: "bg-green-500/10 text-green-600 border border-green-500/20",
  declined: "bg-red-500/10 text-red-600 border border-red-500/20",
  matched: "bg-primary/10 text-primary border border-primary/20",
  returned: "bg-success/20 text-success border border-success/30",
};

const statusLabels: Record<string, string> = {
  pending: "Awaiting Approval",
  approved: "Approved",
  declined: "Declined",
  matched: "🎉 Matched!",
  returned: "🏠 Returned",
};

const ItemCard = ({ item, index = 0 }: { item: LostFoundItem; index?: number }) => {
  const [showChat, setShowChat] = useState(false);
  const { user } = useAuth();
  
  const emoji = categoryIcons[item.category] || categoryIcons.other;
  const isOwner = user?.id === item.submittedBy;

  // Supports both camelCase and snake_case depending on your Context mapping
  const displayImage = item.imageUrl || (item as any).image_url;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="bg-card border border-border/50 rounded-[2rem] p-5 flex flex-col h-full hover:shadow-xl hover:shadow-black/5 transition-all duration-300 group"
      >
        {/* Visual Header (Image or Emoji) */}
        <div className="h-44 rounded-[1.5rem] bg-muted/50 flex items-center justify-center overflow-hidden mb-4 group-hover:scale-[1.02] transition-transform duration-500 relative">
          {displayImage ? (
            <img 
              src={displayImage} 
              alt={item.title} 
              className="w-full h-full object-cover transition-opacity duration-500"
              loading="lazy"
            />
          ) : (
            <span className="text-5xl drop-shadow-sm">{emoji}</span>
          )}
          
          {/* Subtle Category Overlay for Images */}
          {displayImage && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-black/30 backdrop-blur-md rounded-full text-[9px] text-white font-black uppercase tracking-widest">
              {item.category}
            </div>
          )}
        </div>

        {/* Header Info */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-bold text-foreground text-base leading-tight line-clamp-1">
            {item.title}
          </h3>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shrink-0 ${
            item.type === "lost" ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600"
          }`}>
            {item.type}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2 italic opacity-80">
          "{item.description}"
        </p>

        {/* Meta Details */}
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-muted-foreground/60 mb-5">
          <span className="flex items-center gap-1.5 uppercase tracking-wider">
            <MapPin className="w-3 h-3 text-primary" />
            {item.location}
          </span>
          <span className="flex items-center gap-1.5 uppercase tracking-wider">
            <Clock className="w-3 h-3 text-primary" />
            {new Date(item.submittedAt).toLocaleDateString()}
          </span>
        </div>

        {/* Action/Status Section */}
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className={`${statusStyles[item.status]} inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-bold tracking-tight`}>
              {statusLabels[item.status]}
            </div>
            
            {isOwner && (
              <span className="text-[10px] flex items-center gap-1.5 text-primary font-black uppercase tracking-widest">
                <UserCheck className="w-3.5 h-3.5" /> Mine
              </span>
            )}
          </div>

          {!isOwner ? (
            <Button 
              onClick={() => setShowChat(true)}
              variant="secondary"
              size="sm"
              className="w-full rounded-2xl text-[10px] uppercase tracking-widest font-black gap-2 h-11 hover:bg-primary hover:text-white transition-all duration-300"
            >
              <MessageSquare className="w-4 h-4" />
              Message Reporter
            </Button>
          ) : (
            <div className="w-full py-3 px-3 bg-muted/30 rounded-2xl border-2 border-dashed border-border/50 text-[10px] flex items-center justify-center gap-2 text-muted-foreground font-bold uppercase tracking-widest">
              <History className="w-3 h-3" />
              Manage in History
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showChat && (
          <ChatWindow 
            itemId={item.id}
            itemTitle={item.title}
            receiverId={item.submittedBy}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ItemCard;