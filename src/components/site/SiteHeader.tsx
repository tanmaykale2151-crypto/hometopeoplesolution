import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, Plus, ShieldCheck, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Logo } from "./Logo";

const navLinkClass =
  "rounded-full px-3.5 py-2 text-sm font-semibold text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground";
const activeClass = "bg-secondary text-foreground";

export function SiteHeader() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/properties" search={{ type: "pg" }} className={navLinkClass} activeProps={{ className: activeClass }} activeOptions={{ includeSearch: true }}>
            Find PG
          </Link>
          <Link to="/properties" search={{ type: "flat" }} className={navLinkClass} activeProps={{ className: activeClass }} activeOptions={{ includeSearch: true }}>
            Find Flat
          </Link>
          <Link to="/properties" className={navLinkClass}>
            All listings
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full">
                  <UserIcon /> My account
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/my-properties">My listings</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin"><ShieldCheck /> Verify listings</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={signOut}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
          <Button asChild size="sm" className="rounded-full px-4">
            <Link to="/list-property">
              <Plus /> List your property
            </Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-background">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="mt-8 flex flex-col gap-1" onClick={() => setOpen(false)}>
              <Link to="/properties" search={{ type: "pg" }} className={navLinkClass}>Find PG</Link>
              <Link to="/properties" search={{ type: "flat" }} className={navLinkClass}>Find Flat</Link>
              <Link to="/properties" className={navLinkClass}>All listings</Link>
              {user ? (
                <>
                  <Link to="/my-properties" className={navLinkClass}>My listings</Link>
                  {isAdmin && <Link to="/admin" className={navLinkClass}>Verify listings</Link>}
                  <button onClick={signOut} className={`${navLinkClass} text-left`}>Sign out</button>
                </>
              ) : (
                <Link to="/auth" className={navLinkClass}>Sign in</Link>
              )}
              <Button asChild className="mt-4 rounded-full">
                <Link to="/list-property"><Plus /> List your property</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
