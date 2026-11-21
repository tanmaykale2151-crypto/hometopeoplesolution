import { Link } from "@tanstack/react-router";
import { POPULAR_LOCALITIES } from "@/lib/properties";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-ink-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo inverted />
          <p className="max-w-sm text-sm leading-relaxed text-ink-foreground/70">
            Helping students and working people find a PG or flat in Pune — and helping owners find good tenants. No brokerage.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-foreground/60">Explore</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/properties" search={{ type: "pg" }} className="hover:text-accent">PGs in Pune</Link></li>
            <li><Link to="/properties" search={{ type: "flat" }} className="hover:text-accent">Flats for rent</Link></li>
            <li><Link to="/list-property" className="hover:text-accent">List your property</Link></li>
            <li><Link to="/my-properties" className="hover:text-accent">My listings</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-foreground/60">Popular areas</h3>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {POPULAR_LOCALITIES.slice(0, 8).map((l) => (
              <li key={l}>
                <Link to="/properties" search={{ locality: l }} className="hover:text-accent">{l}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="container-page py-5 text-xs text-ink-foreground/55">
          © {new Date().getFullYear()} HTPS – Home To People Solution · Pune, Maharashtra
        </div>
      </div>
    </footer>
  );
}
