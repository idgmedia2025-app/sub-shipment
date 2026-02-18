import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Printer, ArrowRightLeft, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Invoice = {
  id: string;
  invoice_type: string;
  proforma_no: string | null;
  commercial_no: string | null;
  status: string;
  customer_id: string;
  shipment_id: string | null;
  currency: string;
  items: any;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  created_at: string;
  converted_from_invoice_id: string | null;
};
type Customer = { id: string; name: string; company: string };
type Shipment = { id: string; tracking_number: string };
type LineItem = { description: string; quantity: number; unit_price: number; total: number };

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<Invoice>>({});
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit_price: 0, total: 0 }]);
  const { toast } = useToast();
  const { isAdmin, isStaff } = useAuth();

  const load = async () => {
    setLoading(true);
    let q = supabase.from("invoices").select("*").order("created_at", { ascending: false });
    if (filterStatus !== "all") q = q.eq("status", filterStatus);
    if (search) q = q.or(`proforma_no.ilike.%${search}%,commercial_no.ilike.%${search}%`);
    const { data } = await q;
    setInvoices(data || []);
    if (isStaff) {
      const [c, s] = await Promise.all([
        supabase.from("customers").select("id, name, company").eq("is_deleted", false),
        supabase.from("shipments").select("id, tracking_number").eq("is_deleted", false),
      ]);
      setCustomers(c.data || []);
      setShipments(s.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [filterStatus, search]);

  const calcTotals = (lineItems: LineItem[], tax = current.tax ?? 0, discount = current.discount ?? 0) => {
    const subtotal = lineItems.reduce((sum, i) => sum + i.total, 0);
    return {
      subtotal,
      tax,
      discount,
      total: subtotal + tax - discount,
    };
  };

  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      updated[idx].total = updated[idx].quantity * updated[idx].unit_price;
      return updated;
    });
  };

  const save = async () => {
    if (!current.customer_id || !current.invoice_type) {
      toast({ title: "Customer and type required", variant: "destructive" });
      return;
    }
    const totals = calcTotals(items, current.tax ?? 0, current.discount ?? 0);

    if (current.id) {
      const { error } = await supabase
        .from("invoices")
        .update({
          customer_id: current.customer_id,
          shipment_id: current.shipment_id,
          currency: current.currency || "USD",
          items: items as any,
          ...totals,
          status: current.status,
        })
        .eq("id", current.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { data: invoiceNo } = await supabase.rpc("generate_invoice_number", { _type: current.invoice_type! });
      const noField = current.invoice_type === "proforma" ? { proforma_no: invoiceNo } : { commercial_no: invoiceNo };
      const { error } = await supabase.from("invoices").insert({
        invoice_type: current.invoice_type!,
        customer_id: current.customer_id!,
        shipment_id: current.shipment_id,
        currency: current.currency || "USD",
        items: items as any,
        ...totals,
        ...noField,
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    }
    toast({ title: current.id ? "Invoice updated" : "Invoice created" });
    setEditOpen(false);
    setCurrent({});
    setItems([{ description: "", quantity: 1, unit_price: 0, total: 0 }]);
    load();
  };

  const convertToCommercial = async (inv: Invoice) => {
    if (inv.status !== "sent" && inv.status !== "paid") {
      toast({ title: "Kaliya sent ama paid proformas ayaa la beddeli karaa", variant: "destructive" });
      return;
    }
    const { data: invoiceNo } = await supabase.rpc("generate_invoice_number", { _type: "commercial" });
    const { error } = await supabase.from("invoices").insert({
      invoice_type: "commercial",
      commercial_no: invoiceNo,
      customer_id: inv.customer_id,
      shipment_id: inv.shipment_id,
      currency: inv.currency,
      items: inv.items,
      subtotal: inv.subtotal,
      tax: inv.tax,
      discount: inv.discount,
      total: inv.total,
      converted_from_invoice_id: inv.id,
      converted_at: new Date().toISOString(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Converted to commercial invoice" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "sent") updates.sent_at = new Date().toISOString();
    if (status === "paid") updates.paid_at = new Date().toISOString();
    await supabase.from("invoices").update(updates).eq("id", id);
    toast({ title: `Status updated to ${status}` });
    load();
  };

  const openEdit = (inv: Invoice) => {
    if (inv.status !== "draft") {
      toast({ title: "Only draft invoices can be edited" });
      return;
    }
    setCurrent(inv);
    setItems(Array.isArray(inv.items) ? (inv.items as LineItem[]) : []);
    setEditOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices…"
              className="pl-9 w-64"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isStaff && (
          <Button
            onClick={() => {
              setCurrent({ invoice_type: "proforma" });
              setItems([{ description: "", quantity: 1, unit_price: 0, total: 0 }]);
              setEditOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> New Invoice
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No invoices found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono font-medium">{inv.proforma_no || inv.commercial_no}</TableCell>
                <TableCell className="capitalize">{inv.invoice_type}</TableCell>
                <TableCell>
                  {inv.currency} {inv.total.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={STATUS_COLORS[inv.status]}>
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-1 flex-wrap">
                  {isStaff && inv.status === "draft" && (
                    <Button size="sm" variant="ghost" onClick={() => openEdit(inv)}>
                      Edit
                    </Button>
                  )}
                  {isStaff && inv.status === "draft" && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(inv.id, "sent")}>
                      Send
                    </Button>
                  )}
                  {isStaff && inv.status === "sent" && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(inv.id, "paid")}>
                      Mark Paid
                    </Button>
                  )}
                  {isStaff && inv.invoice_type === "proforma" && (
                    <Button size="sm" variant="outline" onClick={() => convertToCommercial(inv)}>
                      <ArrowRightLeft className="h-3 w-3 mr-1" />
                      Convert
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Browser print — sidebar ayaa sidoo kale la printi doonaa"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{current.id ? "Edit Invoice" : "New Invoice"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type *</Label>
                <Select
                  value={current.invoice_type || "proforma"}
                  onValueChange={(v) => setCurrent((c) => ({ ...c, invoice_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proforma">Proforma</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Customer *</Label>
                <Select
                  value={current.customer_id || ""}
                  onValueChange={(v) => setCurrent((c) => ({ ...c, customer_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.company})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Shipment</Label>
                <Select
                  value={current.shipment_id || ""}
                  onValueChange={(v) => setCurrent((c) => ({ ...c, shipment_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {shipments.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.tracking_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Currency</Label>
                <Input
                  value={current.currency || "USD"}
                  onChange={(e) => setCurrent((c) => ({ ...c, currency: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Line Items</Label>
              <div className="space-y-2 mt-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.unit_price}
                        onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2 text-sm font-medium text-right pt-2">
                      {(item.quantity * item.unit_price).toFixed(2)}
                    </div>
                    <div className="col-span-1">
                      <Button size="sm" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setItems([...items, { description: "", quantity: 1, unit_price: 0, total: 0 }])}
                >
                  + Add Item
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Tax</Label>
                <Input
                  type="number"
                  value={current.tax ?? 0}
                  onChange={(e) => setCurrent((c) => ({ ...c, tax: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Discount</Label>
                <Input
                  type="number"
                  value={current.discount ?? 0}
                  onChange={(e) => setCurrent((c) => ({ ...c, discount: Number(e.target.value) }))}
                />
              </div>
              <div className="pt-6 text-right">
                <p className="text-lg font-bold">Total: {calcTotals(items, current.tax ?? 0, current.discount ?? 0).total.toFixed(2)}</p>
              </div>
            </div>
            <Button onClick={save} className="w-full">
              Save Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
