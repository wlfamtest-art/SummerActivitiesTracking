"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  Coins,
  Download,
  Lock,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Trophy,
} from "lucide-react";

import { createDemoRepository } from "../lib/demo/repository";
import type { SummerQuestState } from "../lib/demo/store";
import { createInitialState } from "../lib/demo/store";
import { ACTIVITY_CATEGORIES, WEEKDAYS } from "../lib/game/constants";
import { getLevelForXp, getLevelProgress } from "../lib/game/levels";
import { getTodayInTimeZone } from "../lib/dates/timezone";
import { getDateForWeekday, getWeekdayForDate, getWeekStartMonday } from "../lib/dates/weekdays";
import { calculateWeeklyBalance } from "../lib/game/balance";
import { getKidNotifications } from "../lib/demo/notifications";
import { getRewardApprovalSummary } from "../lib/demo/rewardApprovalSummary";
import { getParentReviewHistory } from "../lib/demo/reviewHistory";
import { getDeploymentReadiness } from "../lib/demo/deploymentReadiness";
import { REWARD_ICON_OPTIONS } from "../lib/demo/rewardIcons";
import { getKidVisibleRewards } from "../lib/demo/kidRewards";
import { getKidQuestFeedback } from "../lib/demo/kidQuestFeedback";
import { QUEST_ICON_OPTIONS } from "../lib/demo/questIcons";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "../lib/supabase/client";
import { approveRewardRedemption as approveSupabaseRewardRedemption } from "../lib/supabase/rewards";

type View = "dashboard" | "quests" | "rewards" | "approvals" | "planner" | "settings" | "kid";

