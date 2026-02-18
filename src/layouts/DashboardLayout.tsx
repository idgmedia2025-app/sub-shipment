import { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import {
  Ship, LayoutDashboard, Users, Package, Truck, FileText, Calendar, UserPlus, Settings, LogOut, Menu, X, ChevronLeft
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "moderator", "user"] },
  { to: "/dashboard/leads", label: "Leads", icon: UserPlus, roles: ["admin", "moderator"] },
  { to: "/dashboard/customers", label: "Customers", icon: Users, roles: ["admin", "moderator", "user"] },
  { to: "/dashboard/shipments", label: "Shipments", icon: Package, roles: ["admin", "moderator", "user"] },
  { to: "/dashboard/tracking-events", label: "Tracking", icon: Truck, roles: ["admin", "moderator"] },
  { to: "/dashboard/invoices", label: "Invoices", icon: FileText, roles: ["admin", "moderator", "user"] },
  { to: "/dashboard/appointments", label: "Appointments", icon: Calendar, roles: ["admin", "moderator"] },
  { to: "/dashboard/users", label: "Users", icon: Users, roles: ["admin"] },
  { to: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

export function DashboardLayout() {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  const filteredNav = navItems.filter(item => role && item.roles.includes(role));

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Ship className="h-5 w-5" />
        </div>
        {!collapsed && <span className="font-display text-lg font-bold text-sidebar-foreground">Gobras</span>}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {filteredNav.map(item => {
          const isActive = item.to === "/dashboard"
            ? location.pathname === "/dashboard"
            : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        {!collapsed && profile && (
          <div className="mb-3">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.name}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{role}</p>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout} 
          disabled={loggingOut}
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className={`h-4 w-4 mr-2 ${loggingOut ? 'animate-spin' : ''}`} /> 
          {!collapsed && (loggingOut ? "Logging out..." : "Sign out")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={`no-print hidden md:flex flex-col border-r bg-sidebar transition-all duration-200 ${collapsed ? "w-16" : "w-60"}`}>
        <SidebarContent />
        <button onClick={() => setCollapsed(!collapsed)} className="absolute bottom-4 -right-3 z-10 hidden md:flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-foreground" style={{ left: collapsed ? "52px" : "228px" }}>
          <ChevronLeft className={`h-3 w-3 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 bg-sidebar">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="no-print flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
          <button className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg font-semibold capitalize">
            {location.pathname === "/dashboard"
              ? "Dashboard"
              : location.pathname.split("/").pop()?.replace(/-/g, " ")}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
