"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { Room } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Wifi, Bath, Car } from "lucide-react";

const defaultRoomImages = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
];

interface RoomCardProps {
  room: Room;
  viewMode?: "grid" | "list";
}

export function RoomCard({ room, viewMode = "grid" }: RoomCardProps) {
  const { user, favorites, addFavorite, removeFavorite } = useAuth();
  const isFavorite = favorites.includes(room.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavorite) {
      removeFavorite(room.id);
    } else {
      addFavorite(room.id);
    }
  };

  const getImageUrl = () => {
    if (room.images && room.images.length > 0 && room.images[0]) {
      return room.images[0];
    }
    const numericId = parseInt(room.id.replace(/\D/g, "") || "0", 10);
    const index = numericId % defaultRoomImages.length;
    console.log(index);
    return defaultRoomImages[index];
  };

  // Quick amenities display (max 3)
  const amenities = [];
  if (room.facilities.wifi) amenities.push({ icon: Wifi, label: "WiFi" });
  if (room.facilities.bathroom) amenities.push({ icon: Bath, label: "Bath" });
  if (room.facilities.parking) amenities.push({ icon: Car, label: "Parking" });

  if (viewMode === "list") {
    return (
      <Card className="group overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="relative aspect-[4/3] w-full sm:aspect-auto sm:h-36 sm:w-48 flex-shrink-0">
            <Link href={`/room/${room.id}`}>
              <Image
                src={getImageUrl()}
                alt={room.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
            {user && (
              <button
                onClick={handleFavoriteClick}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-background"
                aria-label={
                  isFavorite ? "Remove from favorites" : "Add to favorites"
                }
              >
                <Heart
                  className={`h-4 w-4 ${
                    isFavorite
                      ? "fill-red-500 text-red-500"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between p-3">
            <div>
              <div className="flex items-start justify-between gap-2">
                <Link href={`/room/${room.id}`}>
                  <h3 className="font-medium text-sm line-clamp-1 hover:text-primary transition-colors">
                    {room.title}
                  </h3>
                </Link>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {room.type}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{room.location}</span>
              </div>
              {amenities.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {amenities.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 text-xs text-muted-foreground"
                    >
                      <item.icon className="h-3 w-3" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <span className="font-semibold">${room.price}</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-7 text-xs bg-transparent"
              >
                <Link href={`/room/${room.id}`}>View</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3]">
        <Link href={`/room/${room.id}`}>
          <Image
            src={getImageUrl()}
            alt={room.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        {user && (
          <button
            onClick={handleFavoriteClick}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-background"
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        )}
        <Badge className="absolute bottom-2 left-2 bg-background/90 text-foreground text-xs">
          {room.type}
        </Badge>
      </div>
      <div className="p-3">
        <Link href={`/room/${room.id}`}>
          <h3 className="font-medium text-sm line-clamp-1 hover:text-primary transition-colors">
            {room.title}
          </h3>
        </Link>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{room.location}</span>
        </div>
        {amenities.length > 0 && (
          <div className="mt-2 flex gap-2">
            {amenities.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <item.icon className="h-3 w-3" />
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <div>
            <span className="font-semibold">${room.price}</span>
            <span className="text-xs text-muted-foreground">/mo</span>
          </div>
          <Button asChild size="sm" className="h-7 text-xs">
            <Link href={`/room/${room.id}`}>View</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
