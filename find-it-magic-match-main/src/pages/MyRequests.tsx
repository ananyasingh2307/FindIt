import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import ItemCard from "@/components/ItemCard";
import { useAuth } from "@/context/AuthContext";
import { useItems } from "@/context/ItemsContext";
import { Inbox } from "lucide-react";

const MyRequests = () => {
  const { user } = useAuth();
  const { items } = useItems();

  const myItems = items.filter((i) => i.submittedBy === user?.id);

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">My Requests</h1>
        <p className="text-muted-foreground text-sm">Track the status of your reported items</p>
      </motion.div>

      {myItems.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">You haven't reported any items yet</p>
        </motion.div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myItems.map((item, i) => (
              <ItemCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </Layout>
  );
};

export default MyRequests;
