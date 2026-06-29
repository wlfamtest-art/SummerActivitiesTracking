import { describe, expect, it } from "vitest";

import {
  generateDailyQuestInstances,
  type DailyAssignedQuest,
  type DailyQuestInstance,
} from "../../lib/data/daily-quests";

function assignedQuest(overrides: Partial<DailyAssignedQuest> & Pick<DailyAssignedQuest, "id" | "name">): DailyAssignedQuest {
  return {
    id: overrides.id,
    child_id: "child-1",
    name: overrides.name,
    icon: "book",
    category: "Learning",
    duration_minutes: 30,
    active_days: ["monday", "tuesday"],
    suggested_time_window: "morning",
    completion_deadline: "before lunch",
    approval_mode: "auto",
    xp_value: 45,
    coin_value: 9,
    unlock_mode: "always",
    prerequisite_quest_ids: [],
    parent_note: null,
    active: true,
    ...overrides,
  };
}

function existingInstance(overrides: Partial<DailyQuestInstance>): DailyQuestInstance {
  return {
    id: "instance-existing",
    assigned_quest_id: "reading",
    child_id: "child-1",
    quest_date: "2026-06-29",
    name: "Existing Reading",
    icon: "book",
    category: "Learning",
    duration_minutes: 20,
    xp_value: 30,
    coin_value: 6,
    approval_mode: "auto",
    suggested_time_window: "morning",
    completion_deadline: "before lunch",
    parent_note: "old note",
    status: "completed",
    elapsed_seconds: 1200,
    started_at: null,
    submitted_at: null,
    completed_at: "2026-06-29T12:00:00.000Z",
    denied_at: null,
    created_at: "2026-06-29T08:00:00.000Z",
    updated_at: "2026-06-29T12:00:00.000Z",
    ...overrides,
  };
}

describe("generateDailyQuestInstances", () => {
  it("returns existing instances and creates nothing on a rest day", () => {
    const existing = [existingInstance({})];

    const result = generateDailyQuestInstances({
      assignedQuests: [assignedQuest({ id: "reading", name: "Reading" })],
      existingInstances: existing,
      restDay: { type: "rest_day", message: "Rest day" },
      dateKey: "2026-06-29",
      weekday: "monday",
    });

    expect(result.instances).toBe(existing);
    expect(result.createdInstances).toEqual([]);
    expect(result.restDay).toEqual({ active: true, message: "Rest day" });
  });

  it("does not duplicate or mutate instances that already exist for the date", () => {
    const existing = [existingInstance({ name: "Original Reading" })];
    const before = structuredClone(existing);

    const result = generateDailyQuestInstances({
      assignedQuests: [
        assignedQuest({ id: "reading", name: "Edited Reading", duration_minutes: 60 }),
      ],
      existingInstances: existing,
      dateKey: "2026-06-29",
      weekday: "monday",
    });

    expect(result.instances).toEqual(before);
    expect(result.instances[0]).toBe(existing[0]);
    expect(result.createdInstances).toEqual([]);
  });

  it("keeps existing same-date snapshots and creates missing active quest instances", () => {
    const existingReading = existingInstance({
      id: "reading-existing",
      assigned_quest_id: "reading",
      quest_date: "2026-06-29",
      name: "Original Reading",
      status: "completed",
    });
    const existing = [existingReading];
    const before = structuredClone(existing);

    const result = generateDailyQuestInstances({
      assignedQuests: [
        assignedQuest({ id: "reading", name: "Edited Reading", duration_minutes: 60 }),
        assignedQuest({
          id: "outdoor",
          name: "Outdoor Play",
          icon: "run",
          category: "Physical",
        }),
      ],
      existingInstances: existing,
      dateKey: "2026-06-29",
      weekday: "monday",
      now: "2026-06-29T07:00:00.000Z",
    });

    expect(existing).toEqual(before);
    expect(result.instances[0]).toBe(existingReading);
    expect(result.instances).toEqual([
      existingReading,
      expect.objectContaining({
        id: "outdoor-2026-06-29",
        assigned_quest_id: "outdoor",
        quest_date: "2026-06-29",
        name: "Outdoor Play",
        status: "not_started",
        created_at: "2026-06-29T07:00:00.000Z",
        updated_at: "2026-06-29T07:00:00.000Z",
      }),
    ]);
    expect(result.createdInstances).toEqual([result.instances[1]]);
  });

  it("creates one snapshot per active assigned quest for the weekday", () => {
    const reading = assignedQuest({
      id: "reading",
      name: "Reading",
      parent_note: "Read together if helpful.",
    });
    const outdoor = assignedQuest({
      id: "outdoor",
      name: "Outdoor Play",
      icon: "run",
      category: "Physical",
      active_days: ["wednesday"],
    });
    const inactive = assignedQuest({
      id: "inactive",
      name: "Inactive Quest",
      active: false,
    });

    const result = generateDailyQuestInstances({
      assignedQuests: [reading, outdoor, inactive],
      existingInstances: [],
      dateKey: "2026-06-29",
      weekday: "monday",
      now: "2026-06-29T07:00:00.000Z",
    });

    expect(result.createdInstances).toHaveLength(1);
    expect(result.instances).toEqual([
      expect.objectContaining({
        id: "reading-2026-06-29",
        assigned_quest_id: "reading",
        child_id: "child-1",
        quest_date: "2026-06-29",
        name: "Reading",
        icon: "book",
        category: "Learning",
        duration_minutes: 30,
        xp_value: 45,
        coin_value: 9,
        approval_mode: "auto",
        suggested_time_window: "morning",
        completion_deadline: "before lunch",
        parent_note: "Read together if helpful.",
        status: "not_started",
        elapsed_seconds: 0,
        created_at: "2026-06-29T07:00:00.000Z",
        updated_at: "2026-06-29T07:00:00.000Z",
      }),
    ]);
  });

  it("keeps existing snapshots unchanged after assigned quest edits", () => {
    const existing = existingInstance({
      assigned_quest_id: "reading",
      quest_date: "2026-06-29",
      name: "Reading",
      duration_minutes: 30,
      xp_value: 45,
    });

    const result = generateDailyQuestInstances({
      assignedQuests: [
        assignedQuest({
          id: "reading",
          name: "Reading Edited",
          duration_minutes: 60,
          xp_value: 90,
        }),
      ],
      existingInstances: [existing],
      dateKey: "2026-06-29",
      weekday: "monday",
    });

    expect(result.instances[0]).toMatchObject({
      name: "Reading",
      duration_minutes: 30,
      xp_value: 45,
    });
  });

  it("keeps generated instances unique by assigned quest and date", () => {
    const reading = assignedQuest({ id: "reading", name: "Reading" });

    const result = generateDailyQuestInstances({
      assignedQuests: [reading, reading],
      existingInstances: [],
      dateKey: "2026-06-29",
      weekday: "monday",
    });

    expect(result.instances.map((entry) => `${entry.assigned_quest_id}:${entry.quest_date}`)).toEqual([
      "reading:2026-06-29",
    ]);
  });
});
