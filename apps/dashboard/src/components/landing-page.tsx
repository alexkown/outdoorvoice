import Link from "next/link";
import {
  Phone,
  Clock,
  DollarSign,
  Moon,
  BookOpen,
  MessageSquare,
  CalendarCheck,
  Mic,
  Zap,
  Star,
  ArrowRight,
  Check,
  Mountain,
  Waves,
  Bike,
  Tent,
  TreePine,
  Fish,
  Wind,
  Anchor,
  MapPin,
} from "lucide-react";

function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-emerald-800 flex items-center justify-center">
            <Mountain className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-stone-900 text-lg tracking-tight">OutdoorVoice</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
            How it works
          </a>
          <a href="#features" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
            Features
          </a>
          <a href="#testimonials" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
            Testimonials
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm text-stone-700 hover:text-stone-900 font-medium px-4 py-2 rounded-lg border border-stone-300 hover:border-stone-400 transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="text-sm bg-emerald-800 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section
      className="relative pt-16 min-h-[88vh] flex items-center overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #0f2d1e 0%, #1a4a2e 30%, #1c5560 65%, #0a2535 100%)",
      }}
    >
      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-30 mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative blobs */}
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-20 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-24 w-full">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3.5 py-1.5 text-xs text-emerald-300 font-medium mb-8">
            <span className="h-1.5 w-1.5 bg-amber-400 rounded-full" />
            24/7 AI Receptionist for Outdoor Businesses
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-6">
            The great outdoors
            <br />
            <span className="text-amber-400">are calling.</span>
          </h1>
          <p className="text-xl text-emerald-100/80 leading-relaxed mb-10 max-w-xl">
            Discover and book outdoor experiences — or let OutdoorVoice answer
            every call so your business never misses a booking.
          </p>

          {/* Search-bar style CTA */}
          <div className="flex flex-col sm:flex-row items-stretch bg-white rounded-2xl overflow-hidden shadow-2xl max-w-xl">
            <div className="flex items-center gap-3 flex-1 px-5 py-4 border-b sm:border-b-0 sm:border-r border-stone-100">
              <Phone className="h-5 w-5 text-stone-400 flex-shrink-0" />
              <span className="text-stone-400 text-base">What can we answer for you?</span>
            </div>
            <Link
              href="/sign-up"
              className="flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold px-6 py-4 transition-colors whitespace-nowrap"
            >
              <MapPin className="h-4 w-4" />
              Start Free Trial
            </Link>
          </div>
          <p className="text-sm text-emerald-400/70 mt-4">
            No credit card required · Setup in 5 minutes
          </p>
        </div>
      </div>
    </section>
  );
}

const CATEGORIES = [
  { icon: Waves, label: "Water Sports" },
  { icon: Bike, label: "Cycling & E-Bikes" },
  { icon: Mountain, label: "Climbing" },
  { icon: TreePine, label: "Hiking" },
  { icon: Fish, label: "Fishing" },
  { icon: Wind, label: "Aerial & Zip Lines" },
  { icon: Anchor, label: "Horseback Riding" },
  { icon: Tent, label: "Camping & Glamping" },
  { icon: Zap, label: "Motorized" },
  { icon: Clock, label: "Outdoor Fitness" },
];