export function SummerQuestApp() {
  const repoRef = useRef(createDemoRepository(createInitialState()));
  const [state, setState] = useState<SummerQuestState>(() => repoRef.current.getState());
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [kidMode, setKidMode] = useState(false);
  const [pinAttempt, setPinAttempt] = useState("");
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    setState(repoRef.current.load());
    setReady(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  function refresh() {
    setState(repoRef.current.getState());
  }

  function createDemo(kidPin: string) {
    const { child } = repoRef.current.onboardParent({
      familyName: "River Family",
      parentEmail: "parent@example.com",
      childName: "Mina",
      childAvatar: "🧭",
      ageBand: "younger",
      kidPin,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles",
    });
    repoRef.current.useStarterPlan(child.id);
    repoRef.current.generateDailyQuests(todayKey, getWeekdayForDate(todayKey));
    refresh();
  }

  function exitKidMode() {
    if (!repoRef.current.verifyKidModePin(pinAttempt)) {
      setPinError("Enter the 4-digit Kid Mode PIN to return to parent mode.");
      return;
    }
    setPinAttempt("");
    setPinError("");
    setKidMode(false);
    setView("dashboard");
  }

  const child = state.children[0];
  const family = state.families[0];
  const level = child ? getLevelForXp(child.total_xp) : null;
  const progress = child ? getLevelProgress(child.total_xp) : null;
  const fallbackTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const todayKey = getTodayInTimeZone(family?.time_zone ?? fallbackTimeZone);

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#e5f3f0] px-4 py-6 text-slate-950">
        <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-xl items-center justify-center rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-800">Loading Summer Quest...</p>
        </section>
      </main>
    );
  }

  if (!child || !family) {
    return <Onboarding onStart={createDemo} />;
  }

  if (kidMode || view === "kid") {
    return (
      <KidMode
        child={child}
        level={level!}
        progress={progress!}
        todayKey={todayKey}
        state={state}
        repo={repoRef.current}
        refresh={refresh}
        exitKidMode={exitKidMode}
        pinAttempt={pinAttempt}
        setPinAttempt={setPinAttempt}
        pinError={pinError}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#e5f3f0] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-700">Summer Quest</p>
              <h1 className="text-2xl font-bold">Quest Master Dashboard</h1>
            </div>
            <button
              className="min-h-11 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                setKidMode(true);
                setView("kid");
              }}
            >
              Kid Mode
            </button>
          </div>
          <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {(["dashboard", "quests", "rewards", "approvals", "planner", "settings"] as View[]).map((item) => (
              <button
                key={item}
                className={`min-h-10 rounded-md border px-2 text-sm font-semibold capitalize ${
                  view === item ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-white"
                }`}
                onClick={() => setView(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </header>

        <section className="flex-1 px-3 py-4 sm:px-4 sm:py-5">
          {view === "dashboard" && <Dashboard state={state} child={child} level={level!} progress={progress!} todayKey={todayKey} setView={setView} />}
          {view === "quests" && <QuestManager state={state} todayKey={todayKey} repo={repoRef.current} refresh={refresh} />}
          {view === "rewards" && <Rewards state={state} repo={repoRef.current} refresh={refresh} />}
          {view === "approvals" && <Approvals state={state} repo={repoRef.current} refresh={refresh} />}
          {view === "planner" && <Planner state={state} todayKey={todayKey} repo={repoRef.current} refresh={refresh} />}
          {view === "settings" && <Settings family={family} state={state} todayKey={todayKey} repo={repoRef.current} refresh={refresh} />}
        </section>
      </div>
    </main>
  );
}

function Onboarding({ onStart }: { onStart: (kidPin: string) => void }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  function handleStart() {
    if (!/^\d{4}$/.test(pin)) {
      setError("Kid Mode PIN must be exactly 4 digits.");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }

    setError("");
    onStart(pin);
  }

  return (
    <main className="min-h-screen bg-[#e5f3f0] px-4 py-6 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-xl flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-700">Summer Quest</p>
              <h1 className="mt-2 text-3xl font-bold">Set up the first adventure week</h1>
            </div>
            <Sparkles className="h-10 w-10 text-amber-500" />
          </div>
          <div className="grid gap-3">
            {["One parent account", "One adventurer profile", "Starter quests and rewards"].map((item) => (
              <div className="rounded-md border border-slate-200 p-3 text-sm font-medium" key={item}>
                {item}
              </div>
            ))}
            <div className="rounded-md border border-slate-200 p-3">
              <label className="block text-sm font-semibold">
                Kid Mode PIN
                <input
                  className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3"
                  inputMode="numeric"
                  maxLength={4}
                  type="password"
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </label>
              <label className="mt-3 block text-sm font-semibold">
                Confirm PIN
                <input
                  className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3"
                  inputMode="numeric"
                  maxLength={4}
                  type="password"
                  value={confirmPin}
                  onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </label>
              {error && <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
            </div>
          </div>
        </div>
        <button className="mt-8 min-h-12 rounded-md bg-slate-950 px-4 py-3 font-semibold text-white" onClick={handleStart}>
          Create Demo Family
        </button>
      </section>
    </main>
  );
}

function Dashboard({ state, child, level, progress, todayKey, setView }: any) {
  const todayInstances = state.quest_instances.filter((item: any) => item.quest_date === todayKey);
  const completed = todayInstances.filter((item: any) => item.status === "completed").length;
  const pendingQuestApprovals = state.quest_instances.filter((item: any) => item.status === "submitted").length;
  const pendingRewards = state.reward_redemptions.filter((item: any) => item.status === "requested").length;
  const screen = todayInstances.find((item: any) => item.name === "Screen Time");
  const balance = useWeeklyBalance(state, todayKey);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Panel>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-5xl">{child.avatar}</div>
            <h2 className="mt-2 text-2xl font-bold">{child.name}</h2>
            <p className="text-sm text-slate-600">Level {level.level}: {level.title}</p>
          </div>
          <Stat icon={<Coins />} label="Gold Coins" value={child.coin_balance} />
        </div>
        <Progress percent={progress.percent} label={`${progress.xpIntoLevel} XP toward next level`} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Stat icon={<Check />} label="Completed Today" value={`${completed}/${todayInstances.length}`} />
          <Stat icon={<ShieldCheck />} label="Pending" value={pendingQuestApprovals + pendingRewards} />
        </div>
      </Panel>
      <Panel>
        <h2 className="text-lg font-bold">Quick Actions</h2>
        <div className="mt-3 grid gap-2">
          {[
            ["Add Quest", "quests"],
            ["Rewards", "rewards"],
            ["Pending Approvals", "approvals"],
            ["Weekly Planner", "planner"],
          ].map(([label, target]) => (
            <button className="min-h-11 rounded-md border border-slate-200 bg-white px-3 font-semibold" key={label} onClick={() => setView(target)}>
              {label}
            </button>
          ))}
        </div>
      </Panel>
      <Panel>
        <h2 className="text-lg font-bold">Screen Time</h2>
        <p className="mt-2 text-sm text-slate-700">
          {screen ? "Visible as a locked or unlocked privilege on the kid map." : "No Screen Time quest today."}
        </p>
      </Panel>
      <Panel>
        <h2 className="text-lg font-bold">Weekly Balance</h2>
        <p className="mt-1 text-sm font-semibold text-emerald-800">{balance.nudge}</p>
        <div className="mt-3 grid gap-2">
          {balance.categories.map((row: any) => (
            <div key={row.category}>
              <div className="flex justify-between text-xs font-semibold">
                <span>{row.category}</span>
                <span>{row.completedMinutes}/{row.plannedMinutes} min</span>
              </div>
              <Progress percent={row.plannedMinutes ? Math.round((row.completedMinutes / row.plannedMinutes) * 100) : 0} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function QuestManager({ state, todayKey, repo, refresh }: any) {
  const blankForm = {
    id: "",
    name: "",
    icon: "✨",
    category: "Custom",
    durationMinutes: "20",
    activeDays: ["monday", "wednesday", "friday"],
    suggestedTimeWindow: "anytime",
    completionDeadline: "end of day",
    approvalMode: "auto",
    parentNote: "",
    active: true,
  };
  const [form, setForm] = useState(blankForm);
  const [notice, setNotice] = useState("");
  const editing = Boolean(form.id);

  function editQuest(quest: any) {
    setForm({
      id: quest.id,
      name: quest.name,
      icon: quest.icon,
      category: quest.category,
      durationMinutes: String(quest.duration_minutes),
      activeDays: [...quest.active_days],
      suggestedTimeWindow: quest.suggested_time_window,
      completionDeadline: quest.completion_deadline,
      approvalMode: quest.approval_mode,
      parentNote: quest.parent_note ?? "",
      active: quest.active,
    });
    setNotice("");
  }

  function resetForm() {
    setForm(blankForm);
  }

  function toggleDay(day: string) {
    const activeDays = form.activeDays.includes(day)
      ? form.activeDays.filter((entry) => entry !== day)
      : [...form.activeDays, day];
    setForm({ ...form, activeDays });
  }

  function refreshTodayQuests() {
    repo.generateDailyQuests(todayKey, getWeekdayForDate(todayKey));
  }

  function saveQuest() {
    const name = form.name.trim();
    const durationMinutes = Math.max(5, Math.round(Number(form.durationMinutes) || 0));

    if (!name || form.activeDays.length === 0) {
      setNotice("Add a quest name and at least one active day before saving.");
      return;
    }

    repo.upsertQuest({
      id: form.id || undefined,
      name,
      icon: form.icon.trim() || "✨",
      category: form.category,
      durationMinutes,
      activeDays: form.activeDays,
      suggestedTimeWindow: form.suggestedTimeWindow.trim() || "anytime",
      completionDeadline: form.completionDeadline.trim() || "end of day",
      approvalMode: form.approvalMode,
      parentNote: form.parentNote.trim() || null,
      active: form.active,
    });
    refreshTodayQuests();
    setNotice(`${name} ${editing ? "updated" : "added"}.`);
    resetForm();
    refresh();
  }

  function toggleQuest(quest: any) {
    repo.upsertQuest({ ...toQuestInput(quest), active: !quest.active });
    refreshTodayQuests();
    setNotice(`${quest.name} ${quest.active ? "hidden from" : "returned to"} future Kid Mode days.`);
    if (form.id === quest.id) {
      resetForm();
    }
    refresh();
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Quest Builder</h2>
        {editing && (
          <button className="min-h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold" onClick={resetForm}>
            New Quest
          </button>
        )}
      </div>
      {notice && (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
          {notice}
        </p>
      )}

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div>
          <p className="text-sm font-semibold">Icon</p>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-12">
            {QUEST_ICON_OPTIONS.map((icon) => {
              const selected = form.icon === icon;

              return (
                <button
                  aria-label={`Use ${icon} icon`}
                  aria-pressed={selected}
                  className={`flex aspect-square min-h-11 items-center justify-center rounded-md border text-xl transition ${
                    selected
                      ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                      : "border-slate-200 bg-white hover:border-emerald-400"
                  }`}
                  key={icon}
                  onClick={() => setForm({ ...form, icon })}
                  type="button"
                >
                  {icon}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_150px]">
          <label className="block text-sm font-semibold">
            Quest
            <input
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Read a summer book"
            />
          </label>
          <label className="block text-sm font-semibold">
            Minutes
            <input
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3"
              inputMode="numeric"
              value={form.durationMinutes}
              onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}
            />
          </label>
        </div>
        <label className="mt-3 block text-sm font-semibold">
          Custom icon
          <input
            className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-lg"
            value={form.icon}
            onChange={(event) => setForm({ ...form, icon: event.target.value })}
          />
        </label>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Category
            <select
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {ACTIVITY_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Approval
            <select
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3"
              value={form.approvalMode}
              onChange={(event) => setForm({ ...form, approvalMode: event.target.value })}
            >
              <option value="auto">Auto award</option>
              <option value="parent">Parent approval</option>
            </select>
          </label>
        </div>

        <div className="mt-3">
          <p className="text-sm font-semibold">Active days</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-7">
            {WEEKDAYS.map((day) => {
              const selected = form.activeDays.includes(day);

              return (
                <button
                  className={`min-h-10 rounded-md border px-2 text-xs font-black capitalize ${
                    selected ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-white"
                  }`}
                  key={day}
                  onClick={() => toggleDay(day)}
                  type="button"
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Best time
            <input
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3"
              value={form.suggestedTimeWindow}
              onChange={(event) => setForm({ ...form, suggestedTimeWindow: event.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold">
            Deadline
            <input
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3"
              value={form.completionDeadline}
              onChange={(event) => setForm({ ...form, completionDeadline: event.target.value })}
            />
          </label>
        </div>

        <label className="mt-3 block text-sm font-semibold">
          Parent note
          <input
            className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3"
            value={form.parentNote}
            onChange={(event) => setForm({ ...form, parentNote: event.target.value })}
            placeholder="Optional"
          />
        </label>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              checked={form.active}
              className="h-4 w-4"
              type="checkbox"
              onChange={(event) => setForm({ ...form, active: event.target.checked })}
            />
            Use on future Kid Mode days
          </label>
          <button className="min-h-11 rounded-md bg-emerald-700 px-4 font-semibold text-white" onClick={saveQuest}>
            <Plus className="inline h-4 w-4" /> {editing ? "Save Quest" : "Add Quest"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {state.assigned_quests.map((quest: any) => (
          <div
            className={`rounded-md border p-3 ${
              quest.active ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
            key={quest.id}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{quest.icon} {quest.name}</p>
                <p className="text-sm text-slate-600">
                  {quest.duration_minutes} min · {quest.xp_value} XP · {quest.coin_value} coins · {quest.approval_mode === "parent" ? "Parent approval" : "Auto award"}
                </p>
                <p className="mt-1 text-xs font-semibold capitalize text-slate-500">
                  {quest.active ? "Visible" : "Hidden"} · {quest.active_days.map((day: string) => day.slice(0, 3)).join(", ")}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button className="min-h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold" onClick={() => editQuest(quest)}>
                  Edit
                </button>
                <button className="min-h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold" onClick={() => toggleQuest(quest)}>
                  {quest.active ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function KidMode({ child, level, progress, todayKey, state, repo, refresh, exitKidMode, pinAttempt, setPinAttempt, pinError }: any) {
  const [questFeedback, setQuestFeedback] = useState<any>(null);
  const restDay = state.rest_days.find((item: any) => item.date === todayKey);
  const instances = restDay ? [] : state.quest_instances.filter((item: any) => item.quest_date === todayKey);
  const notifications = getKidNotifications({
    questInstances: state.quest_instances,
    rewards: state.rewards.map((reward: any) => ({ id: reward.id, name: reward.name })),
    redemptions: state.reward_redemptions,
    limit: 4,
  });

  function finish(instance: any) {
    repo.startQuest(instance.id);
    const result = repo.completeQuest(instance.id);
    setQuestFeedback(
      getKidQuestFeedback({
        name: instance.name,
        icon: instance.icon,
        status: result.instance.status,
        approvalMode: instance.approval_mode,
        xpValue: instance.xp_value,
        coinValue: instance.coin_value,
      }),
    );
    refresh();
  }

  return (
    <main className="min-h-screen bg-[#fff7d6] px-4 py-5 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-lg border border-amber-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-5xl">{child.avatar}</div>
              <h1 className="mt-2 text-2xl font-black">Quest Map</h1>
              <p className="text-sm font-semibold">Level {level.level}: {level.title}</p>
            </div>
            <Stat icon={<Coins />} label="Coins" value={child.coin_balance} />
          </div>
          <Progress percent={progress.percent} />
        </section>
        {questFeedback && (
          <section
            className={`mt-4 rounded-lg border p-4 ${
              questFeedback.tone === "review"
                ? "border-sky-200 bg-sky-50 text-sky-950"
                : "border-emerald-200 bg-emerald-50 text-emerald-950"
            }`}
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">{questFeedback.icon}</div>
              <div>
                <h2 className="text-lg font-black">{questFeedback.title}</h2>
                <p className="mt-1 text-sm font-semibold">{questFeedback.message}</p>
              </div>
            </div>
          </section>
        )}
        {restDay && (
          <section className="mt-4 rounded-lg border border-amber-200 bg-white p-5 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-amber-600" />
            <h2 className="mt-2 text-xl font-black">No quests today</h2>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              No quests today — adventure resumes tomorrow.
            </p>
          </section>
        )}
        <div className="mt-4 grid gap-3">
          {instances.map((instance: any) => {
            const quest = state.assigned_quests.find((item: any) => item.id === instance.assigned_quest_id);
            const unlock = repo.getUnlockStateForQuest(instance.assigned_quest_id, todayKey);
            const locked = !unlock.unlocked;
            return (
              <section className="rounded-lg border border-amber-200 bg-white p-4" key={instance.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black">{instance.icon} {instance.name}</h2>
                    <p className="text-sm text-slate-700">{instance.duration_minutes} min · {instance.xp_value ? `${instance.xp_value} XP · ${instance.coin_value} coins` : "Unlocked privilege"}</p>
                    <p className="mt-1 text-sm font-semibold capitalize">{instance.status.replace("_", " ")}</p>
                    {locked && <p className="mt-2 text-sm text-slate-600"><Lock className="inline h-4 w-4" /> {unlock.lockedMessage}</p>}
                    {instance.name === "Screen Time" && !locked && (
                      <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-950">
                        Screen Time is unlocked for today.
                      </p>
                    )}
                    {instance.status === "denied" && <p className="mt-2 text-sm">Your parent wants you to try this one again. Check with them if you have questions!</p>}
                    {quest?.suggested_time_window && <p className="mt-1 text-xs text-slate-500">Best time: {quest.suggested_time_window}</p>}
                  </div>
                  {!locked && instance.status !== "completed" && instance.status !== "submitted" && (
                    <button className="min-h-11 rounded-md bg-amber-500 px-3 font-bold" onClick={() => finish(instance)}>
                      <Timer className="inline h-4 w-4" /> Finish
                    </button>
                  )}
                  {instance.status === "denied" && (
                    <button className="min-h-11 rounded-md bg-amber-500 px-3 font-bold" onClick={() => { repo.retryQuest(instance.id); refresh(); }}>
                      Try Again
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
        <section className="mt-4 rounded-lg border border-amber-200 bg-white p-4">
          <h2 className="text-lg font-black"><Star className="inline h-5 w-5 text-amber-600" /> Updates</h2>
          <div className="mt-3 grid gap-2">
            {notifications.length === 0 && (
              <p className="text-sm font-semibold text-slate-600">Approvals and Treasure Chest updates will show here.</p>
            )}
            {notifications.map((notification) => (
              <div
                className={`rounded-md border p-3 text-sm ${
                  notification.kind === "denial"
                    ? "border-amber-300 bg-amber-50"
                    : "border-emerald-200 bg-emerald-50"
                }`}
                key={notification.id}
              >
                <p className="font-black">{notification.title}</p>
                <p className="mt-1 font-semibold text-slate-700">{notification.message}</p>
              </div>
            ))}
          </div>
        </section>
        <TreasureChest state={state} repo={repo} refresh={refresh} />
        <section className="mt-4 rounded-lg border border-amber-200 bg-white p-4">
          <h2 className="font-bold">Exit Kid Mode</h2>
          <div className="mt-2 flex gap-2">
            <input className="min-h-11 flex-1 rounded-md border border-slate-300 px-3" value={pinAttempt} onChange={(event) => setPinAttempt(event.target.value)} placeholder="PIN" inputMode="numeric" />
            <button className="min-h-11 rounded-md bg-slate-950 px-4 font-semibold text-white" onClick={exitKidMode}>Exit</button>
          </div>
          {pinError && <p className="mt-2 text-sm font-semibold text-red-700">{pinError}</p>}
        </section>
      </div>
    </main>
  );
}

function TreasureChest({ state, repo, refresh }: any) {
  const [message, setMessage] = useState("");
  const child = state.children[0];
  const coinBalance = child?.coin_balance ?? 0;
  const visibleRewards = getKidVisibleRewards(state.rewards);

  return (
    <section className="mt-4 rounded-lg border border-amber-200 bg-white p-4">
      <h2 className="text-lg font-black"><Trophy className="inline h-5 w-5" /> Treasure Chest</h2>
      {message && (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-950" aria-live="polite">
          {message}
        </p>
      )}
      <div className="mt-3 grid gap-2">
        {visibleRewards.map((reward: any) => {
          const pending = state.reward_redemptions.some(
            (redemption: any) =>
              redemption.child_id === child?.id && redemption.reward_id === reward.id && redemption.status === "requested",
          );
          const coinsNeeded = Math.max(0, reward.coin_cost - coinBalance);
          const disabled = pending || coinsNeeded > 0;
          const actionLabel = pending ? "Requested" : coinsNeeded > 0 ? `Need ${coinsNeeded} more` : "Request";

          return (
            <button
              className={`min-h-14 rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${
                disabled
                  ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                  : "border-amber-200 bg-white text-slate-950 hover:border-amber-400 hover:bg-amber-50"
              }`}
              disabled={disabled}
              key={reward.id}
              onClick={() => {
                try {
                  repo.requestReward(reward.id);
                  setMessage(`${reward.name} requested. Ask your parent to review it.`);
                  refresh();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Reward request did not go through.");
                  refresh();
                }
              }}
            >
              <span className="flex items-center justify-between gap-3">
                <span>{reward.icon} {reward.name}</span>
                <span className="shrink-0 text-xs font-black uppercase tracking-normal">{actionLabel}</span>
              </span>
              <span className="mt-1 block text-xs font-semibold text-slate-500">{reward.coin_cost} Gold Coins</span>
            </button>
          );
        })}
        {visibleRewards.length === 0 && (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-600">
            No rewards are available right now.
          </p>
        )}
      </div>
    </section>
  );
}

function Rewards({ state, repo, refresh }: any) {
  const blankForm = {
    id: "",
    name: "",
    icon: "🎟️",
    coinCost: "25",
    description: "",
    active: true,
  };
  const [form, setForm] = useState(blankForm);
  const [notice, setNotice] = useState("");
  const editing = Boolean(form.id);

  function editReward(reward: any) {
    setForm({
      id: reward.id,
      name: reward.name,
      icon: reward.icon,
      coinCost: String(reward.coin_cost),
      description: reward.description,
      active: reward.active,
    });
    setNotice("");
  }

  function resetForm() {
    setForm(blankForm);
  }

  function saveReward() {
    const coinCost = Math.max(1, Math.round(Number(form.coinCost) || 0));
    const name = form.name.trim();
    const description = form.description.trim();

    if (!name || !description) {
      setNotice("Add a reward name and description before saving.");
      return;
    }

    if (editing) {
      repo.updateReward({
        id: form.id,
        name,
        icon: form.icon.trim() || "🎟️",
        coinCost,
        description,
        active: form.active,
      });
      setNotice(`${name} updated.`);
    } else {
      repo.createReward({
        name,
        icon: form.icon.trim() || "🎟️",
        coinCost,
        description,
      });
      setNotice(`${name} added to the reward menu.`);
    }

    resetForm();
    refresh();
  }

  function toggleReward(reward: any) {
    repo.updateReward({
      id: reward.id,
      name: reward.name,
      icon: reward.icon,
      coinCost: reward.coin_cost,
      description: reward.description,
      active: !reward.active,
    });
    setNotice(`${reward.name} ${reward.active ? "hidden from" : "returned to"} Kid Mode.`);
    if (form.id === reward.id) {
      resetForm();
    }
    refresh();
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Reward Menu</h2>
        {editing && (
          <button className="min-h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold" onClick={resetForm}>
            New Reward
          </button>
        )}
      </div>
      {notice && (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
          {notice}
        </p>
      )}

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div>
          <p className="text-sm font-semibold">Icon</p>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-12">
            {REWARD_ICON_OPTIONS.map((icon) => {
              const selected = form.icon === icon;

              return (
                <button
                  aria-label={`Use ${icon} icon`}
                  aria-pressed={selected}
                  className={`flex aspect-square min-h-11 items-center justify-center rounded-md border text-xl transition ${
                    selected
                      ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                      : "border-slate-200 bg-white hover:border-emerald-400"
                  }`}
                  key={icon}
                  onClick={() => setForm({ ...form, icon })}
                  type="button"
                >
                  {icon}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px]">
          <label className="block text-sm font-semibold">
            Reward
            <input
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Pick family movie"
            />
          </label>
          <label className="block text-sm font-semibold">
            Coins
            <input
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3"
              inputMode="numeric"
              value={form.coinCost}
              onChange={(event) => setForm({ ...form, coinCost: event.target.value })}
            />
          </label>
        </div>
        <label className="mt-3 block text-sm font-semibold">
          Custom icon
          <input
            className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-lg"
            value={form.icon}
            onChange={(event) => setForm({ ...form, icon: event.target.value })}
          />
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Description
          <input
            className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Choose the next family movie."
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              checked={form.active}
              className="h-4 w-4"
              type="checkbox"
              onChange={(event) => setForm({ ...form, active: event.target.checked })}
            />
            Visible in Kid Mode
          </label>
          <button className="min-h-11 rounded-md bg-emerald-700 px-4 font-semibold text-white" onClick={saveReward}>
            {editing ? "Save Reward" : "Add Reward"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {state.rewards.map((reward: any) => (
          <div
            className={`rounded-md border p-3 ${
              reward.active ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
            key={reward.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  <span className="mr-1">{reward.icon}</span>
                  <b>{reward.name}</b>
                </p>
                <p className="mt-1 text-sm text-slate-600">{reward.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black">{reward.coin_cost} coins</p>
                <p className="text-xs font-semibold uppercase tracking-normal">{reward.active ? "Visible" : "Hidden"}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="min-h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold" onClick={() => editReward(reward)}>
                Edit
              </button>
              <button className="min-h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold" onClick={() => toggleReward(reward)}>
                {reward.active ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Approvals({ state, repo, refresh }: any) {
  const [notice, setNotice] = useState("");
  const [overdraw, setOverdraw] = useState<any>(null);
  const submitted = state.quest_instances.filter((item: any) => item.status === "submitted");
  const rewards = state.reward_redemptions.filter((item: any) => item.status === "requested");
  const child = state.children[0];
  const history = getParentReviewHistory({
    questInstances: state.quest_instances,
    rewards: state.rewards.map((reward: any) => ({ id: reward.id, name: reward.name })),
    redemptions: state.reward_redemptions,
    limit: 6,
  });

  function approveQuest(item: any) {
    repo.approveQuest(item.id);
    setNotice(`${item.name} approved. XP and Gold Coins were awarded.`);
    refresh();
  }

  function denyQuest(item: any) {
    repo.denyQuest(item.id, "Try again.");
    setNotice(`${item.name} was sent back for another try.`);
    refresh();
  }

  async function resolveReward(redemption: any, targetStatus: "approved" | "approved_for_later" | "denied", allowOverdraw = false) {
    const reward = state.rewards.find((item: any) => item.id === redemption.reward_id);
    const deductsCoins = targetStatus === "approved" || targetStatus === "approved_for_later";
    const resultingBalance = child.coin_balance - redemption.cost;

    if (deductsCoins && resultingBalance < 0 && !allowOverdraw) {
      setOverdraw({ redemption, reward, targetStatus, resultingBalance });
      setNotice("");
      return;
    }

    try {
      if (deductsCoins && isSupabaseConfigured()) {
        const supabase = createBrowserSupabaseClient();
        await approveSupabaseRewardRedemption(supabase, redemption.id, targetStatus, allowOverdraw);
      }

      repo.approveReward(redemption.id, targetStatus, allowOverdraw);
      setOverdraw(null);
      setNotice(
        targetStatus === "denied"
          ? `${reward?.name ?? "Reward"} was denied. No coins were deducted.`
          : `${reward?.name ?? "Reward"} approved. New coin balance: ${resultingBalance}.`,
      );
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Reward approval failed.";
      if (deductsCoins && message.toLowerCase().includes("reduce the coin balance below zero") && !allowOverdraw) {
        setOverdraw({ redemption, reward, targetStatus, resultingBalance });
        setNotice("");
        return;
      }

      setOverdraw(null);
      setNotice(message);
    }
  }

  return (
    <Panel>
      <h2 className="text-xl font-bold">Pending Approvals</h2>
      {notice && (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
          {notice}
        </div>
      )}
      {overdraw && (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-950">
            Approving this reward will reduce the coin balance below zero. Current balance: {child.coin_balance}. Resulting balance: {overdraw.resultingBalance}. Continue?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              className="min-h-10 rounded-md bg-amber-600 px-3 text-sm font-semibold text-white"
              onClick={() => resolveReward(overdraw.redemption, overdraw.targetStatus, true)}
            >
              Continue
            </button>
            <button className="min-h-10 rounded-md border border-amber-300 px-3 text-sm font-semibold" onClick={() => setOverdraw(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="mt-4 grid gap-3">
        {submitted.map((item: any) => (
          <div className="rounded-md border border-slate-200 p-3" key={item.id}>
            <b>{item.name}</b>
            <div className="mt-2 flex gap-2">
              <button className="min-h-10 rounded-md bg-emerald-700 px-3 font-semibold text-white" onClick={() => approveQuest(item)}>Approve</button>
              <button className="min-h-10 rounded-md border border-slate-200 px-3 font-semibold" onClick={() => denyQuest(item)}>Deny</button>
            </div>
          </div>
        ))}
        {rewards.map((redemption: any) => {
          const reward = state.rewards.find((item: any) => item.id === redemption.reward_id);
          const summary = getRewardApprovalSummary({
            coinBalance: child.coin_balance,
            rewardCost: redemption.cost,
          });
          return (
            <div className="rounded-md border border-slate-200 p-3" key={redemption.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-normal text-amber-700">Reward request</p>
                  <b className="mt-1 block text-base">{reward?.name}</b>
                </div>
                <span className="rounded-md bg-amber-100 px-3 py-1 text-sm font-black text-amber-900">
                  {summary.rewardCost} coins
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-slate-50 px-2 py-2">
                  <p className="text-[11px] font-black uppercase tracking-normal text-slate-500">Current</p>
                  <p className="text-lg font-black">{summary.coinBalance}</p>
                </div>
                <div className="rounded-md bg-slate-50 px-2 py-2">
                  <p className="text-[11px] font-black uppercase tracking-normal text-slate-500">Cost</p>
                  <p className="text-lg font-black">-{summary.rewardCost}</p>
                </div>
                <div
                  className={`rounded-md px-2 py-2 ${
                    summary.willOverdraw ? "bg-amber-50 text-amber-950" : "bg-emerald-50 text-emerald-950"
                  }`}
                >
                  <p className="text-[11px] font-black uppercase tracking-normal">After</p>
                  <p className="text-lg font-black">{summary.projectedBalance}</p>
                </div>
              </div>
              {summary.willOverdraw && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950">
                  This would make the coin balance negative.
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="min-h-10 rounded-md bg-emerald-700 px-3 font-semibold text-white" onClick={() => resolveReward(redemption, "approved")}>Approve</button>
                <button className="min-h-10 rounded-md border border-slate-200 px-3 font-semibold" onClick={() => resolveReward(redemption, "approved_for_later")}>Later</button>
                <button className="min-h-10 rounded-md border border-slate-200 px-3 font-semibold" onClick={() => resolveReward(redemption, "denied")}>Deny</button>
              </div>
            </div>
          );
        })}
        {submitted.length + rewards.length === 0 && <p className="text-sm text-slate-600">Nothing waiting right now.</p>}
      </div>
      <div className="mt-6 border-t border-slate-200 pt-5">
        <h3 className="text-lg font-bold">Review History</h3>
        <div className="mt-3 grid gap-2">
          {history.length === 0 && <p className="text-sm text-slate-600">Approved and denied items will show here.</p>}
          {history.map((item) => (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-normal text-slate-500">
                    {item.kind === "quest" ? "Quest" : "Reward"} · {item.outcome.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 font-bold">{item.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{item.detail}</p>
                </div>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-slate-600">
                  {new Date(item.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function Planner({ state, todayKey, repo, refresh }: any) {
  const balance = useWeeklyBalance(state, todayKey);
  const weekStart = getWeekStartMonday(todayKey);
  const [notice, setNotice] = useState("");

  function resetToday() {
    repo.resetDemoDay(todayKey, getWeekdayForDate(todayKey));
    setNotice("Today reset. Quests are ready to test again.");
    refresh();
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Weekly Planner</h2>
        <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold" onClick={resetToday}>
          <RotateCcw className="h-4 w-4" />
          Reset Today
        </button>
      </div>
      <p className="mt-2 text-sm font-semibold text-emerald-800">{balance.nudge}</p>
      {notice && (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-950" aria-live="polite">
          {notice}
        </p>
      )}
      <div className="mt-4 grid gap-2">
        {WEEKDAYS.map((day) => {
          const date = getDateForWeekday(weekStart, day);
          const restDay = state.rest_days.find((entry: any) => entry.date === date);
          const plannedCount = state.assigned_quests.filter((quest: any) => quest.active && quest.active_days.includes(day)).length;

          return (
            <div className="rounded-md border border-slate-200 p-3" key={day}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold capitalize">{day}</p>
                  <p className="text-sm text-slate-600">
                    {date} · {restDay ? "Rest day" : `${plannedCount} planned`}
                  </p>
                </div>
                <button
                  className={`min-h-10 rounded-md px-3 text-sm font-semibold ${
                    restDay ? "border border-slate-200 bg-white" : "bg-slate-950 text-white"
                  }`}
                  onClick={() => {
                    if (restDay) {
                      repo.clearRestDay(date);
                    } else {
                      repo.markRestDay(date, "rest_day", "Rest day");
                    }
                    refresh();
                  }}
                >
                  {restDay ? "Clear Rest" : "Mark Rest"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Settings({ family, state, todayKey, repo, refresh }: any) {
  const [timeZone, setTimeZone] = useState(family.time_zone);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const dataSummary = [
    ["Quests", state.assigned_quests.length],
    ["Rewards", state.rewards.length],
    ["Quest logs", state.quest_instances.length],
    ["Reward requests", state.reward_redemptions.length],
  ];
  const readinessChecks = getDeploymentReadiness({
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasDemoData: state.children.length > 0,
  });

  function saveSettings() {
    repo.updateTimeZone(timeZone.trim() || family.time_zone);
    const wantsPinChange = newPin.trim().length > 0 || confirmNewPin.trim().length > 0;

    if (wantsPinChange) {
      if (!/^\d{4}$/.test(currentPin.trim())) {
        setNotice("Enter your current 4-digit Kid Mode PIN to make changes.");
        return;
      }

      if (!repo.verifyKidModePin(currentPin.trim())) {
        setNotice("Current PIN is incorrect.");
        return;
      }

      if (!/^\d{4}$/.test(newPin.trim())) {
        setNotice("New Kid Mode PIN needs exactly 4 digits.");
        return;
      }

      if (newPin.trim() !== confirmNewPin.trim()) {
        setNotice("New PIN and confirmation do not match.");
        return;
      }

      repo.resetKidModePin(newPin.trim());
      setCurrentPin("");
      setNewPin("");
      setConfirmNewPin("");
    }

    setConfirmReset(false);
    setNotice("Settings saved.");
    refresh();
  }

  function exportDemoData() {
    const exported = repo.exportState();
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `summer-quest-demo-${todayKey}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setConfirmReset(false);
    setNotice("Demo data export downloaded.");
  }

  function resetDemoData() {
    if (!confirmReset) {
      setConfirmReset(true);
      setNotice("Tap Reset Demo Data again to clear this browser's demo family.");
      return;
    }

    repo.resetLocalState();
    refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
      <Panel>
        <h2 className="text-xl font-bold">Settings</h2>
        <label className="mt-4 block text-sm font-semibold">Family timezone</label>
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3"
          value={timeZone}
          onChange={(event) => setTimeZone(event.target.value)}
        />
        <label className="mt-4 block text-sm font-semibold">Current Kid Mode PIN</label>
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3"
          inputMode="numeric"
          maxLength={4}
          type="password"
          value={currentPin}
          onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        <label className="mt-4 block text-sm font-semibold">New Kid Mode PIN</label>
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3"
          inputMode="numeric"
          maxLength={4}
          type="password"
          value={newPin}
          onChange={(event) => setNewPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        <label className="mt-4 block text-sm font-semibold">Confirm New PIN</label>
        <input
          className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3"
          inputMode="numeric"
          maxLength={4}
          type="password"
          value={confirmNewPin}
          onChange={(event) => setConfirmNewPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        <button
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 font-semibold text-white"
          onClick={saveSettings}
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        {notice && (
          <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-950" aria-live="polite">
            {notice}
          </p>
        )}

        <div className="mt-6 border-t border-slate-200 pt-5">
          <h3 className="font-bold">Local demo data</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {dataSummary.map(([label, value]) => (
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm" key={label}>
                <span className="font-semibold text-slate-600">{label}</span>
                <span className="font-black">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 font-semibold"
              onClick={exportDemoData}
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
            <button
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 font-semibold ${
                confirmReset ? "bg-red-700 text-white" : "border border-red-200 bg-white text-red-700"
              }`}
              onClick={resetDemoData}
            >
              <RotateCcw className="h-4 w-4" />
              Reset Demo Data
            </button>
          </div>
        </div>
      </Panel>

      <Panel>
        <h2 className="text-xl font-bold">Deployment Readiness</h2>
        <div className="mt-4 grid gap-3">
          {readinessChecks.map((check) => (
            <div className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0" key={check.label}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold">{check.label}</h3>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-black ${
                    check.status === "Needed" ? "bg-amber-100 text-amber-900" : check.status === "Optional" ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-900"
                  }`}
                >
                  {check.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{check.detail}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function useWeeklyBalance(state: SummerQuestState, todayKey: string) {
  return useMemo(() => {
    const weekStart = getWeekStartMonday(todayKey);
    return calculateWeeklyBalance({
      assignedQuests: state.assigned_quests,
      completedQuestInstances: state.quest_instances,
      restDays: state.rest_days.map((day) => day.date),
      excusedDateKeys: [],
      weekStartDate: weekStart,
    });
  }, [state, todayKey]);
}

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">{children}</section>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 text-emerald-700">{icon}<span className="text-xs font-semibold uppercase">{label}</span></div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}

function Progress({ percent, label }: { percent: number; label?: string }) {
  return (
    <div className="mt-3">
      {label && <div className="mb-1 text-xs font-semibold text-slate-600">{label}</div>}
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
    </div>
  );
}

function toQuestInput(quest: any) {
  return {
    id: quest.id,
    name: quest.name,
    icon: quest.icon,
    category: quest.category,
    durationMinutes: quest.duration_minutes,
    activeDays: quest.active_days,
    suggestedTimeWindow: quest.suggested_time_window,
    completionDeadline: quest.completion_deadline,
    approvalMode: quest.approval_mode,
    unlockMode: quest.unlock_mode,
    prerequisiteQuestIds: quest.prerequisite_quest_ids,
    parentNote: quest.parent_note,
    active: quest.active,
  };
}
