import Link from "next/link";
import { Settings, CheckCircle2, Circle, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
          <p className="text-stone-500 text-sm mt-0.5">Configure your AI phone agent</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Settings className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">Get Started</h2>
              <p className="text-sm text-stone-500">Complete setup to activate your AI phone agent in under 30 minutes.</p>
            </div>
          </div>
          <Button asChild className="bg-emerald-800 hover:bg-emerald-700 text-white">
            <Link href="/settings/onboarding">
              Start Setup Wizard <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
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
  const isComplete = business.onboardingComplete;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
        <p className="text-stone-500 text-sm mt-0.5">Configure your AI phone agent</p>
      </div>

      {/* Setup status card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Settings className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">Setup Status</h2>
              <p className="text-sm text-stone-500">
                {isComplete
                  ? `${business.name} — your agent is live.`
                  : "Complete all steps to activate your agent."}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
            isComplete
              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
              : "bg-amber-100 text-amber-800 border-amber-200"
          }`}>
            {isComplete ? "Active" : `${completedCount}/${WIZARD_STEPS.length} steps done`}
          </span>
        </div>

        <div className="space-y-2.5 mb-6">
          {stepStatus.map(({ label, done }) => (
            <div key={label} className="flex items-center gap-3">
              {done
                ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                : <Circle className="h-4 w-4 text-stone-300 shrink-0" />}
              <span className={`text-sm ${done ? "text-stone-800" : "text-stone-400"}`}>{label}</span>
            </div>
          ))}
        </div>

        <Button
          asChild
          className={isComplete ? "border-stone-200 text-stone-700 bg-white hover:bg-stone-50" : "bg-emerald-800 hover:bg-emerald-700 text-white"}
          variant={isComplete ? "outline" : "default"}
        >
          <Link href="/settings/onboarding">
            {isComplete ? "Edit Setup" : "Continue Setup"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>

      {/* Phone number card */}
      {business.phoneNumber && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Phone className="h-5 w-5 text-emerald-700" />
            </div>
            <h2 className="font-semibold text-stone-900">Agent Phone Number</h2>
          </div>
          <p className="font-mono text-2xl font-bold text-emerald-800">{business.phoneNumber}</p>
          <p className="text-xs text-stone-400 mt-1">
            {business.twilioPhoneNumberSid ? "Provisioned via Twilio" : "Forwarded from existing number"}
          </p>
        </div>
      )}
    </div>
  );
}
