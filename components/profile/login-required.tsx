"use client";

import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginRequiredProps {
  onGoHome: () => void;
}

export function LoginRequired({ onGoHome }: LoginRequiredProps) {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="rounded-full bg-muted p-6">
        <LogIn className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Login Required</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Please login to view your profile and manage your listings.
      </p>
      <Button className="mt-6" onClick={onGoHome}>
        Go to Home
      </Button>
    </div>
  );
}
