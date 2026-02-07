"use client";

import { useState, useMemo } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { mockRooms } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
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
  Wifi,
  Bath,
  UtensilsCrossed,
  Droplets,
  Car,
  Sofa,
  CheckCircle2,
  ArrowLeft,
  CalendarIcon,
} from "lucide-react";
import { format, addMonths } from "date-fns";
import { cn } from "@/lib/utils";

// Default room images for fallback
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
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();

  const allRooms = useMemo(() => {
    return [...mockRooms, ...postedRooms];
  }, [postedRooms]);

  const room = allRooms.find((r) => r.id === params.id);

  if (!room) {
    notFound();
  }

  const isFavorite = favorites.includes(room.id);

  // Get valid images with fallback
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

  const [showVerificationRequired, setShowVerificationRequired] =
    useState(false);

  const handleBookClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (!user.verified) {
      setShowVerificationRequired(true);
      return;
    }
    // Set default dates
    const today = new Date();
    setCheckInDate(today);
    setCheckOutDate(addMonths(today, 1));
    setShowBookingDialog(true);
  };

  const handleConfirmBooking = () => {
    if (!checkInDate || !checkOutDate || !user) return;

    addBooking({
      roomId: room.id,
      userId: user.id,
      checkIn: checkInDate.toISOString(),
      checkOut: checkOutDate.toISOString(),
      status: "confirmed",
    });

    setBookingConfirmed(true);
  };

  const handleBookingClose = () => {
    setShowBookingDialog(false);
    if (bookingConfirmed) {
      setBookingConfirmed(false);
      router.push("/profile?tab=bookings");
    }
  };

  const facilities = [
    {
      key: "bathroom",
      label: "Private Bathroom",
      icon: Bath,
      available: room.facilities.bathroom,
    },
    {
      key: "kitchen",
      label: "Kitchen",
      icon: UtensilsCrossed,
      available: room.facilities.kitchen,
    },
    { key: "wifi", label: "WiFi", icon: Wifi, available: room.facilities.wifi },
    {
      key: "waterSupply",
      label: "Water Supply",
      icon: Droplets,
      available: room.facilities.waterSupply,
    },
    {
      key: "parking",
      label: "Parking",
      icon: Car,
      available: room.facilities.parking,
    },
    {
      key: "furnished",
      label: "Furnished",
      icon: Sofa,
      available: room.facilities.furnished,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/explore">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Explore
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Image Carousel */}
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

          {/* Room Info */}
          <div className="mt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                </Badge>
                <h1 className="text-2xl font-bold md:text-3xl">{room.title}</h1>
                <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {room.location}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">${room.price}</div>
                <div className="text-muted-foreground">per month</div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold">About this place</h2>
              <p className="mt-2 text-muted-foreground">{room.description}</p>
            </div>

            {/* Facilities */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold">Facilities</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {facilities.map((facility) => (
                  <div
                    key={facility.key}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      facility.available
                        ? "bg-background"
                        : "bg-muted/50 opacity-50"
                    }`}
                  >
                    <facility.icon className="h-5 w-5" />
                    <span className="text-sm">{facility.label}</span>
                    {facility.available && (
                      <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Landlord Card */}
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
                    {room.landlord.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="rounded-xl border p-6">
              <div className="space-y-3">
                <Button className="w-full" size="lg" onClick={handleBookClick}>
                  Book This Room
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
                  Login to book or save this room
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={handleBookingClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bookingConfirmed ? "Booking Confirmed!" : "Confirm Booking"}
            </DialogTitle>
            <DialogDescription>
              {bookingConfirmed
                ? "Your booking has been confirmed successfully."
                : `You are about to book "${room.title}" for $${room.price}/month.`}
            </DialogDescription>
          </DialogHeader>
          {bookingConfirmed ? (
            <div className="flex flex-col items-center py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="mt-4 text-center text-muted-foreground">
                You can view your booking in your profile.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Date Selection */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Check-in Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start bg-transparent text-left font-normal",
                          !checkInDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkInDate
                          ? format(checkInDate, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkInDate}
                        onSelect={setCheckInDate}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Check-out Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start bg-transparent text-left font-normal",
                          !checkOutDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOutDate
                          ? format(checkOutDate, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkOutDate}
                        onSelect={setCheckOutDate}
                        disabled={(date) => date < (checkInDate || new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between">
                  <span>Monthly Rent</span>
                  <span className="font-medium">${room.price}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>Security Deposit</span>
                  <span className="font-medium">${room.price}</span>
                </div>
                <div className="mt-3 border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total Due at Move-in</span>
                    <span>${room.price * 2}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {bookingConfirmed ? (
              <Button onClick={handleBookingClose}>View My Bookings</Button>
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
                  disabled={!checkInDate || !checkOutDate}
                >
                  Confirm Booking
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Prompt Dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              Please login to book rooms or add them to your favorites.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginPrompt(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowLoginPrompt(false)}>
              Go to Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Required Dialog */}
      <Dialog
        open={showVerificationRequired}
        onOpenChange={setShowVerificationRequired}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phone Verification Required</DialogTitle>
            <DialogDescription>
              Please verify your phone number before booking a room. This helps
              us ensure secure transactions.
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
