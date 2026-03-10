"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Room } from "@/lib/mock-data";
import { rentalStatusLabels } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { TabsContent } from "@/components/ui/tabs";
import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Pencil,
  RotateCcw,
  Trash2,
  Home,
  AlertCircle,
} from "lucide-react";

interface LandlordListingsTabProps {
  landlordListings: Room[];
}

type ListingAction =
  | { roomId: string; type: "available" }
  | { roomId: string; type: "inactive" }
  | { roomId: string; type: "delete" }
  | null;

const statusOrder: Room["status"][] = ["available", "rented", "inactive"];

const emptyStateCopy: Record<Room["status"], string> = {
  available: "Available listings will appear here.",
  rented: "Approved tenant requests will move listings into this section.",
  inactive: "Temporarily paused listings will appear here.",
};

const sectionDescription: Record<Room["status"], string> = {
  available: "Visible to tenants and ready to receive booking requests.",
  rented: "Occupied listings stay visible to you so you can reactivate them later.",
  inactive: "Hidden from tenants until you make them available again.",
};

export function LandlordListingsTab({
  landlordListings,
}: LandlordListingsTabProps) {
  const { updateRoomStatus, deleteRoom } = useAuth();
  const [listingAction, setListingAction] = useState<ListingAction>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const listingsByStatus = useMemo(
    () =>
      statusOrder.map((status) => ({
        status,
        rooms: landlordListings.filter((room) => room.status === status),
      })),
    [landlordListings],
  );

  const isBusy = (roomId: string, type: NonNullable<ListingAction>["type"]) =>
    listingAction?.roomId === roomId && listingAction.type === type;

  const handleMakeAvailable = async (roomId: string) => {
    setActionError(null);
    setListingAction({ roomId, type: "available" });

    const result = await updateRoomStatus(roomId, "available");

    setListingAction(null);

    if (!result.success) {
      setActionError(result.error);
    }
  };

  const handleMarkInactive = async (roomId: string) => {
    setActionError(null);
    setListingAction({ roomId, type: "inactive" });

    const result = await updateRoomStatus(roomId, "inactive");

    setListingAction(null);

    if (!result.success) {
      setActionError(result.error);
    }
  };

  const handleDelete = async (roomId: string) => {
    setActionError(null);
    setListingAction({ roomId, type: "delete" });

    const result = await deleteRoom(roomId);

    setListingAction(null);

    if (!result.success) {
      setActionError(result.error);
    }
  };

  return (
    <TabsContent value="listings">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-lg border border-dashed bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Manage your portfolio</h3>
            <p className="text-sm text-muted-foreground">
              Edit active listings, reactivate rented rooms, or remove old posts.
            </p>
          </div>
          <Button asChild>
            <Link href="/post-room">
              <Plus className="mr-2 h-4 w-4" />
              Post a Room
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          {listingsByStatus.map(({ status, rooms }) => (
            <div
              key={status}
              className="min-w-32 rounded-lg border bg-card px-4 py-3 shadow-sm"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {rentalStatusLabels[status]}
              </p>
              <p className="mt-1 text-2xl font-semibold">{rooms.length}</p>
            </div>
          ))}
        </div>

        {actionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        {landlordListings.length > 0 ? (
          <div className="space-y-8">
            {listingsByStatus.map(({ status, rooms }) => (
              <section key={status} className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold">
                    {rentalStatusLabels[status]}
                  </h3>
                  <Badge variant="secondary">{rooms.length}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {sectionDescription[status]}
                </p>

                {rooms.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rooms.map((room) => (
                      <div key={room.id} className="space-y-3">
                        <RoomCard room={room} />
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/post-room?edit=${room.rental_id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </Button>

                          {room.status === "available" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={listingAction?.roomId === room.rental_id}
                              onClick={() => void handleMarkInactive(room.rental_id)}
                            >
                              <Home className="mr-2 h-4 w-4" />
                              {isBusy(room.rental_id, "inactive")
                                ? "Pausing..."
                                : "Mark Inactive"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={listingAction?.roomId === room.rental_id}
                              onClick={() => void handleMakeAvailable(room.rental_id)}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              {isBusy(room.rental_id, "available")
                                ? "Updating..."
                                : "Make Available"}
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={listingAction?.roomId === room.rental_id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove this rental and its
                                  related requests from your profile.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Listing</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => void handleDelete(room.rental_id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {isBusy(room.rental_id, "delete")
                                    ? "Deleting..."
                                    : "Delete Listing"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        {room.status === "rented" && (
                          <p className="text-xs text-muted-foreground">
                            Make this listing available again after the tenant
                            moves out.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
                    {emptyStateCopy[status]}
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/20 p-10 text-center">
            <h3 className="text-lg font-semibold">No listings yet</h3>
            <p className="mt-2 text-muted-foreground">
              Create your first rental listing to start receiving tenant requests.
            </p>
            <Button asChild className="mt-4">
              <Link href="/post-room">
                <Plus className="mr-2 h-4 w-4" />
                Post a Room
              </Link>
            </Button>
          </div>
        )}
      </div>
    </TabsContent>
  );
}
