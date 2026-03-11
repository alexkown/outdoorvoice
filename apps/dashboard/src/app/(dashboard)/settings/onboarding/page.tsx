"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const TOTAL_STEPS = 7;

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
];

const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Calm and professional" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", description: "Friendly and conversational" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", description: "Warm and natural" },
];

// ---------------------------------------------------------------------------
// Wizard state
// ---------------------------------------------------------------------------

interface WizardData {
  // Step 1
  name: string;
  type: string;
  timezone: string;
  // Step 2
  phoneMode: "provision" | "forward";
  areaCode: string;
  selectedNumber: string;
  existingNumber: string;
  // Step 3
  reservationPlatform: string;
  apiKey: string;
  companyId: string;
  // Step 4
  transferNumbers: { label: string; number: string }[];
  fallbackBehavior: string;
  // Step 5
  smsNumbers: string;
  emailAddresses: string;
  // Step 6
  voiceId: string;
  // Step 7
  greeting: string;
}

const DEFAULT: WizardData = {
  name: "", type: "KAYAK_CANOE", timezone: "America/New_York",
  phoneMode: "provision", areaCode: "", selectedNumber: "", existingNumber: "",
  reservationPlatform: "FAREHARBOR", apiKey: "", companyId: "",
  transferNumbers: [{ label: "Owner's Cell", number: "" }],
  fallbackBehavior: "TAKE_MESSAGE",
  smsNumbers: "", emailAddresses: "",
  voiceId: "21m00Tcm4TlvDq8ikWAM",
  greeting: "",
};

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

