import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/hooks/useStore";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUploader({ value, onChange, label = "Image", className }: ImageUploaderProps) {
  const { store } = useStore();
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 5 Mo)");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Fichier non supporté");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${store.id}/landings/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from("store-assets").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      toast.error("Échec de l'upload");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("store-assets").getPublicUrl(path);
    onChange(urlData.publicUrl);
    setUploading(false);
    toast.success("Image uploadée");

    // Reset input
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={className}>
      <Label className="text-[10px]">{label}</Label>

      {value ? (
        <div className="mt-1 relative group">
          <img
            src={value}
            alt=""
            className="w-full h-24 object-cover rounded-md border border-border"
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
          <button
            onClick={() => onChange("")}
            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="mt-1 border-2 border-dashed border-border rounded-md p-3 text-center">
          <ImageIcon className="w-6 h-6 mx-auto text-muted-foreground/40 mb-1" />
          <p className="text-[10px] text-muted-foreground mb-2">Glissez ou cliquez</p>
        </div>
      )}

      <div className="flex gap-1 mt-1.5">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-6 text-[10px]"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
          {uploading ? "Upload..." : "Upload"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[10px] px-2"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          URL
        </Button>
      </div>

      {showUrlInput && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 text-[10px] mt-1"
          placeholder="https://..."
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
