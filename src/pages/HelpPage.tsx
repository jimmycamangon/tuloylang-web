import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type GuideEntry = {
  question: string
  answer: string
}

type GuideSection = {
  title: string
  description: string
  entries: GuideEntry[]
}

const guideSections: GuideSection[] = [
  {
    title: 'Habits',
    description: 'Setting up routines, choosing a goal type, and reading your streaks.',
    entries: [
      {
        question: 'How do I create a habit?',
        answer:
          'Go to the Habits page, fill in a name and description, then choose how often it repeats: Daily, Weekdays, Weekend, or Custom days. Save it and it appears in your active list right away.',
      },
      {
        question: 'What is the difference between a "check" and "quantity" habit?',
        answer:
          'A check habit is simple done/undone, like "Stretch in the morning." A quantity habit tracks an amount toward a daily target, like "8 glasses of water" — you log how much you did each day, and it counts as complete once you hit the target.',
      },
      {
        question: 'How do streaks work?',
        answer:
          'A streak counts consecutive scheduled days where the habit was completed. It only looks at the days the habit is actually scheduled for — a Weekdays-only habit will not break its streak over a weekend.',
      },
      {
        question: 'What happens when I archive a habit?',
        answer:
          'Archiving removes it from your active lists on the Habits page and Dashboard "Due Today" section, but its past completions are never deleted. The Analytics heatmap, weekly activity chart, and Dashboard history still count everything the habit completed before it was archived.',
      },
    ],
  },
  {
    title: 'Workouts + Templates',
    description: 'Logging sessions, saving templates, and assigning them to a day of the week.',
    entries: [
      {
        question: 'How do I log a workout?',
        answer:
          'On the Workouts page, fill in the title, category, duration, and intensity. You can also add structured exercises — name, sets, and either reps or a hold time in seconds — for a detailed breakdown, or leave that section empty for a quick log.',
      },
      {
        question: 'What does "Save as template" do?',
        answer:
          'It saves the current form (including any exercises) as a reusable template, so you only have to set it up once. From then on, use "Use template" to fill the form again for editing, or "Log now" to save it instantly with today\'s date, one tap.',
      },
      {
        question: 'How do I assign a template to a specific day?',
        answer:
          'Each saved template has a "Change day" dropdown. Pick the day of the week that routine belongs to (for example, Leg Day on Saturday). Templates assigned to today automatically get a "Today" badge and sort to the top of the list.',
      },
      {
        question: 'What is "Today\'s Workout" on the Dashboard?',
        answer:
          'If a template is assigned to today\'s day of the week, it shows up as its own card on the Dashboard with a "Log now" button, so you can log your session without opening the Workouts page. It logs once per day — the button disables itself after you use it.',
      },
    ],
  },
  {
    title: 'Body Metrics + Analytics',
    description: 'Tracking weight over time and reading the heatmap and exercise progress.',
    entries: [
      {
        question: 'How do I log my weight?',
        answer:
          'Open the Body Metrics page, pick a date, enter your weight in kg, and save. You can edit or delete any past entry from the history list on the same page.',
      },
      {
        question: 'What do "7-day avg" and "Total change" mean?',
        answer:
          '"7-day avg" is the average of every entry logged in the last 7 days, which smooths out normal day-to-day water-weight swings. "Total change" compares your very first logged entry to your latest one.',
      },
      {
        question: 'When does the Weight Trend chart appear?',
        answer:
          'Once you have at least two weight entries, a chart appears above the log form showing your weight over time so you can see the overall direction, not just single-day numbers.',
      },
      {
        question: 'How does the Analytics heatmap work?',
        answer:
          'Each cell is one day over the last 24 weeks — darker means more habits completed and workouts logged. Click any cell to see exactly which habits were completed, which stayed open, and which workouts were logged that day.',
      },
      {
        question: 'What does "Exercise Progress" tell me?',
        answer:
          'It looks at your logged sets, reps, and hold times for each exercise over time and tags it as Improving, Plateaued, or Ready to level up (once a common bodyweight move like push-ups or pull-ups hits a known threshold at the same effort as last time).',
      },
    ],
  },
  {
    title: 'Data + Settings',
    description: 'Backing up your data, switching themes, and setting weekly goals.',
    entries: [
      {
        question: 'How do I back up my data?',
        answer:
          'In Settings, under "Connected Data," use "Export app data" to download a JSON backup of everything — habits, workouts, templates, and body metrics. Keep that file somewhere safe.',
      },
      {
        question: 'How do I restore or move to another device?',
        answer:
          'Since everything is stored in your browser only, use "Restore History" in Settings to import a previously exported JSON backup. This is also how you carry your data over to a new device or browser.',
      },
      {
        question: 'Where do I switch between light and dark mode?',
        answer:
          'Settings > Appearance has a single toggle button that switches the whole app between light and dark mode.',
      },
      {
        question: 'What are Weekly Goals for?',
        answer:
          'In Settings, you can set a target number of weekly habit completions and workout sessions. Your progress toward both shows up on the Dashboard as two progress bars.',
      },
    ],
  },
]

function GuideItem({ question, answer }: GuideEntry) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0">
          <p className="muted-copy pb-4 text-sm leading-7">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export default function HelpPage() {
  return (
    <section className="space-y-6">
      <div className="surface-card p-6">
        <h2 className="text-base font-semibold text-foreground">Guide</h2>
        <p className="muted-copy mt-2 text-sm leading-7">
          Short answers for how each part of TuloyLang works. Pick a section below and expand a
          question to read the details.
        </p>
      </div>

      {guideSections.map((section) => (
        <div key={section.title} className="surface-card p-6">
          <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
          <p className="muted-copy mt-2 text-sm">{section.description}</p>

          <div className="mt-4 border-t border-border">
            {section.entries.map((entry) => (
              <GuideItem key={entry.question} question={entry.question} answer={entry.answer} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}