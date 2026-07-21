# Harta · the map to living well

A private meal-planning and gentle-habits app, built on one idea: **know first, then choose.**

Harta plans a week of whole-food, family-sized dinners around the nights you're actually rushed, writes the grocery list, holds four quiet habit trackers, and explains the evidence behind every suggestion with named sources. Progress is measured in energy, never weight.

## What makes it different

- **The why is always there.** Every recipe and every nudge carries a one-line reason and a named source (NHMRC, World Cancer Research Fund, WHO, Heart Foundation, and peers), with an honest label for how strong the evidence is. No superfoods, no fear.
- **An experience, not a dashboard.** The day opens with a passage for the soul (Psalms and older wisdom, rotating daily). A Recharge sanctuary offers guided breathing, on-device synthesised soundscapes (432 Hz, 528 Hz, ocean, rain) with honest framing, and journaling prompts for the inner power.
- **Two ways of eating, honestly ranked.** Whole-food Mediterranean by default; a deliberate ketogenic mode (net carbs shown, adult plates only) informed by the published work of Dr William Li, Jessie Inchauspe, Dr Boz, Dr Jason Fung and Dr Thomas Seyfried, each labelled with what to take and what to hold lightly.
- **Fasting with a spine.** 12:12, 14:10 and 16:8 timers behind a real safety gate; water fasting beyond a day is deliberately not timed here, it belongs with a doctor.
- **Signals, kindly.** Manual or CSV-imported glucose and ketone readings (LibreView, Dexcom Clarity, Keto-Mojo style exports), GKI and Dr Boz ratio, lab-result trends, and gentle cited pattern hints. Charts, never verdicts.
- **A journal and a time capsule.** Photos, voice notes and words in on-device IndexedDB; letters sealed until a chosen date, for the future you or the people you love. All of it exports in one backup file.
- **Wellbeing first, by design.** No calories, no weight tracking, no streaks, no "cheat days". The app measures energy, sleep and mood, and treats a blank day as information, not failure.
- **Family real, not family ideal.** One dinner for the whole table, rushed nights get 15-minute meals or planned leftovers, and the planner learns what the family actually loved.
- **Private by architecture.** No account, no server, no analytics. Everything lives in the browser on your device; backup is a file you download and keep. The optional Care calendar (appointments, questions for your doctor) can be PIN-locked.
- **Not medical advice, and honest about it.** Harta never diagnoses, never prescribes, never interprets symptoms or results. Its job with anything medical is to help you arrive at the doctor with better questions.

## Running it

It is a static site with no build step and no dependencies.

```
cd app
python3 -m http.server 8000
# open http://localhost:8000
```

Any static host works (Netlify, Cloudflare Pages, GitHub Pages). It installs as a PWA and works offline after first load.

## Roadmap (post-launch)

- Video recipe walk-throughs (optional, on-device)
- Direct sensor pairing where platforms allow it (CSV import covers the gap)
- Romanian-language mode

## Stack

Vanilla JavaScript (ES modules), hand-rolled CSS design system with light and dark modes, no frameworks, no external requests. The service worker caches the app shell for offline use.

```
app/
  index.html
  css/styles.css        design system
  js/app.js             router and shell
  js/store.js           state, persistence, weekly planner, grocery aggregation
  js/data.js            recipes, evidence cards, nudges
  js/ui.js              DOM helpers, icons, modal, toast, sparkline
  js/views-plan.js      onboarding, today, plan, groceries, recipes
  js/views-track.js     habits, check-in, progress, learn, care, settings
  sw.js                 offline shell
```

## The line it will not cross

This app offers general information drawn from published guidance. It is not medical advice, and it says so to the user, repeatedly and in plain language. It contains deliberate guardrails against restrictive or obsessive patterns: no weight, no calories, no punitive framing, and a designed absence of the features that make diet apps harmful.

---

*I've been there. I kept the map.*
