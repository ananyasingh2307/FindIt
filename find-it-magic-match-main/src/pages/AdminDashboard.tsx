import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import BentoCard from "@/components/BentoCard";
import { useItems } from "@/context/ItemsContext";
import { 
  CheckCircle2, XCircle, Package, TrendingUp, Users, 
  Clock, Sparkles, Handshake, Search, ArrowRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MatchPopup = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ y: 30 }}
      animate={{ y: 0 }}
      className="bg-card border-2 border-primary/20 rounded-[2rem] shadow-2xl max-w-sm mx-4 text-center p-8"
    >
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-display font-black text-2xl text-foreground mb-2 tracking-tight">Magic Match!</h3>
      <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
        This report perfectly aligns with a pending request: <br />
        <span className="font-bold text-foreground">"{title}"</span>
      </p>
      <Button onClick={onClose} className="w-full rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
        Awesome!
      </Button>
    </motion.div>
  </motion.div>
);

const AdminDashboard = () => {
  // 1. Destructure updateItemStatus from context
  const { items, approveItem, declineItem, matchItem, updateItemStatus, reunionCount } = useItems();
  const [matchPopup, setMatchPopup] = useState<string | null>(null);

  // 2. Refined Filtering Logic
  const pendingItems = items.filter((i) => i.status === "pending");
  
  // Only show items that are 'approved'. Once they become 'returned', they leave this list.
  const activeItems = items.filter((i) => i.status === "approved");
  
  const lostCount = items.filter((i) => i.type === "lost" && i.status !== "returned").length;
  const foundCount = items.filter((i) => i.type === "found" && i.status !== "returned").length;

  const handleApprove = async (id: string) => {
    await approveItem(id);
    const matchTitle = matchItem(id);
    if (matchTitle) {
      setMatchPopup(matchTitle);
    } else {
      toast.success("Item is now live on the feed!");
    }
  };

  // 3. FIXED: Actually update the database status
  const handleResolveReunion = async (id: string) => {
    try {
      await updateItemStatus(id, "returned");
      toast.success("Reunion Confirmed! 🥳", {
        description: "Item moved to the Reunion Wall history.",
      });
    } catch (error) {
      toast.error("Failed to update status. Please try again.");
    }
  };

  const handleDecline = async (id: string) => {
    await declineItem(id);
    toast.error("Item removed from queue.");
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-display font-black text-foreground mb-2 tracking-tight">Admin Control</h1>
        <p className="text-muted-foreground text-base font-medium">Monitor reports and facilitate reunions.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
        <BentoCard delay={0.05} className="border-destructive/10 bg-destructive/[0.02]">
          <div className="flex flex-col gap-2">
            <Package className="w-5 h-5 text-destructive" />
            <p className="text-3xl font-display font-black">{lostCount}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Lost</p>
          </div>
        </BentoCard>
        <BentoCard delay={0.1} className="border-success/10 bg-success/[0.02]">
          <div className="flex flex-col gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <p className="text-3xl font-display font-black">{foundCount}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Found</p>
          </div>
        </BentoCard>
        <BentoCard delay={0.15} className="border-warning/10 bg-warning/[0.02]">
          <div className="flex flex-col gap-2">
            <Clock className="w-5 h-5 text-warning" />
            <p className="text-3xl font-display font-black">{pendingItems.length}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Pending</p>
          </div>
        </BentoCard>
        <BentoCard delay={0.2} className="border-primary/10 bg-primary/[0.02]">
          <div className="flex flex-col gap-2">
            <Users className="w-5 h-5 text-primary" />
            <p className="text-3xl font-display font-black">{reunionCount}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Reunions</p>
          </div>
        </BentoCard>
      </div>

      <AnimatePresence>
        {matchPopup && <MatchPopup title={matchPopup} onClose={() => setMatchPopup(null)} />}
      </AnimatePresence>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-2xl mb-8">
          <TabsTrigger value="pending" className="rounded-xl px-8 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Pending Queue
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-xl px-8 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Live Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 outline-none">
          {pendingItems.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center border-2 border-dashed rounded-[2.5rem] border-muted-foreground/10">
              <CheckCircle2 className="w-12 h-12 text-success/30 mb-4" />
              <p className="text-muted-foreground font-medium">All caught up! No reports to review.</p>
            </div>
          ) : (
            pendingItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-card border border-border/60 p-5 rounded-3xl flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                    item.type === "lost" ? "bg-destructive/10" : "bg-success/10"
                  }`}>
                    {item.type === "lost" ? "🔍" : "📦"}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground font-medium">{item.location} • {new Date(item.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDecline(item.id)}>
                    <XCircle className="w-6 h-6" />
                  </Button>
                  <Button className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90" onClick={() => handleApprove(item.id)}>
                    Approve
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4 outline-none">
          {activeItems.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center border-2 border-dashed rounded-[2.5rem] border-muted-foreground/10">
              <Search className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground font-medium">No active items on the feed.</p>
            </div>
          ) : (
            activeItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border/60 p-5 rounded-3xl flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-xl opacity-50 grayscale">
                    {item.type === "lost" ? "🔍" : "📦"}
                   </div>
                   <div>
                    <p className="font-bold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground font-medium">Currently visible on {item.type} feed</p>
                   </div>
                </div>
                <Button 
                  variant="outline" 
                  className="rounded-xl font-bold gap-2 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground h-11 px-6 transition-all active:scale-95 group"
                  onClick={() => handleResolveReunion(item.id)}
                >
                  <Handshake className="w-5 h-5 group-hover:animate-bounce" /> Mark as Returned
                </Button>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default AdminDashboard;