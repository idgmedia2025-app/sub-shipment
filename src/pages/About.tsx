import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Building2, Users, Globe, Target } from "lucide-react";

export default function About() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="container text-center">
            <h1 className="font-display text-4xl font-bold md:text-5xl">About Gobras</h1>
            <p className="mt-4 text-lg text-primary-foreground/70 max-w-2xl mx-auto">
              Your trusted partner in global logistics since 2009. We connect businesses to the world through reliable freight and supply chain solutions.
            </p>
          </div>
        </section>

        <section className="container py-16">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <h2 className="font-display text-3xl font-bold mb-4">Our Story</h2>
              <p className="text-muted-foreground mb-4">
                Founded with a vision to simplify international trade, Gobras Shipment Hub has grown from a small freight forwarding office to a full-service logistics company serving clients across 50+ countries.
              </p>
              <p className="text-muted-foreground">
                Our team of logistics experts ensures every shipment — whether by air, sea, or land — arrives safely, on time, and with complete transparency through our real-time tracking system.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Building2, title: "15+ Years", desc: "Industry experience" },
                { icon: Users, title: "50+ Partners", desc: "Global network" },
                { icon: Globe, title: "100+ Countries", desc: "Worldwide reach" },
                { icon: Target, title: "10,000+", desc: "Shipments delivered" },
              ].map(item => (
                <div key={item.title} className="rounded-xl border bg-card p-6 text-center">
                  <item.icon className="mx-auto h-8 w-8 text-accent mb-2" />
                  <p className="font-display font-bold text-xl">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted py-16">
          <div className="container text-center">
            <h2 className="font-display text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              To provide reliable, transparent, and cost-effective logistics solutions that empower businesses to grow globally. We believe in building lasting partnerships through trust and exceptional service.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
