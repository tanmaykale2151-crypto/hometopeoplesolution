import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, BadgeIndianRupee, Camera, Home as HomeIcon, MapPin, MessageCircle, Search, ShieldCheck, Users } from "lucide-react";
import heroImg from "@/assets/hero-pune.jpg";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertyGrid } from "@/components/site/PropertyCard";
import { propertiesQuery } from "@/lib/property-queries";
import { POPULAR_LOCALITIES, PUNE_LOCALITIES, type ListingType } from "@/lib/properties";

const featuredFilters = { limit: 6 };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HTPS – Find PGs & Flats for Rent in Pune" },
      { name: "description", content: "Search PGs and flats for rent across Pune — Hinjewadi, Kothrud, Baner, Wakad and more. Owners can list their property for free." },
      { property: "og:title", content: "HTPS – Find PGs & Flats for Rent in Pune" },
      { property: "og:description", content: "Search PGs and flats across Pune, or list your property for free." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(propertiesQuery(featuredFilters)),
  component: Index,
});

function Index() {
  const { data: featured } = useSuspenseQuery(propertiesQuery(featuredFilters));

  return (
    <>
      <Hero />

      <section className="container-page mt-16">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Popular areas</h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {POPULAR_LOCALITIES.map((l) => (
            <Link
              key={l}
              to="/properties"
              search={{ locality: l }}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold shadow-soft transition-colors hover:border-primary hover:text-primary"
            >
              <MapPin className="size-3.5" /> {l}
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page mt-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold md:text-4xl">Just listed in Pune</h2>
            <p className="mt-2 text-muted-foreground">Fresh PGs and flats posted directly by owners.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/properties">See all listings <ArrowRight /></Link>
          </Button>
        </div>
        <PropertyGrid properties={featured} />
      </section>

      <HowItWorks />
      <OwnerCta />
    </>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [type, setType] = useState<ListingType | "all">("pg");
  const [locality, setLocality] = useState("all");

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    void navigate({
      to: "/properties",
      search: {
        ...(type !== "all" ? { type } : {}),
        ...(locality !== "all" ? { locality } : {}),
      },
    });
  };

  return (
    <section className="relative isolate overflow-hidden">
      <img src={heroImg} alt="Apartment buildings on a tree-lined street in Pune" className="absolute inset-0 -z-20 size-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-hero-overlay" />
      <div className="container-page flex min-h-[600px] flex-col justify-end pb-14 pt-28 md:min-h-[640px]">
        <p className="animate-rise mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-card/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-ink-foreground backdrop-blur">
          <span className="size-1.5 rounded-full bg-accent" /> Pune · No brokerage
        </p>
        <h1 className="animate-rise max-w-3xl text-5xl font-extrabold leading-[1.02] text-ink-foreground md:text-7xl">
          Your next home in Pune, <span className="text-accent">straight from the owner.</span>
        </h1>
        <p className="animate-rise mt-5 max-w-xl text-lg text-ink-foreground/85" style={{ animationDelay: "80ms" }}>
          PGs for students and working people, flats for families — call or WhatsApp the owner directly.
        </p>

        <form
          onSubmit={search}
          className="animate-rise mt-8 grid max-w-3xl gap-2 rounded-2xl bg-card p-2 shadow-lift md:grid-cols-[auto_1fr_auto]"
          style={{ animationDelay: "160ms" }}
        >
          <div className="flex rounded-xl bg-muted p-1">
            {(["pg", "flat", "all"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors md:flex-none ${
                  type === t ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "pg" ? "PG" : t === "flat" ? "Flat" : "Any"}
              </button>
            ))}
          </div>
          <Select value={locality} onValueChange={(v) => v && setLocality(v)}>
            <SelectTrigger className="h-12 border-0 bg-transparent text-base shadow-none focus:ring-0" aria-label="Area">
              <MapPin className="size-4 text-primary" />
              <SelectValue placeholder="Choose an area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All of Pune</SelectItem>
              {PUNE_LOCALITIES.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="xl" className="rounded-xl">
            <Search /> Search
          </Button>
        </form>
      </div>
    </section>
  );
}

function HowItWorks() {
  const tenant = [
    { icon: Search, title: "Search by area", text: "Filter PGs and flats by locality, budget and who it's for." },
    { icon: HomeIcon, title: "See real photos", text: "Rent, deposit, amenities and photos — all upfront." },
    { icon: MessageCircle, title: "Talk to the owner", text: "Call or WhatsApp the owner directly. No middlemen." },
  ];
  const perks = [
    { icon: BadgeIndianRupee, title: "Zero brokerage" },
    { icon: ShieldCheck, title: "Owners contact you directly" },
    { icon: Users, title: "For students, professionals & families" },
  ];
  return (
    <section className="container-page mt-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-center">
        <div>
          <h2 className="text-3xl font-extrabold md:text-4xl">Finding a room shouldn't take weeks.</h2>
          <p className="mt-4 text-muted-foreground">
            HTPS connects people looking for a place to stay with people who have one — across every corner of Pune.
          </p>
          <ul className="mt-6 space-y-3">
            {perks.map((p) => (
              <li key={p.title} className="flex items-center gap-3 font-semibold">
                <span className="grid size-8 place-items-center rounded-lg bg-secondary text-primary">
                  <p.icon className="size-4" />
                </span>
                {p.title}
              </li>
            ))}
          </ul>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {tenant.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <span className="font-display text-4xl font-extrabold text-primary/25">0{i + 1}</span>
              <s.icon className="mt-3 size-6 text-primary" />
              <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function OwnerCta() {
  return (
    <section className="container-page mt-24">
      <div className="relative overflow-hidden rounded-3xl bg-warm px-8 py-14 text-primary-foreground shadow-lift md:px-14">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-accent/30 blur-2xl" />
        <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary-foreground/80">For property owners</p>
            <h2 className="mt-3 text-3xl font-extrabold md:text-5xl">Have a PG or flat to rent out?</h2>
            <p className="mt-4 max-w-lg text-primary-foreground/85">
              Post it on HTPS in under 5 minutes. Add photos, set your rent, and tenants will call you directly.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Button asChild variant="hero" size="xl" className="rounded-full">
              <Link to="/list-property"><Camera /> List your property — free</Link>
            </Button>
            <p className="text-sm text-primary-foreground/75">Goes live instantly.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
