import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, BedDouble, Check, ImageOff, IndianRupee, MapPin, MessageCircle, Phone, Sofa, Users, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { propertyQuery } from "@/lib/property-queries";
import {
  FURNISHING_LABEL,
  GENDER_LABEL,
  TYPE_LABEL,
  formatRupees,
  propertySubtitle,
  telLink,
  whatsappLink,
  type Furnishing,
  type Gender,
  type ListingType,
} from "@/lib/properties";

export const Route = createFileRoute("/properties/$id")({
  loader: async ({ context, params }) => {
    const property = await context.queryClient.ensureQueryData(propertyQuery(params.id));
    if (!property) throw notFound();
    return { title: property.title, locality: property.locality, rent: property.rent, type: property.listing_type };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Listing unavailable | HTPS" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.title} – ${loaderData.locality}, Pune | HTPS`;
    const description = `${TYPE_LABEL[loaderData.type as ListingType]} in ${loaderData.locality}, Pune for ${formatRupees(loaderData.rent)}/month. Contact the owner directly on HTPS.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="text-3xl font-extrabold">This listing isn't available</h1>
      <p className="mt-2 text-muted-foreground">It may have been rented out or removed by the owner.</p>
      <Button asChild className="mt-6 rounded-full">
        <Link to="/properties">Browse other places</Link>
      </Button>
    </div>
  ),
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const { data: property } = useSuspenseQuery(propertyQuery(id));
  const [active, setActive] = useState(0);
  if (!property) return null;

  const images = property.imageUrls;
  const isPg = property.listing_type === "pg";
  const message = `Hi, I saw your ${TYPE_LABEL[property.listing_type as ListingType]} "${property.title}" in ${property.locality} on HTPS. Is it still available?`;

  const facts = [
    { icon: IndianRupee, label: "Deposit", value: property.deposit ? formatRupees(property.deposit) : "No deposit" },
    isPg
      ? { icon: BedDouble, label: "Sharing", value: property.sharing ?? "—" }
      : { icon: BedDouble, label: "Size", value: property.bhk ?? "—" },
    { icon: Users, label: isPg ? "PG for" : "Preferred", value: GENDER_LABEL[property.gender as Gender] },
    { icon: Sofa, label: "Furnishing", value: FURNISHING_LABEL[property.furnishing as Furnishing] },
    ...(isPg ? [{ icon: Utensils, label: "Meals", value: property.food_included ? "Included" : "Not included" }] : []),
  ];

  return (
    <div className="container-page pt-8">
      <Link to="/properties" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Back to listings
      </Link>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_120px]">
        <div className="aspect-[16/10] overflow-hidden rounded-3xl bg-muted shadow-soft">
          {images[active] ? (
            <img src={images[active]} alt={property.title} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground"><ImageOff className="size-10" /></div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-3 md:flex-col">
            {images.map((src, i) => (
              <button
                key={src}
                onClick={() => setActive(i)}
                className={`aspect-square w-24 overflow-hidden rounded-xl border-2 md:w-full ${i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
                aria-label={`Photo ${i + 1}`}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
            {propertySubtitle(property)}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">{property.title}</h1>
          <p className="mt-3 flex items-start gap-1.5 text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            {property.address || `${property.locality}, Pune`}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label} className="rounded-2xl border border-border bg-card p-4">
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <f.icon className="size-3.5" /> {f.label}
                </dt>
                <dd className="mt-1 font-bold">{f.value}</dd>
              </div>
            ))}
          </dl>

          {property.amenities.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold">Amenities</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {property.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-sm font-semibold text-secondary-foreground">
                    <Check className="size-3.5 text-success" /> {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {property.description && (
            <section className="mt-10">
              <h2 className="text-xl font-bold">About this place</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/85">{property.description}</p>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-lift">
            <p>
              <span className="font-display text-4xl font-extrabold">{formatRupees(property.rent)}</span>
              <span className="text-muted-foreground"> /month</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Deposit {property.deposit ? formatRupees(property.deposit) : "not required"}
            </p>
            <div className="my-5 h-px bg-border" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Owner</p>
            <p className="mt-1 text-lg font-bold">{property.contact_name}</p>
            <p className="text-sm text-muted-foreground">+91 {property.contact_phone}</p>
            <div className="mt-5 grid gap-2.5">
              <Button asChild size="xl" className="rounded-xl">
                <a href={telLink(property.contact_phone)}><Phone /> Call owner</a>
              </Button>
              <Button asChild size="xl" variant="whatsapp" className="rounded-xl">
                <a href={whatsappLink(property.contact_phone, message)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle /> WhatsApp owner
                </a>
              </Button>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">No brokerage — you deal with the owner directly.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
