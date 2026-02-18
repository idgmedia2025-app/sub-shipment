import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Shipment = {
  id: string; tracking_number: string; customer_id: string; type: string; origin: string; destination: string;
  cargo_description: string | null; status: string; eta_date: string | null; notes: string | null;
  weight_kg: number | null; length_cm: number | null; width_cm: number | null; height_cm: number | null;
  container_type: string | null; volume_cbm: number | null; vehicle_type: string | null; is_deleted: boolean;
};
type Customer = { id: string; name: string; company: string };

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground", received: "bg-blue-100 text-blue-800", warehouse: "bg-purple-100 text-purple-800",
  in_transit: "bg-yellow-100 text-yellow-800", arrived: "bg-green-100 text-green-800", delivered: "bg-green-500 text-white",
};

export default function Shipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<Shipment>>({});
  const { toast } = useToast();
  const { isAdmin, isStaff, user } = useAuth();

  const load = async () => {
    setLoading(true);
    let q = supabase.from("shipments").select("*").eq("is_deleted", false).order("created_at", { ascending: false });
    if (filterStatus !== "all") q = q.eq("status", filterStatus);
    if (search) q = q.or(`tracking_number.ilike.%${search}%,origin.ilike.%${search}%,destination.ilike.%${search}%`);
    const { data } = await q;
    setShipments(data || []);
    const { data: c } = await supabase.from("customers").select("id, name, company").eq("is_deleted", false);
    setCustomers(c || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus, search]);

  const generateTrackingNumber = () => {
    const ts = Date.now().toString().slice(-6);
    const rand = Math.random().toString(36).slice(-3).toUpperCase();
    return `GBRS${ts}${rand}`;
  };

  const save = async () => {
    if (!current.customer_id || !current.type || !current.origin || !current.destination) { toast({ title: "Fill required fields", variant: "destructive" }); return; }
    if (current.id) {
      const { error } = await supabase.from("shipments").update({
        customer_id: current.customer_id, type: current.type, origin: current.origin, destination: current.destination,
        cargo_description: current.cargo_description, status: current.status, eta_date: current.eta_date, notes: current.notes,
        weight_kg: current.weight_kg, length_cm: current.length_cm, width_cm: current.width_cm, height_cm: current.height_cm,
        container_type: current.container_type, volume_cbm: current.volume_cbm, vehicle_type: current.vehicle_type,
        updated_by: user?.id,
      }).eq("id", current.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const tracking_number = generateTrackingNumber();
      const { error } = await supabase.from("shipments").insert({
        tracking_number, customer_id: current.customer_id!, type: current.type!, origin: current.origin!, destination: current.destination!,
        cargo_description: current.cargo_description, notes: current.notes, weight_kg: current.weight_kg,
        length_cm: current.length_cm, width_cm: current.width_cm, height_cm: current.height_cm,
        container_type: current.container_type, volume_cbm: current.volume_cbm, vehicle_type: current.vehicle_type,
        created_by: user?.id,
      });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: current.id ? "Shipment updated" : "Shipment created" });
    setEditOpen(false); setCurrent({}); load();
  };

  const softDelete = async (id: string) => {
    if (!window.confirm("Ma hubtaa inaad delete gareysid shipment-kan? Ficilkaan lama laaban karo.")) return;
    await supabase.from("shipments").update({ is_deleted: true }).eq("id", id);
    toast({ title: "Shipment deleted" }); load();
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("shipments").update({ status: newStatus, updated_by: user?.id }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Status updated to ${newStatus.replace("_", " ")}` });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-9 w-64" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="received">Received</SelectItem><SelectItem value="warehouse">Warehouse</SelectItem><SelectItem value="in_transit">In Transit</SelectItem><SelectItem value="arrived">Arrived</SelectItem><SelectItem value="delivered">Delivered</SelectItem></SelectContent></Select>
        </div>
        {isStaff && <Button onClick={() => { setCurrent({}); setEditOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Shipment</Button>}
      </div>

      {loading ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : shipments.length === 0 ? <p className="text-center py-12 text-muted-foreground">No shipments found.</p> : (
        <Table>
          <TableHeader><TableRow><TableHead>Tracking #</TableHead><TableHead>Type</TableHead><TableHead>Origin → Dest</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {shipments.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-mono font-medium">{s.tracking_number}</TableCell>
                <TableCell className="capitalize">{s.type}</TableCell>
                <TableCell>{s.origin} → {s.destination}</TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Select value={s.status} onValueChange={v => updateStatus(s.id, v)}>
                      <SelectTrigger className="w-32 h-8">
                        <Badge variant="secondary" className={STATUS_COLORS[s.status]}>{s.status.replace("_", " ")}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="arrived">Arrived</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary" className={STATUS_COLORS[s.status]}>{s.status.replace("_", " ")}</Badge>
                  )}
                </TableCell>
                <TableCell className="flex gap-1">
                  {isStaff && <Button size="sm" variant="ghost" onClick={() => { setCurrent(s); setEditOpen(true); }}>Edit</Button>}
                  {isAdmin && <Button size="sm" variant="ghost" onClick={() => softDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{current.id ? "Edit Shipment" : "New Shipment"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Customer *</Label><Select value={current.customer_id || ""} onValueChange={v => setCurrent(c => ({ ...c, customer_id: v }))}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.company})</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type *</Label><Select value={current.type || ""} onValueChange={v => setCurrent(c => ({ ...c, type: v }))}><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="air">Air</SelectItem><SelectItem value="sea">Sea</SelectItem><SelectItem value="land">Land</SelectItem></SelectContent></Select></div>
              {current.id && <div><Label>Status</Label><Select value={current.status || "pending"} onValueChange={v => setCurrent(c => ({ ...c, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="received">Received</SelectItem><SelectItem value="warehouse">Warehouse</SelectItem><SelectItem value="in_transit">In Transit</SelectItem><SelectItem value="arrived">Arrived</SelectItem><SelectItem value="delivered">Delivered</SelectItem></SelectContent></Select></div>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Origin *</Label><Input value={current.origin || ""} onChange={e => setCurrent(c => ({ ...c, origin: e.target.value }))} /></div>
              <div><Label>Destination *</Label><Input value={current.destination || ""} onChange={e => setCurrent(c => ({ ...c, destination: e.target.value }))} /></div>
            </div>
            <div><Label>Cargo Description</Label><Textarea value={current.cargo_description || ""} onChange={e => setCurrent(c => ({ ...c, cargo_description: e.target.value }))} /></div>
            <div><Label>ETA Date</Label><Input type="date" value={current.eta_date || ""} onChange={e => setCurrent(c => ({ ...c, eta_date: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Weight (kg)</Label><Input type="number" value={current.weight_kg ?? ""} onChange={e => setCurrent(c => ({ ...c, weight_kg: e.target.value ? Number(e.target.value) : null }))} /></div>
              <div><Label>Volume (CBM)</Label><Input type="number" value={current.volume_cbm ?? ""} onChange={e => setCurrent(c => ({ ...c, volume_cbm: e.target.value ? Number(e.target.value) : null }))} /></div>
              <div><Label>Container</Label><Select value={current.container_type || ""} onValueChange={v => setCurrent(c => ({ ...c, container_type: v || null }))}><SelectTrigger><SelectValue placeholder="N/A" /></SelectTrigger><SelectContent><SelectItem value="20ft">20ft</SelectItem><SelectItem value="40ft">40ft</SelectItem><SelectItem value="LCL">LCL</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Length (cm)</Label><Input type="number" value={current.length_cm ?? ""} onChange={e => setCurrent(c => ({ ...c, length_cm: e.target.value ? Number(e.target.value) : null }))} /></div>
              <div><Label>Width (cm)</Label><Input type="number" value={current.width_cm ?? ""} onChange={e => setCurrent(c => ({ ...c, width_cm: e.target.value ? Number(e.target.value) : null }))} /></div>
              <div><Label>Height (cm)</Label><Input type="number" value={current.height_cm ?? ""} onChange={e => setCurrent(c => ({ ...c, height_cm: e.target.value ? Number(e.target.value) : null }))} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={current.notes || ""} onChange={e => setCurrent(c => ({ ...c, notes: e.target.value }))} /></div>
            <Button onClick={save} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
