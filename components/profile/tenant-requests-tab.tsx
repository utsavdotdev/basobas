"use client";

import Link from "next/link";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ArrowUpRight, Calendar, XCircle } from "lucide-react";
import type { RequestWithRoom } from "@/components/profile/types";
import { formatDate, formatDuration, getStatusColor } from "@/components/profile/utils";

interface TenantRequestsTabProps {
  requests: RequestWithRoom[];
  onCancelBooking: (bookingId: string) => void;
}

export function TenantRequestsTab({
  requests,
  onCancelBooking,
}: TenantRequestsTabProps) {
  return (
    <TabsContent value="requests">
      {requests.length > 0 ? (
        <div className="mx-auto max-w-3xl space-y-3">
          {requests.map(({ booking, room }) => (
            <Card key={booking.id} className="border-border/70 bg-card/90 shadow-sm">
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
                {(booking.status === "pending" || booking.status === "approved") && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="h-8 px-3">
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Rental Request</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this request? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Request</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onCancelBooking(booking.id)}
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
          <h3 className="mt-4 text-lg font-semibold">No requests yet</h3>
          <p className="mt-2 text-muted-foreground">
            {"You have not sent any long-term rental requests yet. Start exploring!"}
          </p>
          <Button asChild className="mt-4">
            <Link href="/explore">Explore Rooms</Link>
          </Button>
        </div>
      )}
    </TabsContent>
  );
}
