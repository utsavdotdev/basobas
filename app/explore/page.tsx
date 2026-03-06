"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  bathroomTypeLabels,
  configurationLabels,
  normalizeRoom,
  rentalStatusLabels,
  rentalTypeLabels,
  waterFacilityLabels,
  type Room,
} from "@/lib/mock-data";
import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal, X, Grid3X3, List } from "lucide-react";
import { formatNPR } from "@/lib/currency";

type EnumFilter<T extends string> = T | "all";
type UnitConfigSizeFilter = "all" | "1" | "2" | "3";
const DEFAULT_RENT_MIN = 0;
const DEFAULT_RENT_MAX = 5000;
const RENT_STEP = 100;

interface Filters {
  search: string;
  location: string;
  rental_type: EnumFilter<Room["rental_type"]>;
  configuration: EnumFilter<Exclude<Room["configuration"], null>>;
  config_unit: UnitConfigSizeFilter;
  status: EnumFilter<Room["status"]>;
  bathroom_type: EnumFilter<Room["bathroom_type"]>;
  water_facility: EnumFilter<Room["water_facility"]>;
  is_kitchen: boolean;
  min_rooms: number;
  rentRange: [number, number];
  sortBy: "newest" | "oldest" | "rent-low" | "rent-high";
}

const initialFilters: Filters = {
  search: "",
  location: "",
  rental_type: "all",
  configuration: "all",
  config_unit: "all",
  status: "all",
  bathroom_type: "all",
  water_facility: "all",
  is_kitchen: false,
  min_rooms: 0,
  rentRange: [DEFAULT_RENT_MIN, DEFAULT_RENT_MAX],
  sortBy: "newest",
};

const parseLegacyTypeToRentalType = (
  value: string | null,
): Filters["rental_type"] => {
  if (!value) return "all";
  if (value === "single_room" || value === "multiple_room" || value === "flat") {
    return value;
  }
  if (value === "single") return "single_room";
  if (value === "double") return "multiple_room";
  if (value === "studio" || value === "apartment") return "flat";
  return "all";
};

