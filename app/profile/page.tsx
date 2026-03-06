"use client";

import { useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Tabs } from "@/components/ui/tabs";
import { LoginRequired } from "@/components/profile/login-required";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabsList } from "@/components/profile/profile-tabs-list";
import { ProfileOverviewTab } from "@/components/profile/profile-overview-tab";
import { TenantRequestsTab } from "@/components/profile/tenant-requests-tab";
import { TenantFavoritesTab } from "@/components/profile/tenant-favorites-tab";
import { LandlordRequestsTab } from "@/components/profile/landlord-requests-tab";
import { LandlordListingsTab } from "@/components/profile/landlord-listings-tab";
import type { RequestWithRoom } from "@/components/profile/types";

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
        const room = allRooms.find((r) => r.id === booking.roomId);
        return { booking, room };
      })
      .filter((item): item is RequestWithRoom => item.room !== undefined);
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
        const room = allRooms.find((r) => r.id === booking.roomId);
        return { booking, room };
      })
      .filter((item): item is RequestWithRoom => item.room !== undefined);
  }, [allRooms, bookings, user?.id]);

  if (!user) {
    return <LoginRequired onGoHome={() => router.push("/")} />;
  }

  const defaultTab =
    user.role === "landlord" && requestedTab === "favorites"
      ? "profile"
      : requestedTab;

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileHeader user={user} onLogout={logout} />

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <ProfileTabsList
          role={user.role}
          tenantRequestsCount={tenantRequestsWithRoom.length}
          favoritesCount={favorites.length}
          landlordRequestsCount={incomingRequestsWithRoom.length}
          landlordListingsCount={landlordListings.length}
        />

        <ProfileOverviewTab user={user} onVerifyPhone={verifyPhone} />

        {user.role === "tenant" && (
          <>
            <TenantRequestsTab
              requests={tenantRequestsWithRoom}
              onCancelBooking={cancelBooking}
            />
            <TenantFavoritesTab favoriteRooms={favoriteRooms} />
          </>
        )}

        {user.role === "landlord" && (
          <>
            <LandlordRequestsTab
              requests={incomingRequestsWithRoom}
              onUpdateBookingStatus={updateBookingStatus}
            />
            <LandlordListingsTab landlordListings={landlordListings} />
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
