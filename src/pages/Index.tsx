import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AppointmentModal } from "@/components/modals/AppointmentModal";
import { TrackShipmentModal } from "@/components/modals/TrackShipmentModal";
import { TrustedPartnersMarquee } from "@/components/TrustedPartnersMarquee";
import {
  Plane,
  Ship,
  Warehouse,
  Package,
  ArrowRight,
  CheckCircle,
  Search,
  Globe,
  Truck,
  ShieldCheck,
  Handshake,
  ClipboardCheck,
} from "lucide-react";

const services = [
  { icon: Plane, title: "Air Freight", desc: "Fast and reliable air cargo services worldwide." },
  { icon: Ship, title: "Sea Freight", desc: "Cost-effective ocean shipping for large volumes." },
  { icon: Truck, title: "Land Transport", desc: "Door-to-door ground logistics across regions." },
  { icon: Warehouse, title: "Warehousing", desc: "Secure storage and inventory management solutions." },
  { icon: Globe, title: "Global Sourcing", desc: "End-to-end supplier sourcing and procurement." },
  { icon: Package, title: "Customs Clearance", desc: "Smooth customs handling and documentation." },
];
import heroImg from "@/assets/hero-logistics.jpg";

const globalSourcingFlow = [
  {
    icon: Search,
    title: "Requirements & Sourcing",
    desc: "Define specs and find reliable suppliers for your product worldwide.",
  },
  {
    icon: ShieldCheck,
    title: "Supplier Verification",
    desc: "Verify factories, licenses, and capacity to reduce risk.",
  },
  {
    icon: Handshake,
    title: "Negotiation & Procurement",
    desc: "Negotiate price, MOQ, lead time, and secure purchasing terms.",
  },
  {
    icon: ClipboardCheck,
    title: "Production & Quality Control",
    desc: "Follow up production and inspect quality before shipment.",
  },
  {
    icon: Package,
    title: "Packing & Consolidation",
    desc: "Label, pack professionally, and combine orders to cut costs.",
  },
  {
    icon: Truck,
    title: "Shipping & Delivery",
    desc: "Arrange freight, handle customs, and deliver door-to-door with tracking.",
  },
];

const steps = [
  { num: "01", title: "Book & Quote", desc: "Submit your shipment details and get an instant quote." },
  { num: "02", title: "Ship & Track", desc: "We handle logistics while you track in real-time." },
  { num: "03", title: "Receive & Confirm", desc: "Your cargo arrives safely at the destination." },
];

export default function Index() {
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative min-h-[600px] flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImg}
              alt="Shipping port with cargo containers at sunset"
              className="h-full w-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.88), rgba(15,23,42,0.55))" }}
            />
          </div>
          <div className="container relative z-10 py-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-2xl"
            >
              <h1 className="font-display text-4xl font-bold text-white md:text-5xl lg:text-6xl leading-tight">
                Your Trusted Global Sourcing Partner
              </h1>
              <p className="mt-4 text-lg text-white/80 md:text-xl">
                End-to-end global sourcing: supplier verification, inspection, and order tracking.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  onClick={() => setAppointmentOpen(true)}
                >
                  Book Appointment
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-black hover:bg-white/10"
                  onClick={() => setTrackOpen(true)}
                >
                  <Search className="mr-2 h-4 w-4" /> Track Shipment
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-12 grid grid-cols-3 gap-4 max-w-lg"
            >
              {[
                { value: "10,000+", label: "Shipments" },
                { value: "50+", label: "Global Partners" },
                { value: "15+", label: "Years Experience" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-2xl font-bold text-white md:text-3xl">{s.value}</p>
                  <p className="text-sm text-white/60">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Global Sourcing Flow */}
        <section className="container py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Global Sourcing</h2>
            <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
              From supplier search to delivery—handled end-to-end.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {globalSourcingFlow.map((s) => (
              <Card key={s.title} className="group hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-display">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-muted py-20">
          <div className="container">
            <h2 className="font-display text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.num} className="relative flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-xl font-bold mb-4">
                    {s.num}
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                  {i < steps.length - 1 && (
                    <ArrowRight className="hidden md:block absolute right-0 top-8 -mr-4 h-6 w-6 text-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trusted Partners Marquee */}
        <TrustedPartnersMarquee />

        {/* Industrial preview */}
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="container text-center">
            <h2 className="font-display text-3xl font-bold mb-4">Industrial Solutions</h2>
            <p className="text-primary-foreground/70 max-w-xl mx-auto mb-8">
              From raw materials to heavy machinery — we handle complex industrial logistics with expertise.
            </p>
            <Link to="/industrial">
              <Button
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                View Industrial Services <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <AppointmentModal open={appointmentOpen} onOpenChange={setAppointmentOpen} />
      <TrackShipmentModal open={trackOpen} onOpenChange={setTrackOpen} />
    </>
  );
}
