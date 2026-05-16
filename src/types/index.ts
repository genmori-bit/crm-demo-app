export type CompanyStatus = "prospect" | "negotiating" | "active" | "lost" | "dormant";
export type DealStage = "qualification" | "needs_analysis" | "value_proposition" | "proposal" | "negotiation" | "final_review" | "won" | "lost";
export type ForecastCategory = "PIPELINE" | "BEST_CASE" | "COMMIT" | "CLOSED" | "OMITTED";
export type ActivityType = "phone" | "email" | "meeting" | "note" | "other";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  prospect: "見込み",
  negotiating: "商談中",
  active: "既存顧客",
  lost: "失注",
  dormant: "休眠",
};

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  qualification:     "初期確認",
  needs_analysis:    "課題確認",
  value_proposition: "価値提案",
  proposal:          "提案",
  negotiation:       "交渉",
  final_review:      "最終確認",
  won:               "受注",
  lost:              "失注",
};

export const FORECAST_CATEGORY_LABELS: Record<ForecastCategory, string> = {
  PIPELINE:   "パイプライン",
  BEST_CASE:  "ベストケース",
  COMMIT:     "コミット",
  CLOSED:     "確定",
  OMITTED:    "除外",
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  phone: "電話",
  email: "メール",
  meeting: "会議",
  note: "メモ",
  other: "その他",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "未着手",
  in_progress: "進行中",
  done: "完了",
};
