import { CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">Usage and payment — Phase 6</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Usage This Period
          </CardTitle>
          <CardDescription>Per-minute call charges, reservations, and messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Billing coming in Phase 6</p>
            <p className="text-xs text-muted-foreground mt-1">
              Stripe metered billing will be set up here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
