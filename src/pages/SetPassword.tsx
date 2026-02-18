import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Ship } from "lucide-react";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY or SIGNED_IN event from the invite link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      toast({ title: "Error setting password", description: updateError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Activate the user profile via edge function
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: activateError } = await supabase.functions.invoke("manage-user", {
        body: { action: "activate", userId: user.id },
      });
      if (activateError) {
        console.error("Activation error:", activateError);
      }
    }

    toast({ title: "Password set! Redirecting to dashboard…" });
    setLoading(false);
    navigate("/dashboard");
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Ship className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="font-display">Processing invite…</CardTitle>
            <CardDescription>Please wait while we verify your invitation link.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Ship className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="font-display text-2xl">Set Your Password</CardTitle>
          <CardDescription>Choose a password for your Gobras account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Xaaladda la xukumaayo…" : "Set Password & Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
