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
  Waves,
} from "lucide-react";

function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-emerald-950/95 backdrop-blur-sm border-b border-emerald-800/50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-amber-400 flex items-center justify-center">
            <Waves className="h-4 w-4 text-emerald-950" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">OutdoorVoice</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-emerald-300 hover:text-white transition-colors">
            How it works
          </a>
          <a href="#features" className="text-sm text-emerald-300 hover:text-white transition-colors">
            Features
          </a>
          <a href="#testimonials" className="text-sm text-emerald-300 hover:text-white transition-colors">
            Testimonials
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm text-emerald-300 hover:text-white transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm bg-amber-400 hover:bg-amber-300 text-emerald-950 font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="bg-gradient-to-b from-emerald-950 via-emerald-950 to-emerald-900 pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-800/60 border border-emerald-700/40 rounded-full px-3.5 py-1.5 text-xs text-emerald-300 font-medium mb-8">
              <span className="h-1.5 w-1.5 bg-amber-400 rounded-full" />
              24/7 AI receptionist for outdoor businesses
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-6">
              Never miss a{" "}
              <span className="text-amber-400">booking</span> again.
            </h1>
            <p className="text-xl text-emerald-200 leading-relaxed mb-10 max-w-lg">
              OutdoorVoice answers every call 24/7 — answering questions, capturing
              bookings, and taking messages while you're out on the trail.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-semibold px-6 py-3.5 rounded-xl text-base transition-colors"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 border border-emerald-700 text-emerald-100 hover:bg-emerald-800/50 px-6 py-3.5 rounded-xl text-base transition-colors"
              >
                See how it works
              </a>
            </div>
            <p className="text-sm text-emerald-500 mt-4">
              No credit card required · Setup in 5 minutes
            </p>
          </div>

          {/* Right: mock call UI */}
          <div className="relative">
            <div className="bg-emerald-800/40 border border-emerald-700/50 rounded-2xl p-6 backdrop-blur-sm">
              {/* Call header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Incoming Call</p>
                  <p className="text-emerald-400 text-xs">+1 (555) 234-7890</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">Live</span>
                </div>
              </div>

              {/* Chat bubbles */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="h-7 w-7 rounded-full bg-emerald-700 flex-shrink-0 flex items-center justify-center text-xs text-white font-medium">
                    C
                  </div>
                  <div className="bg-emerald-700/50 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-emerald-100 max-w-[260px]">
                    Hi! Do you have kayak tours this Saturday for 4 people?
                  </div>
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <div className="h-7 w-7 rounded-full bg-amber-400 flex-shrink-0 flex items-center justify-center text-xs text-emerald-950 font-bold">
                    AI
                  </div>
                  <div className="bg-white/10 rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm text-white max-w-[260px]">
                    Yes! We have 10am and 2pm open this Saturday for up to 6. Want me to hold a spot?
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-7 w-7 rounded-full bg-emerald-700 flex-shrink-0 flex items-center justify-center text-xs text-white font-medium">
                    C
                  </div>
                  <div className="bg-emerald-700/50 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-emerald-100 max-w-[260px]">
                    10am works perfectly. Let's do it!
                  </div>
                </div>
              </div>

              {/* Booking captured */}
              <div className="mt-5 pt-4 border-t border-emerald-700/50 flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-green-400" />
                </div>
                <p className="text-xs text-green-400 font-medium">
                  Booking captured — you've been notified
                </p>
              </div>
            </div>
            {/* Decorative blurs */}
            <div className="absolute -bottom-6 -right-6 h-40 w-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-6 -left-6 h-32 w-32 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}

const PAIN_POINTS = [
  {
    icon: Phone,
    color: "bg-red-50 text-red-500",
    problem: "You're on the water when customers call",
    detail:
      "You're guiding a kayak tour. A customer calls to book. Nobody answers. They Google the next operator and book them instead.",
    stat: "62% of callers won't leave a voicemail",
  },
  {
    icon: DollarSign,
    color: "bg-orange-50 text-orange-500",
    problem: "A full-time receptionist costs $40k+/year",
    detail:
      "Hiring even part-time staff for phone coverage is expensive, inconsistent, and impossible to scale during peak season.",
    stat: "Most small operators can't justify the cost",
  },
  {
    icon: Moon,
    color: "bg-indigo-50 text-indigo-500",
    problem: "Calls after 5pm go unanswered",
    detail:
      "Your peak booking hours are evenings and weekends — exactly when your team isn't available to pick up the phone.",
    stat: "47% of outdoor bookings happen after hours",
  },
];

function PainPoints() {
  return (
    <section className="bg-stone-50 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-4">
            Sound familiar?
          </h2>
          <p className="text-lg text-stone-600 max-w-xl mx-auto">
            Every outdoor operator faces the same challenge: you're great at guiding,
            but hard to be everywhere at once.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PAIN_POINTS.map((item) => (
            <div
              key={item.problem}
              className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-5 ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-lg mb-3 leading-snug">
                {item.problem}
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-5">{item.detail}</p>
              <p className="text-xs font-medium text-stone-500 bg-stone-50 border border-stone-100 rounded-full px-3 py-1 inline-block">
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
    <section id="how-it-works" className="bg-white py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-4">
            Up and running in minutes
          </h2>
          <p className="text-lg text-stone-600">
            No IT team. No long onboarding. Just set it up and go back outside.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(100%+8px)] w-[calc(100%-16px)] h-px bg-stone-200" />
              )}
              <div className="text-6xl font-black text-emerald-50 select-none leading-none mb-4">
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
    <section id="features" className="bg-stone-50 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-4">
            Everything your front desk should do
          </h2>
          <p className="text-lg text-stone-600 max-w-xl mx-auto">
            OutdoorVoice isn&apos;t just an answering service. It&apos;s a full AI
            receptionist built specifically for outdoor experience businesses.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-7 border border-stone-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-5">
                <f.icon className="h-5 w-5 text-emerald-600" />
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

const TESTIMONIALS = [
  {
    quote:
      "We used to miss 30% of calls during peak season. Now every call is answered and our bookings are noticeably up. Paid for itself in week one.",
    author: "Jake Thompson",
    role: "Owner, Whitewater Adventures",
    avatar: "JT",
  },
  {
    quote:
      "I set it up in 20 minutes before a trip. Got back to three new bookings captured while I was on the water. This thing is a game changer.",
    author: "Maria Santos",
    role: "Founder, Coastal Kayak Tours",
    avatar: "MS",
  },
  {
    quote:
      "Our customers actually compliment how helpful our 'receptionist' is. They have no idea it's AI — it just sounds like someone who really knows our business.",
    author: "Tom Keller",
    role: "Director, Alpine Hiking Co.",
    avatar: "TK",
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="bg-emerald-950 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white tracking-tight mb-4">
            Trusted by operators who love the outdoors
          </h2>
          <p className="text-lg text-emerald-400">
            From solo guides to multi-location tour companies
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.author}
              className="bg-emerald-900/50 border border-emerald-800/60 rounded-2xl p-7 flex flex-col"
            >
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-emerald-100 text-base leading-relaxed flex-1 mb-7">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-xs font-bold text-amber-300 flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{t.author}</p>
                  <p className="text-emerald-400 text-xs">{t.role}</p>
                </div>
              </div>
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

function PricingCTA() {
  return (
    <section className="bg-white py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3.5 py-1.5 text-xs text-emerald-700 font-medium mb-6">
          Simple pricing
        </div>
        <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-4">
          Start free. No credit card needed.
        </h2>
        <p className="text-lg text-stone-600 mb-10 max-w-xl mx-auto">
          Try OutdoorVoice free — set up your AI agent, get a phone number, and see
          exactly how it works for your business.
        </p>
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8 max-w-md mx-auto text-left">
          <div className="space-y-3.5 mb-8">
            {PLAN_FEATURES.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="text-stone-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <Link
            href="/sign-up"
            className="flex w-full items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors"
          >
            Start your free trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-center text-xs text-stone-500 mt-3">
            Full pricing available after trial · No long-term contracts
          </p>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-gradient-to-br from-emerald-800 to-emerald-700 py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-5">
          Stop missing calls.
          <br />
          Start growing.
        </h2>
        <p className="text-xl text-emerald-200 mb-10 max-w-lg mx-auto">
          Set up your AI receptionist today and never lose another booking to voicemail.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
        >
          Start free trial
          <ArrowRight className="h-5 w-5" />
        </Link>
        <p className="text-sm text-emerald-300/70 mt-4">
          No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-emerald-950 border-t border-emerald-900/80 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-amber-400 flex items-center justify-center">
            <Waves className="h-3.5 w-3.5 text-emerald-950" />
          </div>
          <span className="font-bold text-white">OutdoorVoice</span>
        </div>
        <p className="text-sm text-emerald-600">© 2025 OutdoorVoice. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="/sign-in" className="text-sm text-emerald-500 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link href="/sign-up" className="text-sm text-emerald-500 hover:text-white transition-colors">
            Get started
          </Link>
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
      <PainPoints />
      <HowItWorks />
      <Features />
      <Testimonials />
      <PricingCTA />
      <FinalCTA />
      <Footer />
    </div>
  );
}
