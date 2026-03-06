export const RENTAL_TYPES = ["single_room", "multiple_room", "flat"] as const;
export type RentalType = (typeof RENTAL_TYPES)[number];

export const CONFIGURATIONS = ["bhk", "bk"] as const;
export type Configuration = (typeof CONFIGURATIONS)[number];

export const RENTAL_STATUSES = ["available", "rented", "inactive"] as const;
export type RentalStatus = (typeof RENTAL_STATUSES)[number];

export const BATHROOM_TYPES = ["attached", "shared"] as const;
export type BathroomType = (typeof BATHROOM_TYPES)[number];

export const WATER_FACILITIES = [
  "supply_24x7",
  "limited_supply",
  "tanker",
] as const;
export type WaterFacility = (typeof WATER_FACILITIES)[number];

export const rentalTypeLabels: Record<RentalType, string> = {
  single_room: "Single Room",
  multiple_room: "Multiple Room",
  flat: "Flat",
};

export const configurationLabels: Record<Configuration, string> = {
  bhk: "BHK",
  bk: "BK",
};

export const rentalStatusLabels: Record<RentalStatus, string> = {
  available: "Available",
  rented: "Rented",
  inactive: "Inactive",
};

export const bathroomTypeLabels: Record<BathroomType, string> = {
  attached: "Attached",
  shared: "Shared",
};

export const waterFacilityLabels: Record<WaterFacility, string> = {
  supply_24x7: "24/7 Supply",
  limited_supply: "Limited Supply",
  tanker: "Tanker",
};

export interface Room {
  // UI route id (kept for compatibility with existing favorites/bookings).
  id: string;
  rental_id: string;
  user_id: string;
  title: string;
  description: string;
  location: string;
  images: string[];
  rental_type: RentalType;
  no_of_rooms: number;
  configuration: Configuration | null;
  config_unit: number | null;
  rent: number;
  status: RentalStatus;
  is_kitchen: boolean;
  bathroom_type: BathroomType;
  water_facility: WaterFacility;
  landlord: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    verified: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "tenant" | "landlord";
  verified: boolean;
  phone?: string;
}

const isRentalType = (value: unknown): value is RentalType =>
  typeof value === "string" &&
  (RENTAL_TYPES as readonly string[]).includes(value);

const isConfiguration = (value: unknown): value is Configuration =>
  typeof value === "string" &&
  (CONFIGURATIONS as readonly string[]).includes(value);

const isRentalStatus = (value: unknown): value is RentalStatus =>
  typeof value === "string" &&
  (RENTAL_STATUSES as readonly string[]).includes(value);

const isBathroomType = (value: unknown): value is BathroomType =>
  typeof value === "string" &&
  (BATHROOM_TYPES as readonly string[]).includes(value);

const isWaterFacility = (value: unknown): value is WaterFacility =>
  typeof value === "string" &&
  (WATER_FACILITIES as readonly string[]).includes(value);

const toPositiveInteger = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
  }
  return fallback;
};

const toPositiveNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallback;
};

const toIsoStringSafe = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
};

const legacyTypeToRentalType = (value: unknown): RentalType => {
  if (isRentalType(value)) return value;
  if (value === "single") return "single_room";
  if (value === "double") return "multiple_room";
  if (value === "apartment" || value === "studio") return "flat";
  return "single_room";
};

const readLegacyBhkUnit = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d+)/);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const getFlatConfigurationLabel = (
  room: Pick<Room, "rental_type" | "configuration" | "config_unit">,
): string | null => {
  if (room.rental_type !== "flat") {
    return null;
  }

  const size =
    typeof room.config_unit === "number" && room.config_unit > 0
      ? room.config_unit
      : 1;
  const configType = room.configuration ?? "bhk";

  return `${size}${configurationLabels[configType]}`;
};

