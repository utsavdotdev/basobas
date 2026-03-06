"use client";

import Link from "next/link";
import type { Room } from "@/lib/mock-data";
import { TabsContent } from "@/components/ui/tabs";
import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface LandlordListingsTabProps {
  landlordListings: Room[];
}

export function LandlordListingsTab({ landlordListings }: LandlordListingsTabProps) {
  return (
    <TabsContent value="listings">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-lg border border-dashed bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
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

        <div>
          <h3 className="mb-4 text-lg font-semibold">
            My Listings ({landlordListings.length})
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {landlordListings.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
