"use client";

import Link from "next/link";
import { useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  MapPinned,
  MessageSquare,
  PhoneCall,
  X,
} from "lucide-react";
import type { RequestWithRoom } from "@/components/profile/types";
import type { BookingMutationResult } from "@/lib/auth-context";
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
  ) => Promise<BookingMutationResult>;
  onShareContact: (bookingId: string) => Promise<BookingMutationResult>;
  onShareLocation: (
    bookingId: string,
    sharedLocationUrl: string,
  ) => Promise<BookingMutationResult>;
}

type RequestActionFeedback = {
  bookingId: string;
  kind: "success" | "error";
  message: string;
};

export function LandlordRequestsTab({
  requests,
  onShareContact,
  onUpdateBookingStatus,
  onShareLocation,
}: LandlordRequestsTabProps) {
  const [activeAction, setActiveAction] = useState<{
    bookingId: string;
    type: "share-contact" | "share-location" | "approve" | "reject";
  } | null>(null);
  const [feedback, setFeedback] = useState<RequestActionFeedback | null>(null);

  const runAction = async (
    bookingId: string,
    type: "share-contact" | "share-location" | "approve" | "reject",
    action: () => Promise<BookingMutationResult>,
    successMessage: string,
  ) => {
    setActiveAction({ bookingId, type });
    setFeedback(null);

    try {
      const result = await action();

      if (!result.success) {
        setFeedback({
          bookingId,
          kind: "error",
          message: result.error,
        });
        setActiveAction(null);
        return;
      }

      setFeedback({
        bookingId,
        kind: "success",
        message: successMessage,
      });
      setActiveAction(null);
    } catch {
      setFeedback({
        bookingId,
        kind: "error",
        message: "The request action failed. Please try again.",
      });
      setActiveAction(null);
    }
  };

  return (
    <TabsContent value="requests">
      {requests.length > 0 ? (
        <div className="mx-auto max-w-5xl space-y-3">
          {requests.map(({ booking, room, isDemo }) => {
            if (!room) {
              return null;
            }

            return (
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
                      <p className="text-sm text-muted-foreground">
                        {room.location}
                      </p>

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

                      {booking.sharedLandlordPhone &&
                      (booking.status === "pending" ||
                        booking.status === "approved") ? (
                        <div className="rounded-md border border-blue-200 bg-blue-50/80 px-3 py-2 text-sm text-blue-800">
                          Contact number shared on{" "}
                          {formatDate(
                            booking.sharedLandlordPhoneAt ?? booking.createdAt,
                          )}
                          : {booking.sharedLandlordPhone}
                        </div>
                      ) : null}

                      {booking.sharedLocationUrl &&
                      (booking.status === "pending" ||
                        booking.status === "approved") && (
                        <div className="rounded-md border border-green-200 bg-green-50/80 px-3 py-2 text-sm text-green-800">
                          Exact location shared on{" "}
                          {formatDate(booking.sharedLocationAt ?? booking.createdAt)}.
                        </div>
                      )}

                      {feedback?.bookingId === booking.id ? (
                        <Alert
                          className={
                            feedback.kind === "error"
                              ? "border-red-200 bg-red-50/80"
                              : "border-emerald-200 bg-emerald-50/80"
                          }
                        >
                          {feedback.kind === "error" ? (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          )}
                          <AlertDescription
                            className={
                              feedback.kind === "error"
                                ? "text-red-900"
                                : "text-emerald-900"
                            }
                          >
                            {feedback.message}
                          </AlertDescription>
                        </Alert>
                      ) : null}
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

                      {(booking.status === "pending" ||
                        booking.status === "approved") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full bg-transparent"
                          disabled={activeAction?.bookingId === booking.id}
                          onClick={() =>
                            void runAction(
                              booking.id,
                              "share-contact",
                              () => onShareContact(booking.id),
                              booking.sharedLandlordPhone
                                ? "Contact number updated for this tenant."
                                : "Contact number shared with this tenant.",
                            )
                          }
                        >
                          {activeAction?.bookingId === booking.id &&
                          activeAction.type === "share-contact" ? (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <PhoneCall className="mr-2 h-4 w-4" />
                          )}
                          {booking.sharedLandlordPhone
                            ? "Update Contact"
                            : "Share Contact"}
                        </Button>
                      )}

                      {booking.sharedLocationUrl &&
                      (booking.status === "pending" ||
                        booking.status === "approved") ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                        >
                          <a
                            href={booking.sharedLocationUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Shared Map
                          </a>
                        </Button>
                      ) : booking.status === "pending" ||
                        booking.status === "approved" ? (
                        room.google_maps_url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full bg-transparent"
                            disabled={activeAction?.bookingId === booking.id}
                            onClick={() =>
                              void runAction(
                                booking.id,
                                "share-location",
                                () => onShareLocation(booking.id, room.google_maps_url),
                                "Exact location shared with this tenant.",
                              )
                            }
                          >
                            {activeAction?.bookingId === booking.id &&
                            activeAction.type === "share-location" ? (
                              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <MapPinned className="mr-2 h-4 w-4" />
                            )}
                            Share Location
                          </Button>
                        ) : (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full bg-transparent"
                          >
                            <Link href={`/post-room?edit=${room.rental_id}`}>
                              <MapPinned className="mr-2 h-4 w-4" />
                              Add Map Pin
                            </Link>
                          </Button>
                        )
                      ) : null}

                      {booking.status === "pending" ? (
                        <div className="grid w-full grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            className="w-full"
                            disabled={isDemo || activeAction?.bookingId === booking.id}
                            onClick={() =>
                              void runAction(
                                booking.id,
                                "approve",
                                () =>
                                  onUpdateBookingStatus(
                                    booking.id,
                                    "approved",
                                    "Approved by landlord. Please coordinate the agreement details.",
                                  ),
                                "Request approved.",
                              )
                            }
                          >
                            {activeAction?.bookingId === booking.id &&
                            activeAction.type === "approve" ? (
                              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-2 h-4 w-4" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            disabled={isDemo || activeAction?.bookingId === booking.id}
                            onClick={() =>
                              void runAction(
                                booking.id,
                                "reject",
                                () =>
                                  onUpdateBookingStatus(
                                    booking.id,
                                    "rejected",
                                    "Not approved for this listing.",
                                  ),
                                "Request rejected.",
                              )
                            }
                          >
                            {activeAction?.bookingId === booking.id &&
                            activeAction.type === "reject" ? (
                              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <X className="mr-2 h-4 w-4" />
                            )}
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
            );
          })}
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
