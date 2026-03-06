"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import {
  getFlatConfigurationLabel,
  normalizeRoom,
  rentalTypeLabels,
  type Room,
  type User,
} from "./mock-data";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isUserRole, type UserRole } from "@/lib/auth/roles";
import { normalizeNepaliPhone } from "@/lib/phone";

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

export type NewRoomInput = Pick<
  Room,
  | "rental_type"
  | "location"
  | "description"
  | "images"
  | "no_of_rooms"
  | "configuration"
  | "config_unit"
  | "rent"
  | "is_kitchen"
  | "bathroom_type"
  | "water_facility"
>;

type AddRoomResult =
  | { success: true; room: Room }
  | { success: false; error: string };

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  verifyPhone: (phone: string) => void;
  favorites: string[];
  addFavorite: (roomId: string) => void;
  removeFavorite: (roomId: string) => void;
  postedRooms: Room[];
  addRoom: (room: NewRoomInput) => Promise<AddRoomResult>;
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
const FAVORITES_STORAGE_KEY = "homgwe_favorites";
const POSTED_ROOMS_STORAGE_KEY = "homgwe_posted_rooms";
const LANDLORD_SNAPSHOTS_STORAGE_KEY = "homgwe_landlord_snapshots";
const LEGACY_USER_STORAGE_KEY = "basobas_user";
const PENDING_ROLE_STORAGE_KEY = "basobas_pending_role";

interface ProfileRow {
  role: UserRole | null;
  phone: string | null;
  phone_verified: boolean | null;
}

interface RentalRow {
  rental_id: string;
  user_id: string;
  rental_type: Room["rental_type"];
  location: string;
  description: string | null;
  images: string[] | null;
  no_of_rooms: number;
  configuration: Room["configuration"];
  config_unit: number | null;
  rent: number | string;
  status: Room["status"];
  is_kitchen: boolean;
  bathroom_type: Room["bathroom_type"];
  water_facility: Room["water_facility"];
  created_at: string;
  updated_at: string;
}

interface FavoriteRow {
  rental_id: string;
}

type LandlordSnapshot = Pick<
  Room["landlord"],
  "name" | "email" | "avatar" | "verified"
>;

type LandlordSnapshotsByUserId = Record<string, LandlordSnapshot>;

const sanitizeLandlordSnapshot = (
  snapshot: Partial<Room["landlord"]> | null | undefined,
): LandlordSnapshot | null => {
  if (!snapshot) return null;

  const name =
    typeof snapshot.name === "string" ? snapshot.name.trim() : "";
  const email =
    typeof snapshot.email === "string" ? snapshot.email.trim() : "";
  const avatar =
    typeof snapshot.avatar === "string" ? snapshot.avatar.trim() : "";
  const verified = snapshot.verified === true;

  const hasUsefulName = Boolean(name) && name.toLowerCase() !== "landlord";
  const hasUsefulEmail = Boolean(email);
  const hasUsefulAvatar = Boolean(avatar);

  if (!hasUsefulName && !hasUsefulEmail && !hasUsefulAvatar) {
    return null;
  }

  return {
    name: name || "Landlord",
    email,
    avatar,
    verified,
  };
};

const snapshotFromUser = (user: User): LandlordSnapshot => ({
  name: user.name.trim() || "Landlord",
  email: user.email.trim(),
  avatar: user.avatar.trim(),
  verified: user.verified,
});

const readLandlordSnapshotsFromStorage = (): LandlordSnapshotsByUserId => {
  if (typeof window === "undefined") return {};

  const raw = window.localStorage.getItem(LANDLORD_SNAPSHOTS_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const snapshots: LandlordSnapshotsByUserId = {};
    Object.entries(parsed).forEach(([userId, value]) => {
      if (!userId || typeof value !== "object" || !value) return;
      const snapshot = sanitizeLandlordSnapshot(
        value as Partial<Room["landlord"]>,
      );
      if (snapshot) {
        snapshots[userId] = snapshot;
      }
    });
    return snapshots;
  } catch {
    return {};
  }
};

