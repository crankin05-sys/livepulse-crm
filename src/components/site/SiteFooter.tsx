import { Link } from "@tanstack/react-router";
import { Truck, Phone, Mail, MapPin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Truck className="h-5 w-5" />
            </span>
            <span className="font-display text-base font-bold">U.S. Truck Driver Training School</span>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/70">
            Training the next generation of professional drivers with hands-on instruction, financing options, and real job placement.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/90">Programs</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-primary-foreground/70">
            <li><Link to="/programs" className="hover:text-accent">Class A CDL</Link></li>
            <li><Link to="/programs" className="hover:text-accent">Class B CDL</Link></li>
            <li><Link to="/programs" className="hover:text-accent">Third-Party Skills Exam</Link></li>
            <li><Link to="/careers" className="hover:text-accent">Career Services</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/90">Company</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-primary-foreground/70">
            <li><Link to="/about" className="hover:text-accent">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Contact</Link></li>
            <li><Link to="/auth" className="hover:text-accent">Staff Portal</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/90">Get in touch</h4>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/70">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /><a href="tel:+15868381268" className="hover:text-accent">586-838-1268</a></li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /><a href="mailto:info@ustdts.edu" className="hover:text-accent">info@ustdts.edu</a></li>
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-accent" /><span>6500 15 Mile Rd., Sterling Heights, MI 48312</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-primary-foreground/60 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} U.S. Truck Driver Training School. All rights reserved.</p>
          <p>Accredited CDL Training · Equal Opportunity Institution</p>
        </div>
      </div>
    </footer>
  );
}
