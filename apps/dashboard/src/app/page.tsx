import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCurrentBusiness } from "@/lib/business";
import { LandingPage } from "@/components/landing-page";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    const business = await getCurrentBusiness();
    redirect(business?.onboardingComplete ? "/overview" : "/settings/onboarding");
  }
  return <LandingPage />;
}
