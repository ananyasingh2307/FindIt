import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
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
  refreshItems: () => Promise<void>;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export const ItemsProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoized fetch function for better performance
  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedItems: LostFoundItem[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        type: item.type,
        location: item.location,
        status: item.status,
        imageUrl: item.image_url, // Matches storage URL
        submittedBy: item.submitted_by,
        submittedAt: new Date(item.created_at),
      }));
      
      setItems(formattedItems);
    } catch (error) {
      console.error("Database fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    
    // Subscribe to ALL changes in the items table
    const channel = supabase
      .channel('global-items-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'items' }, 
        (payload) => {
          console.log('Real-time update:', payload);
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  const reunionCount = items.filter(i => 
    ["returned", "resolved", "matched"].includes(i.status)
  ).length;

  const addItem = async (item: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      // Logic: Ensure the field names here match your Supabase Table Columns
      const { error } = await supabase.from('items').insert([{ 
        title: item.title,
        description: item.description,
        category: item.category,
        type: item.type,
        location: item.location,
        image_url: item.image_url, // Payload from ReportItem.tsx
        submitted_by: user.id,
        status: 'pending' 
      }]);

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Submission failed");
      throw error;
    }
  };

  const updateItemStatus = async (id: string, status: ItemStatus) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      // Optimistic Local Update
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, status } : item
      ));
      
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  const approveItem = (id: string) => updateItemStatus(id, 'approved');
  const declineItem = (id: string) => updateItemStatus(id, 'declined');

  const sendMessage = async (itemId: string, receiverId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Login required");

      const { error } = await supabase.from('messages').insert([{ 
        item_id: itemId, 
        sender_id: user.id, 
        receiver_id: receiverId, 
        content 
      }]);

      if (error) throw error;
      toast.success("Message sent!");
    } catch (error) {
      console.error("Message error:", error);
      toast.error("Failed to send message");
    }
  };

  const matchItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return null;
    
    // Simple matching algorithm based on category
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
      matchItem, sendMessage, reunionCount, loading,
      refreshItems: fetchItems
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