import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertyGrid } from "@/components/site/PropertyCard";
import { propertiesQuery } from "@/lib/property-queries";
import { BUDGET_OPTIONS, PUNE_LOCALITIES } from "@/lib/properties";

type ListingsSearch = {
  type?: "pg" | "flat";
  locality?: string;
  maxRent?: number;
  gender?: "boys" | "girls";
};

function pageTitle(s: ListingsSearch) {
  const what = s.type === "pg" ? "PGs" : s.type === "flat" ? "Flats for rent" : "PGs & flats";
  return `${what} in ${s.locality ? `${s.locality}, ` : ""}Pune`;
}

export const Route = createFileRoute("/properties/")({
  validateSearch: (raw: Record<string, unknown>): ListingsSearch => {
    const out: ListingsSearch = {};
    const type = raw["type"];
    if (type === "pg" || type === "flat") out.type = type;
    const locality = raw["locality"];
    if (typeof locality === "string" && (PUNE_LOCALITIES as readonly string[]).includes(locality)) out.locality = locality;
    const maxRent = Number(raw["maxRent"]);
    if (Number.isFinite(maxRent) && maxRent > 0) out.maxRent = maxRent;
    const gender = raw["gender"];
    if (gender === "boys" || gender === "girls") out.gender = gender;
    return out;
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(propertiesQuery(deps)),
  head: ({ match }) => {
    const title = `${pageTitle(match.search)} | HTPS`;
    const description = `Browse ${pageTitle(match.search).toLowerCase()} posted directly by owners. Call or WhatsApp with no brokerage.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PropertiesPage,
});

function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/properties/" });
  const { data: properties } = useSuspenseQuery(propertiesQuery(search));

  const update = (patch: Partial<Record<keyof ListingsSearch, string | number | undefined>>) => {
    void navigate({
      search: (prev) => {
        const next: Record<string, unknown> = { ...prev, ...patch };
        for (const k of Object.keys(next)) if (next[k] === undefined || next[k] === "all") delete next[k];
        if (next["type"] === "flat") delete next["gender"];
        return next as ListingsSearch;
      },
    });
  };

  const hasFilters = Object.keys(search).length > 0;

  return (
    <div className="container-page pt-10">
      <h1 className="text-4xl font-extrabold md:text-5xl">{pageTitle(search)}</h1>
      <p className="mt-2 text-muted-foreground">
        {properties.length} {properties.length === 1 ? "place" : "places"} available
      </p>

      <div className="sticky top-16 z-30 -mx-5 mt-6 border-y border-border bg-background/90 px-5 py-3 backdrop-blur-md md:mx-0 md:rounded-2xl md:border md:shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="mr-1 hidden size-4 text-muted-foreground md:block" />
          <div className="flex rounded-full bg-muted p-1">
            {([["all", "All"], ["pg", "PG"], ["flat", "Flat"]] as const).map(([value, label]) => {
              const active = (search.type ?? "all") === value;
              return (
                <button
                  key={value}
                  onClick={() => update({ type: value })}
                  className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                    active ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <Select value={search.locality ?? "all"} onValueChange={(v) => v && update({ locality: v })}>
            <SelectTrigger className="h-9 w-[170px] rounded-full bg-card" aria-label="Area">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              {PUNE_LOCALITIES.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={search.maxRent ? String(search.maxRent) : "all"} onValueChange={(v) => v && update({ maxRent: v === "all" ? undefined : Number(v) })}>
            <SelectTrigger className="h-9 w-[160px] rounded-full bg-card" aria-label="Budget">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any budget</SelectItem>
              {BUDGET_OPTIONS.map((b) => (
                <SelectItem key={b.value} value={String(b.value)}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {search.type !== "flat" && (
            <Select value={search.gender ?? "all"} onValueChange={(v) => v && update({ gender: v })}>
              <SelectTrigger className="h-9 w-[140px] rounded-full bg-card" aria-label="PG for">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Boys & girls</SelectItem>
                <SelectItem value="boys">Boys</SelectItem>
                <SelectItem value="girls">Girls</SelectItem>
              </SelectContent>
            </Select>
          )}

          {hasFilters && (
            <Button variant="link" size="sm" asChild>
              <Link to="/properties">Clear filters</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8">
        {properties.length ? (
          <PropertyGrid properties={properties} />
        ) : (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-20 text-center">
            <SearchX className="size-10 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-bold">Nothing here yet</h2>
            <p className="mt-2 max-w-sm text-muted-foreground">Try another area or a higher budget. New places are added every day.</p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/properties">See all listings</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
