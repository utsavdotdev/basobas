"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, X, User, LogOut, Heart, Home, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [user, setUser] = useState<any>();
  const [selectedRole, setSelectedRole] = useState<
    "tenant" | "landlord" | null
  >(null);
  const pathname = usePathname();
  const route = useRouter();

  const logout = () => {
    setUser(null);
    route.push("/");
  };

  const handleLogin = () => {
    if (selectedRole) {
      setUser({
        id: `user_${Date.now()}`,
        name: selectedRole === "tenant" ? "Utsav Bhattarai" : "Roshan Acharya",
        email:
          selectedRole === "tenant"
            ? "utsavdotdev@gmail.com"
            : "roshanacharya@gmail.com",
        avatar:
          selectedRole === "tenant"
            ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"
            : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
        role: selectedRole,
        verified: false,
      });
      setLoginDialogOpen(false);
      setSelectedRole(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setLoginDialogOpen(open);
    if (!open) {
      setSelectedRole(null);
    }
  };

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Listings" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">BasoBas</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden gap-6 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden items-center gap-2 md:flex">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-sm">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user.role}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "tenant" && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/profile?tab=favorites"
                          className="flex items-center gap-2"
                        >
                          <Heart className="h-4 w-4" />
                          Favorites
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === "landlord" && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/post-room"
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Post Room
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/profile?tab=listings"
                            className="flex items-center gap-2"
                          >
                            <Home className="h-4 w-4" />
                            My Listings
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="flex items-center gap-2 text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLoginDialogOpen(true)}
                  >
                    Sign Up
                  </Button>
                  <Button size="sm" onClick={() => setLoginDialogOpen(true)}>
                    Login
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="mt-3 space-y-1 border-t pt-3 md:hidden">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block px-2 py-2 text-sm font-medium transition-colors rounded-md",
                    isActive(link.href)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t pt-2 mt-2">
                {user ? (
                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      className="block px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      className="w-full text-left px-2 py-2 text-sm font-medium text-destructive hover:bg-muted rounded-md"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => {
                      setLoginDialogOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    Login / Sign Up
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to BasoBas</DialogTitle>
            <DialogDescription>Select your role to continue</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Role Selection */}
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setSelectedRole("tenant")}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all hover:border-primary/50",
                  selectedRole === "tenant"
                    ? "border-primary bg-primary/5"
                    : "border-muted",
                )}
              >
                {selectedRole === "tenant" && (
                  <div className="absolute right-2 top-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
                <Home className="h-6 w-6" />
                <span className="text-sm font-medium">Looking for a Room</span>
                <span className="text-xs text-muted-foreground">
                  Browse and book rentals
                </span>
              </button>
              <button
                onClick={() => setSelectedRole("landlord")}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all hover:border-primary/50",
                  selectedRole === "landlord"
                    ? "border-primary bg-primary/5"
                    : "border-muted",
                )}
              >
                {selectedRole === "landlord" && (
                  <div className="absolute right-2 top-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">I'm a Landlord</span>
                <span className="text-xs text-muted-foreground">
                  List your properties
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Continue with
                </span>
              </div>
            </div>

            {/* Google Login Button */}
            <Button
              onClick={handleLogin}
              variant="outline"
              className="w-full bg-transparent"
              disabled={!selectedRole}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>

            {!selectedRole && (
              <p className="text-center text-xs text-muted-foreground">
                Please select a role above to continue
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
