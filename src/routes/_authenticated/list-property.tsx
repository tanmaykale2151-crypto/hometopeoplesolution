import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, BedSingle, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  AMENITIES,
  BHK_OPTIONS,
  FURNISHING_LABEL,
  IMAGE_BUCKET,
  PUNE_LOCALITIES,
  SHARING_OPTIONS,
  normalizeIndianPhone,
  type Furnishing,
  type Gender,
  type ListingType,
} from "@/lib/properties";

const MAX_PHOTOS = 6;

export const Route = createFileRoute("/_authenticated/list-property")({
  head: () => ({
    meta: [
      { title: "List your PG or flat in Pune | HTPS" },
      { name: "description", content: "Post your PG or flat for rent in Pune for free. Add photos, rent and amenities — tenants contact you directly." },
      { property: "og:title", content: "List your PG or flat in Pune | HTPS" },
      { property: "og:description", content: "Post your property for rent in Pune for free." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ListPropertyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
      <h2 className="mb-5 text-xl font-bold">{title}</h2>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function ListPropertyPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [type, setType] = useState<ListingType>("pg");
  const [locality, setLocality] = useState("");
  const [bhk, setBhk] = useState("1 BHK");
  const [sharing, setSharing] = useState("Double");
  const [gender, setGender] = useState<Gender>("any");
  const [furnishing, setFurnishing] = useState<Furnishing>("furnished");
  const [food, setFood] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const tooBig = picked.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) toast.error(`${tooBig.name} is larger than 5 MB`);
    setFiles((prev) => [...prev, ...picked.filter((f) => f.size <= 5 * 1024 * 1024)].slice(0, MAX_PHOTOS));
  };

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const phone = normalizeIndianPhone(String(f.get("phone") ?? ""));
    if (!locality) { toast.error("Please choose the area in Pune"); return; }
    if (!phone) { toast.error("Please enter a valid 10-digit mobile number"); return; }
    const rent = Number(f.get("rent"));
    if (!rent || rent <= 0) { toast.error("Please enter the monthly rent"); return; }

    setSaving(true);
    try {
      const paths: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type });
        if (error) throw new Error(`Photo upload failed: ${error.message}`);
        paths.push(path);
      }

      const { data, error } = await supabase
        .from("properties")
        .insert({
          owner_id: user.id,
          title: String(f.get("title")).trim(),
          listing_type: type,
          locality,
          address: String(f.get("address") ?? "").trim() || null,
          rent,
          deposit: Number(f.get("deposit")) || 0,
          bhk: type === "flat" ? bhk : null,
          sharing: type === "pg" ? sharing : null,
          gender,
          furnishing,
          food_included: type === "pg" ? food : false,
          amenities,
          description: String(f.get("description") ?? "").trim() || null,
          contact_name: String(f.get("contact_name")).trim(),
          contact_phone: phone,
          images: paths,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);

      await queryClient.invalidateQueries({ queryKey: ["properties"] });
      void data;
      toast.success("Submitted! Your property will be shown to others after our team verifies it.");
      void navigate({ to: "/my-properties" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  };

  const defaultName = (user.user_metadata?.["full_name"] as string | undefined) ?? (user.user_metadata?.["name"] as string | undefined) ?? "";

  return (
    <div className="container-page max-w-3xl pt-10">
      <h1 className="text-4xl font-extrabold md:text-5xl">List your property</h1>
      <p className="mt-2 text-muted-foreground">It's free. Our team verifies every listing before it's shown to tenants.</p>

      <form onSubmit={submit} className="mt-8 grid gap-6">
        <Section title="What are you renting out?">
          <div className="grid grid-cols-2 gap-3">
            {([
              ["pg", "PG / Hostel", BedSingle, "Rooms or beds on sharing"],
              ["flat", "Flat / House", Building2, "1 RK to 4+ BHK"],
            ] as const).map(([value, label, Icon, hint]) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-colors ${
                  type === value ? "border-primary bg-secondary" : "border-border hover:border-primary/40"
                }`}
              >
                <Icon className="size-6 text-primary" />
                <span className="font-bold">{label}</span>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="title">Listing title</Label>
            <Input id="title" name="title" required maxLength={100} placeholder={type === "pg" ? "e.g. Girls PG with meals near FC Road" : "e.g. Furnished 2BHK near Baner Road"} />
          </div>
        </Section>

        <Section title="Location">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Area in Pune</Label>
              <Select value={locality} onValueChange={(v) => v && setLocality(v)}>
                <SelectTrigger><SelectValue placeholder="Choose area" /></SelectTrigger>
                <SelectContent>
                  {PUNE_LOCALITIES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="address">Address / landmark</Label>
              <Input id="address" name="address" maxLength={200} placeholder="e.g. Near Dange Chowk" />
            </div>
          </div>
        </Section>

        <Section title="Rent & details">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="rent">Monthly rent (₹)</Label>
              <Input id="rent" name="rent" type="number" min={1} required inputMode="numeric" placeholder="10000" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="deposit">Deposit (₹)</Label>
              <Input id="deposit" name="deposit" type="number" min={0} inputMode="numeric" placeholder="20000" />
            </div>
            {type === "flat" ? (
              <div className="grid gap-1.5">
                <Label>Size</Label>
                <Select value={bhk} onValueChange={(v) => v && setBhk(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BHK_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-1.5">
                <Label>Sharing</Label>
                <Select value={sharing} onValueChange={(v) => v && setSharing(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SHARING_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label>{type === "pg" ? "PG for" : "Preferred tenants"}</Label>
              <Select value={gender} onValueChange={(v) => v && setGender(v as Gender)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Anyone</SelectItem>
                  <SelectItem value="boys">{type === "pg" ? "Boys only" : "Bachelors (male)"}</SelectItem>
                  <SelectItem value="girls">{type === "pg" ? "Girls only" : "Bachelors (female)"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Furnishing</Label>
              <Select value={furnishing} onValueChange={(v) => v && setFurnishing(v as Furnishing)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(FURNISHING_LABEL) as Furnishing[]).map((k) => (
                    <SelectItem key={k} value={k}>{FURNISHING_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {type === "pg" && (
              <label className="flex items-center justify-between gap-3 self-end rounded-xl border border-border px-4 py-2.5">
                <span className="text-sm font-semibold">Meals included</span>
                <Switch checked={food} onCheckedChange={setFood} />
              </label>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AMENITIES.map((a) => (
                <label key={a} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                  <Checkbox checked={amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)} />
                  {a}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} maxLength={2000} placeholder="Nearby colleges/offices, rules, timings, what's included…" />
          </div>
        </Section>

        <Section title="Photos">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {previews.map((src, i) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                <img src={src} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-card/90 text-foreground shadow"
                  aria-label="Remove photo"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {files.length < MAX_PHOTOS && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <ImagePlus className="size-6" />
                <span className="text-xs font-semibold">Add photos</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Up to {MAX_PHOTOS} photos, 5 MB each. Listings with photos get far more calls.</p>
        </Section>

        <Section title="Contact details">
          <p className="-mt-2 text-sm text-muted-foreground">Shown on your listing so people can call or WhatsApp you.</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="contact_name">Your name</Label>
              <Input id="contact_name" name="contact_name" required maxLength={80} defaultValue={defaultName} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phone">Mobile / WhatsApp number</Label>
              <div className="flex">
                <span className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">+91</span>
                <Input id="phone" name="phone" required inputMode="tel" maxLength={14} placeholder="98XXXXXXXX" className="rounded-l-none" />
              </div>
            </div>
          </div>
        </Section>

        <Button type="submit" size="xl" className="rounded-xl" disabled={saving}>
          {saving ? <><Loader2 className="animate-spin" /> Posting…</> : "Post my property"}
        </Button>
      </form>
    </div>
  );
}
