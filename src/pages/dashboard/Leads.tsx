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
import { Plus, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Lead = { id: string; name: string; email: string; phone: string | null; company: string | null; status: string; notes: string | null; customer_id: string | null; created_at: string };

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-purple-100 text-purple-800",
  converted: "bg-green-100 text-green-800",
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<Lead>>({});
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const load = async () => {
    setLoading(true);
    let q = supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (filterStatus !== "all") q = q.eq("status", filterStatus);
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    const { data } = await q;
    setLeads(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus, search]);

  const save = async () => {
    if (!current.name || !current.email) { toast({ title: "Name and email required", variant: "destructive" }); return; }
    if (current.id) {
      const { error } = await supabase.from("leads").update({ name: current.name, email: current.email, phone: current.phone, company: current.company, notes: current.notes, status: current.status }).eq("id", current.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("leads").insert({ name: current.name!, email: current.email!, phone: current.phone, company: current.company, notes: current.notes });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: current.id ? "Lead updated" : "Lead created" });
    setEditOpen(false);
    setCurrent({});
    load();
  };

  const convertToCustomer = async (lead: Lead) => {
    const { data: newCustomer, error } = await supabase
      .from("customers")
      .insert({ name: lead.name, email: lead.email, phone: lead.phone, company: lead.company || "Unknown" })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") toast({ title: "Customer already exists with this email" });
      else toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.from("leads").update({ status: "converted", customer_id: newCustomer.id }).eq("id", lead.id);
    toast({ title: "Lead converted to customer" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…" className="pl-9 w-64" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="qualified">Qualified</SelectItem><SelectItem value="converted">Converted</SelectItem></SelectContent></Select>
        </div>
        <Button onClick={() => { setCurrent({}); setEditOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Lead</Button>
      </div>

      {loading ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : leads.length === 0 ? <p className="text-center py-12 text-muted-foreground">No leads found.</p> : (
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Company</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {leads.map(l => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.name}</TableCell>
                <TableCell>{l.email}</TableCell>
                <TableCell>{l.company}</TableCell>
                <TableCell><Badge variant="secondary" className={STATUS_COLORS[l.status]}>{l.status}</Badge></TableCell>
                <TableCell className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setCurrent(l); setEditOpen(true); }}>Edit</Button>
                  {l.status !== "converted" && <Button size="sm" variant="outline" onClick={() => convertToCustomer(l)}>Convert</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{current.id ? "Edit Lead" : "New Lead"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={current.name || ""} onChange={e => setCurrent(c => ({ ...c, name: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input value={current.email || ""} onChange={e => setCurrent(c => ({ ...c, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={current.phone || ""} onChange={e => setCurrent(c => ({ ...c, phone: e.target.value }))} /></div>
            <div><Label>Company</Label><Input value={current.company || ""} onChange={e => setCurrent(c => ({ ...c, company: e.target.value }))} /></div>
            {current.id && <div><Label>Status</Label><Select value={current.status} onValueChange={v => setCurrent(c => ({ ...c, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="qualified">Qualified</SelectItem><SelectItem value="converted">Converted</SelectItem></SelectContent></Select></div>}
            <div><Label>Notes</Label><Textarea value={current.notes || ""} onChange={e => setCurrent(c => ({ ...c, notes: e.target.value }))} /></div>
            <Button onClick={save} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
