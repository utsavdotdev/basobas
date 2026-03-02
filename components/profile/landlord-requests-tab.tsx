"use client";

import Link from "next/link";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, MessageSquare, PhoneCall } from "lucide-react";
import type { RequestWithRoom } from "@/components/profile/types";
import {
  formatDate,
  formatDuration,
  getDialablePhone,
  getStatusColor,
} from "@/components/profile/utils";

interface LandlordRequestsTabProps {
  requests: RequestWithRoom[];
  onUpdateBookingStatus: (
    bookingId: string,
    status: "approved" | "rejected",
    reviewMessage?: string,
  ) => void;
}

export function LandlordRequestsTab({
  requests,
  onUpdateBookingStatus,
}: LandlordRequestsTabProps) {
  return (
    <TabsContent value="requests">
      {requests.length > 0 ? (
        <div className="mx-auto max-w-5xl space-y-3">
          {requests.map(({ booking, room, isDemo }) => (
            <Card key={booking.id} className="border-border/70 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getStatusColor(booking.status)}>
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
                    <p className="text-sm text-muted-foreground">{room.location}</p>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                        <p className="font-medium">{booking.tenantName}</p>
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
                          {formatDuration(booking.stayDurationMonths)} stay
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
                        <a href={`tel:${getDialablePhone(booking.tenantPhone)}`}>
                          <PhoneCall className="mr-2 h-4 w-4" />
                          Call Tenant
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full" disabled>
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
                            onUpdateBookingStatus(
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
                            onUpdateBookingStatus(
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
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No incoming requests</h3>
          <p className="mt-2 text-muted-foreground">
            Tenants will appear here once they request one of your listings.
          </p>
        </div>
      )}
    </TabsContent>
  );
}
