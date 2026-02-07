"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { mockRooms } from "@/lib/mock-data";
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

interface Filters {
  search: string;
  location: string;
  type: string;
  bathroom: boolean;
  kitchen: boolean;
  wifi: boolean;
  waterSupply: boolean;
  parking: boolean;
  furnished: boolean;
  priceRange: [number, number];
  sortBy: string;
}

const initialFilters: Filters = {
  search: "",
  location: "",
  type: "all",
  bathroom: false,
  kitchen: false,
  wifi: false,
  waterSupply: false,
  parking: false,
  furnished: false,
  priceRange: [0, 5000],
  sortBy: "newest",
};

function ExploreContent() {
  const searchParams = useSearchParams();
  const { postedRooms } = useAuth();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize filters from URL params - only once
  useEffect(() => {
    if (isInitialized) return;

    const search = searchParams.get("search") || "";
    const location = searchParams.get("location") || "";
    const type = searchParams.get("type") || "all";
    const price = searchParams.get("price");

    let priceRange: [number, number] = [0, 5000];
    if (price) {
      if (price === "0-1000") priceRange = [0, 1000];
      else if (price === "1000-2000") priceRange = [1000, 2000];
      else if (price === "2000-3000") priceRange = [2000, 3000];
      else if (price === "3000+") priceRange = [3000, 5000];
    }

    setFilters({
      ...initialFilters,
      search,
      location,
      type,
      priceRange,
    });
    setIsInitialized(true);
  }, [searchParams, isInitialized]);

  // Combine mock rooms with user-posted rooms
  const allRooms = useMemo(() => {
    return [...mockRooms, ...postedRooms];
  }, [postedRooms]);

  // Filter and sort rooms
  const filteredRooms = useMemo(() => {
    let rooms = allRooms.filter((room) => {
      // Search filter
      if (
        filters.search &&
        !room.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !room.location.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Location filter
      if (
        filters.location &&
        !room.location.toLowerCase().includes(filters.location.toLowerCase())
      ) {
        return false;
      }

      // Type filter
      if (filters.type !== "all" && room.type !== filters.type) {
        return false;
      }

      // Facility filters
      if (filters.bathroom && !room.facilities.bathroom) return false;
      if (filters.kitchen && !room.facilities.kitchen) return false;
      if (filters.wifi && !room.facilities.wifi) return false;
      if (filters.waterSupply && !room.facilities.waterSupply) return false;
      if (filters.parking && !room.facilities.parking) return false;
      if (filters.furnished && !room.facilities.furnished) return false;

      // Price filter
      if (
        room.price < filters.priceRange[0] ||
        room.price > filters.priceRange[1]
      ) {
        return false;
      }

      return true;
    });

    // Sort
    switch (filters.sortBy) {
      case "price-low":
        rooms = rooms.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        rooms = rooms.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        rooms = rooms.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "oldest":
        rooms = rooms.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
    }

    return rooms;
  }, [allRooms, filters]);

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const activeFilterCount = [
    filters.search !== "",
    filters.location !== "",
    filters.type !== "all",
    filters.bathroom,
    filters.kitchen,
    filters.wifi,
    filters.waterSupply,
    filters.parking,
    filters.furnished,
    filters.priceRange[0] !== 0 || filters.priceRange[1] !== 5000,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Explore Rooms</h1>
          <p className="text-muted-foreground">
            {filteredRooms.length} rooms available
          </p>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="secondary" className="gap-2 pl-3">
                Search: {filters.search}
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, search: "" }))
                  }
                  className="hover:bg-background/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.type !== "all" && (
              <Badge variant="secondary" className="gap-2 pl-3">
                Type: {filters.type}
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, type: "all" }))
                  }
                  className="hover:bg-background/20"
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
                  className="hover:bg-background/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-6 gap-1 px-2"
              >
                <X className="h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Location Search */}
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
                  className="h-10"
                />
              </div>

              {/* Room Type */}
              <div className="space-y-3 border-t pt-6">
                <Label className="text-sm font-semibold">Room Type</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="single">Single Room</SelectItem>
                    <SelectItem value="double">Double Room</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Facilities */}
              <div className="space-y-3 border-t pt-6">
                <Label className="text-sm font-semibold">
                  Facilities & Amenities
                </Label>
                <div className="space-y-3">
                  {[
                    { id: "bathroom", label: "Private Bathroom" },
                    { id: "kitchen", label: "Kitchen Access" },
                    { id: "wifi", label: "WiFi Included" },
                    { id: "waterSupply", label: "24/7 Water Supply" },
                    { id: "parking", label: "Parking Space" },
                    { id: "furnished", label: "Fully Furnished" },
                  ].map((facility) => (
                    <div key={facility.id} className="flex items-center gap-2">
                      <Checkbox
                        id={facility.id}
                        checked={
                          filters[facility.id as keyof typeof filters] === true
                        }
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({
                            ...prev,
                            [facility.id]: checked,
                          }))
                        }
                      />
                      <label
                        htmlFor={facility.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {facility.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4 border-t pt-6">
                <Label className="text-sm font-semibold">Price Range</Label>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Min:{" "}
                      <span className="font-medium text-foreground">
                        ${filters.priceRange[0]}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      Max:{" "}
                      <span className="font-medium text-foreground">
                        ${filters.priceRange[1]}
                      </span>
                    </span>
                  </div>
                  <div className="px-1">
                    <Slider
                      value={filters.priceRange}
                      min={0}
                      max={5000}
                      step={100}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          priceRange: value as [number, number],
                        }))
                      }
                      className="py-2"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          priceRange: [0, 1000],
                        }))
                      }
                      className="text-xs h-8"
                    >
                      Under $1k
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          priceRange: [1000, 2000],
                        }))
                      }
                      className="text-xs h-8"
                    >
                      $1k - $2k
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          priceRange: [2000, 5000],
                        }))
                      }
                      className="text-xs h-8"
                    >
                      $2k+
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-3 border-t pt-6">
                <Label className="text-sm font-semibold">Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, sortBy: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price-low">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-high">
                      Price: High to Low
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter + View Toggle */}
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
                      Refine your search to find the perfect room
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {/* Location Search */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="mobile-location"
                        className="text-sm font-semibold"
                      >
                        Location
                      </Label>
                      <Input
                        id="mobile-location"
                        placeholder="Search location..."
                        value={filters.location}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        className="h-10"
                      />
                    </div>

                    {/* Room Type */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Room Type</Label>
                      <Select
                        value={filters.type}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All types</SelectItem>
                          <SelectItem value="single">Single Room</SelectItem>
                          <SelectItem value="double">Double Room</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Facilities */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">
                        Facilities
                      </Label>
                      <div className="space-y-3">
                        {[
                          { id: "bathroom", label: "Private Bathroom" },
                          { id: "kitchen", label: "Kitchen Access" },
                          { id: "wifi", label: "WiFi Included" },
                          { id: "waterSupply", label: "24/7 Water Supply" },
                          { id: "parking", label: "Parking Space" },
                          { id: "furnished", label: "Fully Furnished" },
                        ].map((facility) => (
                          <div
                            key={facility.id}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={facility.id}
                              checked={
                                filters[facility.id as keyof typeof filters] ===
                                true
                              }
                              onCheckedChange={(checked) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  [facility.id]: checked,
                                }))
                              }
                            />
                            <label
                              htmlFor={facility.id}
                              className="text-sm font-medium"
                            >
                              {facility.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sort By */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Sort By</Label>
                      <Select
                        value={filters.sortBy}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, sortBy: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="price-low">
                            Price: Low to High
                          </SelectItem>
                          <SelectItem value="price-high">
                            Price: High to Low
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

            {/* Results */}
            {filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/25 py-12 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-1 text-lg font-semibold">No rooms found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters to find what you're looking for
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
