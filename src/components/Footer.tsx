import { Link } from "react-router-dom";
import { Ship } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Ship className="h-6 w-6" />
              <span className="font-display text-lg font-bold">Gobras</span>
            </div>
            <p className="text-sm text-primary-foreground/70">
              Global sourcing you can trust. Verified suppliers, smooth procurement, and full order tracking.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <Link to="/" className="hover:text-primary-foreground">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link to="/industrial" className="hover:text-primary-foreground">
                  Industrial
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Services</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>Global Sourcing</li>
              <li>Supplier Verification</li>
              <li>Quality Inspection</li>
              <li>Procurement</li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>info@gobras.com</li>
              <li>+86 178 2696 6060</li>
              <li>
                <Link to="/login" className="hover:text-primary-foreground underline">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-primary-foreground/10 pt-6 text-center text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} Gobras Shipment Hub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
