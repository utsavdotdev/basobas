import type { Booking } from "@/lib/auth-context";

export const getStatusColor = (status: Booking["status"]) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "cancelled":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const formatDate = (dateString: string) => {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? `${dateString}T12:00:00Z`
    : dateString;

  return new Date(normalized).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDuration = (months: number) => {
  if (months === 1) return "1 month";
  return `${months} months`;
};

export const getDialablePhone = (phone: string) => phone.replace(/[^\d+]/g, "");