function Categories() {
  return (
    <section className="bg-stone-50 py-8 px-6 border-b border-stone-200">
      <div className="max-w-7xl mx-auto overflow-x-auto">
        <div className="flex items-start gap-5 pb-1 min-w-max mx-auto justify-center flex-wrap">
          {CATEGORIES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 w-[90px] cursor-pointer group"
            >
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-stone-200 flex items-center justify-center group-hover:bg-emerald-100 group-hover:border-emerald-300 transition-all">
                <Icon className="h-6 w-6 text-emerald-700" />
              </div>
              <span className="text-xs text-stone-600 text-center font-medium leading-tight">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PAIN_POINTS = [
  {
    icon: Phone,
    problem: "You're on the water when customers call",
    detail:
      "You're guiding a kayak tour. A customer calls to book. Nobody answers. They Google the next operator and book them instead.",
    stat: "62% of callers won't leave a voicemail",
  },
  {
    icon: DollarSign,
    problem: "A full-time receptionist costs $40k+/year",
    detail:
      "Hiring even part-time staff for phone coverage is expensive, inconsistent, and impossible to scale during peak season.",
    stat: "Most small operators can't justify the cost",
  },
  {
    icon: Moon,
    problem: "Calls after 5pm go unanswered",
    detail:
      "Your peak booking hours are evenings and weekends — exactly when your team isn't available to pick up the phone.",
    stat: "47% of outdoor bookings happen after hours",
  },
];

function PainPoints() {
  return (
    <section className="bg-white py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-4">
            Sound familiar?
          </h2>
          <p className="text-lg text-stone-500 max-w-xl mx-auto">
            Every outdoor operator faces the same challenge: you're great at guiding,
            but can't be everywhere at once.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PAIN_POINTS.map((item) => (
            <div
              key={item.problem}
              className="bg-stone-50 rounded-2xl p-8 border border-stone-200"
            >
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5">
                <item.icon className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="font-semibold text-stone-900 text-lg mb-3 leading-snug">
                {item.problem}
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">{item.detail}</p>
              <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-3 py-1 inline-block">
                {item.stat}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    number: "01",
    title: "Set up your AI agent",
    description:
      "Upload your FAQs, prices, and policies. Customize your agent's voice and personality. Takes about 5 minutes.",
  },
  {
    number: "02",
    title: "Get your phone number",
    description:
      "We provision a dedicated number or you can port your existing one. Then forward your calls to OutdoorVoice.",
  },
  {
    number: "03",
    title: "Your AI handles every call",
    description:
      "Bookings captured, questions answered, messages taken — all handled instantly. You get notified of everything.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-stone-50 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-4">
            Up and running in minutes
          </h2>
          <p className="text-lg text-stone-500">
            No IT team. No long onboarding. Just set it up and go back outside.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(100%+8px)] w-[calc(100%-16px)] h-px bg-stone-200" />
              )}
              <div className="text-6xl font-black text-emerald-100 select-none leading-none mb-4">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">{step.title}</h3>
              <p className="text-stone-500 leading-relaxed text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: Clock,
    title: "24/7 availability",
    description:
      "Your AI never sleeps, takes breaks, or calls in sick. Every call answered, every time — even on holidays.",
  },
  {
    icon: BookOpen,
    title: "Smart knowledge base",
    description:
      "Train your agent on your FAQs, pricing, and policies. It answers questions exactly the way you would.",
  },
  {
    icon: CalendarCheck,
    title: "Reservation capture",
    description:
      "AI collects booking details and party info, then notifies you instantly so you can confirm.",
  },
  {
    icon: MessageSquare,
    title: "Message taking",
    description:
      "When a caller needs a callback, the AI takes a detailed message and routes it to you with full context.",
  },
  {
    icon: Mic,
    title: "Call recordings & transcripts",
    description:
      "Every call is recorded and transcribed. Review anything, anytime from your dashboard.",
  },
  {
    icon: Zap,
    title: "Natural conversation",
    description:
      "No phone trees. No 'press 1 for...'. Customers speak naturally and get real, helpful answers.",
  },
];

function Features() {
  return (
    <section id="features" className="bg-white py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-4">
            Everything your front desk should do
          </h2>
          <p className="text-lg text-stone-500 max-w-xl mx-auto">
            OutdoorVoice isn&apos;t just an answering service. It&apos;s a full AI
            receptionist built specifically for outdoor experience businesses.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-stone-50 rounded-2xl p-7 border border-stone-200 hover:border-emerald-200 hover:shadow-sm transition-all"
            >
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5">
                <f.icon className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base mb-2">{f.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STATS = [
  { value: "2,400+", label: "Calls handled" },
  { value: "170+", label: "Operators using OutdoorVoice" },
  { value: "4.8★", label: "Average rating" },
];

const TESTIMONIALS = [
  {
    quote:
      "We used to miss 30% of calls during peak season. Now every call is answered and our bookings are noticeably up. Paid for itself in week one.",
    author: "Jake T., Austin",
  },
  {
    quote:
      "I set it up in 20 minutes before a trip. Got back to three new bookings captured while I was on the water. This thing is a game changer.",
    author: "Maria S., Austin",
  },
  {
    quote:
      "Our customers actually compliment how helpful our 'receptionist' is. They have no idea it's AI — it sounds like someone who really knows our business.",
    author: "Tom K., Austin",
  },
];

function StatsAndTestimonials() {
  return (
    <section id="testimonials" className="bg-stone-50 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-8 text-center mb-16 pb-16 border-b border-stone-200">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="text-4xl lg:text-5xl font-bold text-emerald-800 mb-2">
                {value}
              </div>
              <div className="text-stone-500 text-sm">{label}</div>
            </div>
          ))}
        </div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.author}
              className="bg-white rounded-2xl p-7 border border-stone-200 shadow-sm flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <p className="text-stone-700 text-sm leading-relaxed flex-1 mb-4">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="text-stone-400 text-xs">— {t.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLAN_FEATURES = [
  "Unlimited inbound calls",
  "Knowledge base with unlimited FAQs",
  "Call recordings & full transcripts",
  "Reservation & booking capture",
  "24/7 after-hours coverage",
  "Real-time dashboard & analytics",
  "Dedicated AI phone number",
];

