"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { uploadTamagotchiAsset } from "@/lib/tamagotchi/upload-asset";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  autoUpload?: boolean;
}

export function ImageUploadField({
  value,
  onChange,
  label = "Sprite image",
  className,
  autoUpload = true,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function uploadFile(file: File) {
    setIsUploading(true);
    try {
      const publicUrl = await uploadTamagotchiAsset(file);
      onChange(publicUrl);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Upload failed"
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (autoUpload) {
      await uploadFile(file);
      return;
    }
  }

  async function handleManualUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      toast.error("Select an image file first");
      return;
    }
    await uploadFile(file);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium text-white/80">{label}</p>

      {value && (
        <div className="flex items-center gap-3 rounded-lg border border-city-teal/30 bg-city-navy-light p-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-black/20">
            <Image
              src={value}
              alt="Upload preview"
              fill
              unoptimized
              className="object-contain"
            />
          </div>
          <p className="min-w-0 flex-1 truncate text-xs text-city-teal">
            {value}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-city-magenta/20 file:px-3 file:py-2 file:text-xs file:font-medium file:text-city-magenta hover:file:bg-city-magenta/30"
        />
        {!autoUpload && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isUploading}
            onClick={handleManualUpload}
            className="shrink-0"
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        )}
      </div>

      {isUploading && (
        <p className="text-xs text-city-teal">Uploading...</p>
      )}

      {!value && !isUploading && (
        <p className="text-xs text-white/40">
          {autoUpload
            ? "Select a file — it uploads automatically."
            : "Select a file, then click Upload."}
        </p>
      )}
    </div>
  );
}
