import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type TrackingEvent = { id: string; shipment_id: string; event_time: string; location: string; description: string; status: string | null; created_at: string };
type Shipment = { id: string; tracking_number: string; status: string };

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "received", label: "Received" },
  { value: "warehouse", label: "Warehouse" },
  { value: "in_transit", label: "In Transit" },
  { value: "arrived", label: "Arrived" },
  { value: "delivered", label: "Delivered" },
];

export default function TrackingEvents() {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<TrackingEvent>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    const { data: s } = await supabase.from("shipments").select("id, tracking_number, status").eq("is_deleted", false).order("created_at", { ascending: false });
    setShipments(s || []);
    let q = supabase.from("tracking_events").select("*").order("event_time", { ascending: false });
    if (selectedShipment !== "all") q = q.eq("shipment_id", selectedShipment);
    const { data } = await q.limit(100);
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [selectedShipment]);

  const save = async () => {
    if (!current.shipment_id || !current.event_time || !current.location || !current.description) { toast({ title: "Fill required fields", variant: "destructive" }); return; }
    const { error } = await supabase.from("tracking_events").insert({
      shipment_id: current.shipment_id!, event_time: current.event_time!, location: current.location!, description: current.description!, status: current.status, created_by: user?.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Event added" });
    setEditOpen(false); setCurrent({}); load();
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("tracking_events").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Event deleted" }); load();
  };

  const getTrackingNum = (shipmentId: string) => shipments.find(s => s.id === shipmentId)?.tracking_number || "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={selectedShipment} onValueChange={setSelectedShipment}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Filter by shipment" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Shipments</SelectItem>{shipments.map(s => <SelectItem key={s.id} value={s.id}>{s.tracking_number}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={() => { setCurrent({}); setEditOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Event</Button>
      </div>

      {loading ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : events.length === 0 ? <p className="text-center py-12 text-muted-foreground">No events found.</p> : (
        <div className="space-y-4">
          {events.map((ev, i) => (
            <div key={ev.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`h-3 w-3 rounded-full ${i === 0 ? "bg-accent" : "bg-border"}`} />
                {i < events.length - 1 && <div className="w-px flex-1 bg-border" />}
              </div>
              <div className="pb-4 flex items-start justify-between gap-2 flex-1">
                <div>
                  <p className="font-medium">{ev.description}</p>
                  <p className="text-sm text-muted-foreground">{ev.location} • {new Date(ev.event_time).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Shipment: {getTrackingNum(ev.shipment_id)} {ev.status && `• ${ev.status}`}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteEvent(ev.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Add Tracking Event</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Shipment *</Label><Select value={current.shipment_id || ""} onValueChange={v => { const sh = shipments.find(s => s.id === v); setCurrent(c => ({ ...c, shipment_id: v, status: sh?.status || c.status })); }}><SelectTrigger><SelectValue placeholder="Select shipment" /></SelectTrigger><SelectContent>{shipments.map(s => <SelectItem key={s.id} value={s.id}>{s.tracking_number}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Event Time *</Label><Input type="datetime-local" value={current.event_time || ""} onChange={e => setCurrent(c => ({ ...c, event_time: e.target.value }))} /></div>
            <div><Label>Location *</Label><Input value={current.location || ""} onChange={e => setCurrent(c => ({ ...c, location: e.target.value }))} /></div>
            <div><Label>Description *</Label><Input value={current.description || ""} onChange={e => setCurrent(c => ({ ...c, description: e.target.value }))} /></div>
            <div><Label>Status</Label><Select value={current.status || ""} onValueChange={v => setCurrent(c => ({ ...c, status: v }))}><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
            <Button onClick={save} className="w-full">Add Event</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
