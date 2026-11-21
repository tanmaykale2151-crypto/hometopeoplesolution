import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, ImageOff, MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { myPropertiesQuery } from "@/lib/property-queries";
import { IMAGE_BUCKET, formatRupees, isStoragePath, propertySubtitle, type Property } from "@/lib/properties";

export const Route = createFileRoute("/_authenticated/my-properties")({
  head: () => ({
    meta: [
      { title: "My listings | HTPS" },
      { name: "description", content: "Manage the PGs and flats you've listed for rent on HTPS." },
      { property: "og:title", content: "My listings | HTPS" },
      { property: "og:description", content: "Manage your property listings on HTPS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myPropertiesQuery()),
  component: MyPropertiesPage,
});

function MyPropertiesPage() {
  const { data: properties } = useSuspenseQuery(myPropertiesQuery());

  return (
    <div className="container-page pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold md:text-5xl">My listings</h1>
          <p className="mt-2 text-muted-foreground">Turn a listing off once it's rented — you can switch it back on any time.</p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/list-property"><Plus /> Add a property</Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-20 text-center">
          <h2 className="text-2xl font-bold">You haven't listed anything yet</h2>
          <p className="mt-2 max-w-sm text-muted-foreground">Post your PG or flat and start getting calls from tenants.</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/list-property"><Plus /> List your first property</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4">
          {properties.map((p) => <MyPropertyRow key={p.id} property={p} />)}
        </ul>
      )}
    </div>
  );
}

function MyPropertyRow({ property }: { property: Property }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["properties"] });

  const toggle = async (available: boolean) => {
    setBusy(true);
    const { error } = await supabase.from("properties").update({ is_available: available }).eq("id", property.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(available ? "Listing is visible again" : "Marked as rented — hidden from search");
    await refresh();
  };

  const remove = async () => {
    setBusy(true);
    const { error } = await supabase.from("properties").delete().eq("id", property.id);
    if (error) {
      setBusy(false);
      { toast.error(error.message); return; }
    }
    const stored = property.images.filter(isStoragePath);
    if (stored.length) await supabase.storage.from(IMAGE_BUCKET).remove(stored);
    toast.success("Listing deleted");
    await refresh();
  };

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center">
      <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-40">
        {property.imageUrls[0] ? (
          <img src={property.imageUrls[0]} alt="" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground"><ImageOff className="size-6" /></div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <MapPin className="size-3.5 text-primary" /> {property.locality} · {propertySubtitle(property)}
        </p>
        <h2 className="mt-1 truncate text-lg font-bold">{property.title}</h2>
        <p className="font-display text-lg font-extrabold">{formatRupees(property.rent)}<span className="text-sm font-normal text-muted-foreground"> /month</span></p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-semibold">
          <Switch checked={property.is_available} disabled={busy} onCheckedChange={toggle} />
          {property.is_available ? "Live" : "Rented out"}
        </label>
        {property.is_available && (
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/properties/$id" params={{ id: property.id }}><Eye /> View</Link>
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="rounded-full text-destructive hover:text-destructive" disabled={busy}>
              <Trash2 /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
              <AlertDialogDescription>"{property.title}" and its photos will be removed permanently.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
