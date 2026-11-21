import { Link } from "@tanstack/react-router";
import { ImageOff, MapPin, Utensils } from "lucide-react";
import { formatRupees, propertySubtitle, TYPE_LABEL, type ListingType, type Property } from "@/lib/properties";

export function PropertyCard({ property }: { property: Property }) {
  const cover = property.imageUrls[0];
  return (
    <Link
      to="/properties/$id"
      params={{ id: property.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={property.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary shadow-sm">
          {TYPE_LABEL[property.listing_type as ListingType]}
        </span>
        {property.food_included && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
            <Utensils className="size-3" /> Meals
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <MapPin className="size-3.5 text-primary" /> {property.locality}, Pune
        </div>
        <h3 className="line-clamp-2 text-base font-bold leading-snug">{property.title}</h3>
        <p className="text-sm text-muted-foreground">{propertySubtitle(property)}</p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <p>
            <span className="font-display text-xl font-extrabold text-foreground">{formatRupees(property.rent)}</span>
            <span className="text-sm text-muted-foreground"> /month</span>
          </p>
          <span className="text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PropertyGrid({ properties }: { properties: Property[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  );
}
