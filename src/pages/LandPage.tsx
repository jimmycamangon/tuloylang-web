import { useState } from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import NavigationPage from "../components/NavigationPage"
import Footer from "../components/Footer"
import { Button } from "../components/ui/button"
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Dumbbell,
  Heart,
  Lock,
  Repeat,
  Scale,
  Settings,
  Zap,
} from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Set up your habits",
    description:
      "Add the routines you actually want to keep visible — daily, weekday, weekend, or a custom schedule. No accounts, no setup wizard.",
  },
  {
    number: "02",
    title: "Log as you go",
    description:
      "Check off a habit, log a workout, or record your weight in a few taps. Everything saves straight to your device as you go.",
  },
  {
    number: "03",
    title: "Read the pattern",
    description:
      "The dashboard and analytics pages turn that raw log into streaks, a heatmap, and day-by-day detail you can actually act on.",
  },
]

const features = [
  {
    title: "Habits with real schedules",
    description:
      "Daily, weekday, weekend, or custom days — plus check-off or quantity-based goals, like water intake or a daily supplement.",
    icon: Repeat,
  },
  {
    title: "Workouts with structure",
    description:
      "Save a routine once as a template, assign it to a day of the week, then log it in one tap when that day comes around.",
    icon: Dumbbell,
  },
  {
    title: "Weight tracked over time",
    description:
      "Log body weight on your own schedule and read the 7-day average and total change, not just one noisy number.",
    icon: Scale,
  },
  {
    title: "Analytics that explain the day",
    description:
      "An interactive heatmap plus per-exercise progress tracking, so you can tell a plateau apart from real improvement.",
    icon: BarChart3,
  },
  {
    title: "Settings that stay out of the way",
    description:
      "Theme, layout, and data export live in one place, separate from the screens you actually use every day.",
    icon: Settings,
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
      "No streak shaming, no push notifications, no pressure loops. The app stays out of your way until you open it.",
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
      "It's a Filipino phrase that loosely translates to \"just keep going.\" It captures the spirit of consistency over intensity — the idea that small, repeated actions matter more than perfect ones.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes. Inside Settings, you can export your habits and workouts so you have a portable backup, or move to another device whenever you want.",
  },
]

type PreviewTabId = "dashboard" | "workouts" | "analytics"

const previewTabs: { id: PreviewTabId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "workouts", label: "Workouts" },
  { id: "analytics", label: "Analytics" },
]

function WindowFrame({
  label,
  meta,
  children,
}: {
  label: string
  meta?: string
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-xs font-medium text-foreground">{label}</span>
        {meta && (
          <span className="font-mono text-[11px] text-muted-foreground">{meta}</span>
        )}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}

function StatTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-xl font-semibold text-foreground">{value}</p>
      <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">{detail}</p>
    </div>
  )
}

