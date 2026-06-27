import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  MapPin,
  Building2,
  LogOut,
  Truck,
  Menu,
  X,
  UserCheck,
  Wallet,
  CalendarClock,
  Bell,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../integrations/supabase/client";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/_app")({
  component: AuthLayout,
});

const navGroups = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Admissions",
    items: [
      { to: "/leads", label: "Leads", icon: Users },
      { to: "/students", label: "Students", icon: GraduationCap },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/fleet", label: "Live Fleet", icon: MapPin },
      { to: "/carriers", label: "Carriers", icon: Building2 },
    ],
  },
] as const;

const aiAgents = [
  { name: "Admissions AI", icon: UserCheck, status: "Active" },
  { name: "Funding AI", icon: Wallet, status: "Active" },
  { name: "Appointment AI", icon: CalendarClock, status: "Active" },
  { name: "Follow-Up AI", icon: Bell, status: "Active" },
  { name: "Recruiting AI", icon: Megaphone, status: "Standby" },
  { name: "Executive AI", icon: TrendingUp, status: "Active" },
] as const;


function AuthLayout() {
  const { session, loading, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [session, loading, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Truck className="h-5 w-5 animate-pulse" /> Loading CRM…
        </div>
      </div>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Truck className="h-4 w-4" />
        </span>
        <span className="font-display text-sm font-bold text-sidebar-foreground">USTDTS CRM</span>
      </div>
      <nav className="flex-1 space-y-5 p-3">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 pb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <item.icon className="h-4.5 w-4.5" /> {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="px-2 py-2 text-xs text-sidebar-foreground/60 truncate">{user?.email}</div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <LogOut className="h-4.5 w-4.5" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar">{SidebarInner}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6 text-foreground" />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Live tracking CRM</span>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm">View website</Button>
          </Link>
        </header>
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
