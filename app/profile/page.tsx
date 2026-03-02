"use client";

import { useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { mockRooms } from "@/lib/mock-data";
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
  const defaultTab =
    selectedTab === "bookings" ? "requests" : selectedTab || "profile";

  const allRooms = useMemo(() => {
    return [...mockRooms, ...postedRooms];
  }, [postedRooms]);

  const favoriteRooms = useMemo(() => {
    return allRooms.filter((room) => favorites.includes(room.id));
  }, [allRooms, favorites]);

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

  const demoIncomingRequests = useMemo(() => {
    if (
      !user ||
      user.role !== "landlord" ||
      incomingRequestsWithRoom.length > 0
    ) {
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
            index === 0
              ? "anita.tenant@example.com"
              : "rajan.tenant@example.com",
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

  if (!user) {
    return <LoginRequired onGoHome={() => router.push("/")} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileHeader user={user} onLogout={logout} />

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <ProfileTabsList
          role={user.role}
          tenantRequestsCount={tenantRequestsWithRoom.length}
          favoritesCount={favorites.length}
          landlordRequestsCount={landlordRequestsToDisplay.length}
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
              requests={landlordRequestsToDisplay}
              onUpdateBookingStatus={updateBookingStatus}
            />
            <LandlordListingsTab
              landlordListings={landlordListings}
              showingDemoListings={postedRooms.length === 0}
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
