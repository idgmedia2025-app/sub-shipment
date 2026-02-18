import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Customer = { id: string; name: string; email: string; phone: string | null; company: string; is_deleted: boolean; created_at: string };

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<Customer>>({});
  const { toast } = useToast();
  const { isAdmin, isStaff } = useAuth();

  const load = async () => {
    setLoading(true);
    let q = supabase.from("customers").select("*").eq("is_deleted", false).order("created_at", { ascending: false });
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    const { data } = await q;
    setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const save = async () => {
    if (!current.name || !current.email || !current.company) { toast({ title: "Name, email, company required", variant: "destructive" }); return; }
    if (current.id) {
      const { error } = await supabase.from("customers").update({ name: current.name, email: current.email, phone: current.phone, company: current.company }).eq("id", current.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("customers").insert({ name: current.name!, email: current.email!, company: current.company!, phone: current.phone });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: current.id ? "Customer updated" : "Customer created" });
    setEditOpen(false); setCurrent({}); load();
  };

  const softDelete = async (id: string) => {
    if (!window.confirm("Ma hubtaa inaad delete gareysid customer-kan? Ficilkaan lama laaban karo.")) return;
    await supabase.from("customers").update({ is_deleted: true }).eq("id", id);
    toast({ title: "Customer deleted" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…" className="pl-9 w-64" /></div>
        {isStaff && <Button onClick={() => { setCurrent({}); setEditOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Customer</Button>}
      </div>

      {loading ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : customers.length === 0 ? <p className="text-center py-12 text-muted-foreground">No customers found.</p> : (
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Company</TableHead><TableHead>Phone</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {customers.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.company}</TableCell>
                <TableCell>{c.phone || "—"}</TableCell>
                <TableCell className="flex gap-1">
                  {isStaff && <Button size="sm" variant="ghost" onClick={() => { setCurrent(c); setEditOpen(true); }}>Edit</Button>}
                  {isAdmin && <Button size="sm" variant="ghost" onClick={() => softDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{current.id ? "Edit Customer" : "New Customer"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={current.name || ""} onChange={e => setCurrent(c => ({ ...c, name: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input value={current.email || ""} onChange={e => setCurrent(c => ({ ...c, email: e.target.value }))} /></div>
            <div><Label>Company *</Label><Input value={current.company || ""} onChange={e => setCurrent(c => ({ ...c, company: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={current.phone || ""} onChange={e => setCurrent(c => ({ ...c, phone: e.target.value }))} /></div>
            <Button onClick={save} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
