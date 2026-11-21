import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="HTPS – Home To People Solution">
      <span className="grid size-9 place-items-center rounded-xl bg-warm text-primary-foreground shadow-soft transition-transform group-hover:-rotate-6">
        <Home className="size-5" strokeWidth={2.4} />
      </span>
      <span className="leading-none">
        <span className={`block font-display text-xl font-extrabold tracking-tight ${inverted ? "text-ink-foreground" : "text-foreground"}`}>
          HTPS
        </span>
        <span className={`block text-[10px] font-semibold uppercase tracking-[0.14em] ${inverted ? "text-ink-foreground/70" : "text-muted-foreground"}`}>
          Home To People Solution
        </span>
      </span>
    </Link>
  );
}
