"use client";

import { CardFooter } from "@/components/ui/card";
import { useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, type Booking } from "@/lib/auth-context";
import { mockRooms, type Room } from "@/lib/mock-data";
import { RoomCard } from "@/components/room-card";
import { PhoneVerification } from "@/components/phone-verification";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  User,
  Heart,
  Home,
  Plus,
  LogIn,
  Calendar,
  Check,
  X,
  XCircle,
  ArrowUpRight,
  MessageSquare,
  PhoneCall,
} from "lucide-react";

type RequestWithRoom = {
  booking: Booking;
  room: Room;
  isDemo?: boolean;
};

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
    updateBookingStatus,
  } = useAuth();

  const selectedTab = searchParams.get("tab");
  const defaultTab =
    selectedTab === "bookings" ? "requests" : selectedTab || "profile";

  const favoriteRooms = useMemo(() => {
    const allRooms = [...mockRooms, ...postedRooms];
    return allRooms.filter((room) => favorites.includes(room.id));
  }, [favorites, postedRooms]);

  const hardcodedLandlordListings = useMemo(() => {
    if (!user || user.role !== "landlord") return [];

    return mockRooms.slice(0, 3).map((room) => ({
      ...room,
      landlord: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        verified: user.verified,
      },
    }));
  }, [user]);

  const landlordListings =
    postedRooms.length > 0 ? postedRooms : hardcodedLandlordListings;

  const tenantRequestsWithRoom = useMemo(() => {
    const allRooms = [...mockRooms, ...postedRooms];
    return bookings
      .filter((booking) => booking.userId === user?.id)
      .map((booking) => {
        let room = allRooms.find((r) => r.id === booking.roomId);
        if (!room && booking.roomId.startsWith("hardcoded_landlord_listing_")) {
          const legacyIndex = Number(booking.roomId.split("_").pop());
          if (!Number.isNaN(legacyIndex) && legacyIndex > 0) {
            room = mockRooms[legacyIndex - 1];
          }
        }
        return { booking, room };
      })
      .filter(
        (item): item is RequestWithRoom =>
          item.room !== undefined,
      );
  }, [bookings, user?.id, postedRooms]);

  const incomingRequestsWithRoom = useMemo(() => {
    const allRooms = [...mockRooms, ...postedRooms];
    const landlordRoomIds = new Set(
      allRooms.filter((room) => room.landlord.id === user?.id).map((room) => room.id),
    );

    return bookings
      .filter((booking) => landlordRoomIds.has(booking.roomId))
      .map((booking) => {
        const room = allRooms.find((r) => r.id === booking.roomId);
        return { booking, room };
      })
      .filter(
        (item): item is RequestWithRoom =>
          item.room !== undefined,
      );
  }, [bookings, postedRooms, user?.id]);

  const demoIncomingRequests = useMemo(() => {
    if (!user || user.role !== "landlord" || incomingRequestsWithRoom.length > 0) {
      return [];
    }

    return landlordListings.slice(0, 2).map((room, index) => {
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - (index + 1));
      const status = index === 0 ? "pending" : "approved";

      return {
        isDemo: true,
        room,
        booking: {
          id: `demo_request_${index + 1}`,
          roomId: room.id,
          userId: `demo_tenant_${index + 1}`,
          landlordId: user.id,
          tenantName: index === 0 ? "Anita Sharma" : "Rajan Karki",
          tenantEmail:
            index === 0 ? "anita.tenant@example.com" : "rajan.tenant@example.com",
          tenantPhone: index === 0 ? "+1 (555) 120-3400" : "+1 (555) 998-7712",
          tenantMessage:
            index === 0
              ? "I work nearby and can move in next month. Looking for a quiet place."
              : "I plan to stay long term and can provide references if needed.",
          moveInDate: new Date(
            createdDate.getFullYear(),
            createdDate.getMonth() + 1,
            1,
          ).toISOString(),
          stayDurationMonths: index === 0 ? 12 : 6,
          status,
          createdAt: createdDate.toISOString(),
          reviewedAt: status === "approved" ? new Date().toISOString() : undefined,
        },
      } satisfies RequestWithRoom;
    });
  }, [incomingRequestsWithRoom.length, landlordListings, user]);

  const landlordRequestsToDisplay =
    incomingRequestsWithRoom.length > 0
      ? incomingRequestsWithRoom
      : demoIncomingRequests;

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "cancelled":
        return "bg-slate-200 text-slate-700";
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

  const formatDuration = (months: number) => {
    if (months === 1) return "1 month";
    return `${months} months`;
  };

  const getDialablePhone = (phone: string) => phone.replace(/[^\d+]/g, "");

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
        <TabsList className="h-auto w-full flex-wrap gap-2">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          {user.role === "tenant" && (
            <>
              <TabsTrigger value="requests" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">My Requests</span>
                {tenantRequestsWithRoom.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {tenantRequestsWithRoom.length}
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
            <>
              <TabsTrigger value="requests" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Incoming Requests</span>
                {landlordRequestsToDisplay.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {landlordRequestsToDisplay.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="listings" className="gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">My Listings</span>
                {landlordListings.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {landlordListings.length}
                  </Badge>
                )}
              </TabsTrigger>
            </>
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
            <TabsContent value="requests">
              {tenantRequestsWithRoom.length > 0 ? (
                <div className="mx-auto max-w-3xl space-y-3">
                  {tenantRequestsWithRoom.map(({ booking, room }) => (
                    <Card
                      key={booking.id}
                      className="border-border/70 bg-card/90 shadow-sm"
                    >
                      <CardContent className="space-y-3 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-1">
                              <Link
                                href={`/room/${booking.roomId}`}
                                className="truncate text-sm font-semibold hover:text-primary"
                              >
                                {room.title}
                              </Link>
                              <Link
                                href={`/room/${booking.roomId}`}
                                className="text-muted-foreground transition-colors hover:text-primary"
                                aria-label={`Open ${room.title}`}
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {room.location}
                            </p>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status.charAt(0).toUpperCase() +
                              booking.status.slice(1)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div className="rounded-md border bg-muted/20 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Move-in
                            </p>
                            <p className="text-sm font-medium">
                              {formatDate(booking.moveInDate)}
                            </p>
                          </div>
                          <div className="rounded-md border bg-muted/20 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Stay Duration
                            </p>
                            <p className="text-sm font-medium">
                              {formatDuration(booking.stayDurationMonths)}
                            </p>
                          </div>
                          <div className="rounded-md border bg-muted/20 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Requested
                            </p>
                            <p className="text-sm font-medium">
                              {formatDate(booking.createdAt)}
                            </p>
                          </div>
                        </div>

                        {booking.reviewMessage && (
                          <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                            {booking.reviewMessage}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex flex-wrap justify-end gap-2 px-4 pb-4 pt-0">
                        <Button asChild variant="outline" size="sm" className="h-8">
                          <Link href={`/room/${booking.roomId}`}>View Room</Link>
                        </Button>
                        {(booking.status === "pending" ||
                          booking.status === "approved") && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 px-3"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Cancel Rental Request
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this request?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  Keep Request
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
                    No requests yet
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {
                      "You have not sent any long-term rental requests yet. Start exploring!"
                    }
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
          <>
            <TabsContent value="requests">
              {landlordRequestsToDisplay.length > 0 ? (
                <div className="mx-auto max-w-5xl space-y-3">
                  {landlordRequestsToDisplay.map(
                    ({ booking, room, isDemo }) => (
                      <Card
                        key={booking.id}
                        className="border-border/70 shadow-sm"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1 space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  className={getStatusColor(booking.status)}
                                >
                                  {booking.status.charAt(0).toUpperCase() +
                                    booking.status.slice(1)}
                                </Badge>
                                {isDemo && (
                                  <Badge variant="secondary" className="w-fit">
                                    Demo request
                                  </Badge>
                                )}
                              </div>

                              <Link
                                href={`/room/${room.id}`}
                                className="block text-base font-semibold leading-tight hover:text-primary"
                              >
                                {room.title}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                {room.location}
                              </p>

                              <div className="grid gap-2 sm:grid-cols-2">
                                <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                                  <p className="font-medium">
                                    {booking.tenantName}
                                  </p>
                                  <p className="truncate text-muted-foreground">
                                    {booking.tenantEmail}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {booking.tenantPhone || "No phone shared"}
                                  </p>
                                </div>
                                <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                                  <p className="font-medium">
                                    Move-in {formatDate(booking.moveInDate)}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {formatDuration(booking.stayDurationMonths)}{" "}
                                    stay
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Requested {formatDate(booking.createdAt)}
                                  </p>
                                </div>
                              </div>

                              {booking.tenantMessage && (
                                <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground/70">
                                    Tenant message
                                  </p>
                                  {booking.tenantMessage}
                                </div>
                              )}
                            </div>

                            <CardFooter className="w-full flex-col gap-2 border-0 p-0 lg:w-56">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="w-full bg-transparent"
                              >
                                <Link href={`/room/${room.id}`}>View Room</Link>
                              </Button>

                              {getDialablePhone(booking.tenantPhone) ? (
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="w-full bg-transparent"
                                >
                                  <a
                                    href={`tel:${getDialablePhone(booking.tenantPhone)}`}
                                  >
                                    <PhoneCall className="mr-2 h-4 w-4" />
                                    Call Tenant
                                  </a>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  disabled
                                >
                                  <PhoneCall className="mr-2 h-4 w-4" />
                                  No Phone
                                </Button>
                              )}

                              {booking.status === "pending" ? (
                                <div className="grid w-full grid-cols-2 gap-2">
                                  <Button
                                    size="sm"
                                    className="w-full"
                                    disabled={isDemo}
                                    onClick={() =>
                                      updateBookingStatus(
                                        booking.id,
                                        "approved",
                                        "Approved by landlord. Please coordinate the agreement details.",
                                      )
                                    }
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="w-full"
                                    disabled={isDemo}
                                    onClick={() =>
                                      updateBookingStatus(
                                        booking.id,
                                        "rejected",
                                        "Not approved for this listing.",
                                      )
                                    }
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex w-full items-center justify-center rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                                  Request reviewed
                                </div>
                              )}
                            </CardFooter>
                          </div>
                        </CardContent>
                      </Card>
                    ),
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    No incoming requests
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Tenants will appear here once they request one of your
                    listings.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="listings">
              <div className="space-y-6">
                <div className="flex flex-col gap-4 rounded-lg border border-dashed bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Ready to list another room?
                    </h3>
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

                <div>
                  <h3 className="mb-4 text-lg font-semibold">
                    My Listings ({landlordListings.length})
                  </h3>
                  {postedRooms.length === 0 && (
                    <p className="mb-4 text-sm text-muted-foreground">
                      Showing demo listings. Post your room to replace these
                      samples.
                    </p>
                  )}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {landlordListings.map((room) => (
                      <RoomCard key={room.id} room={room} />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </>
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
