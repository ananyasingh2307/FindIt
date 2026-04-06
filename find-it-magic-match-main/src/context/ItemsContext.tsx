import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client"; 
import { toast } from "sonner";

export type ItemStatus = "pending" | "approved" | "declined" | "matched" | "returned" | "resolved";
export type ItemType = "lost" | "found";

export interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: ItemType;
  location: string;
  imageUrl?: string;
  status: ItemStatus;
  submittedBy: string;
  submittedAt: Date;
}

interface ItemsContextType {
  items: LostFoundItem[];
  addItem: (item: any) => Promise<void>;
  approveItem: (id: string) => Promise<void>;
  declineItem: (id: string) => Promise<void>;
  updateItemStatus: (id: string, status: ItemStatus) => Promise<void>;
  matchItem: (id: string) => string | null;
  sendMessage: (itemId: string, receiverId: string, content: string) => Promise<void>;
  reunionCount: number;
  loading: boolean;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export const ItemsProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // FIX: Mapping database snake_case to frontend camelCase
      const formattedItems: LostFoundItem[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        type: item.type,
        location: item.location,
        status: item.status,
        imageUrl: item.image_url, // Added mapping for images
        submittedBy: item.submitted_by, // Matches your DB column 'submitted_by'
        submittedAt: new Date(item.created_at),
      }));
      setItems(formattedItems);
    } catch (error) {
      console.error("Database fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    
    const channel = supabase
      .channel('global-items-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const reunionCount = items.filter(i => 
    ["returned", "resolved", "matched"].includes(i.status)
  ).length;

  const addItem = async (item: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first");

      // FIX: Ensure keys match database column names exactly
      const { error } = await supabase.from('items').insert([{ 
        title: item.title,
        description: item.description,
        category: item.category,
        type: item.type,
        location: item.location,
        image_url: item.imageUrl, // Map frontend imageUrl to DB image_url
        submitted_by: user.id,    // Use snake_case
        status: 'pending' 
      }]);

      if (error) throw error;
      toast.success("Report submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit");
    }
  };

  const approveItem = async (id: string) => {
    const { error } = await supabase.from('items').update({ status: 'approved' }).eq('id', id);
    if (error) toast.error("Failed to approve");
  };

  const declineItem = async (id: string) => {
    const { error } = await supabase.from('items').update({ status: 'declined' }).eq('id', id);
    if (error) toast.error("Failed to decline");
  };

  const updateItemStatus = async (id: string, status: ItemStatus) => {
    const { error } = await supabase.from('items').update({ status }).eq('id', id);
    if (error) toast.error("Status update failed");
  };

  const sendMessage = async (itemId: string, receiverId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { error } = await supabase.from('messages').insert([{ 
        item_id: itemId, 
        sender_id: user.id, 
        receiver_id: receiverId, 
        content 
      }]);

      if (error) throw error;
    } catch (error) {
      console.error("Message error:", error);
    }
  };

  const matchItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return null;
    
    const match = items.find(i => 
      i.type !== item.type && 
      i.category === item.category && 
      i.status === "approved" && 
      i.id !== id
    );

    if (match) {
      updateItemStatus(id, "matched");
      updateItemStatus(match.id, "matched");
      return match.title;
    }
    return null;
  };

  return (
    <ItemsContext.Provider value={{ 
      items, addItem, approveItem, declineItem, updateItemStatus, 
      matchItem, sendMessage, reunionCount, loading 
    }}>
      {children}
    </ItemsContext.Provider>
  );
};

export const useItems = () => {
  const ctx = useContext(ItemsContext);
  if (!ctx) throw new Error("useItems must be used within ItemsProvider");
  return ctx;
};