function ProviderCTA() {
  return (
    <section className="bg-emerald-800 py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
          Are you an outdoor activity provider?
        </h2>
        <p className="text-emerald-200 text-lg mb-8 max-w-xl mx-auto">
          Get a free setup and start answering every call 24/7. We&apos;ll get you
          up and running in no time.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg"
        >
          Add Your Business — It&apos;s Free
        </Link>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="bg-white py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3.5 py-1.5 text-xs text-emerald-700 font-medium mb-6">
          Simple pricing
        </div>
        <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-4">
          Start free. No credit card needed.
        </h2>
        <p className="text-lg text-stone-500 mb-10 max-w-xl mx-auto">
          Try OutdoorVoice free — set up your AI agent, get a phone number, and see
          exactly how it works for your business.
        </p>
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8 max-w-md mx-auto text-left">
          <div className="space-y-3.5 mb-8">
            {PLAN_FEATURES.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-emerald-700" />
                </div>
                <span className="text-stone-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <Link
            href="/sign-up"
            className="flex w-full items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors"
          >
            Start your free trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-center text-xs text-stone-400 mt-3">
            Full pricing available after trial · No long-term contracts
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-stone-100 border-t border-stone-200 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <h4 className="font-semibold text-stone-900 mb-5 text-sm">Product</h4>
            <ul className="space-y-3">
              {[
                { label: "How it works", href: "#how-it-works" },
                { label: "Features", href: "#features" },
                { label: "Testimonials", href: "#testimonials" },
                { label: "Dashboard", href: "/overview" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-stone-500 hover:text-stone-900 text-sm transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-stone-900 mb-5 text-sm">For Providers</h4>
            <ul className="space-y-3">
              {[
                { label: "Start free trial", href: "/sign-up" },
                { label: "Sign in", href: "/sign-in" },
                { label: "Knowledge base", href: "/knowledge" },
                { label: "Settings", href: "/settings" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-stone-500 hover:text-stone-900 text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-stone-900 mb-5 text-sm">Business Types</h4>
            <ul className="space-y-3">
              {["Kayak Tours", "Hiking Guides", "Bike Rentals", "Camping Trips", "Zip Lines"].map(
                (label) => (
                  <li key={label}>
                    <span className="text-stone-500 text-sm">{label}</span>
                  </li>
                )
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-stone-900 mb-5 text-sm">Company</h4>
            <ul className="space-y-3">
              {["About", "Blog", "Support", "Privacy Policy", "Terms of Service"].map((label) => (
                <li key={label}>
                  <span className="text-stone-500 text-sm cursor-pointer hover:text-stone-900 transition-colors">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-emerald-800 flex items-center justify-center">
              <Mountain className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-stone-700 text-sm">OutdoorVoice</span>
          </div>
          <p className="text-xs text-stone-400">© 2025 OutdoorVoice. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen antialiased">
      <Navbar />
      <Hero />
      <Categories />
      <PainPoints />
      <HowItWorks />
      <Features />
      <StatsAndTestimonials />
      <ProviderCTA />
      <PricingSection />
      <Footer />
    </div>
  );
}
