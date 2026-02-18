import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function DashboardSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="font-display">Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Settings page placeholder. Future configuration options will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
