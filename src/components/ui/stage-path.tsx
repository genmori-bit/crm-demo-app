"use client";

import { cn } from "@/lib/utils";
import { DEAL_STAGE_LABELS, type DealStage } from "@/types";

/** ステージパスに表示するアクティブステージ（won/lostを除く） */
const ACTIVE_STAGES: DealStage[] = [
  "qualification",
  "needs_analysis",
  "value_proposition",
  "proposal",
  "negotiation",
  "final_review",
  "won",
];

const STAGE_GUIDANCE: Record<DealStage, string> = {
  qualification:     "初回コンタクトで案件化の可否を確認しましょう",
  needs_analysis:    "顧客の課題・ニーズをヒアリングして整理しましょう",
  value_proposition: "自社ソリューションの価値を訴求しましょう",
  proposal:          "提案資料を作成し、担当者にプレゼンしましょう",
  negotiation:       "契約条件の交渉と承認プロセスを進めましょう",
  final_review:      "最終条件の確認と契約締結に向けて進めましょう",
  won:               "受注を確定し、オンボーディングを開始しましょう",
  lost:              "失注の原因を分析し、次回案件に活かしましょう",
};

const STAGE_COLORS: Record<DealStage, { bg: string; text: string; ring: string }> = {
  qualification:     { bg: "bg-[#706e6b]", text: "text-white", ring: "ring-[#706e6b]" },
  needs_analysis:    { bg: "bg-[#dd7a01]", text: "text-white", ring: "ring-[#dd7a01]" },
  value_proposition: { bg: "bg-[#e57200]", text: "text-white", ring: "ring-[#e57200]" },
  proposal:          { bg: "bg-[#0176d3]", text: "text-white", ring: "ring-[#0176d3]" },
  negotiation:       { bg: "bg-[#6b34b0]", text: "text-white", ring: "ring-[#6b34b0]" },
  final_review:      { bg: "bg-[#0e7490]", text: "text-white", ring: "ring-[#0e7490]" },
  won:               { bg: "bg-success",   text: "text-white", ring: "ring-success" },
  lost:              { bg: "bg-danger",    text: "text-white", ring: "ring-danger" },
};

interface StagePathProps {
  currentStage: string;
  onStageChange?: (stage: DealStage) => void;
}

export function StagePath({ currentStage, onStageChange }: StagePathProps) {
  const current = currentStage as DealStage;
  const currentIndex = ACTIVE_STAGES.indexOf(current);
  const isLost = current === "lost";

  if (isLost) {
    return (
      <div className="bg-danger-light border-b border-danger-border px-6 py-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-danger flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-danger">失注</p>
          <p className="text-xs text-danger/80 mt-0.5">{STAGE_GUIDANCE.lost}</p>
        </div>
        {onStageChange && (
          <button
            onClick={() => onStageChange("qualification")}
            className="ml-auto text-xs text-danger font-medium underline hover:no-underline focus:outline-none"
          >
            ステージをリセット
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-sf-surface" aria-label="商談ステージ">
      {/* Path chevrons */}
      <div className="flex h-11 overflow-hidden px-0">
        {ACTIVE_STAGES.map((stage, i) => {
          const isPast = i < currentIndex;
          const isCurrent = stage === current;
          const isFirst = i === 0;
          const isLast = i === ACTIVE_STAGES.length - 1;

          const colors = STAGE_COLORS[stage];
          let bgClass = "bg-sf-bg";
          let textClass = "text-sf-weak";
          if (isCurrent) { bgClass = colors.bg; textClass = colors.text; }
          else if (isPast) { bgClass = "bg-success/15"; textClass = "text-success"; }

          return (
            <button
              key={stage}
              onClick={() => onStageChange?.(stage)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold transition-opacity relative",
                isFirst ? "stage-item-first" : isLast ? "stage-item-last" : "stage-item-middle",
                bgClass,
                textClass,
                onStageChange ? "hover:opacity-85 cursor-pointer" : "cursor-default",
              )}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`${DEAL_STAGE_LABELS[stage]}${isCurrent ? " (現在)" : isPast ? " (完了)" : ""}`}
              disabled={!onStageChange}
            >
              {isPast && (
                <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span className="truncate">{DEAL_STAGE_LABELS[stage]}</span>
              {isCurrent && (
                <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Guidance for current stage */}
      {currentIndex >= 0 && (
        <div className="px-4 py-2 border-t border-sf-border bg-sf-bg/60 flex items-start gap-2">
          <svg className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-sf-weak leading-relaxed">
            <span className="font-medium text-sf-text">{DEAL_STAGE_LABELS[current]}：</span>
            {STAGE_GUIDANCE[current]}
          </p>
          <span className="ml-auto text-2xs text-sf-weak shrink-0">
            {currentIndex + 1} / {ACTIVE_STAGES.length}
          </span>
        </div>
      )}
    </div>
  );
}
