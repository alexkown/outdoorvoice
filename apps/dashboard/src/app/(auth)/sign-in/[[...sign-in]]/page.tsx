import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">OutdoorVoice</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI phone agent for outdoor activity providers
          </p>
        </div>
        <SignIn />
      </div>
    </main>
  );
}
