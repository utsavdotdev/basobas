"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { Room } from "@/lib/mock-data";
import { MultiImageUploader } from "@/components/multi-image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, AlertCircle, CheckCircle2, Home } from "lucide-react";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80";

export default function PostRoomPage() {
  const router = useRouter();
  const { user, addRoom } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    type: "single" as Room["type"],
    bathroom: false,
    kitchen: false,
    wifi: false,
    waterSupply: false,
    parking: false,
    furnished: false,
  });

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="rounded-full bg-muted p-6">
          <LogIn className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Login Required</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Please login to continue. You'll need to sign up as a landlord to post
          rooms.
        </p>
        <Button className="mt-6" onClick={() => router.push("/")}>
          Go to Home
        </Button>
      </div>
    );
  }

  // Restrict to landlords only
  if (user.role !== "landlord") {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Landlord Access Only</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Only landlords can post room listings. Please sign up as a landlord to
          continue.
        </p>
        <Button className="mt-6" onClick={() => router.push("/explore")}>
          Browse Rooms Instead
        </Button>
      </div>
    );
  }

  // Require phone verification
  if (!user.verified) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <AlertCircle className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Phone Verification Required</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Please verify your phone number before posting a room. This helps
          build trust with potential tenants.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button onClick={() => router.push("/profile")}>Verify Phone</Button>
        </div>
      </div>
    );
  }

  // Success screen
  if (submitted) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Room Posted Successfully!</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Your room listing is now live and visible to potential tenants. You
          can post more rooms or view your listings.
        </p>
        <div className="mt-8 flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              setFormData({
                title: "",
                description: "",
                price: "",
                location: "",
                type: "single",
                bathroom: false,
                kitchen: false,
                wifi: false,
                waterSupply: false,
                parking: false,
                furnished: false,
              });
              setSelectedImages([]);
            }}
          >
            Post Another Room
          </Button>
          <Button onClick={() => router.push("/profile?tab=listings")}>
            View My Listings
          </Button>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) errors.title = "Room title is required";
    if (!formData.description.trim())
      errors.description = "Description is required";
    if (!formData.price || Number(formData.price) <= 0)
      errors.price = "Valid price is required";
    if (!formData.location.trim()) errors.location = "Location is required";
    if (selectedImages.length === 0)
      errors.images = "Please select at least 1 image";
    if (selectedImages.length < 3)
      errors.images = "Please select at least 3 images for better visibility";

    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    // Simulate submission delay
    setTimeout(() => {
      const newRoom: Room = {
        id: `user_${Date.now()}`,
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        location: formData.location,
        images: selectedImages.length > 0 ? selectedImages : [DEFAULT_IMAGE],
        type: formData.type,
        facilities: {
          bathroom: formData.bathroom,
          kitchen: formData.kitchen,
          wifi: formData.wifi,
          waterSupply: formData.waterSupply,
          parking: formData.parking,
          furnished: formData.furnished,
        },
        landlord: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          verified: user.verified,
        },
        createdAt: new Date().toISOString().split("T")[0],
      };

      addRoom(newRoom);
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Home className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Post a Room</h1>
              <p className="text-muted-foreground">
                Fill in the details to list your room for rent
              </p>
            </div>
          </div>
        </div>

        {/* Landlord Badge */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            You are posting as a landlord. This listing will be visible to all
            tenants searching for rooms.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="py-6 space-y-6">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide the main details about your room
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Room Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Spacious Studio with Natural Light"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (formErrors.title) delete formErrors.title;
                  }}
                  className={formErrors.title ? "border-red-500" : ""}
                />
                {formErrors.title && (
                  <p className="text-xs text-red-500">{formErrors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your room, its features, size, amenities, and neighborhood highlights..."
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (formErrors.description) delete formErrors.description;
                  }}
                  rows={5}
                  className={formErrors.description ? "border-red-500" : ""}
                />
                {formErrors.description && (
                  <p className="text-xs text-red-500">
                    {formErrors.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Be detailed to attract more tenants
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Monthly Rent (Rupees) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="1500"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({ ...formData, price: e.target.value });
                      if (formErrors.price) delete formErrors.price;
                    }}
                    className={formErrors.price ? "border-red-500" : "h-12"}
                    min="1"
                  />
                  {formErrors.price && (
                    <p className="text-xs text-red-500">{formErrors.price}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Room Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as Room["type"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Room</SelectItem>
                      <SelectItem value="double">Double Room</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Downtown Seattle, WA"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    if (formErrors.location) delete formErrors.location;
                  }}
                  className={formErrors.location ? "border-red-500" : ""}
                />
                {formErrors.location && (
                  <p className="text-xs text-red-500">{formErrors.location}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Multi-Image Uploader */}
          <MultiImageUploader
            selectedImages={selectedImages}
            onImagesChange={setSelectedImages}
            maxImages={5}
          />

          {formErrors.images && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formErrors.images}</AlertDescription>
            </Alert>
          )}

          {/* Facilities & Amenities */}
          <Card className="py-6">
            <CardHeader>
              <CardTitle>Facilities & Amenities</CardTitle>
              <CardDescription>
                Select all amenities available in your room
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { id: "bathroom", label: "Private Bathroom" },
                  { id: "kitchen", label: "Kitchen Access" },
                  { id: "wifi", label: "WiFi Internet" },
                  { id: "waterSupply", label: "24/7 Water Supply" },
                  { id: "parking", label: "Parking Space" },
                  { id: "furnished", label: "Fully Furnished" },
                ].map((facility) => (
                  <div
                    key={facility.id}
                    className="flex items-center space-x-3 rounded-lg border border-transparent p-3 hover:border-border hover:bg-muted/50"
                  >
                    <Checkbox
                      id={facility.id}
                      checked={
                        formData[
                          facility.id as keyof typeof formData
                        ] as boolean
                      }
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          [facility.id]: checked as boolean,
                        })
                      }
                      className="h-5 w-5"
                    />
                    <label
                      htmlFor={facility.id}
                      className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-medium"
                    >
                      {facility.label}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !user}
            >
              {isSubmitting ? "Posting Room..." : "Post Room"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
