"use client";

import { useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LoginRequired } from "@/components/profile/login-required";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabsList } from "@/components/profile/profile-tabs-list";
import { ProfileOverviewTab } from "@/components/profile/profile-overview-tab";
import { TenantRequestsTab } from "@/components/profile/tenant-requests-tab";
import { TenantFavoritesTab } from "@/components/profile/tenant-favorites-tab";
import { LandlordRequestsTab } from "@/components/profile/landlord-requests-tab";
import { LandlordListingsTab } from "@/components/profile/landlord-listings-tab";
import type { RequestWithRoom } from "@/components/profile/types";
import { ENABLE_BOOKING_REQUESTS, ENABLE_FAVORITES } from "@/lib/launch-flags";
import { MessageSquare } from "lucide-react";

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
    deleteBooking,
    shareBookingContact,
    shareBookingLocation,
    updateBookingStatus,
  } = useAuth();

  const selectedTab = searchParams.get("tab");
  const requestedTab =
    selectedTab === "bookings" ? "requests" : selectedTab || "profile";

  const allRooms = useMemo(() => {
    return postedRooms;
  }, [postedRooms]);

  const favoriteRooms = useMemo(() => {
    return allRooms.filter((room) => favorites.includes(room.id));
  }, [allRooms, favorites]);

  const landlordListings = useMemo(() => {
    if (!user || user.role !== "landlord") {
      return [];
    }

    return allRooms.filter((room) => room.landlord.id === user.id);
  }, [allRooms, user]);

  const tenantRequestsWithRoom = useMemo(() => {
    return bookings
      .filter((booking) => booking.userId === user?.id)
      .map((booking) => {
        const room = allRooms.find((r) => r.id === booking.roomId) ?? null;
        return { booking, room };
      });
  }, [allRooms, bookings, user?.id]);

  const incomingRequestsWithRoom = useMemo(() => {
    const landlordRoomIds = new Set(
      allRooms
        .filter((room) => room.landlord.id === user?.id)
        .map((room) => room.id),
    );

    return bookings
      .filter((booking) => landlordRoomIds.has(booking.roomId))
      .map((booking) => {
        const room = allRooms.find((r) => r.id === booking.roomId) ?? null;
        return { booking, room };
      })
      .filter((item): item is RequestWithRoom => item.room !== null);
  }, [allRooms, bookings, user?.id]);

  const pendingIncomingRequestsCount = useMemo(
    () =>
      incomingRequestsWithRoom.filter(
        ({ booking }) => booking.status === "pending",
      ).length,
    [incomingRequestsWithRoom],
  );

  const activeTenantRequestsCount = useMemo(
    () =>
      tenantRequestsWithRoom.filter(
        ({ booking }) =>
          booking.status === "pending" || booking.status === "approved",
      ).length,
    [tenantRequestsWithRoom],
  );

  if (!user) {
    return <LoginRequired onGoHome={() => router.push("/")} />;
  }

  const activeTab =
    ((!ENABLE_BOOKING_REQUESTS && requestedTab === "requests") ||
      (!ENABLE_FAVORITES && requestedTab === "favorites") ||
      (user.role === "landlord" && requestedTab === "favorites"))
      ? "profile"
      : !selectedTab &&
          user.role === "landlord" &&
          ENABLE_BOOKING_REQUESTS &&
          pendingIncomingRequestsCount > 0
        ? "requests"
      : requestedTab;

  const handleTabChange = (nextTab: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (nextTab === "profile") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", nextTab);
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `/profile?${nextQuery}` : "/profile", {
      scroll: false,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileHeader user={user} onLogout={logout} />

      {user.role === "landlord" &&
        ENABLE_BOOKING_REQUESTS &&
        pendingIncomingRequestsCount > 0 &&
        activeTab !== "requests" && (
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <MessageSquare className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="font-medium text-amber-900">
                  You have {pendingIncomingRequestsCount} pending booking
                  request{pendingIncomingRequestsCount > 1 ? "s" : ""}.
                </p>
                <p className="text-sm text-amber-800">
                  Review and approve or reject them from your requests tab.
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleTabChange("requests")}
              className="sm:self-start"
            >
              Review Requests
            </Button>
          </div>
        )}

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <ProfileTabsList
          role={user.role}
          tenantRequestsCount={
            ENABLE_BOOKING_REQUESTS ? activeTenantRequestsCount : 0
          }
          favoritesCount={ENABLE_FAVORITES ? favorites.length : 0}
          landlordRequestsCount={
            ENABLE_BOOKING_REQUESTS ? pendingIncomingRequestsCount : 0
          }
          landlordListingsCount={landlordListings.length}
        />

        <ProfileOverviewTab user={user} onVerifyPhone={verifyPhone} />

        {user.role === "tenant" && (
          <>
            {ENABLE_BOOKING_REQUESTS && (
              <TenantRequestsTab
                requests={tenantRequestsWithRoom}
                onCancelBooking={cancelBooking}
                onDeleteBooking={deleteBooking}
              />
            )}
            {ENABLE_FAVORITES && <TenantFavoritesTab favoriteRooms={favoriteRooms} />}
          </>
        )}

        {user.role === "landlord" && (
          <>
            {ENABLE_BOOKING_REQUESTS && (
              <LandlordRequestsTab
                requests={incomingRequestsWithRoom}
                onShareContact={shareBookingContact}
                onShareLocation={shareBookingLocation}
                onUpdateBookingStatus={updateBookingStatus}
              />
            )}
            <LandlordListingsTab
              landlordListings={landlordListings}
            />
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
