import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  span?: "1" | "2";
}

const BentoCard = ({ children, className, delay = 0, span = "1" }: BentoCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    className={cn(
      "bento-card",
      span === "2" && "md:col-span-2",
      className
    )}
  >
    {children}
  </motion.div>
);

export default BentoCard;
