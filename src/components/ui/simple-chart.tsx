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

// ── Line chart ────────────────────────────────────────────────────────────

interface LineDataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineDataPoint[];
  height?: number;
  valueFormatter?: (v: number) => string;
  color?: string;
}

export function LineChart({ data, height = 120, valueFormatter = String, color = "#0176d3" }: LineChartProps) {
  if (data.length < 2) {
    return <div className="flex items-center justify-center h-24 text-xs text-sf-weak">データが不足しています</div>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 400;
  const H = height;
  const pad = { top: 16, right: 8, bottom: 28, left: 8 };
  const w = W - pad.left - pad.right;
  const h = H - pad.top - pad.bottom;
  const step = w / (data.length - 1);

  const points = data.map((d, i) => ({
    x: pad.left + i * step,
    y: pad.top + h - (d.value / max) * h,
    label: d.label,
    value: d.value,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${H - pad.bottom} L ${points[0].x} ${H - pad.bottom} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        {/* Area fill */}
        <path d={areaD} fill={color} fillOpacity="0.08" />
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill={color} />
            <title>{`${p.label}: ${valueFormatter(p.value)}`}</title>
          </g>
        ))}
        {/* X-axis labels */}
        {points.filter((_, i) => data.length <= 12 || i % Math.ceil(data.length / 8) === 0).map((p, i) => (
          <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize="9" fill="#706e6b">{p.label}</text>
        ))}
      </svg>
    </div>
  );
}

// ── Pie chart ─────────────────────────────────────────────────────────────

interface PieItem {
  label: string;
  value: number;
  color: string;
}

export function PieChart({ data, size = 120 }: { data: PieItem[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="flex items-center justify-center h-24 text-xs text-sf-weak">データなし</div>;

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - 8) / 2;
  let cumulativeAngle = -Math.PI / 2;

  const slices = data.map((item) => {
    const angle = (item.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumulativeAngle);
    const y1 = cy + r * Math.sin(cumulativeAngle);
    cumulativeAngle += angle;
    const x2 = cx + r * Math.cos(cumulativeAngle);
    const y2 = cy + r * Math.sin(cumulativeAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    return { ...item, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z` };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth="1">
            <title>{`${s.label}: ${s.value} (${Math.round((s.value / total) * 100)}%)`}</title>
          </path>
        ))}
      </svg>
      <ul className="space-y-1.5 text-xs min-w-0">
        {data.slice(0, 6).map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-sf-text truncate">{item.label} <span className="text-sf-weak">{item.value}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Funnel chart ──────────────────────────────────────────────────────────

interface FunnelItem {
  label: string;
  value: number;
  count?: number;
  color: string;
}

export function FunnelChart({ data, valueFormatter = String }: { data: FunnelItem[]; valueFormatter?: (v: number) => string }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minWidth = 30;

  return (
    <div className="space-y-1.5">
      {data.map((item, i) => {
        const pct = Math.max((item.value / maxValue) * 100, minWidth);
        const convRate = i > 0 && data[i - 1].value > 0 ? Math.round((item.value / data[i - 1].value) * 100) : null;
        return (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-16 text-right text-xs text-sf-weak shrink-0 truncate">{item.label}</div>
            <div className="flex-1 relative h-7">
              <div
                className="h-7 rounded-sm flex items-center justify-end pr-2 transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: item.color }}
              >
                <span className="text-xs text-white font-semibold">{valueFormatter(item.value)}</span>
              </div>
              {convRate !== null && (
                <span className="absolute right-0 top-0 h-7 flex items-center text-2xs text-sf-weak px-1">
                  ↓{convRate}%
                </span>
              )}
            </div>
            {item.count !== undefined && (
              <div className="w-10 text-xs text-sf-weak shrink-0 text-right">{item.count}件</div>
            )}
          </div>
        );
      })}
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
