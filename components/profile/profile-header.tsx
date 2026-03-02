"use client";

import type { User } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface ProfileHeaderProps {
  user: User;
  onLogout: () => void;
}

export function ProfileHeader({ user, onLogout }: ProfileHeaderProps) {
  return (
    <div className="mb-8 rounded-xl border bg-card p-6 md:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
          <AvatarFallback className="text-2xl">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            {user.verified && (
              <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            )}
            <Badge variant="secondary" className="capitalize">
              {user.role}
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
