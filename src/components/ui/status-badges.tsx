import { Badge, type BadgeVariant } from "./badge";
import {
  COMPANY_STATUS_LABELS,
  DEAL_STAGE_LABELS,
  ACTIVITY_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type CompanyStatus,
  type DealStage,
  type ActivityType,
  type TaskPriority,
  type TaskStatus,
} from "@/types";

const companyStatusVariants: Record<CompanyStatus, BadgeVariant> = {
  prospect: "brand",
  negotiating: "warning",
  active: "success",
  lost: "danger",
  dormant: "muted",
};

const dealStageVariants: Record<DealStage, BadgeVariant> = {
  lead: "muted",
  hearing: "brand",
  proposal: "info",
  negotiation: "warning",
  won: "success",
  lost: "danger",
};

const activityTypeVariants: Record<ActivityType, BadgeVariant> = {
  phone: "brand",
  email: "info",
  meeting: "warning",
  note: "muted",
  other: "muted",
};

const taskPriorityVariants: Record<TaskPriority, BadgeVariant> = {
  low: "muted",
  medium: "brand",
  high: "danger",
};

const taskStatusVariants: Record<TaskStatus, BadgeVariant> = {
  todo: "muted",
  in_progress: "warning",
  done: "success",
};

export function CompanyStatusBadge({ status }: { status: string }) {
  const s = status as CompanyStatus;
  return (
    <Badge variant={companyStatusVariants[s] ?? "muted"}>
      {COMPANY_STATUS_LABELS[s] ?? status}
    </Badge>
  );
}

export function DealStageBadge({ stage }: { stage: string }) {
  const s = stage as DealStage;
  return (
    <Badge variant={dealStageVariants[s] ?? "muted"}>
      {DEAL_STAGE_LABELS[s] ?? stage}
    </Badge>
  );
}

export function ActivityTypeBadge({ type }: { type: string }) {
  const t = type as ActivityType;
  return (
    <Badge variant={activityTypeVariants[t] ?? "muted"}>
      {ACTIVITY_TYPE_LABELS[t] ?? type}
    </Badge>
  );
}

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const p = priority as TaskPriority;
  return (
    <Badge variant={taskPriorityVariants[p] ?? "muted"}>
      {TASK_PRIORITY_LABELS[p] ?? priority}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: string }) {
  const s = status as TaskStatus;
  return (
    <Badge variant={taskStatusVariants[s] ?? "muted"}>
      {TASK_STATUS_LABELS[s] ?? status}
    </Badge>
  );
}
