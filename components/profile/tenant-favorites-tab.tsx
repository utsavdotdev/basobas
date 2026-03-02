"use client";

import Link from "next/link";
import type { Room } from "@/lib/mock-data";
import { TabsContent } from "@/components/ui/tabs";
import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface TenantFavoritesTabProps {
  favoriteRooms: Room[];
}

export function TenantFavoritesTab({ favoriteRooms }: TenantFavoritesTabProps) {
  return (
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
          <h3 className="mt-4 text-lg font-semibold">No favorites yet</h3>
          <p className="mt-2 text-muted-foreground">
            Start exploring and save rooms you like!
          </p>
          <Button asChild className="mt-4">
            <Link href="/explore">Explore Rooms</Link>
          </Button>
        </div>
      )}
    </TabsContent>
  );
}
