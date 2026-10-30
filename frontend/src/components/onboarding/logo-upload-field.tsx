"use client";

import { useRef } from "react";
import toast from "react-hot-toast";
import { ImageUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MAX_LOGO_BYTES, getInitials } from "@/lib/business";

interface Props {
  preview: string | null;
  fallbackName: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
}

export function LogoUploadField({ preview, fallbackName, onSelect, onRemove }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Logo must be an image file.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Logo must be 2 MB or smaller.");
      return;
    }
    onSelect(file);
  };

  return (
    <div className="space-y-2">
      <Label>
        Logo <span className="font-normal text-muted-foreground">(optional)</span>
      </Label>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Business logo" className="w-full h-full object-contain" />
          ) : (
            <span className="text-xl font-bold text-muted-foreground">
              {getInitials(fallbackName) || "?"}
            </span>
          )}
        </div>
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUp size={14} className="mr-2" />
              {preview ? "Change logo" : "Upload logo"}
            </Button>
            {preview && (
              <Button
                type="button"
                variant="ghost"
                className="h-10 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
              >
                <Trash2 size={14} className="mr-2" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG or SVG, up to 2 MB.</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
