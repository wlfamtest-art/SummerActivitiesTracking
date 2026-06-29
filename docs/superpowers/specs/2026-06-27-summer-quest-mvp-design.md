# Summer Quest MVP Design

## Goal

Build Summer Quest as a local-first, Supabase-ready Next.js MVP. The app must run locally without Supabase credentials while preserving the architecture needed for Supabase Auth, PostgreSQL, RLS, and RPC wiring later.

The first complete loop is:

Parent creates one child profile, uses starter quests and rewards, assigns or edits quests, switches to Kid Mode, child completes quests, XP and Gold Coins are awarded once, Screen Time unlocks, child requests a reward, parent approves it, coins are deducted once, parent marks rest days, and the weekly balance chart updates.

## Chosen Approach

Use a local demo data layer for the runnable MVP and keep all product rules in pure helper modules. Supabase schema migrations, client wrappers, and server-operation boundaries will be included so replacing the local store with real Supabase calls is straightforward.

This avoids blocking the MVP on remote credentials while still proving the core product and data model.

## Architecture

The app will use:

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Local browser-backed demo persistence for the runnable MVP
- Supabase-ready clients under `lib/supabase`
- SQL migrations under `supabase/migrations`
- Pure domain logic under `lib/game`, `lib/dates`, `lib/data`, and `lib/analytics`

Key folders:

```txt
app/
  auth/
  dashboard/
  kid/
  onboarding/
  quests/
  rewards/
  settings/
components/
  kid/
  parent/
  shared/
lib/
  analytics/
  data/
  dates/
  demo/
  game/
  supabase/
supabase/
  migrations/
tests/
```

## Product Surface

The first screen will be the working app, not a landing page. If no local family exists, the user starts in onboarding. If a local family exists, the user lands on the parent dashboard.

Parent screens:

- Onboarding for family, child, avatar, age band, and Kid Mode PIN
- Starter setup with starter plan creation
- Dashboard with child level, XP, coins, quest counts, approvals, reward requests, and quick actions
- Quest wizard and edit flow
- Reward menu
- Pending approvals
- Weekly planner, rest days, and balance chart
- Settings for timezone and PIN reset

Kid screens:

- Kid quest map grouped by available, locked, submitted, completed, and denied quests
- Quest detail and timer
- Completion and submitted states
- Treasure Chest and reward requests
- Level profile
- PIN-gated exit from Kid Mode

## Data Flow

The local demo store will expose repository-style functions that mirror future server operations:

- create family and child
- set and verify Kid Mode PIN
- create starter quests and rewards
- create and edit assigned quests
- generate daily quest instances from assigned quest snapshots
- start, pause, complete, submit, approve, deny, and retry quests
- award XP and coins idempotently
- request and approve rewards
- deduct reward coins idempotently
- mark and remove rest days
- calculate weekly balance and streaks

Server-sensitive operations will be shaped as functions that can later move behind Next.js server actions or Supabase RPC:

- PIN verification
- quest approval and reward awarding
- reward approval with overdraw confirmation
- manual coin adjustments

## Game Logic

The following logic lives outside React components:

- XP and coin calculation
- level calculation through Level 20
- unlock validation and unlock state
- daily quest generation and snapshot rules
- quest completion transaction idempotency
- reward approval and duplicate deduction prevention
- overdraw warning calculation
- timezone and weekday helpers
- streak calculation
- weekly balance calculation

Static game data lives in `lib/game/constants.ts`, including the full Level 1-20 table, preset activity templates, starter quests, starter rewards, rest day types, categories, and weekdays.

## Supabase Design

The MVP includes a migration with the requested tables:

- `families`
- `users`
- `children`
- `activity_templates`
- `assigned_quests`
- `quest_instances`
- `rewards`
- `reward_redemptions`
- `xp_transactions`
- `coin_transactions`
- `rest_days`

RLS policies will restrict access by the authenticated parent user's family. Kid Mode remains a UI restriction within the parent session and does not bypass RLS.

The migration will include an `approve_reward_redemption` RPC shaped around the requested atomic rules: load current balance, validate requested status, reject overdraw unless explicitly allowed, update child balance, insert one coin transaction, and update redemption status.

For local-first mode, the RPC behavior will also be represented by a pure or repository-level function and covered by tests.

## PIN Handling

In the local MVP, the PIN will be handled through an isolated helper that hashes and verifies the PIN using a dependency appropriate for the local app. The helper boundary will make it clear that production PIN verification belongs server-side and that plaintext PINs must never be persisted.

The browser UI will never render or expose the stored hash.

## UI Direction

Parent UI should feel calm, compact, and dashboard-like. It should prioritize quick status scanning and obvious actions.

Kid UI should feel playful but clear, with large touch targets, visible quest states, simple copy, emoji/icon support, and a small celebration when a quest completes.

The layout is mobile-first and PWA-friendly. Desktop can expand into wider dashboard columns, but mobile usability is the primary acceptance target.

## Error Handling

The UI will show clear states for:

- missing onboarding steps
- invalid PIN
- circular or impossible unlock rules
- quest already awarded
- reward already deducted
- overdraw confirmation
- rest day suppressing quest generation
- missing Supabase environment variables when trying to use Supabase clients

Deadline guidance will be displayed but not enforced.

## Testing

Use unit tests for the core logic first:

- XP and coin calculation
- level calculation including Level 20
- weekday validation and week start
- unlock validation and state calculation
- daily quest generation and snapshot behavior
- assigned quest edits not mutating existing instances
- quest completion idempotency
- reward approval and duplicate deduction prevention
- overdraw warning logic
- rest day suppression
- streak calculation
- timezone date helpers
- weekly balance calculation

Add lightweight integration-style tests for the local repository flow once the core helpers exist.

## Implementation Notes

The MVP will favor clear working flows over polish. Components should stay focused on rendering and user interaction. Game economy, scheduling, unlocks, streaks, dates, and reward deduction rules must stay in `lib/`.

The local store is a bridge, not the product's long-term data model. Its shape should match the Supabase tables closely enough that swapping in real database calls later is not a rewrite.

## Out of Scope

The build will not include native apps, payments, AI, social features, push notifications, camera proof, location tracking, gift cards, multiple children, multiple parents, subscriptions, PDF export, or advanced analytics.
