import type { Booking } from "@/lib/auth-context";
import type { Room } from "@/lib/mock-data";

export type RequestWithRoom = {
  booking: Booking;
  room: Room | null;
  isDemo?: boolean;
};
