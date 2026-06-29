import type { ApprovalMode } from "../game/types";

type QuestFeedbackStatus = "completed" | "submitted";

interface KidQuestFeedbackInput {
  name: string;
  icon: string;
  status: QuestFeedbackStatus;
  approvalMode: ApprovalMode;
  xpValue: number;
  coinValue: number;
}

export interface KidQuestFeedback {
  icon: string;
  title: string;
  message: string;
  tone: "success" | "review";
}

export function getKidQuestFeedback(input: KidQuestFeedbackInput): KidQuestFeedback {
  if (input.status === "submitted" || input.approvalMode === "parent") {
    return {
      icon: input.icon,
      title: "Sent to parent!",
      message: `${input.name} is waiting for approval. Rewards unlock after your parent says yes.`,
      tone: "review",
    };
  }

  return {
    icon: input.icon,
    title: "Quest complete!",
    message: `${input.name} earned ${input.xpValue} XP and ${input.coinValue} Gold Coins.`,
    tone: "success",
  };
}
