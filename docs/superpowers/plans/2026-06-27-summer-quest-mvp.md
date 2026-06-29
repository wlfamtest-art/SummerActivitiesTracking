# Summer Quest MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first, Supabase-ready Summer Quest MVP that proves the one-parent, one-child weekly quest, XP, Gold Coin, Kid Mode, reward, rest-day, and balance loop.

**Architecture:** Scaffold a Next.js App Router app with TypeScript, Tailwind CSS, and Vitest. Keep product rules in pure `lib/` modules, run the local MVP from a browser-backed demo repository, and include Supabase clients plus SQL migrations for later credential-based deployment.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Vitest, Testing Library, Supabase schema/RLS SQL, localStorage-backed demo data.

---

## File Structure

- Create `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `vitest.config.ts`, `.env.example`, `.gitignore`.
- Create `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, and route pages under `app/dashboard`, `app/kid`, `app/onboarding`, `app/quests`, `app/rewards`, `app/settings`.
- Create shared UI under `components/shared`, parent UI under `components/parent`, and kid UI under `components/kid`.
- Create domain modules under `lib/game`, date modules under `lib/dates`, seed/data modules under `lib/data`, analytics under `lib/analytics`, local demo repository under `lib/demo`, and Supabase wrappers under `lib/supabase`.
- Create SQL migration `supabase/migrations/0001_initial_schema.sql`.
- Create tests under `tests/game`, `tests/dates`, and `tests/demo`.

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Create project config files**

Add `package.json`:

```json
{
  "name": "summer-quest",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/ssr": "^0.6.1",
    "@supabase/supabase-js": "^2.45.4",
    "bcryptjs": "^2.4.3",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.468.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.16.0",
    "eslint-config-next": "^15.0.0",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

Add `.env.example`:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ANALYTICS_ENABLED=false
```

Add `.gitignore`:

```txt
node_modules
.next
out
dist
coverage
.env
.env.local
.superpowers
```

- [ ] **Step 2: Create TypeScript and build config**

Add `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, and `vitest.config.ts` with standard Next.js, Tailwind, and jsdom test settings.

- [ ] **Step 3: Create the root shell**

Create `app/layout.tsx` with metadata and global CSS import. Create `app/page.tsx` to render a temporary "Summer Quest is starting" screen until the app shell exists.

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 5: Verify scaffold**

Run: `npm test`

Expected: Vitest starts and reports no test files or passes once tests exist.

---

### Task 2: Add Domain Types and Constants

**Files:**
- Create: `lib/game/types.ts`
- Create: `lib/game/constants.ts`
- Test: `tests/game/constants.test.ts`

- [ ] **Step 1: Write failing constants tests**

Test that `LEVELS` has 20 entries, Level 20 is `Legendary Adventurer`, `ACTIVITY_TEMPLATES` includes Screen Time, starter quests include five quests, and starter rewards include eight rewards.

Run: `npm test -- tests/game/constants.test.ts`

Expected: FAIL because constants do not exist.

- [ ] **Step 2: Implement types and constants**

Create union types for weekdays, categories, approval modes, unlock modes, quest statuses, reward statuses, rest day types, and the table-shaped domain entities.

Create `lib/game/constants.ts` with:

- full Level 1-20 table from the spec
- activity categories
- weekdays as lowercase strings
- activity templates from the spec
- starter quests from the spec
- starter rewards from the spec
- rest day types from the spec

- [ ] **Step 3: Verify constants tests**

Run: `npm test -- tests/game/constants.test.ts`

Expected: PASS.

---

### Task 3: Add Economy and Level Logic

**Files:**
- Create: `lib/game/economy.ts`
- Create: `lib/game/levels.ts`
- Test: `tests/game/economy.test.ts`
- Test: `tests/game/levels.test.ts`

- [ ] **Step 1: Write failing economy tests**

Cover exact examples:

```ts
expect(calculateXp(15)).toBe(25)
expect(calculateCoins(25)).toBe(5)
expect(calculateXp(60)).toBe(90)
expect(calculateCoins(90)).toBe(18)
```

Run: `npm test -- tests/game/economy.test.ts`

Expected: FAIL because functions do not exist.

- [ ] **Step 2: Implement economy functions**

Create:

```ts
export function calculateXp(durationMinutes: number): number {
  return Math.round((durationMinutes * 1.5) / 5) * 5
}

