"use client";

import type { User } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, Heart, Home, Calendar, MessageSquare } from "lucide-react";
import { ENABLE_BOOKING_REQUESTS, ENABLE_FAVORITES } from "@/lib/launch-flags";

interface ProfileTabsListProps {
  role: User["role"];
  tenantRequestsCount: number;
  favoritesCount: number;
  landlordRequestsCount: number;
  landlordListingsCount: number;
}

export function ProfileTabsList({
  role,
  tenantRequestsCount,
  favoritesCount,
  landlordRequestsCount,
  landlordListingsCount,
}: ProfileTabsListProps) {
  return (
    <TabsList className="h-auto w-full flex-wrap gap-2">
      <TabsTrigger value="profile" className="gap-2">
        <UserIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Profile</span>
      </TabsTrigger>

      {role === "tenant" && (
        <>
          {ENABLE_BOOKING_REQUESTS && (
            <TabsTrigger value="requests" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">My Requests</span>
              {tenantRequestsCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {tenantRequestsCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
          {ENABLE_FAVORITES && (
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Favorites</span>
              {favoritesCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {favoritesCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </>
      )}

      {role === "landlord" && (
        <>
          {ENABLE_BOOKING_REQUESTS && (
            <TabsTrigger value="requests" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Incoming Requests</span>
              {landlordRequestsCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {landlordRequestsCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="listings" className="gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">My Listings</span>
            {landlordListingsCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {landlordListingsCount}
              </Badge>
            )}
          </TabsTrigger>
        </>
      )}
    </TabsList>
  );
}
