import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(1, "Phone required").max(30),
  company: z.string().trim().min(1, "Company required").max(200),
  preferred_date: z.string().min(1, "Date required"),
  preferred_time: z.string().min(1, "Time required"),
  language: z.string().min(1, "Language required"),
  service: z.string().min(1, "Service required"),
  message: z.string().max(1000).optional(),
});

const LANGUAGES = ["English", "Chinese Mandarin", "Arabic", "Somali"];
const SERVICES = ["Air Freight", "Sea Freight", "Warehousing", "Consolidation", "Customs Clearance", "Door to Door Delivery", "Supplier Verification", "Product Sourcing", "Quality Inspection", "Consultation"];

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export function AppointmentModal({ open, onOpenChange }: Props) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", preferred_date: "", preferred_time: "", language: "", service: "", message: "" });
  const [date, setDate] = useState<Date>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    const { error } = await supabase.rpc("create_appointment_and_customer", {
      payload: result.data as any,
    });

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Appointment received", description: "We will contact you shortly." });
      setForm({ name: "", email: "", phone: "", company: "", preferred_date: "", preferred_time: "", language: "", service: "", message: "" });
      setDate(undefined);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Book an Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Your name" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@example.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1">
              <Label>Phone *</Label>
              <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+1 234 567 890" />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-1">
              <Label>Company *</Label>
              <Input value={form.company} onChange={e => update("company", e.target.value)} placeholder="Company name" />
              {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
            </div>
            <div className="space-y-1">
              <Label>Preferred Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={d => { setDate(d); update("preferred_date", d ? format(d, "yyyy-MM-dd") : ""); }} initialFocus /></PopoverContent>
              </Popover>
              {errors.preferred_date && <p className="text-xs text-destructive">{errors.preferred_date}</p>}
            </div>
            <div className="space-y-1">
              <Label>Preferred Time *</Label>
              <Input type="time" value={form.preferred_time} onChange={e => update("preferred_time", e.target.value)} />
              {errors.preferred_time && <p className="text-xs text-destructive">{errors.preferred_time}</p>}
            </div>
            <div className="space-y-1">
              <Label>Language *</Label>
              <Select value={form.language} onValueChange={v => update("language", v)}>
                <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
              {errors.language && <p className="text-xs text-destructive">{errors.language}</p>}
            </div>
            <div className="space-y-1">
              <Label>Service *</Label>
              <Select value={form.service} onValueChange={v => update("service", v)}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>{SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              {errors.service && <p className="text-xs text-destructive">{errors.service}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Message (optional)</Label>
            <Textarea value={form.message} onChange={e => update("message", e.target.value)} placeholder="Any additional details…" rows={3} />
          </div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
            {loading ? "Submitting…" : "Submit Appointment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