const persistLandlordSnapshots = (snapshots: LandlordSnapshotsByUserId) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LANDLORD_SNAPSHOTS_STORAGE_KEY,
    JSON.stringify(snapshots),
  );
};

const persistFavorites = (favoriteIds: string[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
};

const getDisplayName = (authUser: SupabaseAuthUser) => {
  const metadata = authUser.user_metadata;

  if (typeof metadata?.full_name === "string" && metadata.full_name.trim()) {
    return metadata.full_name;
  }

  if (typeof metadata?.name === "string" && metadata.name.trim()) {
    return metadata.name;
  }

  if (authUser.email) {
    return authUser.email.split("@")[0] || "User";
  }

  return "User";
};

const getAvatar = (authUser: SupabaseAuthUser) => {
  const metadata = authUser.user_metadata;

  if (typeof metadata?.avatar_url === "string" && metadata.avatar_url.trim()) {
    return metadata.avatar_url;
  }

  if (typeof metadata?.picture === "string" && metadata.picture.trim()) {
    return metadata.picture;
  }

  return "";
};

const readPendingRoleFromStorage = (): UserRole | null => {
  if (typeof window === "undefined") return null;
  const role = window.localStorage.getItem(PENDING_ROLE_STORAGE_KEY);
  return isUserRole(role) ? role : null;
};

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

const toNumberSafe = (value: string | number) => {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string) => UUID_PATTERN.test(value);

const mapRentalRowToRoom = (
  row: RentalRow,
  landlordSnapshot?: LandlordSnapshot | null,
): Room | null => {
  const roomCountText = row.no_of_rooms === 1 ? "1 room" : `${row.no_of_rooms} rooms`;
  const configurationLabel = getFlatConfigurationLabel({
    rental_type: row.rental_type,
    configuration: row.configuration,
    config_unit: row.config_unit,
  });
  const fallbackDescription =
    row.rental_type === "flat"
      ? `${configurationLabel ?? "Flat configuration"}, water: ${row.water_facility.replaceAll("_", " ")}, bathroom: ${row.bathroom_type}.`
      : `${roomCountText}, water: ${row.water_facility.replaceAll("_", " ")}, bathroom: ${row.bathroom_type}.`;
  return normalizeRoom({
    id: row.rental_id,
    rental_id: row.rental_id,
    user_id: row.user_id,
    title: `${rentalTypeLabels[row.rental_type]} in ${row.location}`,
    description:
      typeof row.description === "string" && row.description.trim()
        ? row.description
        : fallbackDescription,
    location: row.location,
    images: Array.isArray(row.images)
      ? row.images.filter((image): image is string => typeof image === "string")
      : [],
    rental_type: row.rental_type,
    no_of_rooms: row.no_of_rooms,
    configuration: row.configuration,
    config_unit: row.config_unit,
    rent: toNumberSafe(row.rent),
    status: row.status,
    is_kitchen: row.is_kitchen,
    bathroom_type: row.bathroom_type,
    water_facility: row.water_facility,
    landlord: {
      id: row.user_id,
      name: landlordSnapshot?.name ?? "Landlord",
      email: landlordSnapshot?.email ?? "",
      avatar: landlordSnapshot?.avatar ?? "",
      verified: landlordSnapshot?.verified ?? false,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [postedRooms, setPostedRooms] = useState<Room[]>([]);
  const [landlordSnapshotsByUserId, setLandlordSnapshotsByUserId] =
    useState<LandlordSnapshotsByUserId>({});
  const [bookings, setBookings] = useState<Booking[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Load local app data on mount
    localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
    const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const savedRooms = localStorage.getItem(POSTED_ROOMS_STORAGE_KEY);
    const savedBookings = localStorage.getItem(BOOKING_STORAGE_KEY);
    const savedLandlordSnapshots = readLandlordSnapshotsFromStorage();

    if (savedFavorites) {
      try {
        const parsedFavorites = JSON.parse(savedFavorites);
        if (Array.isArray(parsedFavorites)) {
          const normalizedFavorites = parsedFavorites.filter(
            (favoriteId): favoriteId is string =>
              typeof favoriteId === "string" && isUuid(favoriteId),
          );
          setFavorites(normalizedFavorites);
          persistFavorites(normalizedFavorites);
        }
      } catch {
        localStorage.removeItem(FAVORITES_STORAGE_KEY);
      }
    }
    if (Object.keys(savedLandlordSnapshots).length > 0) {
      setLandlordSnapshotsByUserId(savedLandlordSnapshots);
      persistLandlordSnapshots(savedLandlordSnapshots);
    }
    if (savedRooms) {
      try {
        const parsedRooms = JSON.parse(savedRooms);
        if (Array.isArray(parsedRooms)) {
          const normalizedRooms = parsedRooms
            .map((room) => normalizeRoom(room))
            .filter(
              (room): room is Room =>
                room !== null &&
                isUuid(room.rental_id) &&
                isUuid(room.id) &&
                isUuid(room.user_id),
            );
          setPostedRooms(normalizedRooms);
          localStorage.setItem(
            POSTED_ROOMS_STORAGE_KEY,
            JSON.stringify(normalizedRooms),
          );
        }
      } catch {
        localStorage.removeItem(POSTED_ROOMS_STORAGE_KEY);
      }
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

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    const fetchRentals = async () => {
      const { data, error } = await supabase
        .from("rentals")
        .select(
          "rental_id, user_id, rental_type, location, description, images, no_of_rooms, configuration, config_unit, rent, status, is_kitchen, bathroom_type, water_facility, created_at, updated_at",
        )
        .order("created_at", { ascending: false });

      if (error || !data || !isMounted) {
        return;
      }

      const rentalRows = data as RentalRow[];
      setPostedRooms((prev) => {
        const previousRoomMap = new Map(
          prev.map((room) => [room.rental_id, room] as const),
        );

        const mappedRooms = rentalRows
          .map((row) => {
            const previousRoom = previousRoomMap.get(row.rental_id);
            const currentUserSnapshot =
              user && user.id === row.user_id ? snapshotFromUser(user) : null;
            const cachedSnapshot = landlordSnapshotsByUserId[row.user_id] ?? null;
            const previousSnapshot = sanitizeLandlordSnapshot(
              previousRoom?.landlord,
            );

            return mapRentalRowToRoom(
              row,
              currentUserSnapshot ?? cachedSnapshot ?? previousSnapshot,
            );
          })
          .filter((room): room is Room => room !== null);

        localStorage.setItem(
          POSTED_ROOMS_STORAGE_KEY,
          JSON.stringify(mappedRooms),
        );
        return mappedRooms;
      });
    };

    void fetchRentals();

    const rentalsChannel = supabase
      .channel("rentals_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rentals" },
        () => {
          void fetchRentals();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(rentalsChannel);
    };
  }, [landlordSnapshotsByUserId, supabase, user]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    if (!user || user.role !== "tenant") {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
      return;
    }

    let isMounted = true;

    const fetchFavorites = async () => {
      const { data, error } = await supabase
        .from("rental_favorites")
        .select("rental_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error || !isMounted) {
        return;
      }

      const favoriteIds = (data as FavoriteRow[] | null | undefined)
        ?.map((favorite) => favorite.rental_id)
        .filter((favoriteId): favoriteId is string => isUuid(favoriteId)) ?? [];

      setFavorites(favoriteIds);
      persistFavorites(favoriteIds);
    };

    void fetchFavorites();

    const favoritesChannel = supabase
      .channel(`rental_favorites_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rental_favorites",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void fetchFavorites();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(favoritesChannel);
    };
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    const upsertProfile = async (authUser: SupabaseAuthUser, role: UserRole) => {
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: authUser.id, role }, { onConflict: "id" })
        .select("role, phone, phone_verified")
        .maybeSingle();

      if (error) {
        return null;
      }

      return data as ProfileRow | null;
    };

    const fetchProfile = async (authUser: SupabaseAuthUser) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, phone, phone_verified")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) {
        return null;
      }

      return data as ProfileRow | null;
    };

    const syncAppUser = async (authUser: SupabaseAuthUser | null) => {
      if (!isMounted) return;

      if (!authUser) {
        setUser(null);
        setFavorites([]);
        localStorage.removeItem(FAVORITES_STORAGE_KEY);
        return;
      }

      const pendingRole = readPendingRoleFromStorage();
      let profile = await fetchProfile(authUser);

      const profileRole = isUserRole(profile?.role) ? profile.role : null;
      let resolvedRole: UserRole = profileRole ?? pendingRole ?? "tenant";

      if (!profile || !profileRole) {
        const upserted = await upsertProfile(authUser, resolvedRole);
        if (upserted) {
          profile = upserted;
          resolvedRole = isUserRole(upserted.role) ? upserted.role : resolvedRole;
        }
      }

      if (pendingRole) {
        localStorage.removeItem(PENDING_ROLE_STORAGE_KEY);
      }

      const nextUser: User = {
        id: authUser.id,
        name: getDisplayName(authUser),
        email: authUser.email ?? "",
        avatar: getAvatar(authUser),
        role: resolvedRole,
        verified: Boolean(profile?.phone_verified),
        phone: profile?.phone ?? undefined,
      };

      if (isMounted) {
        setUser(nextUser);
        if (nextUser.role !== "tenant") {
          setFavorites([]);
          localStorage.removeItem(FAVORITES_STORAGE_KEY);
        }
        setLandlordSnapshotsByUserId((prev) => {
          const nextSnapshot = snapshotFromUser(nextUser);
          const currentSnapshot = prev[nextUser.id];
          if (
            currentSnapshot &&
            currentSnapshot.name === nextSnapshot.name &&
            currentSnapshot.email === nextSnapshot.email &&
            currentSnapshot.avatar === nextSnapshot.avatar &&
            currentSnapshot.verified === nextSnapshot.verified
          ) {
            return prev;
          }

          const nextSnapshots = {
            ...prev,
            [nextUser.id]: nextSnapshot,
          };
          persistLandlordSnapshots(nextSnapshots);
          return nextSnapshots;
        });
      }
    };

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await syncAppUser(session?.user ?? null);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncAppUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = (role: UserRole) => {
    if (!supabase || typeof window === "undefined") {
      return;
    }

    localStorage.setItem(PENDING_ROLE_STORAGE_KEY, role);
    const next = `${window.location.pathname}${window.location.search}`;
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", next);
    redirectTo.searchParams.set("role", role);

    void supabase.auth
      .signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })
      .then(({ error }) => {
        if (error) {
          localStorage.removeItem(PENDING_ROLE_STORAGE_KEY);
        }
      });
  };

  const logout = () => {
    setUser(null);
    setFavorites([]);
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    localStorage.removeItem(PENDING_ROLE_STORAGE_KEY);
    if (supabase) {
      void supabase.auth.signOut();
    }
  };

  const verifyPhone = (phone: string) => {
    if (user) {
      const normalizedPhone = normalizeNepaliPhone(phone);
      if (!normalizedPhone) {
        return;
      }

      const verifiedAt = new Date().toISOString();
      const updatedUser = { ...user, verified: true, phone: normalizedPhone };
      setUser(updatedUser);
      setLandlordSnapshotsByUserId((prev) => {
        const nextSnapshot = snapshotFromUser(updatedUser);
        const currentSnapshot = prev[updatedUser.id];
        if (
          currentSnapshot &&
          currentSnapshot.name === nextSnapshot.name &&
          currentSnapshot.email === nextSnapshot.email &&
          currentSnapshot.avatar === nextSnapshot.avatar &&
          currentSnapshot.verified === nextSnapshot.verified
        ) {
          return prev;
        }

        const nextSnapshots = {
          ...prev,
          [updatedUser.id]: nextSnapshot,
        };
        persistLandlordSnapshots(nextSnapshots);
        return nextSnapshots;
      });

      if (supabase) {
        void supabase.from("profiles").upsert(
          {
            id: user.id,
            role: user.role,
            phone: normalizedPhone,
            phone_verified: true,
            phone_verified_at: verifiedAt,
          },
          { onConflict: "id" },
        );
      }
    }
  };

  const addFavorite = (roomId: string) => {
    if (
      !isUuid(roomId) ||
      !user ||
      user.role !== "tenant" ||
      favorites.includes(roomId)
    ) {
      return;
    }
    const newFavorites = [...favorites, roomId];
    setFavorites(newFavorites);
    persistFavorites(newFavorites);

    if (!supabase) {
      return;
    }

    void supabase
      .from("rental_favorites")
      .upsert(
        {
          user_id: user.id,
          rental_id: roomId,
        },
        { onConflict: "user_id,rental_id" },
      )
      .then(({ error }) => {
        if (!error) {
          return;
        }

        setFavorites((prev) => {
          if (!prev.includes(roomId)) {
            return prev;
          }
          const reverted = prev.filter((id) => id !== roomId);
          persistFavorites(reverted);
          return reverted;
        });
      });
  };

  const removeFavorite = (roomId: string) => {
    if (
      !isUuid(roomId) ||
      !user ||
      user.role !== "tenant" ||
      !favorites.includes(roomId)
    ) {
      return;
    }
    const newFavorites = favorites.filter((id) => id !== roomId);
    setFavorites(newFavorites);
    persistFavorites(newFavorites);

    if (!supabase) {
      return;
    }

    void supabase
      .from("rental_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("rental_id", roomId)
      .then(({ error }) => {
        if (!error) {
          return;
        }

        setFavorites((prev) => {
          if (prev.includes(roomId)) {
            return prev;
          }
          const reverted = [roomId, ...prev];
          persistFavorites(reverted);
          return reverted;
        });
      });
  };

  const addRoom = async (room: NewRoomInput): Promise<AddRoomResult> => {
    if (!supabase) {
      return { success: false, error: "Supabase client is unavailable." };
    }

    if (!user || user.role !== "landlord") {
      return { success: false, error: "Only landlords can post rentals." };
    }

    const normalizedRoomCount =
      room.rental_type === "flat"
        ? Math.max(1, room.config_unit ?? room.no_of_rooms)
        : room.rental_type === "single_room"
          ? 1
          : Math.max(1, room.no_of_rooms);
    const normalizedConfiguration =
      room.rental_type === "flat" ? (room.configuration ?? "bhk") : null;
    const normalizedConfigUnit =
      room.rental_type === "flat"
        ? Math.max(1, room.config_unit ?? normalizedRoomCount)
        : null;

    const insertPayload = {
      user_id: user.id,
      rental_type: room.rental_type,
      location: room.location,
      description: room.description,
      images: room.images,
      no_of_rooms: normalizedRoomCount,
      configuration: normalizedConfiguration,
      config_unit: normalizedConfigUnit,
      rent: room.rent,
      status: "available" as const,
      is_kitchen: room.rental_type === "flat" ? true : room.is_kitchen,
      bathroom_type: room.bathroom_type,
      water_facility: room.water_facility,
    };

    const { data, error } = await supabase
      .from("rentals")
      .insert(insertPayload)
      .select(
        "rental_id, user_id, rental_type, location, description, images, no_of_rooms, configuration, config_unit, rent, status, is_kitchen, bathroom_type, water_facility, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      return {
        success: false,
        error: error?.message || "Failed to save rental listing.",
      };
    }

    const normalizedRoom = mapRentalRowToRoom(
      data as RentalRow,
      snapshotFromUser(user),
    );
    if (!normalizedRoom) {
      return {
        success: false,
        error: "Rental was saved but could not be mapped for display.",
      };
    }

    setPostedRooms((prev) => {
      const newRooms = [
        normalizedRoom,
        ...prev.filter((item) => item.rental_id !== normalizedRoom.rental_id),
      ];
      localStorage.setItem(POSTED_ROOMS_STORAGE_KEY, JSON.stringify(newRooms));
      return newRooms;
    });

    return { success: true, room: normalizedRoom };
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
