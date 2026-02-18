import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Ship, Menu, X } from "lucide-react";
import { AppointmentModal } from "@/components/modals/AppointmentModal";
import { TrackShipmentModal } from "@/components/modals/TrackShipmentModal";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Industrial", to: "/industrial" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Ship className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">Gobras</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === l.to ? "text-primary" : "text-muted-foreground"}`}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="outline" size="sm" onClick={() => setTrackOpen(true)}>Track Shipment</Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setAppointmentOpen(true)}>Book Appointment</Button>
            <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t bg-background p-4 md:hidden">
            <nav className="flex flex-col gap-3">
              {navLinks.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-foreground">
                  {l.label}
                </Link>
              ))}
              <Button variant="outline" size="sm" onClick={() => { setTrackOpen(true); setMobileOpen(false); }}>Track Shipment</Button>
              <Button size="sm" className="bg-accent text-accent-foreground" onClick={() => { setAppointmentOpen(true); setMobileOpen(false); }}>Book Appointment</Button>
              <Link to="/login" onClick={() => setMobileOpen(false)}><Button variant="ghost" size="sm" className="w-full">Login</Button></Link>
            </nav>
          </div>
        )}
      </header>

      <AppointmentModal open={appointmentOpen} onOpenChange={setAppointmentOpen} />
      <TrackShipmentModal open={trackOpen} onOpenChange={setTrackOpen} />
    </>
  );
}
