"use client";

import { formatAmount } from "@/lib/utils";

// ── Horizontal bar chart ──────────────────────────────────────────────────

interface HBarItem {
  label: string;
  value: number;
  color?: string;
  count?: number;
}

interface HorizontalBarChartProps {
  data: HBarItem[];
  valueFormatter?: (v: number) => string;
}

export function HorizontalBarChart({
  data,
  valueFormatter = formatAmount,
}: HorizontalBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-20 text-right text-xs text-sf-weak shrink-0 truncate" title={item.label}>
            {item.label}
          </div>
          <div className="flex-1 bg-sf-bg rounded-full h-5 overflow-hidden border border-sf-border">
            <div
              className="h-5 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{
                width: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%`,
                backgroundColor: item.color ?? "#0176d3",
              }}
            >
              {item.count !== undefined && item.value > 0 && (
                <span className="text-2xs text-white font-medium">{item.count}</span>
              )}
            </div>
          </div>
          <div className="w-28 text-xs text-sf-text font-medium shrink-0">
            {valueFormatter(item.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Vertical bar chart ────────────────────────────────────────────────────

interface VBarItem {
  label: string;
  value: number;
}

interface VerticalBarChartProps {
  data: VBarItem[];
  height?: number;
  valueFormatter?: (v: number) => string;
}

export function VerticalBarChart({
  data,
  height = 120,
  valueFormatter = formatAmount,
}: VerticalBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item) => {
          const barHeight = Math.max((item.value / max) * (height - 20), item.value > 0 ? 4 : 0);
          return (
            <div key={item.label} className="flex flex-col items-center gap-1 flex-1">
              <div
                className="w-full flex items-end justify-center"
                style={{ height: height - 20 }}
              >
                <div
                  className="w-full max-w-[40px] bg-primary-500 rounded-t-sf group relative cursor-default"
                  style={{ height: barHeight }}
                  title={`${item.label}: ${valueFormatter(item.value)}`}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xs text-sf-weak whitespace-nowrap hidden group-hover:block bg-sf-text text-white px-1.5 py-0.5 rounded-sf z-10">
                    {valueFormatter(item.value)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-1">
        {data.map((item) => (
          <div key={item.label} className="flex-1 text-center text-2xs text-sf-weak truncate">
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────

interface DonutItem {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutItem[];
  size?: number;
  centerLabel?: string;
}

export function DonutChart({ data, size = 120, centerLabel }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div
        className="rounded-full bg-sf-bg border-4 border-sf-border flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-sf-weak">-</span>
      </div>
    );
  }

  const radius = (size - 12) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((item) => {
    const pct = item.value / total;
    const seg = { ...item, pct, offset };
    offset += pct;
    return seg;
  });

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={10}
              strokeDasharray={`${seg.pct * circumference} ${circumference}`}
              strokeDashoffset={`${-seg.offset * circumference}`}
              className="transition-all duration-500"
            />
          ))}
        </svg>
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-sf-text">{total}</span>
            <span className="text-2xs text-sf-weak">{centerLabel}</span>
          </div>
        )}
      </div>
      <ul className="space-y-1.5 text-xs">
        {data.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span className="text-sf-text">
              {item.label}{" "}
              <span className="text-sf-weak font-medium">{item.value}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
