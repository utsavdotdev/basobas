"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { User, Room } from "./mock-data";

export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  landlordId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  tenantMessage?: string;
  moveInDate: string;
  stayDurationMonths: number;
  status: BookingStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewMessage?: string;
}

type NewBookingInput = Omit<
  Booking,
  "id" | "createdAt" | "status" | "reviewedAt" | "reviewMessage"
>;

interface AuthContextType {
  user: User | null;
  login: (role: "tenant" | "landlord") => void;
  logout: () => void;
  verifyPhone: (phone: string) => void;
  favorites: string[];
  addFavorite: (roomId: string) => void;
  removeFavorite: (roomId: string) => void;
  postedRooms: Room[];
  addRoom: (room: Room) => void;
  bookings: Booking[];
  addBooking: (booking: NewBookingInput) => boolean;
  cancelBooking: (bookingId: string) => void;
  updateBookingStatus: (
    bookingId: string,
    status: "approved" | "rejected",
    reviewMessage?: string,
  ) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BOOKING_STORAGE_KEY = "homgwe_bookings";

const mapLegacyStatus = (status: unknown): BookingStatus => {
  if (status === "approved" || status === "rejected" || status === "cancelled") {
    return status;
  }
  if (status === "confirmed" || status === "completed") {
    return "approved";
  }
  return "pending";
};

const toISOStringSafe = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
};

const getDurationFromLegacyDates = (checkIn: unknown, checkOut: unknown) => {
  if (typeof checkIn !== "string" || typeof checkOut !== "string") {
    return 6;
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 6;
  }

  const monthsDiff =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  return Math.max(1, monthsDiff || 1);
};

const normalizeBooking = (booking: unknown): Booking | null => {
  if (!booking || typeof booking !== "object") return null;

  const raw = booking as Partial<
    Booking & { checkIn?: string; checkOut?: string; status?: string }
  >;
  const now = new Date().toISOString();
  const moveInDate = toISOStringSafe(raw.moveInDate ?? raw.checkIn, now);
  const stayDurationMonths =
    typeof raw.stayDurationMonths === "number" && raw.stayDurationMonths > 0
      ? raw.stayDurationMonths
      : getDurationFromLegacyDates(raw.checkIn, raw.checkOut);

  return {
    id: typeof raw.id === "string" ? raw.id : `booking_${Date.now()}`,
    roomId: typeof raw.roomId === "string" ? raw.roomId : "",
    userId: typeof raw.userId === "string" ? raw.userId : "",
    landlordId: typeof raw.landlordId === "string" ? raw.landlordId : "",
    tenantName:
      typeof raw.tenantName === "string" && raw.tenantName.trim()
        ? raw.tenantName
        : "Tenant",
    tenantEmail:
      typeof raw.tenantEmail === "string" && raw.tenantEmail.trim()
        ? raw.tenantEmail
        : "N/A",
    tenantPhone:
      typeof raw.tenantPhone === "string" && raw.tenantPhone.trim()
        ? raw.tenantPhone
        : "",
    tenantMessage:
      typeof raw.tenantMessage === "string" && raw.tenantMessage.trim()
        ? raw.tenantMessage
        : undefined,
    moveInDate,
    stayDurationMonths,
    status: mapLegacyStatus(raw.status),
    createdAt: toISOStringSafe(raw.createdAt, now),
    reviewedAt:
      typeof raw.reviewedAt === "string"
        ? toISOStringSafe(raw.reviewedAt, now)
        : undefined,
    reviewMessage:
      typeof raw.reviewMessage === "string" && raw.reviewMessage.trim()
        ? raw.reviewMessage
        : undefined,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [postedRooms, setPostedRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = localStorage.getItem("basobas_user");
    const savedFavorites = localStorage.getItem("homgwe_favorites");
    const savedRooms = localStorage.getItem("homgwe_posted_rooms");
    const savedBookings = localStorage.getItem(BOOKING_STORAGE_KEY);

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    if (savedRooms) {
      setPostedRooms(JSON.parse(savedRooms));
    }
    if (savedBookings) {
      try {
        const parsedBookings = JSON.parse(savedBookings);
        if (Array.isArray(parsedBookings)) {
          const normalized = parsedBookings
            .map((booking) => normalizeBooking(booking))
            .filter((booking): booking is Booking => booking !== null);
          setBookings(normalized);
          localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(normalized));
        }
      } catch {
        localStorage.removeItem(BOOKING_STORAGE_KEY);
      }
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const login = (role: "tenant" | "landlord") => {
    const newUser: User = {
      id: role === "tenant" ? "tenant_demo" : "l1",
      name: role === "tenant" ? "Utsav Bhattarai" : "Roshan Acharaya",
      email: role === "tenant" ? "utsavdotdev@gmail.com" : "roshan@gmail.com",
      avatar:
        role === "tenant"
          ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"
          : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
      role,
      verified: false,
    };
    setUser(newUser);
    localStorage.setItem("basobas_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("basobas_user");
  };

  const verifyPhone = (phone: string) => {
    if (user) {
      const updatedUser = { ...user, verified: true, phone };
      setUser(updatedUser);
      localStorage.setItem("basobas_user", JSON.stringify(updatedUser));
    }
  };

  const addFavorite = (roomId: string) => {
    if (favorites.includes(roomId)) return;
    const newFavorites = [...favorites, roomId];
    setFavorites(newFavorites);
    localStorage.setItem("homgwe_favorites", JSON.stringify(newFavorites));
  };

  const removeFavorite = (roomId: string) => {
    const newFavorites = favorites.filter((id) => id !== roomId);
    setFavorites(newFavorites);
    localStorage.setItem("homgwe_favorites", JSON.stringify(newFavorites));
  };

  const addRoom = (room: Room) => {
    const newRooms = [...postedRooms, room];
    setPostedRooms(newRooms);
    localStorage.setItem("homgwe_posted_rooms", JSON.stringify(newRooms));
  };

  const addBooking = (booking: NewBookingInput) => {
    const hasActiveRequest = bookings.some(
      (existingBooking) =>
        existingBooking.roomId === booking.roomId &&
        existingBooking.userId === booking.userId &&
        (existingBooking.status === "pending" ||
          existingBooking.status === "approved"),
    );
    if (hasActiveRequest) {
      return false;
    }

    const newBooking: Booking = {
      ...booking,
      id: `booking_${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    const newBookings = [...bookings, newBooking];
    setBookings(newBookings);
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(newBookings));
    return true;
  };

  const cancelBooking = (bookingId: string) => {
    const newBookings = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: "cancelled" as const } : b,
    );
    setBookings(newBookings);
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(newBookings));
  };

  const updateBookingStatus = (
    bookingId: string,
    status: "approved" | "rejected",
    reviewMessage?: string,
  ) => {
    const reviewedAt = new Date().toISOString();
    const newBookings = bookings.map((b) =>
      b.id === bookingId
        ? {
            ...b,
            status,
            reviewedAt,
            reviewMessage: reviewMessage?.trim() || undefined,
          }
        : b,
    );
    setBookings(newBookings);
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(newBookings));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        verifyPhone,
        favorites,
        addFavorite,
        removeFavorite,
        postedRooms,
        addRoom,
        bookings,
        addBooking,
        cancelBooking,
        updateBookingStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
