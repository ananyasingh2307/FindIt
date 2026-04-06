import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import BentoCard from "@/components/BentoCard";
import ItemCard from "@/components/ItemCard";
import SkeletonCard from "@/components/SkeletonCard";
import { useAuth } from "@/context/AuthContext";
import { useItems } from "@/context/ItemsContext";
import { useNavigate } from "react-router-dom";
import { Search, PlusCircle, TrendingUp, Package, ArrowRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Assuming you have a UI Input component

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good Morning", emoji: "☀️", color: "text-orange-400" };
  if (h < 17) return { text: "Good Afternoon", emoji: "🌤️", color: "text-blue-400" };
  return { text: "Good Evening", emoji: "🌙", color: "text-indigo-400" };
};

const Dashboard = () => {
  const { user } = useAuth();
  const { items, reunionCount } = useItems();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const greeting = getGreeting();

  // Logic for dynamic filtering
  const approvedItems = items.filter((i) => 
    i.status === "approved" && 
    (i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const lostCount = items.filter((i) => i.type === "lost").length;
  const foundCount = items.filter((i) => i.type === "found").length;

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800); // Shorter load feels snappier
    return () => clearTimeout(t);
  }, []);

  return (
    <Layout>
      {/* Header Section with Glassmorphism Effect */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-foreground flex items-center gap-2">
            <span className={greeting.color}>{greeting.emoji}</span> {greeting.text}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-2 text-base font-medium">
            Helping the campus community stay connected.
          </p>
        </div>
        
        {/* Quick Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search items..." 
            className="pl-10 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Stats Grid - Enhanced with Hover Scale */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
        <BentoCard delay={0.1} className="hover:border-destructive/30 transition-colors">
          <div className="flex flex-col gap-1">
             <div className="w-10 h-10 rounded-2xl bg-destructive/10 flex items-center justify-center mb-2">
               <Package className="w-5 h-5 text-destructive" />
             </div>
             <p className="text-3xl font-display font-bold">{lostCount}</p>
             <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items Lost</p>
          </div>
        </BentoCard>

        <BentoCard delay={0.15} className="hover:border-success/30 transition-colors">
          <div className="flex flex-col gap-1">
             <div className="w-10 h-10 rounded-2xl bg-success/10 flex items-center justify-center mb-2">
               <Search className="w-5 h-5 text-success" />
             </div>
             <p className="text-3xl font-display font-bold">{foundCount}</p>
             <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items Found</p>
          </div>
        </BentoCard>

        <BentoCard delay={0.2} className="hover:border-primary/30 transition-colors">
          <div className="flex flex-col gap-1">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
               <TrendingUp className="w-5 h-5 text-primary" />
             </div>
             <p className="text-3xl font-display font-bold">{reunionCount}</p>
             <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reunions</p>
          </div>
        </BentoCard>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="cursor-pointer"
          onClick={() => navigate("/report")}
        >
          <BentoCard delay={0.25} className="bg-primary text-primary-foreground border-none h-full shadow-lg shadow-primary/20">
            <div className="flex flex-col h-full justify-between gap-4">
               <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                 <PlusCircle className="w-5 h-5" />
               </div>
               <div>
                 <p className="font-display font-bold text-lg leading-tight">Report Item</p>
                 <p className="text-xs text-primary-foreground/80 font-medium italic">Join the reunion wall</p>
               </div>
            </div>
          </BentoCard>
        </motion.div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-8 bg-primary rounded-full" />
          <h2 className="font-display font-bold text-foreground text-xl">Recent Activity</h2>
        </div>
        <Button variant="ghost" size="sm" className="group gap-1 text-muted-foreground hover:text-primary transition-colors" onClick={() => navigate("/reunion")}>
          View Reunion Wall <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* Main Feed with Staggered Animation */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {approvedItems.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {approvedItems.map((item, i) => (
                <ItemCard key={item.id} item={item} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="py-20 text-center flex flex-col items-center border-2 border-dashed rounded-3xl border-muted-foreground/10"
            >
              <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-bold text-foreground">No items found</h3>
              <p className="text-muted-foreground">Try adjusting your search or check back later.</p>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Layout>
  );
};

export default Dashboard;