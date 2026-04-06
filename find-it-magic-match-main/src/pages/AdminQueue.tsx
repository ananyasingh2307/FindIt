import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import { useItems } from "@/context/ItemsContext";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AdminQueue = () => {
  const { items, approveItem, declineItem, matchItem } = useItems();
  const [matchPopup, setMatchPopup] = useState<string | null>(null);

  const pendingItems = items.filter((i) => i.status === "pending");

  const handleApprove = (id: string) => {
    approveItem(id);
    const matchTitle = matchItem(id);
    if (matchTitle) {
      setMatchPopup(matchTitle);
    } else {
      toast.success("Item approved!");
    }
  };

  const handleDecline = (id: string) => {
    declineItem(id);
    toast.info("Item declined.");
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">Approval Queue</h1>
        <p className="text-muted-foreground text-sm">Review and approve reported items</p>
      </motion.div>

      {/* Match popup */}
      <AnimatePresence>
        {matchPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMatchPopup(null)}
          >
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: 30 }} animate={{ y: 0 }} className="bento-card-flat max-w-sm mx-4 text-center p-8">
              <motion.div animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }} className="text-5xl mb-4">✨</motion.div>
              <h3 className="font-display font-bold text-xl text-foreground mb-2">Magic Match!</h3>
              <p className="text-muted-foreground text-sm mb-4">
                This matches: <span className="font-semibold text-foreground">"{matchPopup}"</span>
              </p>
              <Button onClick={() => setMatchPopup(null)} className="rounded-xl">Awesome!</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {pendingItems.length === 0 ? (
        <div className="bento-card-flat text-center py-16">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">All caught up! No pending items.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: i * 0.05 }}
              layout
              className="bento-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                  item.type === "lost" ? "bg-destructive/10" : "bg-success/10"
                }`}>
                  {item.type === "lost" ? "🔍" : "📦"}
                </div>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.location} · {item.type} · {item.submittedAt.toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1.5 text-success border-success/30 hover:bg-success/10 hover:text-success"
                    onClick={() => handleApprove(item.id)}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDecline(item.id)}
                  >
                    <XCircle className="w-4 h-4" /> Decline
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default AdminQueue;
