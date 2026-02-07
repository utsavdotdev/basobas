export interface Room {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  type: "single" | "double" | "studio" | "apartment";
  facilities: {
    bathroom: boolean;
    kitchen: boolean;
    wifi: boolean;
    waterSupply: boolean;
    parking: boolean;
    furnished: boolean;
  };
  landlord: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    verified: boolean;
  };
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "tenant" | "landlord";
  verified: boolean;
  phone?: string;
}

export const mockRooms: Room[] = [
  {
    id: "1",
    title: "Modern Forest Cabin",
    description:
      "A stunning modern cabin nestled in a serene forest setting. Floor-to-ceiling windows provide breathtaking views of nature. Perfect for those seeking tranquility and modern comfort.",
    price: 1200,
    location: "Portland, Oregon",
    images: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    ],
    type: "studio",
    facilities: {
      bathroom: true,
      kitchen: true,
      wifi: true,
      waterSupply: true,
      parking: true,
      furnished: true,
    },
    landlord: {
      id: "l1",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
      verified: true,
    },
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Downtown Luxury Apartment",
    description:
      "Spacious downtown apartment with modern amenities. Walking distance to shops, restaurants, and public transit. High ceilings and natural lighting throughout.",
    price: 2500,
    location: "Seattle, Washington",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    ],
    type: "apartment",
    facilities: {
      bathroom: true,
      kitchen: true,
      wifi: true,
      waterSupply: true,
      parking: true,
      furnished: true,
    },
    landlord: {
      id: "l2",
      name: "Michael Chen",
      email: "michael@example.com",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
      verified: true,
    },
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    title: "Cozy Single Room",
    description:
      "Affordable single room in a shared house. Great for students or young professionals. Quiet neighborhood with easy access to public transportation.",
    price: 650,
    location: "Austin, Texas",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    ],
    type: "single",
    facilities: {
      bathroom: false,
      kitchen: false,
      wifi: true,
      waterSupply: true,
      parking: false,
      furnished: true,
    },
    landlord: {
      id: "l3",
      name: "Emily Davis",
      email: "emily@example.com",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
      verified: false,
    },
    createdAt: "2024-02-01",
  },
  {
    id: "4",
    title: "Beachfront Double Room",
    description:
      "Wake up to ocean views in this beautiful double room. Just steps from the beach with a private balcony. Perfect for couples or remote workers.",
    price: 1800,
    location: "San Diego, California",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    ],
    type: "double",
    facilities: {
      bathroom: true,
      kitchen: true,
      wifi: true,
      waterSupply: true,
      parking: true,
      furnished: true,
    },
    landlord: {
      id: "l1",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
      verified: true,
    },
    createdAt: "2024-02-10",
  },
  {
    id: "5",
    title: "Mountain View Studio",
    description:
      "Charming studio with panoramic mountain views. Recently renovated with modern kitchen and bathroom. Ideal for nature lovers and outdoor enthusiasts.",
    price: 950,
    location: "Denver, Colorado",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    ],
    type: "studio",
    facilities: {
      bathroom: true,
      kitchen: true,
      wifi: true,
      waterSupply: true,
      parking: true,
      furnished: false,
    },
    landlord: {
      id: "l4",
      name: "James Wilson",
      email: "james@example.com",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
      verified: true,
    },
    createdAt: "2024-02-15",
  },
  {
    id: "6",
    title: "Urban Loft Apartment",
    description:
      "Industrial-style loft in a converted warehouse. Exposed brick walls, high ceilings, and open floor plan. Located in the heart of the arts district.",
    price: 2200,
    location: "Chicago, Illinois",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    ],
    type: "apartment",
    facilities: {
      bathroom: true,
      kitchen: true,
      wifi: true,
      waterSupply: true,
      parking: false,
      furnished: true,
    },
    landlord: {
      id: "l2",
      name: "Michael Chen",
      email: "michael@example.com",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
      verified: true,
    },
    createdAt: "2024-02-20",
  },
];

export const features = [
  {
    title: "Verified Listings",
    description:
      "All our listings are verified to ensure you get what you see. No hidden surprises.",
    icon: "shield",
  },
  {
    title: "Direct Communication",
    description:
      "Connect directly with landlords without any middlemen or hidden fees.",
    icon: "message",
  },
  {
    title: "Flexible Bookings",
    description:
      "Book for short or long term stays with flexible cancellation policies.",
    icon: "calendar",
  },
  {
    title: "Secure Payments",
    description:
      "Your payments are protected with our secure transaction system.",
    icon: "lock",
  },
];
