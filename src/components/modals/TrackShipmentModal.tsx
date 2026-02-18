import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, MapPin, Clock, Package } from "lucide-react";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

interface TrackingResult {
  found: boolean;
  message?: string;
  tracking_number?: string;
  status?: string;
  origin?: string;
  destination?: string;
  type?: string;
  eta_date?: string;
  events?: Array<{ event_time: string; location: string; description: string; status: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  received: "bg-blue-100 text-blue-800",
  warehouse: "bg-purple-100 text-purple-800",
  in_transit: "bg-accent/20 text-accent-foreground",
  arrived: "bg-green-100 text-green-800",
  delivered: "bg-success text-success-foreground",
};

export function TrackShipmentModal({ open, onOpenChange }: Props) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setLoading(true);
    setResult(null);

    const { data, error } = await supabase.rpc("get_public_tracking", {
      _tracking_number: trackingNumber.trim(),
    });

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setResult(data as unknown as TrackingResult);
  };

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) { setResult(null); setTrackingNumber(""); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Track Shipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleTrack} className="flex gap-2">
          <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="e.g., GBRS123456" className="flex-1" />
          <Button type="submit" disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {result && !result.found && (
          <p className="text-sm text-muted-foreground text-center py-4">{result.message || "No shipment found."}</p>
        )}

        {result?.found && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tracking #</p>
                <p className="font-mono font-semibold">{result.tracking_number}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[result.status || ""] || "bg-muted"}`}>
                {result.status?.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Origin</p><p>{result.origin}</p></div></div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Destination</p><p>{result.destination}</p></div></div>
              <div className="flex items-center gap-2"><Package className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Type</p><p className="capitalize">{result.type}</p></div></div>
              {result.eta_date && <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">ETA</p><p>{result.eta_date}</p></div></div>}
            </div>

            {result.events && result.events.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Recent Events</p>
                <div className="space-y-3">
                  {result.events.map((ev, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-accent" : "bg-border"}`} />
                        {i < result.events!.length - 1 && <div className="w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium">{ev.description}</p>
                        <p className="text-xs text-muted-foreground">{ev.location} • {new Date(ev.event_time).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
