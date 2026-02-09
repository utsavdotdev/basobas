"use client";

import { CardFooter } from "@/components/ui/card";
import {
  DialogFooter,
  DialogDescription,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  Dialog,
} from "@/components/ui/dialog";
import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth, type Booking } from "@/lib/auth-context";
import { mockRooms, type Room } from "@/lib/mock-data";
import { RoomCard } from "@/components/room-card";
import { PhoneVerification } from "@/components/phone-verification";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  CheckCircle2,
  Phone,
  Mail,
  User,
  Heart,
  Home,
  Plus,
  LogIn,
  Calendar,
  MapPin,
  Clock,
  XCircle,
} from "lucide-react";

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    user,
    favorites,
    postedRooms,
    bookings,
    verifyPhone,
    logout,
    cancelBooking,
  } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);

  const defaultTab = searchParams.get("tab") || "profile";

  const favoriteRooms = useMemo(() => {
    const allRooms = [...mockRooms, ...postedRooms];
    return allRooms.filter((room) => favorites.includes(room.id));
  }, [favorites, postedRooms]);

  // Get booked rooms with their booking details
  const bookedRoomsWithDetails = useMemo(() => {
    const allRooms = [...mockRooms, ...postedRooms];
    return bookings
      .filter((booking) => booking.userId === user?.id)
      .map((booking) => {
        const room = allRooms.find((r) => r.id === booking.roomId);
        return { booking, room };
      })
      .filter(
        (item): item is { booking: Booking; room: Room } =>
          item.room !== undefined,
      );
  }, [bookings, user?.id, postedRooms]);

  const handleVerifyPhone = () => {
    if (phoneNumber.length >= 10) {
      verifyPhone(phoneNumber);
      setVerifyDialogOpen(false);
      setPhoneNumber("");
    }
  };

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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
          Please login to view your profile, favorites, and manage your
          listings.
        </p>
        <Button className="mt-6" onClick={() => router.push("/")}>
          Go to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="mb-8 rounded-xl border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={user.avatar || "/placeholder.svg"}
              alt={user.name}
            />
            <AvatarFallback className="text-2xl">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              {user.verified && (
                <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="flex-wrap space-x-4 h-24">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          {user.role === "tenant" && (
            <>
              <TabsTrigger value="bookings" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">My Bookings</span>
                {bookedRoomsWithDetails.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {bookedRoomsWithDetails.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Favorites</span>
                {favorites.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {favorites.length}
                  </Badge>
                )}
              </TabsTrigger>
            </>
          )}
          {user.role === "landlord" && (
            <TabsTrigger value="listings" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">My Listings</span>
              {postedRooms.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {postedRooms.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-6">
            {/* Phone Verification for All Users */}
            <PhoneVerification
              isVerified={user.verified}
              onVerify={verifyPhone}
            />

            {/* Account Information */}
            <div className="rounded-xl border p-6">
              <h2 className="text-lg font-semibold">Account Information</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="mt-1 font-medium">{user.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="mt-1 font-medium">{user.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Account Type</Label>
                  <p className="mt-1 font-medium capitalize">{user.role}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Verification Status
                  </Label>
                  <p className="mt-1 font-medium">
                    {user.verified ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Verified
                      </span>
                    ) : (
                      "Not verified"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {user.role === "tenant" && (
          <>
            <TabsContent value="bookings">
              {bookedRoomsWithDetails.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {bookedRoomsWithDetails.map(({ booking, room }) => (
                    <Card key={booking.id} className="overflow-hidden">
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={
                            room.images[0] ||
                            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80"
                          }
                          alt={room.title}
                          fill
                          className="object-cover"
                        />
                        <Badge
                          className={`absolute right-3 top-3 ${getStatusColor(booking.status)}`}
                        >
                          {booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)}
                        </Badge>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="line-clamp-1 text-lg">
                          {room.title}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {room.location}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pb-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Check-in
                          </div>
                          <span className="font-medium">
                            {formatDate(booking.checkIn)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Check-out
                          </div>
                          <span className="font-medium">
                            {formatDate(booking.checkOut)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            Booked on
                          </div>
                          <span className="font-medium">
                            {formatDate(booking.createdAt)}
                          </span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Monthly Rate
                            </span>
                            <span className="text-lg font-bold">
                              ${room.price}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2 border-t pt-4">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                        >
                          <Link href={`/room/${room.id}`}>View Room</Link>
                        </Button>
                        {(booking.status === "pending" ||
                          booking.status === "confirmed") && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Cancel Booking
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this booking?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  Keep Booking
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelBooking(booking.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Yes, Cancel
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    No bookings yet
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {"You haven't booked any rooms yet. Start exploring!"}
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/explore">Explore Rooms</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites">
              {favoriteRooms.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {favoriteRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <Heart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    No favorites yet
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Start exploring and save rooms you like!
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/explore">Explore Rooms</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
          </>
        )}

        {user.role === "landlord" && (
          <TabsContent value="listings">
            <div className="space-y-6">
              {/* Post New Room Button */}
              <div className="flex justify-between items-center rounded-lg border border-dashed bg-muted/30 p-4">
                <div>
                  <h3 className="font-semibold">Ready to list another room?</h3>
                  <p className="text-sm text-muted-foreground">
                    Post a new room listing in just a few minutes
                  </p>
                </div>
                <Button asChild>
                  <Link href="/post-room">
                    <Plus className="mr-2 h-4 w-4" />
                    Post a Room
                  </Link>
                </Button>
              </div>

              {/* Listings Grid */}
              {postedRooms.length > 0 ? (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      My Listings ({postedRooms.length})
                    </h3>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {postedRooms.map((room) => (
                        <RoomCard key={room.id} room={room} />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <Home className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    No listings yet
                  </h3>
                  <p className="mt-2 max-w-sm text-muted-foreground">
                    You haven't posted any rooms yet. Click the button above to
                    create your first listing!
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/post-room">
                      <Plus className="mr-2 h-4 w-4" />
                      Post Your First Room
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}
    >
      <ProfileContent />
    </Suspense>
  );
}
