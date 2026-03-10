"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  SupabaseClient,
  User as SupabaseAuthUser,
} from "@supabase/supabase-js";
import {
  getFlatConfigurationLabel,
  normalizeRoom,
  rentalTypeLabels,
  type Room,
  type User,
} from "./mock-data";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isUserRole, type UserRole } from "@/lib/auth/roles";
import { normalizeGoogleMapsUrl } from "@/lib/google-maps";
import { normalizeNepaliPhone } from "@/lib/phone";
import { ENABLE_BOOKING_REQUESTS, ENABLE_FAVORITES } from "@/lib/launch-flags";

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
  sharedLandlordPhone?: string;
  sharedLandlordPhoneAt?: string;
  sharedLocationUrl?: string;
  sharedLocationAt?: string;
}

type NewBookingInput = Omit<
  Booking,
  | "id"
  | "createdAt"
  | "status"
  | "reviewedAt"
  | "reviewMessage"
  | "sharedLandlordPhone"
  | "sharedLandlordPhoneAt"
  | "sharedLocationUrl"
  | "sharedLocationAt"
>;

export type NewRoomInput = Pick<
  Room,
  | "rental_type"
  | "location"
  | "google_maps_url"
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

type RoomMutationResult =
  | { success: true; room: Room }
  | { success: false; error: string };

type RoomActionResult =
  | { success: true }
  | { success: false; error: string };

type BookingRequestResult =
  | { success: true; booking: Booking }
  | {
      success: false;
      code:
        | "disabled"
        | "unavailable"
        | "unauthorized"
        | "duplicate"
        | "invalid"
        | "error";
      error: string;
    };

export type BookingMutationResult =
  | { success: true }
  | {
      success: false;
      code:
        | "disabled"
        | "unavailable"
        | "unauthorized"
        | "invalid"
        | "error";
      error: string;
    };

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
  updateRoom: (roomId: string, room: NewRoomInput) => Promise<RoomMutationResult>;
  updateRoomStatus: (
    roomId: string,
    status: Room["status"],
  ) => Promise<RoomMutationResult>;
  deleteRoom: (roomId: string) => Promise<RoomActionResult>;
  bookings: Booking[];
  addBooking: (booking: NewBookingInput) => Promise<BookingRequestResult>;
  cancelBooking: (bookingId: string) => Promise<BookingMutationResult>;
  deleteBooking: (bookingId: string) => Promise<BookingMutationResult>;
  shareBookingContact: (bookingId: string) => Promise<BookingMutationResult>;
  shareBookingLocation: (
    bookingId: string,
    sharedLocationUrl: string,
  ) => Promise<BookingMutationResult>;
  updateBookingStatus: (
    bookingId: string,
    status: "approved" | "rejected",
    reviewMessage?: string,
  ) => Promise<BookingMutationResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  landlord_name: string | null;
  landlord_email: string | null;
  landlord_avatar_url: string | null;
  landlord_phone_verified: boolean | null;
  created_at: string;
  updated_at: string;
}

interface RentalPrivateDetailRow {
  rental_id: string;
  owner_user_id: string;
  google_maps_url: string | null;
}

