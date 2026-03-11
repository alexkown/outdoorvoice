import Link from "next/link";
import { Settings, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentBusiness } from "@/lib/business";

const WIZARD_STEPS = [
  { label: "Business Info", field: "name" },
  { label: "Phone Number", field: "phoneNumber" },
  { label: "Reservation Platform", field: "integrationConfig" },
  { label: "Transfer & Fallback", field: "transferNumbers" },
  { label: "Notifications", field: "notificationConfig" },
  { label: "Voice Selection", field: "agentVoiceId" },
  { label: "Agent Greeting", field: "agentGreeting" },
] as const;

export default async function SettingsPage() {
  let business;
  try {
    business = await getCurrentBusiness();
  } catch {
    business = null;
  }

  if (!business) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your AI phone agent</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Get Started</CardTitle>
            <CardDescription>Complete the setup wizard to activate your AI phone agent in under 30 minutes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/settings/onboarding">
                Start Setup Wizard <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stepStatus = WIZARD_STEPS.map(({ label, field }) => {
    let done = false;
    if (field === "integrationConfig") done = business!.integrationConfig !== null;
    else if (field === "transferNumbers") done = business!.transferNumbers.length > 0;
    else if (field === "notificationConfig") done = business!.notificationConfig !== null;
    else done = Boolean((business as Record<string, unknown>)[field]);
    return { label, done };
  });

  const completedCount = stepStatus.filter((s) => s.done).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your AI phone agent</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Setup Status
            </CardTitle>
            <Badge variant={business.onboardingComplete ? "success" : "warning"}>
              {business.onboardingComplete ? "Active" : `${completedCount}/${WIZARD_STEPS.length} steps done`}
            </Badge>
          </div>
          <CardDescription>
            {business.onboardingComplete
              ? `${business.name} — your agent is live.`
              : "Complete all steps to activate your agent."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stepStatus.map(({ label, done }) => (
            <div key={label} className="flex items-center gap-3">
              {done
                ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
              <span className={`text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
            </div>
          ))}
          <div className="pt-4">
            <Button asChild variant={business.onboardingComplete ? "outline" : "default"}>
              <Link href="/settings/onboarding">
                {business.onboardingComplete ? "Edit Setup" : "Continue Setup"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {business.phoneNumber && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agent Phone Number</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-lg">{business.phoneNumber}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {business.twilioPhoneNumberSid ? "Provisioned via Twilio" : "Forwarded from existing number"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
