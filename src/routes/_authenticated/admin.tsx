import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ImageOff, MapPin, Phone, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { reviewQueueQuery } from "@/lib/property-queries";
import {
  FURNISHING_LABEL,
  STATUS_LABEL,
  formatRupees,
  propertySubtitle,
  type Furnishing,
  type ListingStatus,
  type Property,
} from "@/lib/properties";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Verify listings | HTPS" },
      { name: "description", content: "Review and approve new PG and flat listings before they are shown on HTPS." },
      { property: "og:title", content: "Verify listings | HTPS" },
      { property: "og:description", content: "Admin review of new property listings on HTPS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(reviewQueueQuery()),
  component: AdminPage,
});

const TABS: ListingStatus[] = ["pending", "approved", "rejected"];
const TAB_LABEL: Record<ListingStatus, string> = { pending: "Waiting", approved: "Approved", rejected: "Rejected" };

function AdminPage() {
  const { data } = useSuspenseQuery(reviewQueueQuery());
  const [tab, setTab] = useState<ListingStatus>("pending");

  if (!data.allowed) {
    return (
      <div className="container-page flex flex-col items-center pt-20 text-center">
        <ShieldCheck className="size-10 text-muted-foreground" />
        <h1 className="mt-4 text-3xl font-extrabold">Admins only</h1>
        <p className="mt-2 text-muted-foreground">This page is for the HTPS team that verifies listings.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/">Back to home</Link></Button>
      </div>
    );
  }

  const shown = data.properties.filter((p) => p.status === tab);

  return (
    <div className="container-page pt-10">
      <h1 className="text-4xl font-extrabold md:text-5xl">Verify listings</h1>
      <p className="mt-2 text-muted-foreground">New properties stay hidden from tenants until you approve them.</p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => {
          const count = data.properties.filter((p) => p.status === t).length;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"
              }`}
            >
              {TAB_LABEL[t]} ({count})
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center text-muted-foreground">
          {tab === "pending" ? "Nothing waiting — all caught up." : `No ${TAB_LABEL[tab].toLowerCase()} listings.`}
        </div>
      ) : (
        <ul className="mt-8 grid gap-5">
          {shown.map((p) => <ReviewCard key={p.id} property={p} />)}
        </ul>
      )}
    </div>
  );
}

function ReviewCard({ property: p }: { property: Property }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);

  const setStatus = async (status: ListingStatus, reviewNote: string | null) => {
    setBusy(true);
    const { error } = await supabase.from("properties").update({ status, review_note: reviewNote }).eq("id", p.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "approved" ? "Approved — now visible to tenants" : "Listing rejected");
    setRejectOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["properties"] });
  };

  return (
    <li className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="grid w-full shrink-0 grid-cols-3 gap-2 lg:w-80">
          {p.imageUrls.length ? (
            p.imageUrls.slice(0, 6).map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-lg bg-muted">
                <img src={url} alt="" className="size-full object-cover" />
              </a>
            ))
          ) : (
            <div className="col-span-3 grid aspect-[3/1] place-items-center rounded-lg bg-muted text-sm text-muted-foreground">
              <ImageOff className="size-5" /> No photos
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="size-3.5 text-primary" /> {p.locality}</span>
            <span>· {propertySubtitle(p)}</span>
            <span>· {FURNISHING_LABEL[p.furnishing as Furnishing]}</span>
            <span>· Posted {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
          <h2 className="mt-1 text-xl font-bold">{p.title}</h2>
          <p className="font-display text-lg font-extrabold">
            {formatRupees(p.rent)}<span className="text-sm font-normal text-muted-foreground"> /month · deposit {formatRupees(p.deposit)}</span>
          </p>
          {p.address && <p className="mt-1 text-sm text-muted-foreground">{p.address}</p>}
          {p.description && <p className="mt-2 line-clamp-3 text-sm">{p.description}</p>}
          {p.amenities.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{p.amenities.join(" · ")}</p>}
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <Phone className="size-4 text-primary" /> {p.contact_name} ·{" "}
            <a href={`tel:+91${p.contact_phone}`} className="text-primary underline-offset-2 hover:underline">{p.contact_phone}</a>
          </p>
          {p.status === "rejected" && p.review_note && (
            <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">Reason: {p.review_note}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-row gap-2 lg:flex-col">
          <span className="self-start rounded-full bg-secondary px-3 py-1 text-xs font-bold">{STATUS_LABEL[p.status as ListingStatus]}</span>
          {p.status !== "approved" && (
            <Button className="rounded-full" disabled={busy} onClick={() => setStatus("approved", null)}>
              <Check /> Approve
            </Button>
          )}
          {p.status !== "rejected" && (
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full" disabled={busy}><X /> Reject</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject this listing?</DialogTitle>
                  <DialogDescription>"{p.title}" will be hidden from tenants. The owner will see your reason.</DialogDescription>
                </DialogHeader>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional), e.g. photos are unclear" />
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
                  <Button variant="destructive" disabled={busy} onClick={() => setStatus("rejected", note.trim() || null)}>Reject</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </li>
  );
}