function DashboardPreview() {
  const bars = [
    ["Sun", 32], ["Mon", 88], ["Tue", 64], ["Wed", 92], ["Thu", 48], ["Fri", 76], ["Sat", 40],
  ] as const

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Active Habits" value="8" detail="2 archived" />
        <StatTile label="Completed Today" value="3/5" detail="60% today" />
        <StatTile label="Best Streak" value="12" detail="days running" />
        <StatTile label="This Week" value="3" detail="workouts logged" />
      </div>
      <div className="rounded-lg border border-border bg-background/60 p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Weekly Habit Activity</p>
          <span className="font-mono text-xs text-muted-foreground">7d</span>
        </div>
        <div className="flex items-end justify-between gap-2">
          {bars.map(([day, height]) => (
            <div key={day} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-20 w-full items-end rounded bg-muted">
                <div className="w-full rounded bg-emerald-500/80" style={{ height: `${height}%` }} />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WorkoutsPreview() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[
        { title: "Shoulder + Bicep", day: "Today", exercises: ["Overhead Press — 4x8", "Lateral Raise — 3x12"] },
        { title: "Back + Tricep", day: "Wed", exercises: ["Pull-ups — 3x8", "Rows — 4x10"] },
        { title: "Leg Day", day: "Sat", exercises: ["Goblet Squat — 3x12", "Romanian Deadlift — 3x10"] },
        { title: "Calisthenics + Abs", day: "Tue", exercises: ["Push-ups — 3x15", "Plank — 3x60s"] },
      ].map((template) => (
        <div key={template.title} className="rounded-lg border border-border bg-background/60 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{template.title}</p>
            <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {template.day}
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {template.exercises.map((exercise) => (
              <span
                key={exercise}
                className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
              >
                {exercise}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AnalyticsPreview() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-lg border border-border bg-background/60 p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Interactive Activity Heatmap</p>
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 84 }).map((_, index) => (
            <div
              key={index}
              className={`h-3.5 rounded-sm ${
                index === 58
                  ? "ring-1 ring-foreground bg-emerald-400"
                  : index % 6 === 0
                    ? "bg-muted"
                    : index % 4 === 0
                      ? "bg-emerald-300 dark:bg-emerald-700"
                      : "bg-emerald-500/70"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-background/60 p-4">
        <p className="text-sm font-medium text-foreground">Saturday, selected</p>
        <div className="mt-3 space-y-2 text-xs">
          <div className="rounded-md border border-border px-3 py-2">
            <span className="font-medium text-foreground">Completed — </span>
            <span className="text-muted-foreground">Morning stretch, hydration, reading</span>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <span className="font-medium text-foreground">Open — </span>
            <span className="text-muted-foreground">Sleep by 11 PM</span>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <span className="font-medium text-foreground">Logged — </span>
            <span className="text-muted-foreground">Leg day, 60 min, high intensity</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border py-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground md:text-base">{question}</span>
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
          <p className="muted-copy pt-3 text-sm leading-7">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export default function LandPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<PreviewTabId>("dashboard")

  return (
    <>
      <NavigationPage />
      <div className="bg-background text-foreground">
        {/* HERO */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                Habit + workout tracker
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl">
                Tuloy lang.
                <br />
                Keep the log, skip the noise.
              </h1>
              <p className="muted-copy mt-5 max-w-md text-sm leading-7 md:text-base">
                A local-first space to track habits, log workouts, and watch your own consistency
                take shape — no account, no sync, no one else watching.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate("/start")}>
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <a href="#preview" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    See the app
                  </Button>
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span>Free</span>
                <span aria-hidden>|</span>
                <span>Local-only data</span>
                <span aria-hidden>|</span>
                <span>No sign-up</span>
              </div>
            </div>

            <WindowFrame label="Dashboard" meta="tuloylang.app">
              <DashboardPreview />
            </WindowFrame>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-b border-border px-6 py-16 md:py-24" id="how-it-works">
          <div className="mx-auto max-w-6xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-3 max-w-lg text-2xl font-bold leading-tight text-foreground md:text-3xl">
              Three steps. No setup ceremony.
            </h2>

            <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={`pt-6 md:border-t md:pt-8 ${
                    index === 0 ? "border-foreground" : "border-border"
                  }`}
                >
                  <span className="font-mono text-sm text-muted-foreground">{step.number}</span>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="muted-copy mt-2.5 text-sm leading-7">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="border-b border-border px-6 py-16 md:py-24" id="features">
          <div className="mx-auto max-w-6xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Features
            </p>
            <h2 className="mt-3 max-w-lg text-2xl font-bold leading-tight text-foreground md:text-3xl">
              Built for consistency, not just checklists
            </h2>

            <div className="mt-10 divide-y divide-border border-t border-border">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="grid gap-3 py-6 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-6"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="grid gap-1.5 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-6">
                      <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                      <p className="muted-copy text-sm leading-7">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* PREVIEW */}
        <section className="border-b border-border px-6 py-16 md:py-24" id="preview">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Preview
                </p>
                <h2 className="mt-3 max-w-lg text-2xl font-bold leading-tight text-foreground md:text-3xl">
                  The actual product, not a mockup
                </h2>
              </div>

              <div className="inline-flex w-fit gap-1 rounded-lg border border-border bg-card p-1">
                {previewTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <WindowFrame
                label={previewTabs.find((tab) => tab.id === activeTab)?.label ?? ""}
                meta="tuloylang.app"
              >
                {activeTab === "dashboard" && <DashboardPreview />}
                {activeTab === "workouts" && <WorkoutsPreview />}
                {activeTab === "analytics" && <AnalyticsPreview />}
              </WindowFrame>
            </div>
          </div>
        </section>

        {/* PRINCIPLES */}
        <section className="border-b border-border px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Principles
            </p>
            <h2 className="mt-3 max-w-lg text-2xl font-bold leading-tight text-foreground md:text-3xl">
              A small app with strong opinions
            </h2>

            <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
              {principles.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex gap-4">
                    <Icon className="mt-1 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      <p className="muted-copy mt-2 text-sm leading-7">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-border px-6 py-16 md:py-24" id="faq">
          <div className="mx-auto max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              FAQ
            </p>
            <h2 className="mt-3 text-2xl font-bold leading-tight text-foreground md:text-3xl">
              Quick answers
            </h2>

            <div className="mt-8 border-t border-border">
              {faqs.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-xl border border-border bg-card p-8 md:flex-row md:items-center md:p-12">
            <div>
              <h2 className="max-w-md text-2xl font-bold leading-tight text-foreground md:text-3xl">
                Start small today. Look back in a month.
              </h2>
              <p className="muted-copy mt-3 max-w-md text-sm leading-7">
                Pick one habit, log one workout. Tuloy lang.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate("/start")}>
                Get started — it's free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a
                href="https://github.com/jimmycamangon"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto"
              >
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  View on GitHub
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  )
}