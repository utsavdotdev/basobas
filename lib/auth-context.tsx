"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { User, Room } from "./mock-data";

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

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
  addBooking: (booking: Omit<Booking, "id" | "createdAt">) => void;
  cancelBooking: (bookingId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [postedRooms, setPostedRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = localStorage.getItem("basobas_user");
    const savedFavorites = localStorage.getItem("homgwe_favorites");
    const savedRooms = localStorage.getItem("homgwe_posted_rooms");
    const savedBookings = localStorage.getItem("homgwe_bookings");

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
      setBookings(JSON.parse(savedBookings));
    }
  }, []);

  const login = (role: "tenant" | "landlord") => {
    const newUser: User = {
      id: `user_${Date.now()}`,
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

  const addBooking = (booking: Omit<Booking, "id" | "createdAt">) => {
    const newBooking: Booking = {
      ...booking,
      id: `booking_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const newBookings = [...bookings, newBooking];
    setBookings(newBookings);
    localStorage.setItem("homgwe_bookings", JSON.stringify(newBookings));
  };

  const cancelBooking = (bookingId: string) => {
    const newBookings = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: "cancelled" as const } : b,
    );
    setBookings(newBookings);
    localStorage.setItem("homgwe_bookings", JSON.stringify(newBookings));
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
