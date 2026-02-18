import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type Appointment = { id: string; name: string; email: string; phone: string; company: string; preferred_date: string; preferred_time: string; language: string; service: string; message: string | null; status: string; created_at: string };

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800", contacted: "bg-yellow-100 text-yellow-800", closed: "bg-gray-100 text-gray-800",
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("appointments").select("*").order("created_at", { ascending: false });
    setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    toast({ title: `Status updated to ${status}` });
    load();
  };

  if (loading) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      {appointments.length === 0 ? <p className="text-center py-12 text-muted-foreground">No appointments yet.</p> : (
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Service</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {appointments.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell>{a.email}</TableCell>
                <TableCell>{a.service}</TableCell>
                <TableCell>{a.preferred_date} {a.preferred_time}</TableCell>
                <TableCell><Badge variant="secondary" className={STATUS_COLORS[a.status]}>{a.status}</Badge></TableCell>
                <TableCell>
                  <Select value={a.status} onValueChange={v => updateStatus(a.id, v)}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
