"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Home, DollarSign } from "lucide-react";

export function HeroSection() {
  const router = useRouter();
  const [searchLocation, setSearchLocation] = useState("");
  const [roomType, setRoomType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.set("search", searchLocation);
    if (roomType !== "all") params.set("type", roomType);
    if (priceRange !== "all") params.set("price", priceRange);
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <section className="relative pt-20">
      {/* Hero Image Background */}
      <div className="absolute inset-0 h-full w-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1920&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/45" />
        </div>
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 flex min-h-[600px] flex-col items-center justify-center px-4 py-20 text-center">
        {/* Main Heading */}
        <div className="mb-12 max-w-4xl">
          <h1 className="text-balance text-5xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
            The Best Way to <br /> find Your Space
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Discover your perfect rental home in our premium collection
          </p>
        </div>

        {/* Centered Search Box */}
        <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl md:p-8">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Location Search */}
            <div className="md:col-span-2">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                <MapPin className="h-4 w-4" />
                Location
              </label>
              <Input
                placeholder="Enter location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-12 border-0 bg-gray-100 text-foreground placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-foreground"
              />
            </div>

            {/* Room Type */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                <Home className="h-4 w-4" />
                Type
              </label>
              <Select value={roomType} onValueChange={setRoomType}>
                <SelectTrigger className="bg-gray-100 text-foreground w-full">
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

            {/* Price Range */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                <DollarSign className="h-4 w-4" />
                Budget
              </label>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className=" border-0 bg-gray-100 text-foreground w-full">
                  <SelectValue placeholder="Any price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any price</SelectItem>
                  <SelectItem value="0-1000">$0 - $1k</SelectItem>
                  <SelectItem value="1000-2000">$1k - $2k</SelectItem>
                  <SelectItem value="2000-3000">$2k - $3k</SelectItem>
                  <SelectItem value="3000+">$3k+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            size="lg"
            className="mt-6 w-full gap-2 rounded-full bg-foreground text-white hover:bg-foreground/90 md:mt-4 md:w-auto md:px-8"
          >
            <Search className="h-5 w-5" />
            Search Rooms
          </Button>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12">
          <p className="text-white/70">
            Trusted by thousands of renters and landlords
          </p>
        </div>
      </div>
    </section>
  );
}
