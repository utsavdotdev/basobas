import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Link href="/" className="text-lg font-bold tracking-tight">
              BasoBas
            </Link>
            <span className="hidden text-muted-foreground sm:inline">|</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Find your perfect space
            </span>
          </div>

          {/* Copyright */}
          <p className="text-md text-muted-foreground">
            &copy; {new Date().getFullYear()} BasoBas
          </p>
        </div>
      </div>
    </footer>
  );
}
