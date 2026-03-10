"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsUrlFromCoordinates,
  extractCoordinatesFromGoogleMapsUrl,
  normalizeGoogleMapsUrl,
} from "@/lib/google-maps";
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
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Home,
  LoaderCircle,
  LocateFixed,
  LogIn,
  MapPinned,
} from "lucide-react";

type FormData = {
  location: string;
  google_maps_url: string;
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
  google_maps_url: "",
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

type MapPinNotice = {
  kind: "success" | "error";
  message: string;
};

function PostRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, postedRooms, addRoom, updateRoom } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [mapPinNotice, setMapPinNotice] = useState<MapPinNotice | null>(null);
  const [isLocatingPin, setIsLocatingPin] = useState(false);
  const [didHydrateEditForm, setDidHydrateEditForm] = useState(false);
  const isFlat = formData.rental_type === "flat";
  const isSingleRoom = formData.rental_type === "single_room";
  const isMultipleRoom = formData.rental_type === "multiple_room";
  const normalizedGoogleMapsUrl = useMemo(
    () => normalizeGoogleMapsUrl(formData.google_maps_url),
    [formData.google_maps_url],
  );
  const selectedMapCoordinates = useMemo(
    () => extractCoordinatesFromGoogleMapsUrl(formData.google_maps_url),
    [formData.google_maps_url],
  );
  const mapPreviewUrl = useMemo(() => {
    if (!selectedMapCoordinates) {
      return null;
    }

    return buildGoogleMapsEmbedUrl(
      selectedMapCoordinates.latitude,
      selectedMapCoordinates.longitude,
    );
  }, [selectedMapCoordinates]);
  const editRoomId = searchParams.get("edit");
  const isEditMode = Boolean(editRoomId);
  const editingRoom = useMemo(() => {
    if (!editRoomId || !user) {
      return null;
    }

    return (
      postedRooms.find(
        (room) => room.rental_id === editRoomId && room.user_id === user.id,
      ) ?? null
    );
  }, [editRoomId, postedRooms, user]);

  const clearError = (key: string) => {
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isEditMode || !editingRoom || didHydrateEditForm) {
      return;
    }

    setFormData({
      location: editingRoom.location,
      google_maps_url: editingRoom.google_maps_url,
      description: editingRoom.description,
      rental_type: editingRoom.rental_type,
      no_of_rooms: String(editingRoom.no_of_rooms),
      configuration: editingRoom.configuration ?? "bhk",
      config_unit: String(editingRoom.config_unit ?? editingRoom.no_of_rooms),
      rent: String(editingRoom.rent),
      is_kitchen: editingRoom.is_kitchen,
      bathroom_type: editingRoom.bathroom_type,
      water_facility: editingRoom.water_facility,
    });
    setSelectedImages(editingRoom.images);
    setDidHydrateEditForm(true);
  }, [didHydrateEditForm, editingRoom, isEditMode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (
      !isEditMode ||
      !editingRoom?.google_maps_url ||
      formData.google_maps_url.trim()
    ) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      google_maps_url: editingRoom.google_maps_url,
    }));
  }, [editingRoom?.google_maps_url, formData.google_maps_url, isEditMode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setMapPinNotice({
        kind: "error",
        message:
          "Browser location is not available on this device. Paste a Google Maps link instead.",
      });
      return;
    }

    setIsLocatingPin(true);
    setMapPinNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const generatedUrl = buildGoogleMapsUrlFromCoordinates(
          position.coords.latitude,
          position.coords.longitude,
        );

        if (!generatedUrl) {
          setMapPinNotice({
            kind: "error",
            message:
              "The detected coordinates were invalid. Please try again or paste a Google Maps link.",
          });
          setIsLocatingPin(false);
          return;
        }

        setFormData((prev) => ({
          ...prev,
          google_maps_url: generatedUrl,
        }));
        clearError("google_maps_url");
        clearError("submit");
        setMapPinNotice({
          kind: "success",
          message:
            "Exact pin captured from your current browser location. Review the preview, then save the listing.",
        });
        setIsLocatingPin(false);
      },
      (error: GeolocationPositionError) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Allow access and try again, or paste a Google Maps link."
            : error.code === error.TIMEOUT
              ? "Location detection timed out. Move closer to the property and try again."
              : "Unable to detect your current location. Check device location services and try again.";

        setMapPinNotice({
          kind: "error",
          message,
        });
        setIsLocatingPin(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
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

  if (isEditMode && didHydrateEditForm && !editingRoom) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Listing Not Found</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          This rental could not be found or does not belong to your landlord
          account.
        </p>
        <Button
          className="mt-6"
          onClick={() => router.push("/profile?tab=listings")}
        >
          Go to My Listings
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">
          {isEditMode ? "Rental Updated Successfully!" : "Rental Posted Successfully!"}
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          {isEditMode
            ? "Your rental listing has been updated in Supabase."
            : "Your rental listing has been saved in Supabase and is now visible to tenants."}
        </p>
        <div className="mt-8 flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              setFormErrors({});
              setMapPinNotice(null);
              if (isEditMode) {
                setDidHydrateEditForm(false);
              } else {
                setFormData(initialFormData);
                setSelectedImages([]);
              }
            }}
          >
            {isEditMode ? "Continue Editing" : "Post Another Rental"}
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

    if (
      formData.google_maps_url.trim() &&
      !normalizeGoogleMapsUrl(formData.google_maps_url)
    ) {
      errors.google_maps_url = "Please enter a valid Google Maps share URL";
    }

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

    const roomPayload = {
      rental_type: formData.rental_type,
      location: formData.location.trim(),
      google_maps_url: formData.google_maps_url.trim(),
      description: formData.description.trim(),
      images: selectedImages,
      no_of_rooms: normalizedRoomCount,
      configuration: isFlat ? formData.configuration : null,
      config_unit: isFlat ? normalizedRoomCount : null,
      rent: Number(formData.rent),
      is_kitchen: isFlat ? true : formData.is_kitchen,
      bathroom_type: formData.bathroom_type,
      water_facility: formData.water_facility,
    };
    const result =
      isEditMode && editRoomId
        ? await updateRoom(editRoomId, roomPayload)
        : await addRoom(roomPayload);

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
              <h1 className="text-3xl font-bold">
                {isEditMode ? "Edit Rental Listing" : "Create Rental Listing"}
              </h1>
              <p className="text-muted-foreground">
                {isEditMode
                  ? "Update your rental details and photos"
                  : "Publish your rental with details and photos"}
              </p>
            </div>
          </div>
        </div>

        <Alert className="mb-6 border-blue-200 bg-blue-50/80 backdrop-blur">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            {isEditMode
              ? "You are updating this listing as a landlord. Changes are saved directly in Supabase."
              : "You are posting as a landlord. Listing data and room photos are saved in Supabase."}
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
                  <p className="text-xs text-muted-foreground">
                    This is the public area tenants see. Use the private map pin
                    below for the exact location.
                  </p>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="google_maps_url">
                        Google Maps Pin (Optional)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        This stays private. Tenants only see it if you
                        explicitly share it from an approved request.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocatingPin}
                    >
                      {isLocatingPin ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <LocateFixed />
                      )}
                      {isLocatingPin ? "Locating..." : "Use Current Location"}
                    </Button>
                  </div>
                  <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      If you are standing at the property, allow browser
                      location access and BasoBas will create the exact Google
                      Maps pin for you automatically.
                    </p>
                    <Input
                      id="google_maps_url"
                      placeholder="Paste a Google Maps share link, or use current location"
                      value={formData.google_maps_url}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          google_maps_url: e.target.value,
                        }));
                        setMapPinNotice(null);
                        clearError("google_maps_url");
                        clearError("submit");
                      }}
                      className={
                        formErrors.google_maps_url ? "border-red-500" : ""
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      {normalizedGoogleMapsUrl ? (
                        <Button asChild variant="secondary" size="sm">
                          <a
                            href={normalizedGoogleMapsUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink />
                            Open in Google Maps
                          </a>
                        </Button>
                      ) : null}
                      {formData.google_maps_url.trim() ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              google_maps_url: "",
                            }));
                            setMapPinNotice(null);
                            clearError("google_maps_url");
                            clearError("submit");
                          }}
                        >
                          Clear Pin
                        </Button>
                      ) : null}
                    </div>
                    {mapPinNotice ? (
                      <Alert
                        className={
                          mapPinNotice.kind === "error"
                            ? "border-red-200 bg-red-50/80"
                            : "border-emerald-200 bg-emerald-50/80"
                        }
                      >
                        {mapPinNotice.kind === "error" ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                        <AlertDescription
                          className={
                            mapPinNotice.kind === "error"
                              ? "text-red-900"
                              : "text-emerald-900"
                          }
                        >
                          {mapPinNotice.message}
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    {mapPreviewUrl && selectedMapCoordinates ? (
                      <div className="overflow-hidden rounded-lg border bg-background">
                        <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <MapPinned className="h-4 w-4 text-primary" />
                            Exact Pin Preview
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {selectedMapCoordinates.latitude.toFixed(6)},{" "}
                            {selectedMapCoordinates.longitude.toFixed(6)}
                          </p>
                        </div>
                        <iframe
                          title="Google Maps pin preview"
                          src={mapPreviewUrl}
                          className="h-64 w-full border-0"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    ) : null}
                  </div>
                  {formErrors.google_maps_url && (
                    <p className="text-xs text-red-500">
                      {formErrors.google_maps_url}
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
              {isSubmitting
                ? isEditMode
                  ? "Saving Changes..."
                  : "Posting Rental..."
                : isEditMode
                  ? "Save Changes"
                  : "Post Rental"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PostRoomPage() {
  return (
    <Suspense
      fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}
    >
      <PostRoomContent />
    </Suspense>
  );
}
