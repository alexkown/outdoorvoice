import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCurrentBusiness } from "@/lib/business";
import { LandingPage } from "@/components/landing-page";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    let onboardingComplete = false;
    try {
      const business = await getCurrentBusiness();
      onboardingComplete = business?.onboardingComplete ?? false;
    } catch {
      // DB unavailable — fall through to onboarding
    }
    redirect(onboardingComplete ? "/overview" : "/settings/onboarding");
  }
  return <LandingPage />;
}
