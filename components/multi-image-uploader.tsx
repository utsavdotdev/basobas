"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MultiImageUploaderProps {
  selectedImages: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  "https://images.unsplash.com/photo-1770414173168-f6c666501225?w=800&q=80",
  "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&q=80",
  "https://images.unsplash.com/photo-1771775529138-a7a20ba7e032?w=800&q=80",
  "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&q=80",
  "https://images.unsplash.com/photo-1771275919604-81ae44ac4c38?w=800&q=80",
];

export function MultiImageUploader({
  selectedImages,
  onImagesChange,
  maxImages = 5,
}: MultiImageUploaderProps) {
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  const handleImageSelect = (imageUrl: string) => {
    if (selectedImages.includes(imageUrl)) {
      onImagesChange(selectedImages.filter((img) => img !== imageUrl));
    } else if (selectedImages.length < maxImages) {
      onImagesChange([...selectedImages, imageUrl]);
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    onImagesChange(selectedImages.filter((img) => img !== imageUrl));
  };

  const handleReorderImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...selectedImages];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onImagesChange(newImages);
  };

  return (
    <Card className="py-6">
      <CardHeader>
        <CardTitle>Upload Room Photos</CardTitle>
        <CardDescription>
          Add multiple photos of your room to attract more tenants. Maximum{" "}
          {maxImages} images.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selected Images */}
        {selectedImages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                Selected Photos ({selectedImages.length}/{maxImages})
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onImagesChange([])}
              >
                Clear All
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {selectedImages.map((image, index) => (
                <div
                  key={image}
                  className="group relative aspect-square overflow-hidden rounded-lg border-2 border-primary bg-muted"
                  onMouseEnter={() => setHoveredImage(image)}
                  onMouseLeave={() => setHoveredImage(null)}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`Selected room photo ${index + 1}`}
                    className="object-cover w-full h-full"
                    width={200}
                    height={200}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleRemoveImage(image)}
                      className="rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {index === 0 && (
                    <div className="absolute left-0 top-0 rounded-br-lg bg-primary px-2 py-1">
                      <span className="text-xs font-semibold text-primary-foreground">
                        Cover
                      </span>
                    </div>
                  )}
                  <div className="absolute right-1 top-1 rounded bg-background/80 px-1.5 py-0.5 text-xs font-medium">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
            {selectedImages.length < 3 && (
              <Alert>
                {/* Placeholder for AlertCircle icon */}
                <AlertDescription>
                  Add at least 3 photos for better visibility. Currently{" "}
                  {selectedImages.length} photo(s) selected.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Available Images */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {/* Placeholder for ImageIcon */}
            <Label className="text-sm font-semibold">
              Available Sample Photos
            </Label>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {SAMPLE_IMAGES.map((image) => {
              console.log("Rendering image:", image);
              const isSelected = selectedImages.includes(image);
              return (
                <button
                  key={image}
                  onClick={() => handleImageSelect(image)}
                  className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-primary ring-2 ring-primary ring-offset-2"
                      : "border-muted hover:border-primary/50"
                  }`}
                  type="button"
                >
                  <Image
                    src={image}
                    alt="Room sample"
                    className="object-cover w-full h-full"
                    width={200}
                    height={200}
                  />
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-primary/20"
                        : "bg-black/0 group-hover:bg-black/20"
                    }`}
                  >
                    {isSelected && (
                      <div className="rounded-full bg-primary p-1 text-white hover:bg-primary/80">
                        <X className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {selectedImages.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-muted bg-muted/20 py-8 text-center">
              {/* Placeholder for Upload icon */}
              <p className="text-sm font-medium">
                Select photos from the gallery above
              </p>
              <p className="text-xs text-muted-foreground">
                You can select up to {maxImages} photos
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
