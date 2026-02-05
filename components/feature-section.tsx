import { Shield, MessageCircle, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "Verified Listings",
    description:
      "All our listings are verified to ensure you get what you see. No hidden surprises.",
    icon: Shield,
  },
  {
    title: "Direct Communication",
    description:
      "Connect directly with landlords without any middlemen or hidden fees.",
    icon: MessageCircle,
  },
  {
    title: "Flexible Bookings",
    description:
      "Book for short or long term stays with flexible cancellation policies.",
    icon: Calendar,
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Why Choose BasoBas?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            We make finding and renting your perfect home simple, safe, and
            hassle-free.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-0 bg-background transition-shadow hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
