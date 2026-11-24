import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { IMAGE_BUCKET, isStoragePath, type Property, type PropertyRow } from "./properties";

export type PropertyFilters = {
  type?: "pg" | "flat";
  locality?: string;
  maxRent?: number;
  gender?: "boys" | "girls" | "any";
  limit?: number;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Signed URLs come back on the server-side address; rewrite them to the browser-facing one. */
function toBrowserUrl(url: string): string {
  const server = process.env["SUPABASE_URL"]?.replace(/\/+$/, "");
  const pub = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined)?.replace(/\/+$/, "");
  if (server && pub && url.startsWith(server)) return pub + url.slice(server.length);
  return url;
}

async function withImageUrls(client: SupabaseClient<Database>, rows: PropertyRow[]): Promise<Property[]> {
  const paths = Array.from(new Set(rows.flatMap((r) => r.images.filter(isStoragePath))));
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await client.storage.from(IMAGE_BUCKET).createSignedUrls(paths, 60 * 60 * 24);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) signed.set(item.path, toBrowserUrl(item.signedUrl));
    }
  }
  return rows.map((r) => ({
    ...r,
    imageUrls: r.images
      .map((p) => (isStoragePath(p) ? signed.get(p) : p))
      .filter((u): u is string => Boolean(u)),
  }));
}

export const listProperties = createServerFn({ method: "GET" })
  .inputValidator((input: PropertyFilters) => input)
  .handler(async ({ data }) => {
    const client = publicClient();
    let query = client
      .from("properties")
      .select("*")
      .eq("is_available", true)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limit ?? 60, 100));
    if (data.type) query = query.eq("listing_type", data.type);
    if (data.locality) query = query.eq("locality", data.locality);
    if (data.maxRent) query = query.lte("rent", data.maxRent);
    if (data.gender && data.gender !== "any") query = query.in("gender", [data.gender, "any"]);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return withImageUrls(client, rows ?? []);
  });

export const getProperty = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    if (!UUID_RE.test(data.id)) return null;
    const client = publicClient();
    const { data: row, error } = await client
      .from("properties")
      .select("*")
      .eq("id", data.id)
      .eq("is_available", true)
      .eq("status", "approved")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const [withUrls] = await withImageUrls(client, [row]);
    return withUrls ?? null;
  });

export const listMyProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("properties")
      .select("*")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return withImageUrls(context.supabase as unknown as SupabaseClient<Database>, rows ?? []);
  });

/** Review queue for admins: every listing, newest first. Non-admins get `allowed: false`. */
export const listListingsForReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) return { allowed: false as const, properties: [] as Property[] };
    const { data: rows, error } = await context.supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    const properties = await withImageUrls(context.supabase as unknown as SupabaseClient<Database>, rows ?? []);
    return { allowed: true as const, properties };
  });
