import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Shield, Search, Truck, Factory, Wrench, Cpu, Zap } from "lucide-react";

const products = [
  { icon: Package, title: "Raw Materials", desc: "Sourcing and shipping of industrial raw materials from verified suppliers." },
  { icon: Factory, title: "Manufacturing Equipment", desc: "Heavy machinery and factory equipment logistics with specialized handling." },
  { icon: Wrench, title: "Spare Parts", desc: "Quick turnaround on industrial spare parts sourcing and delivery." },
  { icon: Cpu, title: "Electronics & Components", desc: "Delicate electronics with temperature-controlled shipping." },
  { icon: Shield, title: "Quality Assurance", desc: "Pre-shipment inspections and quality control at origin." },
  { icon: Search, title: "Supplier Verification", desc: "Background checks and audits on potential suppliers." },
  { icon: Truck, title: "Heavy Cargo", desc: "Oversized and heavy-lift cargo handling with specialized equipment." },
  { icon: Zap, title: "Express Industrial", desc: "Expedited shipping for urgent industrial orders worldwide." },
];

export default function Industrial() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="container text-center">
            <h1 className="font-display text-4xl font-bold md:text-5xl">Industrial Solutions</h1>
            <p className="mt-4 text-lg text-primary-foreground/70 max-w-2xl mx-auto">
              End-to-end industrial logistics — from sourcing to delivery. We handle the complexity so you can focus on growing your business.
            </p>
          </div>
        </section>

        <section className="container py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map(p => (
              <Card key={p.title} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <p.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-display text-lg">{p.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
