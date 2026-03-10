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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Pencil,
  RotateCcw,
  Trash2,
  Home,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatNPR } from "@/lib/currency";
import { ENABLE_BOOKING_REQUESTS, ENABLE_FAVORITES } from "@/lib/launch-flags";

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
    bookings,
    addBooking,
    updateRoomStatus,
    deleteRoom,
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
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [ownerActionError, setOwnerActionError] = useState<string | null>(null);
  const [ownerAction, setOwnerAction] = useState<
    "available" | "inactive" | "delete" | null
  >(null);
  const [isNavigatingAfterDelete, setIsNavigatingAfterDelete] = useState(false);

  const allRooms = useMemo(() => {
    return postedRooms
      .map((room) => normalizeRoom(room))
      .filter((room): room is Room => room !== null);
  }, [postedRooms]);

  const roomIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const room = allRooms.find((r) => r.id === roomIdParam);

  if (isNavigatingAfterDelete) {
    return null;
  }

  if (!room) {
    notFound();
  }

  const isFavorite = favorites.includes(room.id);
  const isLandlordUser = user?.role === "landlord";
  const canUseFavorites =
    ENABLE_FAVORITES && (!user || user.role === "tenant");
  const isAvailableListing = room.status === "available";
  const isListingOwner = user?.id === room.landlord.id;
  const activeBookingForRoom = bookings.find(
    (booking) =>
      booking.roomId === room.id &&
      booking.userId === user?.id &&
      (booking.status === "pending" || booking.status === "approved"),
  );
  const bookingButtonLabel =
    isListingOwner
      ? "You Own This Listing"
      : isLandlordUser
        ? "Landlords Cannot Request Rentals"
      : activeBookingForRoom?.status === "pending"
        ? "Request Pending"
      : activeBookingForRoom?.status === "approved"
        ? "Request Approved"
      : !ENABLE_BOOKING_REQUESTS
        ? "Booking Request Coming Soon"
        : !isAvailableListing
          ? "Listing Not Available"
          : "Request to Rent";
  const guestActionHint =
    ENABLE_BOOKING_REQUESTS && ENABLE_FAVORITES
      ? "Login to request or save this listing."
      : ENABLE_FAVORITES
        ? "Login to save this listing."
        : ENABLE_BOOKING_REQUESTS
          ? "Login to request this listing."
          : "Login to continue.";

  const roomImages =
    room.images && room.images.length > 0 && room.images.some((img) => img)
      ? room.images.filter((img) => img)
      : defaultRoomImages;

  const handleFavoriteClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (!ENABLE_FAVORITES) {
      return;
    }
    if (user.role === "landlord") {
      return;
    }
    if (isFavorite) {
      removeFavorite(room.id);
    } else {
      addFavorite(room.id);
    }
  };

  const handleBookClick = () => {
    if (!ENABLE_BOOKING_REQUESTS) {
      return;
    }
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (
      isLandlordUser ||
      isListingOwner ||
      !isAvailableListing ||
      activeBookingForRoom
    ) {
      return;
    }
    if (!user.verified) {
      setShowVerificationRequired(true);
      return;
    }
    const today = new Date();
    setBookingError(null);
    setBookingConfirmed(false);
    setMoveInDate(today);
    setStayDurationMonths(12);
    setTenantMessage("");
    setShowBookingDialog(true);
  };

  const handleConfirmBooking = async () => {
    if (!moveInDate || !stayDurationMonths || !user) return;

    setBookingError(null);
    setIsSubmittingBooking(true);

    const bookingResult = await addBooking({
      roomId: room.id,
      userId: user.id,
      landlordId: room.landlord.id,
      tenantName: user.name,
      tenantEmail: user.email,
      tenantPhone: user.phone || "",
      tenantMessage: tenantMessage.trim() || undefined,
      moveInDate: format(moveInDate, "yyyy-MM-dd"),
      stayDurationMonths,
    });

    setIsSubmittingBooking(false);

    if (!bookingResult.success) {
      if (bookingResult.code === "duplicate") {
        setShowDuplicateRequestDialog(true);
        return;
      }

      setBookingError(bookingResult.error);
      return;
    }

    setBookingConfirmed(true);
  };

  const handleBookingClose = () => {
    setShowBookingDialog(false);
    setBookingError(null);
    setIsSubmittingBooking(false);
    if (bookingConfirmed) {
      setBookingConfirmed(false);
      router.push("/profile?tab=requests");
    }
  };

  const handleOwnerStatusChange = async (
    nextStatus: Extract<Room["status"], "available" | "inactive">,
  ) => {
    setOwnerActionError(null);
    setOwnerAction(nextStatus);

    const result = await updateRoomStatus(room.rental_id, nextStatus);

    setOwnerAction(null);

    if (!result.success) {
      setOwnerActionError(result.error);
    }
  };

  const handleOwnerDelete = async () => {
    setOwnerActionError(null);
    setOwnerAction("delete");

    const result = await deleteRoom(room.rental_id);

    if (!result.success) {
      setOwnerAction(null);
      setOwnerActionError(result.error);
      return;
    }

    setIsNavigatingAfterDelete(true);
    router.replace("/profile?tab=listings");
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
                  {room.landlord.email ? (
                    <a
                      href={`mailto:${room.landlord.email}`}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {room.landlord.email}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Contact details unavailable
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-6">
              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBookClick}
                  disabled={
                    !ENABLE_BOOKING_REQUESTS ||
                    isLandlordUser ||
                    isListingOwner ||
                    !isAvailableListing ||
                    Boolean(activeBookingForRoom)
                  }
                >
                  {bookingButtonLabel}
                </Button>
                {canUseFavorites && (
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
                )}
              </div>
              {!user && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {guestActionHint}
                </p>
              )}
              {isListingOwner && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Use the management panel below to edit, pause, reactivate, or
                  delete this listing.
                </p>
              )}
              {isLandlordUser && !isListingOwner && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Landlord accounts cannot send rental requests. Review incoming
                  tenant requests from your profile.
                </p>
              )}
              {activeBookingForRoom?.status === "pending" && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  You already have a pending request for this rental. Track it
                  from your profile requests tab.
                </p>
              )}
              {activeBookingForRoom?.status === "approved" && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Your request for this rental has already been approved.
                </p>
              )}
              {!ENABLE_BOOKING_REQUESTS && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Booking request workflow is temporarily disabled for launch.
                </p>
              )}
              {!isAvailableListing && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  This listing is currently {rentalStatusLabels[room.status]} and
                  cannot accept new requests.
                </p>
              )}
            </div>

            {isListingOwner && (
              <div className="rounded-xl border p-6">
                <h2 className="text-lg font-semibold">Manage listing</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {room.status === "rented"
                    ? "This room is marked as rented. Make it available again after the tenant moves out."
                    : room.status === "inactive"
                      ? "This listing is hidden from tenants until you reactivate it."
                      : "Keep the listing details current or pause it temporarily."}
                </p>

                {ownerActionError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{ownerActionError}</AlertDescription>
                  </Alert>
                )}

                <div className="mt-4 space-y-3">
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href={`/post-room?edit=${room.rental_id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Listing
                    </Link>
                  </Button>

                  {room.status === "available" ? (
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      disabled={ownerAction !== null}
                      onClick={() => void handleOwnerStatusChange("inactive")}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      {ownerAction === "inactive" ? "Pausing..." : "Mark Inactive"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      disabled={ownerAction !== null}
                      onClick={() => void handleOwnerStatusChange("available")}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {ownerAction === "available"
                        ? "Updating..."
                        : "Make Available"}
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full"
                        disabled={ownerAction !== null}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Listing
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes the rental and its related
                          requests. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Listing</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void handleOwnerDelete()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {ownerAction === "delete"
                            ? "Deleting..."
                            : "Delete Listing"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
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

              {bookingError && (
                <Alert variant="destructive">
                  <AlertDescription>{bookingError}</AlertDescription>
                </Alert>
              )}
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
                  disabled={
                    isSubmittingBooking || !moveInDate || !stayDurationMonths
                  }
                >
                  {isSubmittingBooking ? "Submitting..." : "Submit Request"}
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
              Please login to continue.
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
