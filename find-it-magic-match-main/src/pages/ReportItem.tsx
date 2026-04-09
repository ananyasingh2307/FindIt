import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useItems } from "@/context/ItemsContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Laptop, Key, Shirt, BookOpen, Package, Droplets, CreditCard, Backpack,
  ChevronRight, ChevronLeft, Upload, MapPin, Check, Building2, Coffee, 
  Flower2, Trophy, Home, DoorOpen, Car, Gavel, UserRound, Landmark, AlertOctagon, Loader2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Layout from "@/components/Layout";
import { toast } from "sonner";

const categories = [
  { id: "electronics", label: "Electronics", icon: Laptop },
  { id: "keys", label: "Keys", icon: Key },
  { id: "clothing", label: "Clothing", icon: Shirt },
  { id: "books", label: "Books", icon: BookOpen },
  { id: "bottles", label: "Bottles", icon: Droplets },
  { id: "cards", label: "Cards & IDs", icon: CreditCard },
  { id: "accessories", label: "Bags & Accessories", icon: Backpack },
  { id: "other", label: "Other", icon: Package },
];

const campusZones = [
  { name: "A Block", icon: Building2 },
  { name: "B Block", icon: Building2 },
  { name: "C Block", icon: Building2 },
  { name: "D Block", icon: Building2 },
  { name: "A Block Canteen", icon: Coffee },
  { name: "C Block Canteen", icon: Coffee },
  { name: "Sunken Garden", icon: Flower2 },
  { name: "Cricket Ground", icon: Trophy },
  { name: "Football Court", icon: Trophy },
  { name: "Pickleball Court", icon: Trophy },
  { name: "Volleyball Court", icon: Trophy },
  { name: "Hostel", icon: Home },
  { name: "New Hostel", icon: Home },
  { name: "Main Gate", icon: DoorOpen },
  { name: "Parking", icon: Car },
  { name: "Moot Court", icon: Gavel },
  { name: "Registrar Office", icon: UserRound },
  { name: "Reception", icon: Landmark },
];

const ReportItem = () => {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isBanned, setIsBanned] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // Image Upload States
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { addItem } = useItems();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single();
      
      if (data?.status === 'banned') {
        setIsBanned(true);
      }
    };
    checkStatus();
  }, [user]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file (PNG/JPG)");
        return;
      }

      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);

      setImageUrl(data.publicUrl);
      toast.success("Image attached!");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (isBanned) {
      toast.error("Action Prohibited");
      return;
    }

    if (!user) {
      toast.error("Please login to submit a report.");
      return;
    }

    try {
      await addItem({
        title,
        description,
        category,
        type,
        location,
        submitted_by: user.id,
        image_url: imageUrl, // Added image field
      });
      
      toast.success("Report Submitted!");
      navigate("/my-requests");
    } catch (err) {
      console.error(err);
      toast.error("Submission failed.");
    }
  };

  const canNext =
    (step === 1 && category) ||
    (step === 2 && title && description) ||
    (step === 3 && location);

  if (isBanned) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto py-20 text-center">
          <div className="w-24 h-24 bg-destructive/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-destructive">
            <AlertOctagon className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black font-display tracking-tight text-foreground mb-4">Account Restricted</h1>
          <p className="text-muted-foreground font-medium mb-8">
            You have been restricted from reporting items.
          </p>
          <Button onClick={() => navigate("/dashboard")} variant="outline" className="rounded-xl h-12 px-8 font-bold">
            Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-display font-black text-foreground mb-2 tracking-tight">Report an Item</h1>
          <p className="text-muted-foreground text-sm font-medium">Follow the steps to post your item to the campus feed.</p>
        </motion.div>

        <div className="flex items-center gap-3 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex flex-col gap-2">
              <div className={`h-2 w-full rounded-full transition-all duration-500 ${
                s <= step ? "bg-primary shadow-[0_0_12px_rgba(var(--primary),0.3)]" : "bg-muted"
              }`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${s <= step ? "text-primary" : "text-muted-foreground"}`}>
                Phase 0{s}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex rounded-3xl bg-muted/40 p-2 mb-8 border border-border/50 shadow-inner">
                {(["lost", "found"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                      type === t ? "bg-background text-primary shadow-xl ring-1 ring-black/5" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "lost" ? "Missing Item" : "Found Item"}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-3 py-8 rounded-[2rem] border-2 transition-all duration-300 ${
                      category === cat.id 
                        ? "border-primary bg-primary/5 shadow-xl shadow-primary/5" 
                        : "border-transparent bg-muted/30 hover:bg-muted/60"
                    }`}
                  >
                    <cat.icon className={`w-10 h-10 ${category === cat.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-[10px] font-black text-foreground uppercase tracking-wider">{cat.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Item Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Blue Dell Laptop Bag" className="h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary text-base px-6 shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Key Identifiers</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What makes it unique? Any scratches, stickers, or logos?" className="rounded-3xl min-h-[160px] bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary text-base p-6 resize-none shadow-sm" />
              </div>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); /* Handle drop if desired */ }}
                className={`border-2 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center gap-4 transition-all cursor-pointer relative overflow-hidden group ${
                  dragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/20 bg-muted/10 hover:bg-muted/20"
                }`}
              >
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                
                {imageUrl ? (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg animate-in zoom-in-95 duration-300">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setImageUrl(null); }}
                      className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      {uploading ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : <Upload className="w-8 h-8 text-primary" />}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-foreground uppercase tracking-widest">
                        {uploading ? "Uploading Proof..." : "Attach Visual Proof"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PNG or JPG (Max 5MB)</p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex items-center gap-3 mb-8 ml-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                   <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-black text-foreground tracking-tight">Last Seen Location</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-3 custom-scrollbar">
                {campusZones.map((zone, i) => (
                  <motion.button
                    key={zone.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setLocation(zone.name)}
                    className={`p-5 rounded-[1.5rem] border-2 flex items-center gap-4 transition-all duration-300 ${
                      location === zone.name
                        ? "border-primary bg-primary/5 text-primary shadow-xl shadow-primary/5"
                        : "border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    <div className={`p-3 rounded-xl transition-colors ${location === zone.name ? "bg-primary text-white" : "bg-background shadow-sm"}`}>
                       <zone.icon className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-sm text-foreground">{zone.name}</span>
                    {location === zone.name && <Check className="ml-auto w-6 h-6 animate-in zoom-in" />}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-4 mt-12">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="h-16 flex-1 rounded-2xl font-black uppercase tracking-widest gap-2 text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </Button>
          
          {step < 3 ? (
            <Button 
              onClick={() => setStep((s) => s + 1)} 
              disabled={!canNext || uploading} 
              className="h-16 flex-[2] rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Next Phase <ChevronRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={!canNext || uploading} 
              className="h-16 flex-[2] rounded-2xl font-black uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Publish Report <Check className="w-6 h-6" />
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ReportItem;