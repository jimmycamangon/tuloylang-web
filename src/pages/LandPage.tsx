import { useState } from "react"
import NavigationPage from "../components/NavigationPage"
import Footer from "../components/Footer"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  Heart,
  Lock,
  Repeat,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react"

const trustBadges = [
  { icon: Sparkles, label: "Free forever" },
  { icon: Lock, label: "100% local data" },
  { icon: Heart, label: "No sign-up" },
]

const steps = [
  {
    number: "01",
    title: "Set up your habits",
    description:
      "Add the routines you want to keep visible — daily, weekly, or weekend-only. No accounts, no setup wizards.",
  },
  {
    number: "02",
    title: "Log as you go",
    description:
      "Check off habits and log workouts in seconds. Streaks, durations, intensity, and notes all save instantly to your device.",
  },
  {
    number: "03",
    title: "See the patterns",
    description:
      "Open the dashboard to spot streaks, scan the heatmap, and review weekly activity across habits and training.",
  },
]

const featureCards = [
  {
    title: "Habit momentum that stays visible",
    description:
      "Track daily and weekend routines, protect streaks, and keep recent history easy to scan.",
    icon: Repeat,
    accent: "from-emerald-100 via-emerald-50 to-white",
  },
  {
    title: "Workout logging without extra clutter",
    description:
      "Log sessions, duration, intensity, and notes so your training history stays simple and usable.",
    icon: Dumbbell,
    accent: "from-sky-100 via-sky-50 to-white",
  },
  {
    title: "Analytics that explain the day",
    description:
      "Use clickable heatmaps and activity breakdowns to see exactly what was completed or skipped.",
    icon: BarChart3,
    accent: "from-amber-100 via-amber-50 to-white",
  },
  {
    title: "Settings connected to the workspace",
    description:
      "Profile, theme, layout preferences, and data export all feed directly into the app experience.",
    icon: Settings,
    accent: "from-slate-200 via-slate-100 to-white",
  },
]

