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
import { UserPlus, RotateCcw, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserProfile = { id: string; user_id: string; name: string; email: string; is_active: boolean; user_roles: { role: string }[] };
type Invite = { id: string; email: string; full_name: string; role: string; status: string; created_at: string };

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newInvite, setNewInvite] = useState({ email: "", full_name: "", role: "user" as string });
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const load = async () => {
    setLoading(true);
    const { data: usersData } = await supabase.functions.invoke("manage-user", {
      body: { action: "list" },
    });
    setUsers(usersData?.activeUsers || []);

    const { data: invitesData } = await supabase.functions.invoke("manage-user", {
      body: { action: "list_pending" },
    });
    setInvites(invitesData?.invites || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sendInvite = async () => {
    if (!newInvite.email || !newInvite.full_name) { toast({ title: "Email and name required", variant: "destructive" }); return; }
    setInviting(true);
    const { data, error } = await supabase.functions.invoke("manage-user", {
      body: { action: "create", ...newInvite },
    });
    setInviting(false);
    if (error || data?.error) { toast({ title: "Error", description: data?.error || error?.message, variant: "destructive" }); return; }
    toast({ title: "Invite sent!" });
    setInviteOpen(false); setNewInvite({ email: "", full_name: "", role: "user" }); load();
  };

  const resendInvite = async (email: string) => {
    const { data, error } = await supabase.functions.invoke("manage-user", { body: { action: "resend_invite", email } });
    if (error || data?.error) { toast({ title: "Error", description: data?.error || error?.message, variant: "destructive" }); return; }
    toast({ title: "Invite resent" });
  };

  const updateRole = async (userId: string, role: string) => {
    await supabase.functions.invoke("manage-user", { body: { action: "update_role", userId, role } });
    toast({ title: "Role updated" }); load();
  };

  const deactivate = async (userId: string) => {
    await supabase.functions.invoke("manage-user", { body: { action: "deactivate", userId } });
    toast({ title: "User deactivated" }); load();
  };

  const deleteUser = async (userId: string) => {
    await supabase.functions.invoke("manage-user", { body: { action: "delete", userId } });
    toast({ title: "User deleted" }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">User Management</h2>
        <Button onClick={() => setInviteOpen(true)}><UserPlus className="h-4 w-4 mr-1" /> Invite User</Button>
      </div>

      <Tabs defaultValue="users">
        <TabsList><TabsTrigger value="users">Active Users</TabsTrigger><TabsTrigger value="pending">Pending Invites</TabsTrigger></TabsList>

        <TabsContent value="users">
          {loading ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Select value={u.user_roles?.[0]?.role || "user"} onValueChange={v => updateRole(u.user_id, v)}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="moderator">Moderator</SelectItem><SelectItem value="user">User</SelectItem></SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Badge variant={u.is_active ? "default" : "secondary"}>{u.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="flex gap-1">
                      {u.is_active && <Button size="sm" variant="ghost" onClick={() => deactivate(u.user_id)}>Deactivate</Button>}
                      <Button size="sm" variant="ghost" onClick={() => deleteUser(u.user_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {loading ? <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> : invites.length === 0 ? <p className="text-center py-8 text-muted-foreground">No pending invites.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Invited</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {invites.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.full_name}</TableCell>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell><Badge variant="secondary">{inv.role}</Badge></TableCell>
                    <TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" onClick={() => resendInvite(inv.email)}><RotateCcw className="h-4 w-4 mr-1" /> Resend</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Invite New User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full Name *</Label><Input value={newInvite.full_name} onChange={e => setNewInvite(n => ({ ...n, full_name: e.target.value }))} placeholder="John Doe" /></div>
            <div><Label>Email *</Label><Input type="email" value={newInvite.email} onChange={e => setNewInvite(n => ({ ...n, email: e.target.value }))} placeholder="john@company.com" /></div>
            <div><Label>Role *</Label><Select value={newInvite.role} onValueChange={v => setNewInvite(n => ({ ...n, role: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="moderator">Moderator</SelectItem><SelectItem value="user">User</SelectItem></SelectContent></Select></div>
            <Button onClick={sendInvite} className="w-full" disabled={inviting}>{inviting ? "Sending invite…" : "Send Invite"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