function ExploreContent() {
  const searchParams = useSearchParams();
  const { postedRooms } = useAuth();
  const [filters, setFilters] = useState<Filters>(() => {
    const search = searchParams.get("search") || "";
    const location = searchParams.get("location") || "";
    const rental_type = parseLegacyTypeToRentalType(searchParams.get("type"));
    const price = searchParams.get("price");

    let rentRange: [number, number] = [DEFAULT_RENT_MIN, DEFAULT_RENT_MAX];
    if (price) {
      if (price === "0-1000") rentRange = [0, 1000];
      else if (price === "1000-2000") rentRange = [1000, 2000];
      else if (price === "2000-3000") rentRange = [2000, 3000];
      else if (price === "3000+") rentRange = [3000, DEFAULT_RENT_MAX];
    }

    return {
      ...initialFilters,
      search,
      location,
      rental_type,
      rentRange,
    };
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const allRooms = useMemo(() => {
    return postedRooms
      .map((room) => normalizeRoom(room))
      .filter((room): room is Room => room !== null);
  }, [postedRooms]);

  const rentSliderMax = useMemo(() => {
    const maxRent = allRooms.reduce((max, room) => Math.max(max, room.rent), 0);
    const roundedMax = Math.ceil(maxRent / RENT_STEP) * RENT_STEP;
    return Math.max(DEFAULT_RENT_MAX, roundedMax);
  }, [allRooms]);

  const effectiveRentRange = useMemo<[number, number]>(() => {
    const min = Math.max(DEFAULT_RENT_MIN, filters.rentRange[0]);
    const rawMax =
      filters.rentRange[1] === DEFAULT_RENT_MAX
        ? rentSliderMax
        : filters.rentRange[1];
    const max = Math.max(min, Math.min(rawMax, rentSliderMax));
    return [min, max];
  }, [filters.rentRange, rentSliderMax]);

  const filteredRooms = useMemo(() => {
    let rooms = allRooms.filter((room) => {
      if (
        filters.search &&
        !room.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !room.location.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.location &&
        !room.location.toLowerCase().includes(filters.location.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.rental_type !== "all" &&
        room.rental_type !== filters.rental_type
      ) {
        return false;
      }

      const hasConfigFilter =
        filters.configuration !== "all" || filters.config_unit !== "all";
      if (hasConfigFilter && room.rental_type !== "flat") {
        return false;
      }

      if (
        filters.configuration !== "all" &&
        room.configuration !== filters.configuration
      ) {
        return false;
      }

      if (
        filters.config_unit !== "all" &&
        room.config_unit !== Number(filters.config_unit)
      ) {
        return false;
      }

      if (filters.status !== "all" && room.status !== filters.status) {
        return false;
      }

      if (
        filters.bathroom_type !== "all" &&
        room.bathroom_type !== filters.bathroom_type
      ) {
        return false;
      }

      if (
        filters.water_facility !== "all" &&
        room.water_facility !== filters.water_facility
      ) {
        return false;
      }

      if (filters.is_kitchen && !room.is_kitchen) {
        return false;
      }

      if (room.no_of_rooms < filters.min_rooms) {
        return false;
      }

      if (
        room.rent < effectiveRentRange[0] ||
        room.rent > effectiveRentRange[1]
      ) {
        return false;
      }

      return true;
    });

    switch (filters.sortBy) {
      case "rent-low":
        rooms = rooms.sort((a, b) => a.rent - b.rent);
        break;
      case "rent-high":
        rooms = rooms.sort((a, b) => b.rent - a.rent);
        break;
      case "oldest":
        rooms = rooms.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        break;
      case "newest":
      default:
        rooms = rooms.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
    }

    return rooms;
  }, [allRooms, effectiveRentRange, filters]);

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const handleRentalTypeFilterChange = (value: Filters["rental_type"]) => {
    setFilters((prev) => {
      if (value === "flat") {
        return {
          ...prev,
          rental_type: value,
          is_kitchen: false,
        };
      }

      return {
        ...prev,
        rental_type: value,
        configuration: "all",
        config_unit: "all",
      };
    });
  };

  const canFilterByFlatConfig = filters.rental_type === "flat";

  const activeFilterCount = [
    filters.search !== "",
    filters.location !== "",
    filters.rental_type !== "all",
    filters.configuration !== "all",
    filters.config_unit !== "all",
    filters.status !== "all",
    filters.bathroom_type !== "all",
    filters.water_facility !== "all",
    filters.is_kitchen,
    filters.min_rooms > 0,
    filters.rentRange[0] !== DEFAULT_RENT_MIN ||
      filters.rentRange[1] !== DEFAULT_RENT_MAX,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Explore Rentals</h1>
          <p className="text-muted-foreground">
            {filteredRooms.length} listings available
          </p>
        </div>

        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="secondary" className="gap-2 pl-3">
                Search: {filters.search}
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, search: "" }))
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.location && (
              <Badge variant="secondary" className="gap-2 pl-3">
                Location: {filters.location}
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, location: "" }))
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.rental_type !== "all" && (
              <Badge variant="secondary">
                {rentalTypeLabels[filters.rental_type]}
              </Badge>
            )}
            {filters.configuration !== "all" && (
              <Badge variant="secondary">
                Config: {configurationLabels[filters.configuration]}
              </Badge>
            )}
            {filters.config_unit !== "all" && (
              <Badge variant="secondary">
                Config Unit: {filters.config_unit}
              </Badge>
            )}
            {filters.status !== "all" && (
              <Badge variant="secondary">
                {rentalStatusLabels[filters.status]}
              </Badge>
            )}
            {filters.bathroom_type !== "all" && (
              <Badge variant="secondary">
                Bathroom: {bathroomTypeLabels[filters.bathroom_type]}
              </Badge>
            )}
            {filters.water_facility !== "all" && (
              <Badge variant="secondary">
                Water: {waterFacilityLabels[filters.water_facility]}
              </Badge>
            )}
            {filters.is_kitchen && (
              <Badge variant="secondary">Kitchen Access</Badge>
            )}
            {filters.min_rooms > 0 && (
              <Badge variant="secondary">Min rooms: {filters.min_rooms}</Badge>
            )}
            {(filters.rentRange[0] !== DEFAULT_RENT_MIN ||
              filters.rentRange[1] !== DEFAULT_RENT_MAX) && (
              <Badge variant="secondary">
                Rent: {formatNPR(effectiveRentRange[0])} -{" "}
                {formatNPR(effectiveRentRange[1])}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-6 gap-1 px-2"
            >
              <X className="h-3 w-3" />
              Clear all
            </Button>
          </div>
        )}

        <div className="flex gap-6">
          <aside className="hidden w-72 flex-shrink-0 lg:block">
            <div className="sticky top-24 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="location" className="text-sm font-semibold">
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="Search location..."
                  value={filters.location}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-3 border-t pt-6">
                <Label className="text-sm font-semibold">Rental Type</Label>
                <Select
                  value={filters.rental_type}
                  onValueChange={(value) =>
                    handleRentalTypeFilterChange(value as Filters["rental_type"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.entries(rentalTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Configuration</Label>
                <Select
                  value={filters.configuration}
                  disabled={!canFilterByFlatConfig}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      configuration: value as Filters["configuration"],
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.entries(configurationLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!canFilterByFlatConfig && (
                  <p className="text-xs text-muted-foreground">
                    Select rental type as Flat to filter by configuration.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Config Unit</Label>
                <Select
                  value={filters.config_unit}
                  disabled={!canFilterByFlatConfig}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      config_unit: value as Filters["config_unit"],
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All sizes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sizes</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Listing Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value as Filters["status"],
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.entries(rentalStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 border-t pt-6">
                <Label className="text-sm font-semibold">
                  Facilities & Attributes
                </Label>
                {filters.rental_type !== "flat" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="is_kitchen"
                        checked={filters.is_kitchen}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({
                            ...prev,
                            is_kitchen: checked === true,
                          }))
                        }
                      />
                      <label htmlFor="is_kitchen" className="text-sm font-medium">
                        Kitchen Access Available
                      </label>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Flat listings include kitchen by default.
                  </p>
                )}
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">
                    Bathroom Type
                  </Label>
                  <Select
                    value={filters.bathroom_type}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        bathroom_type: value as Filters["bathroom_type"],
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All bathroom types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All bathroom types</SelectItem>
                      {Object.entries(bathroomTypeLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">
                    Water Facility
                  </Label>
                  <Select
                    value={filters.water_facility}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        water_facility: value as Filters["water_facility"],
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All water options" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All water options</SelectItem>
                      {Object.entries(waterFacilityLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_rooms" className="text-xs text-muted-foreground">
                    Minimum Number of Rooms
                  </Label>
                  <Input
                    id="min_rooms"
                    type="number"
                    min={0}
                    value={filters.min_rooms}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        min_rooms: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <Label className="text-sm font-semibold">Rent Range</Label>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="min-w-0">
                      Min:{" "}
                      <strong className="break-words">
                        {formatNPR(effectiveRentRange[0])}
                      </strong>
                    </span>
                    <span className="min-w-0 text-right">
                      Max:{" "}
                      <strong className="break-words">
                        {formatNPR(effectiveRentRange[1])}
                      </strong>
                    </span>
                  </div>
                  <Slider
                    value={effectiveRentRange}
                    min={DEFAULT_RENT_MIN}
                    max={rentSliderMax}
                    step={RENT_STEP}
                    onValueChange={(value) => {
                      const [nextMin, nextMax] = value as [number, number];
                      setFilters((prev) => ({
                        ...prev,
                        rentRange: [
                          Math.max(DEFAULT_RENT_MIN, nextMin),
                          nextMax >= rentSliderMax ? DEFAULT_RENT_MAX : nextMax,
                        ],
                      }));
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto min-h-8 whitespace-normal px-2 py-2 text-[11px] leading-tight"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, rentRange: [0, 1000] }))
                      }
                    >
                      Up to {formatNPR(1000)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto min-h-8 whitespace-normal px-2 py-2 text-[11px] leading-tight"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          rentRange: [1000, 2000],
                        }))
                      }
                    >
                      {formatNPR(1000)} - {formatNPR(2000)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-2 h-auto min-h-8 whitespace-normal px-2 py-2 text-[11px] leading-tight"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          rentRange: [2000, DEFAULT_RENT_MAX],
                        }))
                      }
                    >
                      {formatNPR(2000)}+
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t pt-6">
                <Label className="text-sm font-semibold">Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: value as Filters["sortBy"],
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="rent-low">Rent: Low to High</SelectItem>
                    <SelectItem value="rent-high">Rent: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Refine your search by rental schema fields
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="mobile-location">Location</Label>
                      <Input
                        id="mobile-location"
                        value={filters.location}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Rental Type</Label>
                      <Select
                        value={filters.rental_type}
                        onValueChange={(value) =>
                          handleRentalTypeFilterChange(
                            value as Filters["rental_type"],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All types</SelectItem>
                          {Object.entries(rentalTypeLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Configuration</Label>
                      <Select
                        value={filters.configuration}
                        disabled={!canFilterByFlatConfig}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            configuration: value as Filters["configuration"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All types</SelectItem>
                          {Object.entries(configurationLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Config Unit</Label>
                      <Select
                        value={filters.config_unit}
                        disabled={!canFilterByFlatConfig}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            config_unit: value as Filters["config_unit"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All sizes</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {filters.rental_type !== "flat" ? (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="mobile_kitchen"
                          checked={filters.is_kitchen}
                          onCheckedChange={(checked) =>
                            setFilters((prev) => ({
                              ...prev,
                              is_kitchen: checked === true,
                            }))
                          }
                        />
                        <label htmlFor="mobile_kitchen" className="text-sm">
                          Kitchen Access Available
                        </label>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Kitchen is included for flat listings.
                      </p>
                    )}

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            status: value as Filters["status"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          {Object.entries(rentalStatusLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Bathroom</Label>
                      <Select
                        value={filters.bathroom_type}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            bathroom_type: value as Filters["bathroom_type"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All bathroom types</SelectItem>
                          {Object.entries(bathroomTypeLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Water</Label>
                      <Select
                        value={filters.water_facility}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            water_facility: value as Filters["water_facility"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All water options</SelectItem>
                          {Object.entries(waterFacilityLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile-min-rooms">Min Rooms</Label>
                      <Input
                        id="mobile-min-rooms"
                        type="number"
                        min={0}
                        value={filters.min_rooms}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            min_rooms: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Sort By</Label>
                      <Select
                        value={filters.sortBy}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            sortBy: value as Filters["sortBy"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="rent-low">
                            Rent: Low to High
                          </SelectItem>
                          <SelectItem value="rent-high">
                            Rent: High to Low
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2 border-l pl-4">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/25 py-12 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-1 text-lg font-semibold">
                  No rentals found
                </h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting schema filters and rent range
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    : "space-y-4"
                }
              >
                {filteredRooms.map((room) => (
                  <RoomCard key={room.id} room={room} viewMode={viewMode} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}
    >
      <ExploreContent />
    </Suspense>
  );
}