export const normalizeRoom = (room: unknown): Room | null => {
  if (!room || typeof room !== "object") return null;

  const raw = room as Partial<Room> & {
    type?: string;
    price?: number;
    configuration?: Configuration | null;
    config_unit?: number | null;
    unit_config_type?: Configuration | null;
    unit_config_size?: number | null;
    bhk_type?: string | null;
    facilities?: {
      bathroom?: boolean;
      kitchen?: boolean;
      waterSupply?: boolean;
    };
    createdAt?: string;
    landlord?: Partial<Room["landlord"]>;
  };

  const rentalId =
    typeof raw.rental_id === "string" && raw.rental_id.trim()
      ? raw.rental_id
      : typeof raw.id === "string" && raw.id.trim()
        ? raw.id
        : "";

  if (!rentalId) return null;

  const rent = toPositiveNumber(raw.rent ?? raw.price, 0);
  if (rent <= 0) return null;

  const rentalType = legacyTypeToRentalType(raw.rental_type ?? raw.type);
  const noOfRooms = toPositiveInteger(
    raw.no_of_rooms,
    rentalType === "multiple_room" ? 2 : 1,
  );
  const configurationCandidate = raw.configuration ?? raw.unit_config_type;
  const resolvedConfiguration =
    rentalType === "flat"
      ? isConfiguration(configurationCandidate)
        ? configurationCandidate
        : "bhk"
      : null;
  const resolvedConfigUnit =
    rentalType === "flat"
      ? toPositiveInteger(
          raw.config_unit ?? raw.unit_config_size,
          readLegacyBhkUnit(raw.bhk_type) ?? 1,
        )
      : null;
  const normalizedRoomCount =
    rentalType === "flat" && resolvedConfigUnit
      ? resolvedConfigUnit
      : noOfRooms;
  const nowIso = new Date().toISOString();
  const landlordId =
    typeof raw.user_id === "string" && raw.user_id.trim()
      ? raw.user_id
      : typeof raw.landlord?.id === "string" && raw.landlord.id.trim()
        ? raw.landlord.id
        : "";

  return {
    id:
      typeof raw.id === "string" && raw.id.trim()
        ? raw.id
        : rentalId,
    rental_id: rentalId,
    user_id: landlordId,
    title:
      typeof raw.title === "string" && raw.title.trim()
        ? raw.title
        : "Untitled Rental",
    description:
      typeof raw.description === "string" && raw.description.trim()
        ? raw.description
        : "No description provided.",
    location:
      typeof raw.location === "string" && raw.location.trim()
        ? raw.location
        : "Unknown location",
    images: Array.isArray(raw.images)
      ? raw.images.filter((image): image is string => typeof image === "string")
      : [],
    rental_type: rentalType,
    no_of_rooms: normalizedRoomCount,
    configuration: resolvedConfiguration,
    config_unit: resolvedConfigUnit,
    rent,
    status: isRentalStatus(raw.status) ? raw.status : "available",
    is_kitchen:
      rentalType === "flat"
        ? true
        : typeof raw.is_kitchen === "boolean"
          ? raw.is_kitchen
          : Boolean(raw.facilities?.kitchen),
    bathroom_type: isBathroomType(raw.bathroom_type)
      ? raw.bathroom_type
      : raw.facilities?.bathroom
        ? "attached"
        : "shared",
    water_facility: isWaterFacility(raw.water_facility)
      ? raw.water_facility
      : raw.facilities?.waterSupply
        ? "supply_24x7"
        : "limited_supply",
    landlord: {
      id: landlordId,
      name:
        typeof raw.landlord?.name === "string" && raw.landlord.name.trim()
          ? raw.landlord.name
          : "Landlord",
      email:
        typeof raw.landlord?.email === "string" && raw.landlord.email.trim()
          ? raw.landlord.email
          : "",
      avatar:
        typeof raw.landlord?.avatar === "string" ? raw.landlord.avatar : "",
      verified:
        typeof raw.landlord?.verified === "boolean"
          ? raw.landlord.verified
          : false,
    },
    created_at: toIsoStringSafe(raw.created_at ?? raw.createdAt, nowIso),
    updated_at: toIsoStringSafe(raw.updated_at, nowIso),
  };
};

export const features = [
  {
    title: "Verified Listings",
    description:
      "All our listings are verified to ensure you get what you see. No hidden surprises.",
    icon: "shield",
  },
  {
    title: "Direct Communication",
    description:
      "Connect directly with landlords without any middlemen or hidden fees.",
    icon: "message",
  },
  {
    title: "Long-Term Rentals",
    description:
      "Send long-term rental requests with preferred move-in dates and stay duration.",
    icon: "calendar",
  },
  {
    title: "Secure Payments",
    description:
      "Your payments are protected with our secure transaction system.",
    icon: "lock",
  },
];