const previewSlides = [
  {
    eyebrow: "Dashboard",
    title: "See habits and workouts in one overview",
    description:
      "Quick stats, recent workout sessions, streak highlights, and a compact heatmap keep your progress readable at a glance.",
    panel: (
      <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm dark:border-border dark:bg-background/80">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Active Habits", "08", "2 archived in storage"],
              ["Completed Today", "03", "1 still open today"],
              ["Today Completion", "75%", "Based on today's scheduled habits"],
              ["Best Streak", "12", "Longest active streak right now"],
              ["Workouts This Week", "03", "165 total minutes logged"],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-border dark:bg-card">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-foreground">{value}</p>
                <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">{detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-border dark:bg-card">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-foreground">
                  Weekly Habit Activity
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
                  Completion progress across the last 7 days based on scheduled habits.
                </p>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-foreground">
                75% today
              </span>
            </div>
            <div className="flex items-end justify-between gap-2">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <div key={day + index} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-20 w-full items-end rounded-full bg-slate-100 p-1.5 dark:bg-muted">
                    <div
                      className="w-full rounded-full bg-sky-500"
                      style={{ height: `${35 + index * 8}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-muted-foreground">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm dark:border-border dark:bg-background/80">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-muted-foreground">
              Highlights
            </p>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-slate-700 dark:text-foreground">
                Morning stretch is on a 12-day streak.
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-slate-700 dark:text-foreground">
                2 workouts logged this week so far.
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/60 bg-slate-950 p-4 text-white shadow-sm dark:border-border dark:bg-slate-950">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">Heatmap</p>
            <div className="mt-3 grid grid-cols-8 gap-1.5">
              {Array.from({ length: 32 }).map((_, index) => (
                <div
                  key={index}
                  className={`h-4 rounded ${
                    index % 5 === 0
                      ? "bg-slate-700"
                      : index % 4 === 0
                        ? "bg-emerald-300"
                        : index % 3 === 0
                          ? "bg-emerald-500"
                          : "bg-emerald-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: "Workouts",
    title: "Log sessions fast and keep the details that matter",
    description:
      "Capture workout name, category, duration, intensity, and notes without turning the page into a spreadsheet.",
    panel: (
      <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm dark:border-border dark:bg-background/80">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-muted-foreground">
            Log workout
          </p>
          <div className="mt-4 space-y-3">
            {["Upper body strength", "Strength", "45 minutes"].map((text) => (
              <div key={text} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-border dark:bg-muted dark:text-foreground">
                {text}
              </div>
            ))}
            <div className="flex gap-2">
              <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                Moderate
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-muted dark:text-foreground">
                Today
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
              Bench press, rows, overhead press, short finisher.
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[
            ["Upper body strength", "45 min", "Moderate"],
            ["Zone 2 cardio", "30 min", "Low"],
            ["Leg day volume", "60 min", "High"],
          ].map(([title, duration, intensity]) => (
            <div key={title} className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm dark:border-border dark:bg-background/80">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-foreground">{title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">Saved to your recent workout log</p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                    {duration}
                  </span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    {intensity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    eyebrow: "Analytics",
    title: "Inspect the exact day, not just the trend",
    description:
      "Tap a heatmap cell and drill into what was completed, what stayed open, and which workout sessions were logged.",
    panel: (
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border border-white/60 bg-slate-950 p-4 text-white shadow-sm dark:border-border dark:bg-slate-950">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">Interactive heatmap</p>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
              24 weeks
            </div>
          </div>
          <div className="mt-4 grid grid-cols-12 gap-1.5">
            {Array.from({ length: 84 }).map((_, index) => (
              <button
                key={index}
                type="button"
                className={`h-4 rounded ${
                  index === 58
                    ? "ring-2 ring-white bg-emerald-300"
                    : index % 6 === 0
                      ? "bg-slate-700"
                      : index % 4 === 0
                        ? "bg-emerald-400"
                        : "bg-emerald-600"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm dark:border-border dark:bg-background/80">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-muted-foreground">
            Selected day
          </p>
          <h4 className="mt-3 text-lg font-bold text-slate-900 dark:text-foreground">Saturday, March 28</h4>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
              <p className="text-sm font-semibold text-emerald-800">Completed habits</p>
              <p className="mt-1 text-sm text-emerald-700">Morning stretch, hydration, reading</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/40">
              <p className="text-sm font-semibold text-amber-800">Open habits</p>
              <p className="mt-1 text-sm text-amber-700">Sleep by 11 PM</p>
            </div>
            <div className="rounded-xl bg-sky-50 p-3 dark:bg-sky-950/40">
              <p className="text-sm font-semibold text-sky-800">Workout logged</p>
              <p className="mt-1 text-sm text-sky-700">Leg day volume, 60 minutes, high intensity</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

const principles = [
  {
    title: "Local-first by default",
    description:
      "Your habits, workouts, and notes live in your browser's storage. Nothing is uploaded, synced, or sold.",
    icon: Lock,
  },
  {
    title: "Quiet, not noisy",
    description:
      "No streak shaming or pressure loops. The app stays out of your way until you open it.",
    icon: Heart,
  },
  {
    title: "Fast on any device",
    description:
      "A lightweight React build with no backend. It loads quickly, works offline, and feels instant.",
    icon: Zap,
  },
]

const faqs = [
  {
    question: "Do I need to sign up or create an account?",
    answer:
      "No. TuloyLang runs entirely in your browser. Open the app, set up your habits, and start tracking — there's no email, password, or profile to create.",
  },
  {
    question: "Where is my data stored?",
    answer:
      "Everything is saved to your browser's local storage on your own device. Nothing leaves your machine, and there is no cloud sync. If you clear your browser data, your tracked habits will be cleared too.",
  },
  {
    question: "Is TuloyLang free?",
    answer:
      "Yes — completely free. There are no premium tiers, paywalls, or upsells. The project is open source on GitHub.",
  },
  {
    question: "What does \"Tuloy lang\" mean?",
    answer:
      "It's a Filipino phrase that loosely translates to \"just keep going\" or \"keep moving forward.\" It captures the spirit of consistency over intensity — the idea that small, repeated actions matter more than perfect ones.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes. Inside Settings, you can export your habits and workouts so you have a portable backup, or move to another device whenever you want.",
  },
]

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-border bg-card transition-colors hover:bg-accent/40">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground md:text-base">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          <p className="muted-copy px-5 pb-5 text-sm leading-7">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export default function LandPage() {
  const navigate = useNavigate()

  return (
    <>
      <NavigationPage />
      <div className="bg-background text-foreground">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden">
          {/* Decorative background blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-500/10"
          />

          <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center">
            <div className="flex w-full max-w-7xl flex-col items-center justify-between gap-12 px-6 py-16 md:flex-row md:py-20">
              {/* LEFT */}
              <div className="flex max-w-xl flex-col text-center md:text-left">
                {/* Badge */}
                <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur md:mx-0 md:w-fit dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Free, local-first, no sign-up needed
                </div>

                <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
                  <span className="bg-gradient-to-r from-emerald-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
                    Tuloy lang.
                  </span>
                  <br />
                  Build consistency, one day at a time.
                </h1>

                <p className="muted-copy mt-5 text-sm leading-7 md:text-base">
                  A quiet, local-first space to track habits, log workouts, and see your discipline
                  take shape without accounts, pressure loops, or anyone watching.
                </p>

                <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
                  <Button
                    className="group h-10 w-full rounded-full px-5 text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md sm:w-auto"
                    size="sm"
                    onClick={() => navigate("/start")}
                  >
                    Get Started
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Button>

                  <a href="#preview" className="w-full sm:w-auto">
                    <Button
                      className="h-10 w-full rounded-full border border-border bg-card px-5 text-sm text-foreground transition-all duration-200 hover:scale-[1.02] hover:bg-accent hover:text-accent-foreground hover:shadow-md sm:w-auto"
                      size="sm"
                    >
                      View Preview
                    </Button>
                  </a>
                </div>

                {/* Tiny subtext */}
                <p className="mt-5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Tuloy lang</span> means "just keep
                  going" in Filipino.
                </p>
              </div>

              {/* RIGHT */}
              <div className="relative flex w-full max-w-3xl items-center justify-center">
                <div className="absolute inset-x-8 top-8 -z-10 h-48 rounded-full bg-gradient-to-r from-emerald-200/60 via-sky-200/50 to-amber-200/60 blur-3xl" />
                <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 shadow-2xl dark:from-card dark:via-card dark:to-muted/70 sm:p-5">
                  <div className="rounded-[1.6rem] border border-white/70 bg-white/90 p-4 shadow-sm dark:border-border dark:bg-background/90">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-rose-300" />
                        <span className="h-3 w-3 rounded-full bg-amber-300" />
                        <span className="h-3 w-3 rounded-full bg-emerald-300" />
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500 dark:border-border dark:bg-card dark:text-muted-foreground">
                        TuloyLang overview
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        ["Active Habits", "08", "2 archived in storage"],
                        ["Completed Today", "03", "1 still open today"],
                        ["Today Completion", "75%", "Based on today's scheduled habits"],
                        ["Best Streak", "12", "Longest active streak right now"],
                      ].map(([label, value, detail]) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-border dark:bg-card"
                        >
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-foreground">
                            {value}
                          </p>
                          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">
                            {detail}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-border dark:bg-card">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-foreground">
                            Weekly Habit Activity
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-muted-foreground">
                            Completion progress across the last 7 days based on scheduled habits.
                          </p>
                        </div>
                        <div className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-foreground">
                          75% today
                        </div>
                      </div>

                      <div className="mt-4 flex h-36 items-end justify-between gap-2">
                        {[
                          ["M", 58],
                          ["T", 82],
                          ["W", 64],
                          ["T", 92],
                          ["F", 72],
                          ["S", 48],
                          ["S", 80],
                        ].map(([day, height]) => (
                          <div key={`${day}-${height}`} className="flex flex-1 flex-col items-center gap-2">
                            <div className="flex h-24 w-full items-end rounded-full bg-slate-100 p-1.5 dark:bg-muted">
                              <div
                                className="w-full rounded-full bg-sky-500"
                                style={{ height: `${height}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-muted-foreground">
                              {day}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="border-y border-border bg-card/40">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-6 md:justify-between">
            {trustBadges.map((badge) => {
              const Icon = badge.icon
              return (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-foreground">{badge.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-6 py-20 md:py-28" id="how-it-works">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-foreground md:text-4xl">
                Three small steps. No setup ceremony.
              </h2>
              <p className="muted-copy mt-4 text-sm leading-7 md:text-base">
                Open the app, set up the routines you care about, and let your dashboard quietly fill
                up. The longer you use it, the more your patterns reveal themselves.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className="relative rounded-3xl border border-border bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Step {step.number}
                    </span>
                    {index < steps.length - 1 && (
                      <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="muted-copy mt-3 text-sm leading-7">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="px-6 py-20 md:py-28" id="features">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Features
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-foreground md:text-4xl">
                Built for consistency, not just checklists
              </h2>
              <p className="muted-copy mt-4 text-sm leading-7 md:text-base">
                TuloyLang connects your habits, workouts, analytics, and settings into one shared
                workspace, so every page contributes to the same story of progress.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {featureCards.map((feature) => {
                const Icon = feature.icon

                return (
                  <article
                    key={feature.title}
                    className={`rounded-3xl border border-border bg-gradient-to-br ${feature.accent} p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 dark:from-card dark:via-card dark:to-muted/70`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-slate-900 shadow-sm dark:border-border dark:bg-background dark:text-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-foreground">{feature.title}</h3>
                    <p className="muted-copy mt-3 text-sm leading-7">{feature.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* PREVIEW SECTION */}
        <section className="px-6 py-20 md:py-28" id="preview">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Preview
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-foreground md:text-4xl">
                  A quick look at the actual product flow
                </h2>
                <p className="muted-copy mt-4 text-sm leading-7 md:text-base">
                  These previews mirror the product areas already connected inside the app, from the
                  dashboard overview to logging workouts and drilling into analytics.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
                <Activity className="h-4 w-4 text-foreground" />
                Shared data across pages
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <Carousel className="w-full max-w-5xl">
                <CarouselContent>
                  {previewSlides.map((slide) => (
                    <CarouselItem key={slide.title}>
                      <div className="p-1 sm:p-2">
                        <div className="overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5 shadow-xl dark:from-card dark:via-card dark:to-muted/70 sm:p-7">
                          <div className="max-w-2xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                              {slide.eyebrow}
                            </p>
                            <h3 className="mt-3 text-2xl font-black text-foreground md:text-3xl">
                              {slide.title}
                            </h3>
                            <p className="muted-copy mt-4 text-sm leading-7 md:text-base">
                              {slide.description}
                            </p>
                          </div>

                          <div className="mt-8">
                            {slide.panel}
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>

                <CarouselPrevious className="-left-3 sm:-left-5" />
                <CarouselNext className="-right-3 sm:-right-5" />
              </Carousel>
            </div>
          </div>
        </section>

        {/* PRINCIPLES SECTION */}
        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Principles
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-foreground md:text-4xl">
                A small app with strong opinions
              </h2>
              <p className="muted-copy mt-4 text-sm leading-7 md:text-base">
                TuloyLang is built around a few quiet beliefs. These aren't features — they're the
                reason the app feels the way it does.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {principles.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-foreground">{item.title}</h3>
                    <p className="muted-copy mt-3 text-sm leading-7">{item.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="px-6 py-20 md:py-28" id="faq">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                FAQ
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-foreground md:text-4xl">
                Quick answers
              </h2>
              <p className="muted-copy mx-auto mt-4 max-w-xl text-sm leading-7 md:text-base">
                If something still isn't clear, the GitHub repository has the source code and a
                contact link.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              {faqs.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="px-6 pb-24 md:pb-32">
          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-10 text-center shadow-sm md:p-16 dark:from-card dark:via-card dark:to-muted/70">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10"
              />
              <div className="relative">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Ready when you are
                </div>
                <h2 className="mx-auto mt-5 max-w-2xl text-2xl font-black leading-tight text-foreground md:text-4xl">
                  Start small today. Look back in a month.
                </h2>
                <p className="muted-copy mx-auto mt-4 max-w-xl text-sm leading-7 md:text-base">
                  Pick one habit, log one workout, and let the dashboard keep score quietly in the
                  background. Tuloy lang.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    className="group h-10 w-full rounded-full px-6 text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md sm:w-auto"
                    size="sm"
                    onClick={() => navigate("/start")}
                  >
                    Get Started — it's free
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Button>
                  <a
                    href="https://github.com/jimmycamangon"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button
                      className="h-10 w-full rounded-full border border-border bg-card px-6 text-sm text-foreground transition-all duration-200 hover:scale-[1.02] hover:bg-accent hover:text-accent-foreground hover:shadow-md sm:w-auto"
                      size="sm"
                    >
                      View on GitHub
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  )
}