export function calculateCoins(xp: number): number {
  return Math.round(xp / 5)
}
```

- [ ] **Step 3: Write failing level tests**

Cover Level 1 at 0 XP, threshold behavior, Level 20 at 4800 XP, continued XP at Level 20, and full progress bar at Level 20.

- [ ] **Step 4: Implement level helpers**

Create `getLevelForXp`, `getLevelProgress`, and `getLevelMessage`. At Level 20, progress is complete and message is the required Legendary Adventurer copy.

- [ ] **Step 5: Verify economy and level tests**

Run: `npm test -- tests/game/economy.test.ts tests/game/levels.test.ts`

Expected: PASS.

---

### Task 4: Add Date, Weekday, Timezone, and Balance Logic

**Files:**
- Create: `lib/dates/weekdays.ts`
- Create: `lib/dates/timezone.ts`
- Create: `lib/game/balance.ts`
- Test: `tests/dates/weekdays.test.ts`
- Test: `tests/dates/timezone.test.ts`
- Test: `tests/game/balance.test.ts`

- [ ] **Step 1: Write failing weekday tests**

Cover lowercase validation, Monday week start, and date-to-weekday conversion.

- [ ] **Step 2: Implement weekday helpers**

Create `isWeekday`, `getWeekdayForDate`, `getWeekStartMonday`, and `formatLocalDate`.

- [ ] **Step 3: Write failing timezone tests**

Cover using an IANA timezone to produce `YYYY-MM-DD` local dates without UTC timestamp storage.

- [ ] **Step 4: Implement timezone helpers**

Use `Intl.DateTimeFormat` to create `getTodayInTimeZone` and `toLocalDateKey`.

- [ ] **Step 5: Write failing balance tests**

Cover planned and completed minutes by category, Screen category inclusion, rest days as excused, and a nudge such as "No physical activity planned yet."

- [ ] **Step 6: Implement balance calculation**

Create `calculateWeeklyBalance` returning categories, totals, excused dates, and one nudge.

- [ ] **Step 7: Verify tests**

Run: `npm test -- tests/dates tests/game/balance.test.ts`

Expected: PASS.

---

### Task 5: Add Unlock, Quest Generation, Streak, and Transaction Rules

**Files:**
- Create: `lib/game/unlocks.ts`
- Create: `lib/data/daily-quests.ts`
- Create: `lib/game/streaks.ts`
- Create: `lib/game/rewards.ts`
- Test: `tests/game/unlocks.test.ts`
- Test: `tests/game/daily-quests.test.ts`
- Test: `tests/game/streaks.test.ts`
- Test: `tests/game/rewards.test.ts`

- [ ] **Step 1: Write failing unlock tests**

Cover `always`, `after_one`, `after_multiple`, locked copy, self-dependency rejection, inactive prerequisite rejection, circular dependency rejection, and no-shared-day warning.

- [ ] **Step 2: Implement unlock helpers**

Create `validateUnlockRule` and `getUnlockState`. Keep circular dependency detection in this module.

- [ ] **Step 3: Write failing daily quest tests**

Cover rest-day suppression, snapshot field copying, uniqueness by `assigned_quest_id` plus date, and assigned quest edits not mutating existing instances.

- [ ] **Step 4: Implement daily quest generation**

Create `generateDailyQuestInstances` that accepts assigned quests, existing instances, rest day, date key, and weekday. Return existing instances unchanged when present.

- [ ] **Step 5: Write failing transaction tests**

Cover quest completion awarding XP/coins once and retrying denied quest without awards.

- [ ] **Step 6: Implement reward and quest transaction helpers**

Create pure helpers for `completeQuestWithAward`, `approveQuestWithAward`, `requestRewardRedemption`, `approveRewardRedemption`, and `getOverdrawWarning`.

- [ ] **Step 7: Write failing streak tests**

Cover completed quest days, rest days not breaking streaks, and missed active days breaking streaks.

- [ ] **Step 8: Implement streak helper**

Create `calculateCurrentStreak`.

- [ ] **Step 9: Verify tests**

Run: `npm test -- tests/game`

Expected: PASS.

---

### Task 6: Add Local Demo Repository

**Files:**
- Create: `lib/demo/store.ts`
- Create: `lib/demo/repository.ts`
- Create: `lib/demo/pin.ts`
- Create: `lib/analytics/track.ts`
- Test: `tests/demo/repository.test.ts`
- Test: `tests/demo/pin.test.ts`

- [ ] **Step 1: Write failing repository flow tests**

Cover parent onboarding, starter plan creation, daily generation, auto-approved quest completion, parent-approved submission and approval, denial and retry, reward request and approval, overdraw rejection and explicit overdraw approval, rest day suppression, and PIN-gated Kid Mode exit.

- [ ] **Step 2: Implement store shape**

Create a `SummerQuestState` object that mirrors Supabase tables closely: families, users, children, assigned quests, quest instances, rewards, redemptions, XP transactions, coin transactions, and rest days.

- [ ] **Step 3: Implement browser persistence**

Create `loadState`, `saveState`, `resetState`, and `createInitialState`. Use localStorage in the browser and an in-memory fallback in tests.

- [ ] **Step 4: Implement repository operations**

Add repository functions for all local MVP operations. Delegate game rules to `lib/game` modules.

- [ ] **Step 5: Implement PIN helper**

Use `bcryptjs` behind `hashKidPin` and `verifyKidPin`. Validate exactly four digits.

- [ ] **Step 6: Implement analytics no-op wrapper**

Create `track(eventName, properties)` that no-ops unless analytics is configured and strips private fields.

- [ ] **Step 7: Verify local flow tests**

Run: `npm test -- tests/demo`

Expected: PASS.

---

### Task 7: Add Supabase Clients and SQL Migration

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `supabase/migrations/0001_initial_schema.sql`

- [ ] **Step 1: Add Supabase client wrappers**

Create browser and server client helpers. If environment variables are missing, throw a clear configuration error only when the Supabase client is requested.

- [ ] **Step 2: Add migration schema**

Create all requested tables with UUID primary keys, timestamps, status checks, unique constraints, and `active_days text[] not null`.

- [ ] **Step 3: Add RLS policies**

Enable RLS on public tables. Use `to authenticated` policies with family ownership predicates based on the `users` table. Include both `using` and `with check` for writes.

- [ ] **Step 4: Add RPC**

Create `approve_reward_redemption(redemption_id uuid, target_status text, allow_overdraw boolean default false)` with atomic balance load, requested-status check, overdraw rejection, coin transaction insertion, redemption status update, and resulting balance return.

- [ ] **Step 5: Review SQL**

Run a local SQL parser or Supabase CLI validation if available. If Supabase CLI is unavailable, manually inspect the migration for table, constraint, RLS, and RPC coverage.

---

### Task 8: Build Shared App Shell

**Files:**
- Create: `components/shared/Button.tsx`
- Create: `components/shared/Card.tsx`
- Create: `components/shared/ProgressBar.tsx`
- Create: `components/shared/StatusBadge.tsx`
- Create: `components/shared/PinPad.tsx`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write component smoke tests**

Add small tests for button rendering, progress labels, and PIN input validation.

- [ ] **Step 2: Implement shared components**

Create small, accessible components with native buttons and inputs. Keep cards at 8px radius or less.

- [ ] **Step 3: Add visual foundation**

Add Tailwind global styles for mobile-first layout, calm parent surfaces, playful kid surfaces, large touch targets, and distinct quest statuses.

- [ ] **Step 4: Wire app entry**

`app/page.tsx` should route between onboarding and dashboard based on local state.

- [ ] **Step 5: Verify**

Run: `npm test`

Expected: PASS.

---

### Task 9: Build Parent Onboarding and Starter Setup

**Files:**
- Create: `app/onboarding/page.tsx`
- Create: `components/parent/OnboardingFlow.tsx`
- Create: `components/parent/StarterSetup.tsx`

- [ ] **Step 1: Write onboarding flow tests**

Cover creating family, child, avatar, age band, timezone, four-digit PIN, starter plan, and dashboard-ready state.

- [ ] **Step 2: Implement onboarding UI**

Build a mobile-first stepper with simple fields and clear validation.

- [ ] **Step 3: Implement starter setup UI**

Add "Use starter plan" and "Customize plan" choices. Starter plan creates starter quests and rewards.

- [ ] **Step 4: Verify**

Run: `npm test -- tests/demo/repository.test.ts`

Expected: PASS, then manually open `/onboarding` once the dev server is running.

---

### Task 10: Build Parent Dashboard, Weekly Planner, and Balance Chart

**Files:**
- Create: `app/dashboard/page.tsx`
- Create: `components/parent/ParentDashboard.tsx`
- Create: `components/parent/WeeklyPlanner.tsx`
- Create: `components/parent/BalanceChart.tsx`
- Create: `components/parent/RestDayControl.tsx`

- [ ] **Step 1: Write dashboard calculation tests**

Use existing balance, streak, and repository tests to cover all dashboard metrics.

- [ ] **Step 2: Implement dashboard UI**

Show child avatar, level, XP progress, coins, quest counts, pending approvals, reward requests, Screen Time lock state, balance summary, and quick actions.

- [ ] **Step 3: Implement planner and rest-day UI**

Show assigned quests by weekday and allow marking/removing rest days.

- [ ] **Step 4: Implement balance chart**

Use horizontal bars or compact category rows with planned minutes, completed minutes, rest days, and one nudge.

- [ ] **Step 5: Verify**

Run: `npm test`

Expected: PASS.

---

### Task 11: Build Quest Wizard and Edit Flow

**Files:**
- Create: `app/quests/page.tsx`
- Create: `app/quests/[questId]/page.tsx`
- Create: `components/parent/QuestWizard.tsx`
- Create: `components/parent/QuestCardPreview.tsx`

- [ ] **Step 1: Write wizard behavior tests**

Cover preset quest creation, custom quest creation, duration choices, lowercase active days, approval mode, unlock prerequisites, invalid circular dependencies, and XP/coin calculation.

- [ ] **Step 2: Implement four-step wizard**

Build steps for activity, schedule, approval/unlocks, and review/save.

- [ ] **Step 3: Implement edit behavior**

Editing assigned quests updates future generation only and never mutates existing quest instances.

- [ ] **Step 4: Verify**

Run: `npm test -- tests/game/daily-quests.test.ts tests/game/unlocks.test.ts tests/demo/repository.test.ts`

Expected: PASS.

---

### Task 12: Build Kid Mode, Quest Map, Timer, and Completion

**Files:**
- Create: `app/kid/page.tsx`
- Create: `app/kid/quests/[instanceId]/page.tsx`
- Create: `components/kid/KidHome.tsx`
- Create: `components/kid/KidQuestCard.tsx`
- Create: `components/kid/QuestDetail.tsx`
- Create: `components/kid/QuestTimer.tsx`
- Create: `components/kid/LevelProfile.tsx`

- [ ] **Step 1: Write Kid Mode flow tests**

Cover quest generation on kid map open, locked Screen Time, timer start/pause/finish, auto-approved completion, parent-approved submitted state, denied Try Again, and PIN-required exit.

- [ ] **Step 2: Implement Kid Home**

Group today quests by available, locked, submitted, completed, and denied. Show avatar, level, XP, coins, streak, and Treasure Chest shortcut.

- [ ] **Step 3: Implement Quest Detail and Timer**

Show countdown, pause, finish, stored elapsed seconds, and completion/submission outcomes.

- [ ] **Step 4: Implement PIN-gated exit**

Exit from Kid Mode requires PIN verification. Invalid PIN shows a clear message.

- [ ] **Step 5: Verify**

Run: `npm test`

Expected: PASS.

---

### Task 13: Build Rewards and Pending Approvals

**Files:**
- Create: `app/rewards/page.tsx`
- Create: `app/dashboard/approvals/page.tsx`
- Create: `components/kid/TreasureChest.tsx`
- Create: `components/parent/RewardMenu.tsx`
- Create: `components/parent/PendingApprovals.tsx`
- Create: `components/parent/OverdrawDialog.tsx`

- [ ] **Step 1: Write reward flow tests**

Cover reward creation, child request, parent approval, approve-for-later, denial, overdraw warning, explicit overdraw confirmation, and duplicate deduction prevention.

- [ ] **Step 2: Implement Treasure Chest**

Show rewards, coin balance, and request flow.

- [ ] **Step 3: Implement Reward Menu**

Allow parent to create, edit, disable, and view rewards.

- [ ] **Step 4: Implement Pending Approvals**

Allow quest approval/denial and reward approval/approve-for-later/denial. Use constructive denial copy.

- [ ] **Step 5: Implement Overdraw Dialog**

Use exact warning copy: "Approving this reward will reduce the coin balance below zero. Current balance: [X]. Resulting balance: [Y]. Continue?"

- [ ] **Step 6: Verify**

Run: `npm test`

Expected: PASS.

---

### Task 14: Build Settings, Auth Shell, and PWA-Friendly Polish

**Files:**
- Create: `app/auth/page.tsx`
- Create: `app/settings/page.tsx`
- Create: `components/parent/SettingsPanel.tsx`
- Create: `public/manifest.webmanifest`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Implement auth shell**

For local-first MVP, provide simple parent login/signup UI that creates or resumes the local parent session. Label Supabase credential setup clearly for future wiring.

- [ ] **Step 2: Implement settings**

Allow timezone update and Kid Mode PIN reset from parent mode.

- [ ] **Step 3: Add PWA metadata**

Add manifest, theme color, viewport-safe layout, and mobile app metadata.

- [ ] **Step 4: Polish responsive behavior**

Verify text fits buttons/cards on mobile widths, touch targets are large, and parent/kid states are visually distinct.

- [ ] **Step 5: Verify**

Run: `npm test`

Expected: PASS.

---

### Task 15: Full Verification

**Files:**
- Modify only the files implicated by verification failures, preserving the module boundaries defined in this plan.

- [ ] **Step 1: Run full automated checks**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and the app builds.

- [ ] **Step 2: Start local app**

Run: `npm run dev`

Expected: dev server starts and prints a local URL.

- [ ] **Step 3: Manual MVP walkthrough**

In the browser, verify:

- create parent/local account
- create family and child
- set Kid Mode PIN
- use starter plan
- add or edit a quest
- confirm today snapshot does not change after editing assigned quest
- switch to Kid Mode
- complete an auto-approved quest
- submit a parent-approved quest
- exit Kid Mode with PIN
- approve submitted quest
- see XP, coins, and level update
- see Screen Time unlock after Reading and Outdoor Play complete
- request Treasure Chest reward
- approve reward and see coins deducted
- approve reward with overdraw confirmation
- mark rest day
- see weekly balance chart
- confirm Kid Mode blocks parent features without PIN

- [ ] **Step 4: Final code review**

Check components remain focused, game logic stays in `lib/`, sensitive operations remain behind clear boundaries, and Supabase SQL covers requested tables/RLS/RPC.