interface BookingRequestRow {
  booking_request_id: string;
  rental_id: string;
  tenant_id: string;
  landlord_id: string;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  tenant_message: string | null;
  move_in_date: string;
  stay_duration_months: number;
  status: BookingStatus;
  created_at: string;
  reviewed_at: string | null;
  review_message: string | null;
  shared_landlord_phone: string | null;
  shared_landlord_phone_at: string | null;
  shared_location_url: string | null;
  shared_location_at: string | null;
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

const toIsoStringSafe = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeMoveInDate = (value: string) => {
  if (DATE_ONLY_PATTERN.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
};

const snapshotFromRentalRow = (
  row: Pick<
    RentalRow,
    | "landlord_name"
    | "landlord_email"
    | "landlord_avatar_url"
    | "landlord_phone_verified"
  >,
) =>
  sanitizeLandlordSnapshot({
    name: row.landlord_name ?? undefined,
    email: row.landlord_email ?? undefined,
    avatar: row.landlord_avatar_url ?? undefined,
    verified: row.landlord_phone_verified ?? undefined,
  });

const BOOKING_REQUEST_SELECT =
  "booking_request_id, rental_id, tenant_id, landlord_id, tenant_name, tenant_email, tenant_phone, tenant_message, move_in_date, stay_duration_months, status, created_at, reviewed_at, review_message, shared_landlord_phone, shared_landlord_phone_at, shared_location_url, shared_location_at";

const RENTAL_SELECT =
  "rental_id, user_id, rental_type, location, description, images, no_of_rooms, configuration, config_unit, rent, status, is_kitchen, bathroom_type, water_facility, landlord_name, landlord_email, landlord_avatar_url, landlord_phone_verified, created_at, updated_at";

const RENTAL_PRIVATE_DETAILS_SELECT =
  "rental_id, owner_user_id, google_maps_url";

const mapBookingRequestRow = (row: BookingRequestRow): Booking => ({
  id: row.booking_request_id,
  roomId: row.rental_id,
  userId: row.tenant_id,
  landlordId: row.landlord_id,
  tenantName: row.tenant_name,
  tenantEmail: row.tenant_email,
  tenantPhone: row.tenant_phone,
  tenantMessage:
    typeof row.tenant_message === "string" && row.tenant_message.trim()
      ? row.tenant_message
      : undefined,
  moveInDate: row.move_in_date,
  stayDurationMonths: row.stay_duration_months,
  status: row.status,
  createdAt: toIsoStringSafe(row.created_at, new Date().toISOString()),
  reviewedAt:
    typeof row.reviewed_at === "string"
      ? toIsoStringSafe(row.reviewed_at, new Date().toISOString())
      : undefined,
  reviewMessage:
    typeof row.review_message === "string" && row.review_message.trim()
      ? row.review_message
      : undefined,
  sharedLandlordPhone:
    typeof row.shared_landlord_phone === "string" &&
    row.shared_landlord_phone.trim()
      ? row.shared_landlord_phone
      : undefined,
  sharedLandlordPhoneAt:
    typeof row.shared_landlord_phone_at === "string"
      ? toIsoStringSafe(row.shared_landlord_phone_at, new Date().toISOString())
      : undefined,
  sharedLocationUrl:
    typeof row.shared_location_url === "string" && row.shared_location_url.trim()
      ? row.shared_location_url
      : undefined,
  sharedLocationAt:
    typeof row.shared_location_at === "string"
      ? toIsoStringSafe(row.shared_location_at, new Date().toISOString())
      : undefined,
});

const persistPostedRooms = (rooms: Room[]) => {
  if (typeof window === "undefined") return;
  const sanitizedRooms = rooms.map((room) => ({
    ...room,
    google_maps_url: "",
  }));
  window.localStorage.setItem(
    POSTED_ROOMS_STORAGE_KEY,
    JSON.stringify(sanitizedRooms),
  );
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
  googleMapsUrl = "",
): Room | null => {
  const persistedLandlordSnapshot = snapshotFromRentalRow(row);
  const resolvedLandlordSnapshot = landlordSnapshot ?? persistedLandlordSnapshot;
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
    google_maps_url: googleMapsUrl,
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
      name: resolvedLandlordSnapshot?.name ?? "Landlord",
      email: resolvedLandlordSnapshot?.email ?? "",
      avatar: resolvedLandlordSnapshot?.avatar ?? "",
      verified: resolvedLandlordSnapshot?.verified ?? false,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
};

const syncLandlordRentalSnapshot = async ({
  supabase,
  nextUser,
}: {
  supabase: SupabaseClient | null;
  nextUser: User;
}) => {
  if (!supabase || nextUser.role !== "landlord") {
    return;
  }

  await supabase
    .from("rentals")
    .update({
      landlord_name: nextUser.name.trim() || "Landlord",
      landlord_email: nextUser.email.trim(),
      landlord_avatar_url: nextUser.avatar.trim(),
      landlord_phone_verified: nextUser.verified,
    })
    .eq("user_id", nextUser.id);
};

const upsertRentalPrivateDetails = async ({
  supabase,
  userId,
  rentalId,
  googleMapsUrl,
}: {
  supabase: SupabaseClient;
  userId: string;
  rentalId: string;
  googleMapsUrl: string;
}) => {
  return supabase.from("rental_private_details").upsert(
    {
      rental_id: rentalId,
      owner_user_id: userId,
      google_maps_url: googleMapsUrl,
    },
    { onConflict: "rental_id" },
  );
};

const buildRentalPayload = ({
  user,
  room,
  fallbackStatus = "available" as const,
}: {
  user: User;
  room: NewRoomInput;
  fallbackStatus?: Room["status"];
}) => {
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

  return {
    user_id: user.id,
    rental_type: room.rental_type,
    location: room.location,
    description: room.description,
    images: room.images,
    no_of_rooms: normalizedRoomCount,
    configuration: normalizedConfiguration,
    config_unit: normalizedConfigUnit,
    rent: room.rent,
    status: fallbackStatus,
    is_kitchen: room.rental_type === "flat" ? true : room.is_kitchen,
    bathroom_type: room.bathroom_type,
    water_facility: room.water_facility,
    landlord_name: user.name.trim() || "Landlord",
    landlord_email: user.email.trim(),
    landlord_avatar_url: user.avatar.trim(),
    landlord_phone_verified: user.verified,
  };
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
    const savedLandlordSnapshots = readLandlordSnapshotsFromStorage();

    if (ENABLE_FAVORITES && savedFavorites) {
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
    } else if (!ENABLE_FAVORITES) {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
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
        .select(RENTAL_SELECT)
        .order("created_at", { ascending: false });

      if (error || !data || !isMounted) {
        return;
      }

      const rentalRows = data as RentalRow[];
      let privateDetailsByRentalId: Record<string, string> = {};

      if (user?.role === "landlord") {
        const { data: privateDetailsData } = await supabase
          .from("rental_private_details")
          .select(RENTAL_PRIVATE_DETAILS_SELECT)
          .eq("owner_user_id", user.id);

        privateDetailsByRentalId =
          (privateDetailsData as RentalPrivateDetailRow[] | null | undefined)
            ?.reduce<Record<string, string>>((acc, detail) => {
              if (
                typeof detail.rental_id === "string" &&
                typeof detail.google_maps_url === "string"
              ) {
                acc[detail.rental_id] = detail.google_maps_url;
              }
              return acc;
            }, {}) ?? {};
      }

      setPostedRooms((prev) => {
        const previousRoomMap = new Map(
          prev.map((room) => [room.rental_id, room] as const),
        );

        const mappedRooms = rentalRows
          .map((row) => {
            const previousRoom = previousRoomMap.get(row.rental_id);
            const currentUserSnapshot =
              user && user.id === row.user_id ? snapshotFromUser(user) : null;
            const rowSnapshot = snapshotFromRentalRow(row);
            const cachedSnapshot = landlordSnapshotsByUserId[row.user_id] ?? null;
            const previousSnapshot = sanitizeLandlordSnapshot(
              previousRoom?.landlord,
            );

            return mapRentalRowToRoom(
              row,
              currentUserSnapshot ??
                rowSnapshot ??
                cachedSnapshot ??
                previousSnapshot,
              row.user_id === user?.id
                ? privateDetailsByRentalId[row.rental_id] ?? ""
                : "",
            );
          })
          .filter((room): room is Room => room !== null);

        persistPostedRooms(mappedRooms);
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

    if (!ENABLE_FAVORITES || !user || user.role !== "tenant") {
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
    if (!ENABLE_BOOKING_REQUESTS || !user || !supabase) {
      return;
    }

    let isMounted = true;

    const fetchBookings = async () => {
      let query = supabase
        .from("booking_requests")
        .select(BOOKING_REQUEST_SELECT)
        .order("created_at", { ascending: false });

      query =
        user.role === "landlord"
          ? query.eq("landlord_id", user.id)
          : query.eq("tenant_id", user.id);

      const { data, error } = await query;

      if (error || !isMounted) {
        return;
      }

      const nextBookings =
        (data as BookingRequestRow[] | null | undefined)?.map(
          mapBookingRequestRow,
        ) ?? [];
      setBookings(nextBookings);
    };

    void fetchBookings();

    const filter =
      user.role === "landlord"
        ? `landlord_id=eq.${user.id}`
        : `tenant_id=eq.${user.id}`;

    const bookingRequestsChannel = supabase
      .channel(`booking_requests_${user.role}_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "booking_requests",
          filter,
        },
        () => {
          void fetchBookings();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(bookingRequestsChannel);
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
        setBookings([]);
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
        if (!ENABLE_FAVORITES || nextUser.role !== "tenant") {
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
        void syncLandlordRentalSnapshot({ supabase, nextUser });
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
    setBookings([]);
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

      void syncLandlordRentalSnapshot({ supabase, nextUser: updatedUser });
    }
  };

  const addFavorite = (roomId: string) => {
    if (
      !ENABLE_FAVORITES ||
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
      !ENABLE_FAVORITES ||
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

  const upsertLocalRoom = (nextRoom: Room) => {
    setPostedRooms((prev) => {
      const nextRooms = [
        nextRoom,
        ...prev.filter((item) => item.rental_id !== nextRoom.rental_id),
      ];
      persistPostedRooms(nextRooms);
      return nextRooms;
    });
  };

  const removeLocalRoom = (roomId: string) => {
    setPostedRooms((prev) => {
      const nextRooms = prev.filter((item) => item.rental_id !== roomId);
      persistPostedRooms(nextRooms);
      return nextRooms;
    });
  };

  const addRoom = async (room: NewRoomInput): Promise<AddRoomResult> => {
    if (!supabase) {
      return { success: false, error: "Supabase client is unavailable." };
    }

    if (!user || user.role !== "landlord") {
      return { success: false, error: "Only landlords can post rentals." };
    }

    const normalizedGoogleMapsUrl = normalizeGoogleMapsUrl(room.google_maps_url);
    if (normalizedGoogleMapsUrl === null) {
      return {
        success: false,
        error: "Please enter a valid Google Maps share URL.",
      };
    }

    const { data, error } = await supabase
      .from("rentals")
      .insert(buildRentalPayload({ user, room }))
      .select(RENTAL_SELECT)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: error?.message || "Failed to save rental listing.",
      };
    }

    const { error: privateDetailsError } = await upsertRentalPrivateDetails({
      supabase,
      userId: user.id,
      rentalId: (data as RentalRow).rental_id,
      googleMapsUrl: normalizedGoogleMapsUrl,
    });

    if (privateDetailsError) {
      return {
        success: false,
        error: privateDetailsError.message || "Failed to save the Google Maps pin.",
      };
    }

    const normalizedRoom = mapRentalRowToRoom(
      data as RentalRow,
      snapshotFromUser(user),
      normalizedGoogleMapsUrl,
    );
    if (!normalizedRoom) {
      return {
        success: false,
        error: "Rental was saved but could not be mapped for display.",
      };
    }

    upsertLocalRoom(normalizedRoom);

    return { success: true, room: normalizedRoom };
  };

  const updateRoom = async (
    roomId: string,
    room: NewRoomInput,
  ): Promise<RoomMutationResult> => {
    if (!supabase) {
      return { success: false, error: "Supabase client is unavailable." };
    }

    if (!user || user.role !== "landlord") {
      return { success: false, error: "Only landlords can update rentals." };
    }

    const existingRoom = postedRooms.find((item) => item.rental_id === roomId);
    if (!existingRoom || existingRoom.user_id !== user.id) {
      return { success: false, error: "Rental listing not found." };
    }

    const normalizedGoogleMapsUrl = normalizeGoogleMapsUrl(room.google_maps_url);
    if (normalizedGoogleMapsUrl === null) {
      return {
        success: false,
        error: "Please enter a valid Google Maps share URL.",
      };
    }

    const { data, error } = await supabase
      .from("rentals")
      .update(
        buildRentalPayload({
          user,
          room,
          fallbackStatus: existingRoom.status,
        }),
      )
      .eq("rental_id", roomId)
      .eq("user_id", user.id)
      .select(RENTAL_SELECT)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: error?.message || "Failed to update rental listing.",
      };
    }

    const { error: privateDetailsError } = await upsertRentalPrivateDetails({
      supabase,
      userId: user.id,
      rentalId: roomId,
      googleMapsUrl: normalizedGoogleMapsUrl,
    });

    if (privateDetailsError) {
      return {
        success: false,
        error: privateDetailsError.message || "Failed to save the Google Maps pin.",
      };
    }

    const normalizedRoom = mapRentalRowToRoom(
      data as RentalRow,
      snapshotFromUser(user),
      normalizedGoogleMapsUrl,
    );
    if (!normalizedRoom) {
      return {
        success: false,
        error: "Rental was updated but could not be mapped for display.",
      };
    }

    upsertLocalRoom(normalizedRoom);

    return { success: true, room: normalizedRoom };
  };

  const updateRoomStatus = async (
    roomId: string,
    status: Room["status"],
  ): Promise<RoomMutationResult> => {
    if (!supabase) {
      return { success: false, error: "Supabase client is unavailable." };
    }

    if (!user || user.role !== "landlord") {
      return { success: false, error: "Only landlords can update listing status." };
    }

    const existingRoom = postedRooms.find((item) => item.rental_id === roomId);
    if (!existingRoom || existingRoom.user_id !== user.id) {
      return { success: false, error: "Rental listing not found." };
    }

    const { data, error } = await supabase
      .from("rentals")
      .update({ status })
      .eq("rental_id", roomId)
      .eq("user_id", user.id)
      .select(RENTAL_SELECT)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: error?.message || "Failed to update listing status.",
      };
    }

    const normalizedRoom = mapRentalRowToRoom(
      data as RentalRow,
      snapshotFromUser(user),
      existingRoom.google_maps_url,
    );
    if (!normalizedRoom) {
      return {
        success: false,
        error: "Listing status was updated but could not be mapped for display.",
      };
    }

    upsertLocalRoom(normalizedRoom);

    return { success: true, room: normalizedRoom };
  };

  const deleteRoom = async (roomId: string): Promise<RoomActionResult> => {
    if (!supabase) {
      return { success: false, error: "Supabase client is unavailable." };
    }

    if (!user || user.role !== "landlord") {
      return { success: false, error: "Only landlords can delete rentals." };
    }

    const { error } = await supabase
      .from("rentals")
      .delete()
      .eq("rental_id", roomId)
      .eq("user_id", user.id);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to delete rental listing.",
      };
    }

    removeLocalRoom(roomId);

    return { success: true };
  };

  const addBooking = async (
    booking: NewBookingInput,
  ): Promise<BookingRequestResult> => {
    if (!ENABLE_BOOKING_REQUESTS) {
      return {
        success: false,
        code: "disabled",
        error: "Booking requests are currently disabled.",
      };
    }

    if (!supabase) {
      return {
        success: false,
        code: "unavailable",
        error: "Supabase client is unavailable.",
      };
    }

    if (
      !user ||
      user.role !== "tenant" ||
      user.id !== booking.userId ||
      booking.landlordId === user.id
    ) {
      return {
        success: false,
        code: "unauthorized",
        error: "Only verified tenant accounts can send booking requests.",
      };
    }

    const normalizedMoveInDate = normalizeMoveInDate(booking.moveInDate);
    if (!normalizedMoveInDate) {
      return {
        success: false,
        code: "invalid",
        error: "Please select a valid move-in date.",
      };
    }

    const hasActiveRequest = bookings.some(
      (existingBooking) =>
        existingBooking.roomId === booking.roomId &&
        existingBooking.userId === booking.userId &&
        (existingBooking.status === "pending" ||
          existingBooking.status === "approved"),
    );
    if (hasActiveRequest) {
      return {
        success: false,
        code: "duplicate",
        error: "You already have an active request for this listing.",
      };
    }

    const { data, error } = await supabase
      .from("booking_requests")
      .insert({
        rental_id: booking.roomId,
        tenant_id: booking.userId,
        landlord_id: booking.landlordId,
        tenant_name: booking.tenantName.trim() || "Tenant",
        tenant_email: booking.tenantEmail.trim(),
        tenant_phone: booking.tenantPhone.trim(),
        tenant_message: booking.tenantMessage?.trim() || null,
        move_in_date: normalizedMoveInDate,
        stay_duration_months: booking.stayDurationMonths,
      })
      .select(BOOKING_REQUEST_SELECT)
      .single();

    if (error || !data) {
      const isDuplicate =
        error?.code === "23505" ||
        error?.message?.includes("booking_requests_one_active_request_idx");

      return {
        success: false,
        code: isDuplicate ? "duplicate" : "error",
        error: isDuplicate
          ? "You already have an active request for this listing."
          : error?.message || "Failed to send booking request.",
      };
    }

    const nextBooking = mapBookingRequestRow(data as BookingRequestRow);
    setBookings((prev) => [
      nextBooking,
      ...prev.filter((item) => item.id !== nextBooking.id),
    ]);

    return { success: true, booking: nextBooking };
  };

  const cancelBooking = async (
    bookingId: string,
  ): Promise<BookingMutationResult> => {
    if (!ENABLE_BOOKING_REQUESTS) {
      return {
        success: false,
        code: "disabled",
        error: "Booking requests are currently disabled.",
      };
    }

    if (!supabase) {
      return {
        success: false,
        code: "unavailable",
        error: "Supabase client is unavailable.",
      };
    }

    const currentBooking = bookings.find((booking) => booking.id === bookingId);
    if (!currentBooking) {
      return {
        success: false,
        code: "invalid",
        error: "Booking request not found.",
      };
    }

    if (!user || user.id !== currentBooking.userId) {
      return {
        success: false,
        code: "unauthorized",
        error: "Only the tenant can cancel this request.",
      };
    }

    if (
      currentBooking.status !== "pending" &&
      currentBooking.status !== "approved"
    ) {
      return {
        success: false,
        code: "invalid",
        error: "Only active requests can be cancelled.",
      };
    }

    const { data, error } = await supabase
      .from("booking_requests")
      .update({ status: "cancelled" as const })
      .eq("booking_request_id", bookingId)
      .select(BOOKING_REQUEST_SELECT)
      .single();

    if (error || !data) {
      return {
        success: false,
        code: "error",
        error: error?.message || "Failed to cancel booking request.",
      };
    }

    const nextBooking = mapBookingRequestRow(data as BookingRequestRow);
    setBookings((prev) =>
      prev.map((booking) => (booking.id === nextBooking.id ? nextBooking : booking)),
    );

    return { success: true };
  };

  const updateBookingStatus = async (
    bookingId: string,
    status: "approved" | "rejected",
    reviewMessage?: string,
  ): Promise<BookingMutationResult> => {
    if (!ENABLE_BOOKING_REQUESTS) {
      return {
        success: false,
        code: "disabled",
        error: "Booking requests are currently disabled.",
      };
    }

    if (!supabase) {
      return {
        success: false,
        code: "unavailable",
        error: "Supabase client is unavailable.",
      };
    }

    const currentBooking = bookings.find((booking) => booking.id === bookingId);
    if (!currentBooking) {
      return {
        success: false,
        code: "invalid",
        error: "Booking request not found.",
      };
    }

    if (!user || user.id !== currentBooking.landlordId) {
      return {
        success: false,
        code: "unauthorized",
        error: "Only the landlord can review this request.",
      };
    }

    if (currentBooking.status !== "pending") {
      return {
        success: false,
        code: "invalid",
        error: "Only pending requests can be reviewed.",
      };
    }

    const reviewedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("booking_requests")
      .update({
        status,
        reviewed_at: reviewedAt,
        review_message: reviewMessage?.trim() || null,
      })
      .eq("booking_request_id", bookingId)
      .select(BOOKING_REQUEST_SELECT)
      .single();

    if (error || !data) {
      return {
        success: false,
        code: "error",
        error: error?.message || "Failed to update booking request.",
      };
    }

    const nextBooking = mapBookingRequestRow(data as BookingRequestRow);
    setBookings((prev) =>
      prev.map((booking) => (booking.id === nextBooking.id ? nextBooking : booking)),
    );

    return { success: true };
  };

  const deleteBooking = async (
    bookingId: string,
  ): Promise<BookingMutationResult> => {
    if (!ENABLE_BOOKING_REQUESTS) {
      return {
        success: false,
        code: "disabled",
        error: "Booking requests are currently disabled.",
      };
    }

    if (!supabase) {
      return {
        success: false,
        code: "unavailable",
        error: "Supabase client is unavailable.",
      };
    }

    const currentBooking = bookings.find((booking) => booking.id === bookingId);
    if (!currentBooking) {
      return {
        success: false,
        code: "invalid",
        error: "Booking request not found.",
      };
    }

    if (!user || user.id !== currentBooking.userId) {
      return {
        success: false,
        code: "unauthorized",
        error: "Only the tenant can delete this request.",
      };
    }

    if (currentBooking.status !== "cancelled") {
      return {
        success: false,
        code: "invalid",
        error: "Only cancelled requests can be deleted.",
      };
    }

    const { error } = await supabase
      .from("booking_requests")
      .delete()
      .eq("booking_request_id", bookingId)
      .eq("tenant_id", user.id);

    if (error) {
      return {
        success: false,
        code: "error",
        error: error.message || "Failed to delete booking request.",
      };
    }

    setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));

    return { success: true };
  };

  const shareBookingContact = async (
    bookingId: string,
  ): Promise<BookingMutationResult> => {
    if (!ENABLE_BOOKING_REQUESTS) {
      return {
        success: false,
        code: "disabled",
        error: "Booking requests are currently disabled.",
      };
    }

    if (!supabase) {
      return {
        success: false,
        code: "unavailable",
        error: "Supabase client is unavailable.",
      };
    }

    const currentBooking = bookings.find((booking) => booking.id === bookingId);
    if (!currentBooking) {
      return {
        success: false,
        code: "invalid",
        error: "Booking request not found.",
      };
    }

    if (!user || user.id !== currentBooking.landlordId) {
      return {
        success: false,
        code: "unauthorized",
        error: "Only the landlord can share contact details.",
      };
    }

    if (
      currentBooking.status !== "pending" &&
      currentBooking.status !== "approved"
    ) {
      return {
        success: false,
        code: "invalid",
        error: "Contact can only be shared for pending or approved requests.",
      };
    }

    const normalizedSharedPhone = normalizeNepaliPhone(user.phone ?? "");
    if (!normalizedSharedPhone) {
      return {
        success: false,
        code: "invalid",
        error: "Verify your landlord phone number before sharing it.",
      };
    }

    const sharedLandlordPhoneAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("booking_requests")
      .update({
        shared_landlord_phone: normalizedSharedPhone,
        shared_landlord_phone_at: sharedLandlordPhoneAt,
      })
      .eq("booking_request_id", bookingId)
      .select(BOOKING_REQUEST_SELECT)
      .single();

    if (error || !data) {
      return {
        success: false,
        code: "error",
        error: error?.message || "Failed to share landlord contact number.",
      };
    }

    const nextBooking = mapBookingRequestRow(data as BookingRequestRow);
    setBookings((prev) =>
      prev.map((booking) => (booking.id === nextBooking.id ? nextBooking : booking)),
    );

    return { success: true };
  };

  const shareBookingLocation = async (
    bookingId: string,
    sharedLocationUrl: string,
  ): Promise<BookingMutationResult> => {
    if (!ENABLE_BOOKING_REQUESTS) {
      return {
        success: false,
        code: "disabled",
        error: "Booking requests are currently disabled.",
      };
    }

    if (!supabase) {
      return {
        success: false,
        code: "unavailable",
        error: "Supabase client is unavailable.",
      };
    }

    const currentBooking = bookings.find((booking) => booking.id === bookingId);
    if (!currentBooking) {
      return {
        success: false,
        code: "invalid",
        error: "Booking request not found.",
      };
    }

    if (!user || user.id !== currentBooking.landlordId) {
      return {
        success: false,
        code: "unauthorized",
        error: "Only the landlord can share the rental location.",
      };
    }

    if (currentBooking.status !== "approved") {
      return {
        success: false,
        code: "invalid",
        error: "Approve the request before sharing the exact location.",
      };
    }

    const normalizedSharedLocationUrl =
      normalizeGoogleMapsUrl(sharedLocationUrl);
    if (!normalizedSharedLocationUrl) {
      return {
        success: false,
        code: "invalid",
        error: "Add a valid Google Maps pin to the listing before sharing it.",
      };
    }

    const sharedLocationAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("booking_requests")
      .update({
        status: "approved" as const,
        shared_location_url: normalizedSharedLocationUrl,
        shared_location_at: sharedLocationAt,
      })
      .eq("booking_request_id", bookingId)
      .select(BOOKING_REQUEST_SELECT)
      .single();

    if (error || !data) {
      return {
        success: false,
        code: "error",
        error: error?.message || "Failed to share the Google Maps location.",
      };
    }

    const nextBooking = mapBookingRequestRow(data as BookingRequestRow);
    setBookings((prev) =>
      prev.map((booking) => (booking.id === nextBooking.id ? nextBooking : booking)),
    );

    return { success: true };
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
        updateRoom,
        updateRoomStatus,
        deleteRoom,
        bookings,
        addBooking,
        cancelBooking,
        deleteBooking,
        shareBookingContact,
        shareBookingLocation,
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
