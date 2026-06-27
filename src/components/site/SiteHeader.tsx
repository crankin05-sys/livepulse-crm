import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Truck, Phone } from "lucide-react";
import { Button } from "../ui/button";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/programs", label: "Programs" },
  { to: "/careers", label: "Career Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-sm font-bold tracking-tight text-foreground">U.S. Truck Driver</span>
            <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Training School</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-semibold text-foreground bg-muted" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Staff Login</Button>
          </Link>
          <Link to="/contact">
            <Button size="sm" variant="accent">Apply Now</Button>
          </Link>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              <Link to="/auth" onClick={() => setOpen(false)} className="flex-1">
                <Button variant="outline" className="w-full" size="sm">Staff Login</Button>
              </Link>
              <Link to="/contact" onClick={() => setOpen(false)} className="flex-1">
                <Button variant="accent" className="w-full" size="sm">Apply Now</Button>
              </Link>
            </div>
            <a href="tel:+15868381268" className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" /> 586-838-1268
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