function Step1({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Business Name</Label>
        <Input id="name" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Blue Ridge Kayak Co." />
      </div>
      <div className="space-y-2">
        <Label>Business Type</Label>
        <RadioGroup value={data.type} onValueChange={(v) => setData({ ...data, type: v })} className="grid grid-cols-2 gap-3">
          {[
            { value: "KAYAK_CANOE", label: "Kayak / Canoe" },
            { value: "HIKING_TOURS", label: "Hiking / Tours" },
            { value: "CAMPING_RV", label: "Camping / RV" },
            { value: "OTHER", label: "Other Outdoor" },
          ].map(({ value, label }) => (
            <Label
              key={value}
              htmlFor={value}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${data.type === value ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
            >
              <RadioGroupItem value={value} id={value} />
              {label}
            </Label>
          ))}
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>Timezone</Label>
        <Select value={data.timezone} onValueChange={(v) => setData({ ...data, timezone: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function Step2({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  const [searching, setSearching] = useState(false);
  const [numbers, setNumbers] = useState<{ phoneNumber: string; friendlyName: string; locality?: string }[]>([]);

  async function search() {
    if (!/^\d{3}$/.test(data.areaCode)) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/phone/search?areaCode=${data.areaCode}`);
      const json = await res.json() as { numbers?: typeof numbers };
      setNumbers(json.numbers ?? []);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-5">
      <RadioGroup value={data.phoneMode} onValueChange={(v) => setData({ ...data, phoneMode: v as "provision" | "forward" })} className="grid grid-cols-2 gap-3">
        {[
          { value: "provision", label: "Get a new number", desc: "We provision a Twilio number for you" },
          { value: "forward", label: "Forward existing number", desc: "Keep your current number" },
        ].map(({ value, label, desc }) => (
          <Label key={value} htmlFor={`mode-${value}`} className={`flex flex-col gap-1 rounded-lg border p-3 cursor-pointer ${data.phoneMode === value ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value={value} id={`mode-${value}`} />
              <span className="font-medium">{label}</span>
            </div>
            <span className="text-xs text-muted-foreground pl-6">{desc}</span>
          </Label>
        ))}
      </RadioGroup>

      {data.phoneMode === "provision" ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Search by area code</Label>
            <div className="flex gap-2">
              <Input value={data.areaCode} onChange={(e) => setData({ ...data, areaCode: e.target.value })} placeholder="555" maxLength={3} className="w-24" />
              <Button variant="outline" onClick={search} disabled={searching}>
                {searching ? "Searching…" : "Search"}
              </Button>
            </div>
          </div>
          {numbers.length > 0 && (
            <div className="space-y-2">
              <Label>Available numbers</Label>
              <div className="space-y-1 max-h-48 overflow-y-auto rounded-md border p-2">
                {numbers.map((n) => (
                  <label key={n.phoneNumber} className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${data.selectedNumber === n.phoneNumber ? "bg-primary/10" : "hover:bg-muted"}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="number" checked={data.selectedNumber === n.phoneNumber} onChange={() => setData({ ...data, selectedNumber: n.phoneNumber })} />
                      <span className="font-mono text-sm">{n.friendlyName}</span>
                    </div>
                    {n.locality && <span className="text-xs text-muted-foreground">{n.locality}</span>}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Your existing number</Label>
          <Input value={data.existingNumber} onChange={(e) => setData({ ...data, existingNumber: e.target.value })} placeholder="+15551234567" />
          <p className="text-xs text-muted-foreground">
            After setup, forward your calls to the OutdoorVoice number we&apos;ll provide.
          </p>
        </div>
      )}
    </div>
  );
}

function Step3({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Reservation Platform</Label>
        <Select value={data.reservationPlatform} onValueChange={(v) => setData({ ...data, reservationPlatform: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="FAREHARBOR">FareHarbor</SelectItem>
            <SelectItem value="REZDY">Rezdy</SelectItem>
            <SelectItem value="CAMPSPOT">Campspot</SelectItem>
            <SelectItem value="GOOGLE_CALENDAR">Google Calendar</SelectItem>
            <SelectItem value="GENERIC">Other / Webhook</SelectItem>
            <SelectItem value="NONE">None (take messages only)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {data.reservationPlatform !== "NONE" && (
        <>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input type="password" value={data.apiKey} onChange={(e) => setData({ ...data, apiKey: e.target.value })} placeholder="Your platform API key" />
          </div>
          {["FAREHARBOR", "REZDY", "CAMPSPOT"].includes(data.reservationPlatform) && (
            <div className="space-y-2">
              <Label>{data.reservationPlatform === "FAREHARBOR" ? "Company Shortname" : "Company ID"}</Label>
              <Input value={data.companyId} onChange={(e) => setData({ ...data, companyId: e.target.value })} placeholder={data.reservationPlatform === "FAREHARBOR" ? "my-kayak-company" : "12345"} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Step4({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  function updateNumber(i: number, field: "label" | "number", value: string) {
    const updated = [...data.transferNumbers];
    updated[i] = { ...updated[i]!, [field]: value };
    setData({ ...data, transferNumbers: updated });
  }

  function addNumber() {
    setData({ ...data, transferNumbers: [...data.transferNumbers, { label: "", number: "" }] });
  }

  function removeNumber(i: number) {
    setData({ ...data, transferNumbers: data.transferNumbers.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Label>Transfer Numbers <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <p className="text-xs text-muted-foreground">When a caller asks to speak with a person, the agent will call these numbers in order.</p>
        {data.transferNumbers.map((t, i) => (
          <div key={i} className="flex gap-2">
            <Input value={t.label} onChange={(e) => updateNumber(i, "label", e.target.value)} placeholder="Label (e.g. Owner's Cell)" className="w-40" />
            <Input value={t.number} onChange={(e) => updateNumber(i, "number", e.target.value)} placeholder="+15551234567" className="flex-1" />
            {data.transferNumbers.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeNumber(i)} className="text-destructive hover:text-destructive">×</Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addNumber}>+ Add another number</Button>
      </div>

      <div className="space-y-2">
        <Label>When the agent doesn&apos;t know an answer</Label>
        <RadioGroup value={data.fallbackBehavior} onValueChange={(v) => setData({ ...data, fallbackBehavior: v })} className="space-y-2">
          {[
            { value: "TAKE_MESSAGE", label: "Take a message", desc: "Agent offers to have someone follow up" },
            { value: "TRANSFER", label: "Transfer to a human", desc: "Agent tries to connect with your staff immediately" },
            { value: "AI_DECIDES", label: "Let the AI decide", desc: "Agent judges based on urgency keywords" },
          ].map(({ value, label, desc }) => (
            <Label key={value} htmlFor={`fb-${value}`} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${data.fallbackBehavior === value ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
              <RadioGroupItem value={value} id={`fb-${value}`} className="mt-0.5" />
              <div>
                <div className="font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

function Step5({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">After each call, your agent will notify you of new bookings and messages.</p>
      <div className="space-y-2">
        <Label>SMS Numbers</Label>
        <Input value={data.smsNumbers} onChange={(e) => setData({ ...data, smsNumbers: e.target.value })} placeholder="+15551234567, +15559876543" />
        <p className="text-xs text-muted-foreground">Comma-separated. E.164 format (+1XXXXXXXXXX).</p>
      </div>
      <div className="space-y-2">
        <Label>Email Addresses</Label>
        <Input value={data.emailAddresses} onChange={(e) => setData({ ...data, emailAddresses: e.target.value })} placeholder="owner@example.com, manager@example.com" />
        <p className="text-xs text-muted-foreground">Comma-separated.</p>
      </div>
    </div>
  );
}

function Step6({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Choose the voice your AI agent will use on calls.</p>
      {VOICES.map((v) => (
        <Label key={v.id} htmlFor={`voice-${v.id}`} className={`flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors ${data.voiceId === v.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
          <RadioGroup value={data.voiceId} onValueChange={(val) => setData({ ...data, voiceId: val })}>
            <RadioGroupItem value={v.id} id={`voice-${v.id}`} />
          </RadioGroup>
          <div className="flex-1">
            <div className="font-medium">{v.name}</div>
            <div className="text-xs text-muted-foreground">{v.description}</div>
          </div>
          {data.voiceId === v.id && <Badge variant="success">Selected</Badge>}
        </Label>
      ))}
    </div>
  );
}

function Step7({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  const defaultGreeting = data.name
    ? `Thank you for calling ${data.name}. I'm an AI assistant and I'm here to help. How can I assist you today?`
    : "";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        This is the first thing callers hear. The agent always discloses it&apos;s an AI — make sure your greeting reflects your brand.
      </p>
      <div className="space-y-2">
        <Label>Agent Greeting</Label>
        <Textarea
          value={data.greeting || defaultGreeting}
          onChange={(e) => setData({ ...data, greeting: e.target.value })}
          rows={4}
          placeholder={defaultGreeting}
        />
        <p className="text-xs text-muted-foreground">Keep it under 20 words. The agent will always mention it&apos;s an AI.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wizard orchestrator
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const stepTitles = [
    "Business Info", "Phone Setup", "Reservations",
    "Transfer & Fallback", "Notifications", "Voice", "Greeting",
  ];

  async function next() {
    setSaving(true);
    setError("");
    try {
      if (step === 1) {
        // Create or update business
        const res = await fetch("/api/business", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.name, type: data.type, timezone: data.timezone }),
        });
        if (!res.ok) throw new Error("Failed to save business info");
      }

      if (step === 2 && data.phoneMode === "provision" && data.selectedNumber) {
        // Provision Twilio number
        const res = await fetch("/api/phone/provision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: data.selectedNumber }),
        });
        if (!res.ok) {
          const j = await res.json() as { error?: string };
          throw new Error(j.error ?? "Failed to provision number");
        }
      }

      if (step < TOTAL_STEPS) {
        setStep((s) => s + 1);
      } else {
        // Final step — complete onboarding
        await completeOnboarding();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function completeOnboarding() {
    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentVoiceId: data.voiceId,
        agentGreeting: data.greeting || undefined,
        fallbackBehavior: data.fallbackBehavior,
      }),
    });
    if (!res.ok) throw new Error("Failed to save agent config");

    const completeRes = await fetch("/api/business/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transferNumbers: data.transferNumbers.filter((t) => t.number),
        fallbackBehavior: data.fallbackBehavior,
        smsNumbers: data.smsNumbers.split(",").map((s) => s.trim()).filter(Boolean),
        emailAddresses: data.emailAddresses.split(",").map((s) => s.trim()).filter(Boolean),
        integrationPlatform: data.reservationPlatform !== "NONE" ? data.reservationPlatform : undefined,
        integrationApiKey: data.apiKey || undefined,
        integrationCompanyId: data.companyId || undefined,
      }),
    });
    if (!completeRes.ok) throw new Error("Failed to complete onboarding");

    router.push("/overview");
  }

  const stepComponents = [
    <Step1 key={1} data={data} setData={setData} />,
    <Step2 key={2} data={data} setData={setData} />,
    <Step3 key={3} data={data} setData={setData} />,
    <Step4 key={4} data={data} setData={setData} />,
    <Step5 key={5} data={data} setData={setData} />,
    <Step6 key={6} data={data} setData={setData} />,
    <Step7 key={7} data={data} setData={setData} />,
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Waves className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Setup your AI phone agent</h1>
          <p className="text-xs text-muted-foreground">Step {step} of {TOTAL_STEPS} — {stepTitles[step - 1]}</p>
        </div>
      </div>

      <Progress value={(step / TOTAL_STEPS) * 100} />

      {/* Step tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {stepTitles.map((title, i) => (
          <button
            key={i}
            onClick={() => { if (i + 1 < step) setStep(i + 1); }}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs whitespace-nowrap transition-colors ${
              i + 1 === step ? "bg-primary text-primary-foreground" :
              i + 1 < step ? "bg-primary/20 text-primary cursor-pointer" :
              "bg-muted text-muted-foreground cursor-default"
            }`}
          >
            {i + 1 < step && <Check className="h-3 w-3" />}
            {title}
          </button>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{stepTitles[step - 1]}</CardTitle>
          <CardDescription>
            {[
              "Tell us about your business so the agent can introduce itself correctly.",
              "Set up the phone number callers will dial.",
              "Connect your reservation system so the agent can check availability and book.",
              "Configure how the agent handles escalations and unknowns.",
              "Choose where to receive call summaries and alerts.",
              "Pick the voice your agent will use on every call.",
              "Write the first words callers hear when they call.",
            ][step - 1]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stepComponents[step - 1]}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
          Back
        </Button>
        <Button onClick={next} disabled={saving}>
          {saving ? "Saving…" : step === TOTAL_STEPS ? "Complete Setup" : (
            <span className="flex items-center gap-1">Next <ChevronRight className="h-4 w-4" /></span>
          )}
        </Button>
      </div>
    </div>
  );
}
