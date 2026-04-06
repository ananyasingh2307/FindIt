import React, { useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import { useItems } from "@/context/ItemsContext";
import { PartyPopper, Heart, CheckCircle2, History, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import type { ItemStatus } from "@/context/ItemsContext";

const ReunionWall = () => {
  const { items = [] } = useItems(); // Default to empty array to prevent filter errors

  // DERIVED DATA: Filtered and Memoized for performance
  const returnedItems = useMemo(() =>
    items.filter((item) => item.status === ("returned" as ItemStatus) || item.status === ("resolved" as ItemStatus)),
    [items]
  );

  const reunionCount = returnedItems.length;

  const fireConfetti = useCallback(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      // Fire from left side
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      // Fire from right side
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval); // Local cleanup
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 mb-8 shadow-inner"
          >
            <PartyPopper className="w-12 h-12 text-primary" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-display font-black text-foreground mb-4 tracking-tight">
            The Reunion Wall
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto font-medium leading-relaxed">
            Every count represents a story of honesty and a successful return.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Main Counter Card */}
          <motion.div 
            className="md:col-span-7"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div 
              onClick={fireConfetti}
              className="relative overflow-hidden group bg-card border-2 border-primary/10 rounded-[2.5rem] p-12 text-center cursor-pointer hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98]"
            >
              <div className="absolute top-4 right-6 opacity-10 group-hover:opacity-30 transition-opacity">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>

              <motion.span 
                key={reunionCount}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="block text-8xl md:text-9xl font-display font-black text-primary mb-2 drop-shadow-sm"
              >
                {reunionCount}
              </motion.span>
              
              <p className="text-xl font-bold text-foreground mb-1 tracking-tight uppercase">Items Reunited</p>
              <p className="text-muted-foreground text-sm flex items-center justify-center gap-2 font-medium">
                <Heart className="w-4 h-4 text-destructive fill-destructive" /> Tap to celebrate campus honesty!
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { label: "Success Rate", value: "92%", icon: CheckCircle2 },
                { label: "Avg. Time", value: "2 Days", icon: History },
                { label: "Active Users", value: "240+", icon: Sparkles },
              ].map((stat) => (
                <div key={stat.label} className="bg-muted/30 rounded-2xl p-4 border border-border/50 text-center">
                  <stat.icon className="w-4 h-4 mx-auto mb-2 text-primary opacity-60" />
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent History Sidebar */}
          <motion.div 
            className="md:col-span-5 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Recent Reunions</h3>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {returnedItems.length > 0 ? (
                  returnedItems.slice(0, 5).map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-4 bg-card border border-border/60 p-4 rounded-2xl shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-tight line-clamp-1">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Found at {item.location}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-[2rem] border-muted-foreground/10 bg-muted/5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No reunions yet</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ReunionWall;