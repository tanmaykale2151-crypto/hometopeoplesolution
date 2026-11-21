import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

const REDIRECT_KEY = "htps:after-auth";

function safePath(value: unknown): string | undefined {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : undefined;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (raw: Record<string, unknown>): { redirect?: string } => {
    const r = safePath(raw["redirect"]);
    return r ? { redirect: r } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in | HTPS – Home To People Solution" },
      { name: "description", content: "Sign in or create a free HTPS account to list your PG or flat for rent in Pune." },
      { property: "og:title", content: "Sign in | HTPS" },
      { property: "og:description", content: "Create a free account to list your property in Pune." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function GoogleLogo() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="!size-[18px]">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (redirect) sessionStorage.setItem(REDIRECT_KEY, redirect);
  }, [redirect]);

  useEffect(() => {
    if (!user) return;
    const target = safePath(sessionStorage.getItem(REDIRECT_KEY)) ?? redirect ?? "/my-properties";
    sessionStorage.removeItem(REDIRECT_KEY);
    void navigate({ to: target });
  }, [user, redirect, navigate]);

  const social = async (provider: "google" | "lovable") => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) {
      toast.error(result.error.message || "Could not sign in. Please try again.");
      setBusy(false);
    }
  };

  const signIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  const signUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: String(f.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: { full_name: String(f.get("name")) },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (!data.session) setSentTo(email);
  };

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-lift">
        {sentTo ? (
          <div className="text-center">
            <MailCheck className="mx-auto size-12 text-primary" />
            <h1 className="mt-4 text-2xl font-extrabold">Check your email</h1>
            <p className="mt-2 text-muted-foreground">
              We sent a confirmation link to <strong className="text-foreground">{sentTo}</strong>. Click it to finish creating your account.
            </p>
            <Button variant="outline" className="mt-6 rounded-full" onClick={() => setSentTo(null)}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold">Welcome to HTPS</h1>
            <p className="mt-1.5 text-muted-foreground">Sign in to list and manage your properties.</p>

            <div className="mt-6 grid gap-2.5">
              <Button type="button" variant="google" size="lg" className="h-11 rounded-xl" disabled={busy} onClick={() => social("google")}>
                <GoogleLogo /> Continue with Google
              </Button>
              <Button type="button" variant="outline" size="lg" className="h-11 rounded-xl" disabled={busy} onClick={() => social("lovable")}>
                <LovableMark className="!size-[18px]" /> Continue with Lovable
              </Button>
            </div>

            <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
            </div>

            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={signIn} className="mt-4 grid gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="si-email">Email</Label>
                    <Input id="si-email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="si-password">Password</Label>
                    <Input id="si-password" name="password" type="password" required autoComplete="current-password" />
                  </div>
                  <Button type="submit" size="lg" className="h-11 rounded-xl" disabled={busy}>Sign in</Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={signUp} className="mt-4 grid gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="su-name">Full name</Label>
                    <Input id="su-name" name="name" required autoComplete="name" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="su-password">Password</Label>
                    <Input id="su-password" name="password" type="password" required minLength={6} autoComplete="new-password" />
                  </div>
                  <Button type="submit" size="lg" className="h-11 rounded-xl" disabled={busy}>Create account</Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Just looking for a room? You don't need an account — <Link to="/properties" className="font-semibold text-primary">browse listings</Link>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
