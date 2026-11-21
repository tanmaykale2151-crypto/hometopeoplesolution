import type { Database } from "@/integrations/supabase/types";

export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type Property = PropertyRow & { imageUrls: string[] };
export type ListingType = "pg" | "flat";
export type Gender = "boys" | "girls" | "any";
export type Furnishing = "furnished" | "semi" | "unfurnished";

export const IMAGE_BUCKET = "property-images";

export const PUNE_LOCALITIES = [
  "Aundh",
  "Balewadi",
  "Baner",
  "Bavdhan",
  "Camp",
  "Chinchwad",
  "Deccan",
  "Hadapsar",
  "Hinjewadi",
  "Kalyani Nagar",
  "Karve Nagar",
  "Katraj",
  "Kharadi",
  "Kondhwa",
  "Koregaon Park",
  "Kothrud",
  "Magarpatta",
  "Nigdi",
  "Pimple Saudagar",
  "Pimpri",
  "Shivajinagar",
  "Sinhagad Road",
  "Swargate",
  "Undri",
  "Viman Nagar",
  "Wagholi",
  "Wakad",
  "Warje",
] as const;

export const POPULAR_LOCALITIES = [
  "Hinjewadi",
  "Kothrud",
  "Baner",
  "Wakad",
  "Viman Nagar",
  "Kharadi",
  "Hadapsar",
  "Shivajinagar",
];

export const AMENITIES = [
  "WiFi",
  "Meals",
  "AC",
  "Parking",
  "Lift",
  "Power Backup",
  "24x7 Security",
  "CCTV",
  "Laundry",
  "Housekeeping",
  "Hot Water",
  "Gym",
  "Swimming Pool",
  "Clubhouse",
  "Balcony",
  "Water Supply",
];

export const BHK_OPTIONS = ["1 RK", "1 BHK", "2 BHK", "3 BHK", "4+ BHK"];
export const SHARING_OPTIONS = ["Single", "Double", "Triple", "4+ Sharing"];

export const BUDGET_OPTIONS = [
  { value: 8000, label: "Up to ₹8,000" },
  { value: 12000, label: "Up to ₹12,000" },
  { value: 20000, label: "Up to ₹20,000" },
  { value: 30000, label: "Up to ₹30,000" },
  { value: 50000, label: "Up to ₹50,000" },
];

export const TYPE_LABEL: Record<ListingType, string> = { pg: "PG", flat: "Flat" };
export const GENDER_LABEL: Record<Gender, string> = {
  boys: "Boys",
  girls: "Girls",
  any: "Anyone",
};
export const FURNISHING_LABEL: Record<Furnishing, string> = {
  furnished: "Fully furnished",
  semi: "Semi furnished",
  unfurnished: "Unfurnished",
};

export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Returns the 10-digit Indian mobile number, or null when the input isn't one. */
export function normalizeIndianPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function telLink(phone: string): string {
  const n = normalizeIndianPhone(phone) ?? phone.replace(/\D/g, "");
  return `tel:+91${n}`;
}

export function whatsappLink(phone: string, message?: string): string {
  const n = normalizeIndianPhone(phone) ?? phone.replace(/\D/g, "");
  const base = `https://wa.me/91${n}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Static demo photos live under /images; everything else is a storage path. */
export function isStoragePath(path: string): boolean {
  return !path.startsWith("/") && !/^https?:\/\//.test(path);
}

export function propertySubtitle(p: Pick<PropertyRow, "listing_type" | "bhk" | "sharing" | "gender">) {
  if (p.listing_type === "pg") {
    const parts = [p.sharing ? `${p.sharing} sharing` : null, `${GENDER_LABEL[p.gender as Gender]} PG`];
    return parts.filter(Boolean).join(" · ");
  }
  return [p.bhk, "Flat"].filter(Boolean).join(" ");
}
