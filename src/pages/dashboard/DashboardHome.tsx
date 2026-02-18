import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Users, Calendar, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function DashboardHome() {
  const { isStaff, profile } = useAuth();
  const [stats, setStats] = useState({ shipments: 0, leads: 0, appointments: 0, invoices: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (isStaff) {
        const [s, l, a, i] = await Promise.all([
          supabase.from("shipments").select("id", { count: "exact", head: true }).eq("is_deleted", false),
          supabase.from("leads").select("id", { count: "exact", head: true }),
          supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "new"),
          supabase.from("invoices").select("id", { count: "exact", head: true }),
        ]);
        setStats({ shipments: s.count || 0, leads: l.count || 0, appointments: a.count || 0, invoices: i.count || 0 });
      } else if (profile?.customer_id) {
        const [s, i] = await Promise.all([
          supabase.from("shipments").select("id", { count: "exact", head: true }).eq("customer_id", profile.customer_id).eq("is_deleted", false),
          supabase.from("invoices").select("id", { count: "exact", head: true }).eq("customer_id", profile.customer_id),
        ]);
        setStats({ shipments: s.count || 0, leads: 0, appointments: 0, invoices: i.count || 0 });
      }
      setLoading(false);
    };
    load();
  }, [isStaff, profile]);

  const cards = [
    { title: "Shipments", value: stats.shipments, icon: Package, link: "/dashboard/shipments", iconBg: "bg-blue-500", show: true },
    { title: "Active Leads", value: stats.leads, icon: Users, link: "/dashboard/leads", iconBg: "bg-purple-500", show: isStaff },
    { title: "Pending Appointments", value: stats.appointments, icon: Calendar, link: "/dashboard/appointments", iconBg: "bg-amber-500", show: isStaff },
    { title: "Invoices", value: stats.invoices, icon: FileText, link: "/dashboard/invoices", iconBg: "bg-green-500", show: true },
  ].filter(c => c.show);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <Link key={c.title} to={c.link} className="block">
            <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <Card className="transition-shadow hover:shadow-xl cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
                  <div className={`${c.iconBg} rounded-lg p-2`}>
                    <c.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{c.value}</p>}
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
