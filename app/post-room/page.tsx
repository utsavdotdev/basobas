"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  bathroomTypeLabels,
  configurationLabels,
  rentalTypeLabels,
  waterFacilityLabels,
  type Room,
} from "@/lib/mock-data";
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

type FormData = {
  location: string;
  description: string;
  rental_type: Room["rental_type"];
  no_of_rooms: string;
  configuration: Exclude<Room["configuration"], null>;
  config_unit: string;
  rent: string;
  is_kitchen: boolean;
  bathroom_type: Room["bathroom_type"];
  water_facility: Room["water_facility"];
};

const initialFormData: FormData = {
  location: "",
  description: "",
  rental_type: "single_room",
  no_of_rooms: "1",
  configuration: "bhk",
  config_unit: "1",
  rent: "",
  is_kitchen: false,
  bathroom_type: "attached",
  water_facility: "supply_24x7",
};

export default function PostRoomPage() {
  const router = useRouter();
  const { user, addRoom } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const isFlat = formData.rental_type === "flat";
  const isSingleRoom = formData.rental_type === "single_room";
  const isMultipleRoom = formData.rental_type === "multiple_room";

  const clearError = (key: string) => {
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="rounded-full bg-muted p-6">
          <LogIn className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Login Required</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Please login to continue. You&apos;ll need to sign up as a landlord to
          post rental listings.
        </p>
        <Button className="mt-6" onClick={() => router.push("/")}>
          Go to Home
        </Button>
      </div>
    );
  }

  if (user.role !== "landlord") {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Landlord Access Only</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Only landlords can post rental listings. Please sign up as a landlord
          to continue.
        </p>
        <Button className="mt-6" onClick={() => router.push("/explore")}>
          Browse Rentals Instead
        </Button>
      </div>
    );
  }

  if (!user.verified) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <AlertCircle className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Phone Verification Required</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Please verify your phone number before posting a rental.
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

  if (submitted) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Rental Posted Successfully!</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Your rental listing has been saved in Supabase and is now visible to
          tenants.
        </p>
        <div className="mt-8 flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              setFormData(initialFormData);
              setSelectedImages([]);
              setFormErrors({});
            }}
          >
            Post Another Rental
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

    if (!formData.location.trim()) errors.location = "Location is required";

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }

    const rent = Number(formData.rent);
    if (!Number.isFinite(rent) || rent <= 0) {
      errors.rent = "Rent must be greater than 0";
    }

    if (isFlat) {
      const configSize = Number(formData.config_unit);
      if (!Number.isInteger(configSize) || configSize < 1 || configSize > 3) {
        errors.config_unit =
          "Configuration size must be a number between 1 and 3";
      }
    } else if (isSingleRoom) {
      if (Number(formData.no_of_rooms) !== 1) {
        errors.no_of_rooms = "Single room listings must have exactly 1 room";
      }
    } else {
      const roomCount = Number(formData.no_of_rooms);
      if (!Number.isInteger(roomCount) || roomCount <= 1) {
        errors.no_of_rooms =
          "Multiple room listings must have more than 1 room";
      }
    }

    if (selectedImages.length < 3) {
      errors.images = "Please select at least 3 room images";
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    const roomCount = isFlat
      ? Number(formData.config_unit)
      : isSingleRoom
        ? 1
        : Number(formData.no_of_rooms);
    const normalizedRoomCount =
      Number.isInteger(roomCount) && roomCount > 0 ? roomCount : 1;

    const result = await addRoom({
      rental_type: formData.rental_type,
      location: formData.location.trim(),
      description: formData.description.trim(),
      images: selectedImages,
      no_of_rooms: normalizedRoomCount,
      configuration: isFlat ? formData.configuration : null,
      config_unit: isFlat ? normalizedRoomCount : null,
      rent: Number(formData.rent),
      is_kitchen: isFlat ? true : formData.is_kitchen,
      bathroom_type: formData.bathroom_type,
      water_facility: formData.water_facility,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setFormErrors({ submit: result.error });
      return;
    }

    setSubmitted(true);
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
              <h1 className="text-3xl font-bold">Create Rental Listing</h1>
              <p className="text-muted-foreground">
                Publish your rental with details and photos
              </p>
            </div>
          </div>
        </div>

        <Alert className="mb-6 border-blue-200 bg-blue-50/80 backdrop-blur">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            You are posting as a landlord. Listing data and room photos are
            saved in Supabase.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="space-y-6 rounded-2xl border bg-card/90 py-6 shadow-sm">
            <CardHeader>
              <CardTitle>Rental Information</CardTitle>
              <CardDescription>
                Required columns: rental type, location, description, rent,
                bathroom type, water facility, and photos. status is set to
                available by default. configuration and config_unit are required
                only for flat listings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="rental_type">Rental Type *</Label>
                  <Select
                    value={formData.rental_type}
                    onValueChange={(value) => {
                      const rentalType = value as Room["rental_type"];
                      setFormData((prev) => {
                        if (rentalType === "single_room") {
                          return {
                            ...prev,
                            rental_type: rentalType,
                            no_of_rooms: "1",
                            is_kitchen: false,
                          };
                        }

                        if (rentalType === "flat") {
                          return {
                            ...prev,
                            rental_type: rentalType,
                            no_of_rooms: prev.config_unit || "1",
                            is_kitchen: true,
                            configuration: prev.configuration || "bhk",
                            config_unit: prev.config_unit || "1",
                          };
                        }

                        return {
                          ...prev,
                          rental_type: rentalType,
                          no_of_rooms:
                            Number(prev.no_of_rooms) > 1
                              ? prev.no_of_rooms
                              : "2",
                        };
                      });
                      clearError("rental_type");
                      clearError("no_of_rooms");
                      clearError("config_unit");
                      clearError("submit");
                    }}
                  >
                    <SelectTrigger id="rental_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(rentalTypeLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Baneshwor, Kathmandu"
                    value={formData.location}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }));
                      clearError("location");
                      clearError("submit");
                    }}
                    className={formErrors.location ? "border-red-500" : ""}
                  />
                  {formErrors.location && (
                    <p className="text-xs text-red-500">
                      {formErrors.location}
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    rows={5}
                    placeholder="Describe the room, nearby landmarks, included facilities, and any house rules"
                    value={formData.description}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }));
                      clearError("description");
                      clearError("submit");
                    }}
                    className={formErrors.description ? "border-red-500" : ""}
                  />
                  {formErrors.description && (
                    <p className="text-xs text-red-500">
                      {formErrors.description}
                    </p>
                  )}
                </div>

                {isFlat ? (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Configuration *</Label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Select
                        value={formData.configuration}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            configuration: value as FormData["configuration"],
                          }))
                        }
                      >
                        <SelectTrigger id="configuration">
                          <SelectValue placeholder="Select configuration" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(configurationLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>

                      <Select
                        value={formData.config_unit}
                        onValueChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            config_unit: value,
                            no_of_rooms: value,
                          }));
                          clearError("config_unit");
                          clearError("submit");
                        }}
                      >
                        <SelectTrigger id="config_unit">
                          <SelectValue placeholder="Select config unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formErrors.config_unit && (
                      <p className="text-xs text-red-500">
                        {formErrors.config_unit}
                      </p>
                    )}
                  </div>
                ) : (
                  <></>
                )}

                {!isFlat && (
                  <div className="space-y-2">
                    <Label htmlFor="no_of_rooms">No of Rooms *</Label>
                    <Input
                      id="no_of_rooms"
                      type="number"
                      min={isSingleRoom ? "1" : "2"}
                      disabled={isSingleRoom}
                      value={isSingleRoom ? "1" : formData.no_of_rooms}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          no_of_rooms: e.target.value,
                        }));
                        clearError("no_of_rooms");
                        clearError("submit");
                      }}
                      className={formErrors.no_of_rooms ? "border-red-500" : ""}
                    />
                    {formErrors.no_of_rooms && (
                      <p className="text-xs text-red-500">
                        {formErrors.no_of_rooms}
                      </p>
                    )}
                    {isSingleRoom && (
                      <p className="text-xs text-muted-foreground">
                        Single room listings are fixed to 1 room.
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="rent">Rent *</Label>
                  <Input
                    id="rent"
                    type="number"
                    min="1"
                    placeholder="25000"
                    value={formData.rent}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        rent: e.target.value,
                      }));
                      clearError("rent");
                      clearError("submit");
                    }}
                    className={formErrors.rent ? "border-red-500" : ""}
                  />
                  {formErrors.rent && (
                    <p className="text-xs text-red-500">{formErrors.rent}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathroom_type">Bathroom Type *</Label>
                  <Select
                    value={formData.bathroom_type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        bathroom_type: value as Room["bathroom_type"],
                      }))
                    }
                  >
                    <SelectTrigger id="bathroom_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(bathroomTypeLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="water_facility">Water Facility *</Label>
                  <Select
                    value={formData.water_facility}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        water_facility: value as Room["water_facility"],
                      }))
                    }
                  >
                    <SelectTrigger id="water_facility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(waterFacilityLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  {isFlat ? (
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                      Kitchen is included for flat listings.
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 rounded-lg border border-transparent p-3 hover:border-border hover:bg-muted/50">
                      <Checkbox
                        id="is_kitchen"
                        checked={formData.is_kitchen}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            is_kitchen: checked as boolean,
                          }))
                        }
                        className="h-5 w-5"
                      />
                      <label
                        htmlFor="is_kitchen"
                        className="cursor-pointer text-sm font-medium"
                      >
                        Kitchen Access Available
                      </label>
                    </div>
                  )}
                  {!isFlat && isMultipleRoom && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use this to indicate shared or private kitchen access.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <MultiImageUploader
            selectedImages={selectedImages}
            onImagesChange={(images) => {
              setSelectedImages(images);
              clearError("images");
              clearError("submit");
            }}
            maxImages={8}
          />
          {formErrors.images && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formErrors.images}</AlertDescription>
            </Alert>
          )}

          {formErrors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formErrors.submit}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Posting Rental..." : "Post Rental"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
