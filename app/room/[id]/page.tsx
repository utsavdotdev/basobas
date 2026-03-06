"use client";

import { useState, useMemo } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  bathroomTypeLabels,
  getFlatConfigurationLabel,
  normalizeRoom,
  rentalStatusLabels,
  rentalTypeLabels,
  waterFacilityLabels,
  type Room,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Heart,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatNPR } from "@/lib/currency";

const defaultRoomImages = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
];

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    user,
    favorites,
    addFavorite,
    removeFavorite,
    postedRooms,
    addBooking,
  } = useAuth();
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [moveInDate, setMoveInDate] = useState<Date>();
  const [stayDurationMonths, setStayDurationMonths] = useState<number | null>(
    null,
  );
  const [tenantMessage, setTenantMessage] = useState("");
  const [showDuplicateRequestDialog, setShowDuplicateRequestDialog] =
    useState(false);
  const [showVerificationRequired, setShowVerificationRequired] =
    useState(false);

  const allRooms = useMemo(() => {
    return postedRooms
      .map((room) => normalizeRoom(room))
      .filter((room): room is Room => room !== null);
  }, [postedRooms]);

  const roomIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const room = allRooms.find((r) => r.id === roomIdParam);

  if (!room) {
    notFound();
  }

  const isFavorite = favorites.includes(room.id);
  const isLandlordUser = user?.role === "landlord";
  const isAvailableListing = room.status === "available";
  const isListingOwner = user?.id === room.landlord.id;

  const roomImages = useMemo(() => {
    if (
      room.images &&
      room.images.length > 0 &&
      room.images.some((img) => img)
    ) {
      return room.images.filter((img) => img);
    }
    return defaultRoomImages;
  }, [room.images]);

  const handleFavoriteClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (isFavorite) {
      removeFavorite(room.id);
    } else {
      addFavorite(room.id);
    }
  };

  const handleBookClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (isLandlordUser || isListingOwner || !isAvailableListing) {
      return;
    }
    if (!user.verified) {
      setShowVerificationRequired(true);
      return;
    }
    const today = new Date();
    setMoveInDate(today);
    setStayDurationMonths(12);
    setTenantMessage("");
    setShowBookingDialog(true);
  };

  const handleConfirmBooking = () => {
    if (!moveInDate || !stayDurationMonths || !user) return;

    const bookingCreated = addBooking({
      roomId: room.id,
      userId: user.id,
      landlordId: room.landlord.id,
      tenantName: user.name,
      tenantEmail: user.email,
      tenantPhone: user.phone || "",
      tenantMessage: tenantMessage.trim() || undefined,
      moveInDate: moveInDate.toISOString(),
      stayDurationMonths,
    });
    if (!bookingCreated) {
      setShowDuplicateRequestDialog(true);
      return;
    }

    setBookingConfirmed(true);
  };

  const handleBookingClose = () => {
    setShowBookingDialog(false);
    if (bookingConfirmed) {
      setBookingConfirmed(false);
      router.push("/profile?tab=requests");
    }
  };

  const flatConfiguration = getFlatConfigurationLabel(room);
  const listingDetails = [
    ...(room.rental_type === "flat"
      ? [
          {
            label: "Configuration",
            value: flatConfiguration ?? "Flat",
          },
        ]
      : [
          {
            label: "Total Rooms",
            value: String(room.no_of_rooms),
          },
          {
            label: "Kitchen Access",
            value: room.is_kitchen ? "Available" : "Not available",
          },
        ]),
    {
      label: "Bathroom Access",
      value: bathroomTypeLabels[room.bathroom_type],
    },
    {
      label: "Water Supply",
      value: waterFacilityLabels[room.water_facility],
    },
    {
      label: "Listed On",
      value: format(new Date(room.created_at), "PPP"),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/explore">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Explore
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Carousel className="w-full">
            <CarouselContent>
              {roomImages.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${room.title} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>

          <div className="mt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary">
                    {rentalTypeLabels[room.rental_type]}
                  </Badge>
                  <Badge variant="outline">
                    {rentalStatusLabels[room.status]}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold md:text-3xl">{room.title}</h1>
                <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {room.location}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{formatNPR(room.rent)}</div>
                <div className="text-muted-foreground">per month</div>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold">About this rental</h2>
              <p className="mt-2 text-muted-foreground">{room.description}</p>
            </div>

            <div className="mt-8 rounded-2xl border bg-card p-5">
              <h2 className="text-base font-semibold">Rental Details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {listingDetails.map((detail) => (
                  <div key={detail.label} className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {detail.label}
                    </p>
                    <p className="text-sm font-medium">{detail.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-xl border p-6">
              <h2 className="text-lg font-semibold">Listed by</h2>
              <div className="mt-4 flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage
                    src={room.landlord.avatar || "/placeholder.svg"}
                    alt={room.landlord.name}
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {room.landlord.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{room.landlord.name}</span>
                    {room.landlord.verified && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {room.landlord.email || "Email not shared"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-6">
              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBookClick}
                  disabled={isLandlordUser || isListingOwner || !isAvailableListing}
                >
                  {isLandlordUser || isListingOwner
                    ? "Landlords Cannot Book"
                    : !isAvailableListing
                      ? "Listing Not Available"
                      : "Request to Rent"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  size="lg"
                  onClick={handleFavoriteClick}
                >
                  <Heart
                    className={`mr-2 h-5 w-5 ${
                      isFavorite ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                  {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                </Button>
              </div>
              {!user && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Login to request or save this listing.
                </p>
              )}
              {isLandlordUser && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Landlord accounts can only manage listings and incoming tenant
                  requests.
                </p>
              )}
              {!isAvailableListing && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  This listing is currently {rentalStatusLabels[room.status]} and
                  cannot accept new requests.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showBookingDialog} onOpenChange={handleBookingClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bookingConfirmed ? "Request Submitted" : "Send Rental Request"}
            </DialogTitle>
            <DialogDescription>
              {bookingConfirmed
                ? "Your request is now pending landlord review."
                : `Request "${room.title}" for long-term stay at ${formatNPR(room.rent)}/month.`}
            </DialogDescription>
          </DialogHeader>
          {bookingConfirmed ? (
            <div className="flex flex-col items-center py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="mt-4 text-center text-muted-foreground">
                The landlord will approve or reject this request from their
                dashboard. You can track status in your profile.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Preferred Move-in Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start bg-transparent text-left font-normal",
                          !moveInDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {moveInDate ? format(moveInDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={moveInDate}
                        onSelect={setMoveInDate}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Intended Stay</Label>
                  <Select
                    value={stayDurationMonths?.toString()}
                    onValueChange={(value) => setStayDurationMonths(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-message">
                  Message to landlord (optional)
                </Label>
                <Textarea
                  id="tenant-message"
                  value={tenantMessage}
                  onChange={(event) => setTenantMessage(event.target.value)}
                  placeholder="Share your move-in timing and any relevant details."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {tenantMessage.length}/500
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between">
                  <span>Monthly Rent</span>
                  <span className="font-medium">{formatNPR(room.rent)}</span>
                </div>
                <div className="mt-3 border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Estimated Initial Payment</span>
                    <span>{formatNPR(room.rent)}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Your request stays pending until the landlord responds.
              </p>
            </div>
          )}
          <DialogFooter>
            {bookingConfirmed ? (
              <Button onClick={handleBookingClose}>View My Requests</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowBookingDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={!moveInDate || !stayDurationMonths}
                >
                  Submit Request
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              Please login to send rental requests or add listings to your
              favorites.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginPrompt(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowLoginPrompt(false)}>Go to Login</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDuplicateRequestDialog}
        onOpenChange={setShowDuplicateRequestDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Already Exists</DialogTitle>
            <DialogDescription>
              You already have an active request for this listing. Please wait
              for the landlord response or cancel your existing request from
              your profile.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDuplicateRequestDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showVerificationRequired}
        onOpenChange={setShowVerificationRequired}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phone Verification Required</DialogTitle>
            <DialogDescription>
              Please verify your phone number before sending a rental request.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVerificationRequired(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowVerificationRequired(false);
                router.push("/profile");
              }}
            >
              Go to Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
