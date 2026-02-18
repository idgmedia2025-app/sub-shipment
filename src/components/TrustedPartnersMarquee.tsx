import { useState } from "react";

const partners = [
  { name: "Maersk Line", logo: "/logos/maersk.svg" },
  { name: "DHL Global", logo: "/logos/dhl.svg" },
  { name: "CMA CGM", logo: "/logos/cmacgm.svg" },
  { name: "Hapag-Lloyd", logo: "/logos/hapag.svg" },
  { name: "MSC Cargo", logo: "/logos/msc.svg" },
  { name: "FedEx Logistics", logo: "/logos/fedex.svg" },
  { name: "Kuehne+Nagel", logo: "/logos/kuehne.svg" },
  { name: "DB Schenker", logo: "/logos/schenker.svg" },
  { name: "Bolloré Transport", logo: "/logos/bollore.svg" },
  { name: "Aramex", logo: "/logos/aramex.svg" },
];

function PartnerPill({ name, logo }: { name: string; logo: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-sm shrink-0">
      {imgError ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
          {name.charAt(0)}
        </div>
      ) : (
        <img
          src={logo}
          alt={`${name} logo`}
          className="h-8 w-8 object-contain"
          onError={() => setImgError(true)}
        />
      )}
      <span className="text-sm font-medium text-foreground whitespace-nowrap">{name}</span>
    </div>
  );
}

export function TrustedPartnersMarquee() {
  const track = [...partners, ...partners];

  return (
    <section className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] py-16 overflow-hidden bg-muted/50">
      <div className="text-center mb-10 px-4">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Trusted Partners</h2>
        <p className="mt-2 text-muted-foreground">Companies we work with around the world.</p>
      </div>

      <div
        className="group flex gap-6 motion-safe:animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused]"
        style={{ width: "max-content" }}
      >
        {track.map((p, i) => (
          <PartnerPill key={`${p.name}-${i}`} name={p.name} logo={p.logo} />
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .motion-safe\\:animate-\\[marquee_30s_linear_infinite\\] {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
