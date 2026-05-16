"use client";

import {
  Building2, TrendingUp, User, UserPlus, Clock, CheckSquare2,
  Megaphone, LifeBuoy, BarChart3, LayoutDashboard, Package,
  FileText, FileCheck2, ShoppingCart, Tag, Globe, Mail,
  Zap, Briefcase, Star, BookOpen, Layers, Grid3x3,
  Calendar, Truck, Link2, Hash, Heart, Map, Database,
  Settings2, FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type LucideIcon = React.ComponentType<{ className?: string; strokeWidth?: number }>;

// ── Standard object → icon & color mapping ─────────────────────────────────

export const STANDARD_OBJECT_ICONS: Record<string, LucideIcon> = {
  // CRM
  Company:          Building2,
  Account:          Building2,
  Deal:             TrendingUp,
  Opportunity:      TrendingUp,
  Contact:          User,
  Lead:             UserPlus,
  Activity:         Clock,
  Task:             CheckSquare2,
  Campaign:         Megaphone,
  Case:             LifeBuoy,
  Product:          Package,
  Quote:            FileText,
  Contract:         FileCheck2,
  Order:            ShoppingCart,
  PriceBook:        Tag,
  // Analytics
  Report:           BarChart3,
  Dashboard:        LayoutDashboard,
  // MA
  MarketingEmail:   Mail,
  MarketingForm:    FileSpreadsheet,
  LandingPage:      Globe,
  EngagementProgram: Zap,
};

export const STANDARD_OBJECT_COLORS: Record<string, string> = {
  Company:          "#0176d3",
  Account:          "#0176d3",
  Deal:             "#2e844a",
  Opportunity:      "#2e844a",
  Contact:          "#7c3aed",
  Lead:             "#ea580c",
  Activity:         "#0891b2",
  Task:             "#475569",
  Campaign:         "#db2777",
  Case:             "#dc2626",
  Product:          "#d97706",
  Quote:            "#0891b2",
  Contract:         "#475569",
  Order:            "#7c3aed",
  PriceBook:        "#475569",
  Report:           "#4f46e5",
  Dashboard:        "#4f46e5",
  MarketingEmail:   "#db2777",
  MarketingForm:    "#0176d3",
  LandingPage:      "#2e844a",
  EngagementProgram:"#7c3aed",
};

// ── Presets for custom objects ─────────────────────────────────────────────

export interface ColorPreset {
  id: string;
  label: string;
  hex: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: "blue",   label: "ブルー",     hex: "#0176d3" },
  { id: "indigo", label: "インディゴ", hex: "#4f46e5" },
  { id: "purple", label: "パープル",   hex: "#7c3aed" },
  { id: "pink",   label: "ピンク",     hex: "#db2777" },
  { id: "red",    label: "レッド",     hex: "#dc2626" },
  { id: "orange", label: "オレンジ",   hex: "#ea580c" },
  { id: "amber",  label: "アンバー",   hex: "#d97706" },
  { id: "green",  label: "グリーン",   hex: "#2e844a" },
  { id: "teal",   label: "ティール",   hex: "#0891b2" },
  { id: "slate",  label: "スレート",   hex: "#475569" },
];

export interface IconOption {
  id: string;
  label: string;
  Icon: LucideIcon;
}

export const ICON_OPTIONS: IconOption[] = [
  { id: "briefcase",   label: "ブリーフケース",     Icon: Briefcase },
  { id: "star",        label: "スター",             Icon: Star },
  { id: "zap",         label: "ライトニング",       Icon: Zap },
  { id: "globe",       label: "グローブ",           Icon: Globe },
  { id: "package",     label: "パッケージ",         Icon: Package },
  { id: "file",        label: "ファイル",           Icon: FileText },
  { id: "mail",        label: "メール",             Icon: Mail },
  { id: "settings",    label: "設定",               Icon: Settings2 },
  { id: "chart",       label: "チャート",           Icon: BarChart3 },
  { id: "book",        label: "ブック",             Icon: BookOpen },
  { id: "tag",         label: "タグ",               Icon: Tag },
  { id: "dashboard",   label: "ダッシュボード",     Icon: LayoutDashboard },
  { id: "layers",      label: "レイヤー",           Icon: Layers },
  { id: "grid",        label: "グリッド",           Icon: Grid3x3 },
  { id: "calendar",    label: "カレンダー",         Icon: Calendar },
  { id: "truck",       label: "配送",               Icon: Truck },
  { id: "link",        label: "リンク",             Icon: Link2 },
  { id: "hash",        label: "ハッシュ",           Icon: Hash },
  { id: "heart",       label: "ハート",             Icon: Heart },
  { id: "map",         label: "マップ",             Icon: Map },
  { id: "database",    label: "データベース",       Icon: Database },
  { id: "user",        label: "ユーザー",           Icon: User },
  { id: "trending",    label: "トレンド",           Icon: TrendingUp },
  { id: "building",    label: "ビルディング",       Icon: Building2 },
];

// ── ObjectIcon component ───────────────────────────────────────────────────

interface ObjectIconProps {
  /** Standard object API name (Company, Deal, Contact, etc.) */
  objectType?: string;
  /** Custom icon id from ICON_OPTIONS — used when objectType is not a standard object */
  iconId?: string;
  /** Background color hex — used when objectType is not in STANDARD_OBJECT_COLORS */
  color?: string;
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  xs: { outer: "w-6 h-6 rounded",    icon: "w-3.5 h-3.5" },
  sm: { outer: "w-8 h-8 rounded-lg", icon: "w-4 h-4" },
  md: { outer: "w-10 h-10 rounded-lg", icon: "w-5 h-5" },
  lg: { outer: "w-12 h-12 rounded-xl", icon: "w-6 h-6" },
};

export function ObjectIcon({
  objectType,
  iconId,
  color,
  size = "md",
  className,
}: ObjectIconProps) {
  const { outer, icon } = SIZE_MAP[size];

  // Resolve icon component
  const IconComponent: LucideIcon =
    (objectType && STANDARD_OBJECT_ICONS[objectType]) ||
    (iconId && ICON_OPTIONS.find((o) => o.id === iconId)?.Icon) ||
    Briefcase;

  // Resolve background color
  const bgColor =
    (objectType && STANDARD_OBJECT_COLORS[objectType]) ||
    color ||
    "#4f46e5";

  return (
    <div
      className={cn(outer, "flex items-center justify-center shrink-0", className)}
      style={{ backgroundColor: bgColor }}
    >
      <IconComponent className={cn(icon, "text-white")} strokeWidth={1.7} />
    </div>
  );
}

// ── ObjectColorPicker ──────────────────────────────────────────────────────

interface ObjectColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function ObjectColorPicker({ value, onChange }: ObjectColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          title={preset.label}
          onClick={() => onChange(preset.hex)}
          className={cn(
            "w-7 h-7 rounded-lg transition-all focus:outline-none",
            value === preset.hex
              ? "ring-2 ring-offset-2 ring-gray-500 scale-110"
              : "hover:scale-105 hover:ring-1 hover:ring-offset-1 hover:ring-gray-400"
          )}
          style={{ backgroundColor: preset.hex }}
        />
      ))}
    </div>
  );
}

// ── ObjectIconPicker ───────────────────────────────────────────────────────

interface ObjectIconPickerProps {
  value: string;
  onChange: (iconId: string) => void;
  /** Preview color for selected icon */
  previewColor?: string;
}

export function ObjectIconPicker({ value, onChange, previewColor = "#4f46e5" }: ObjectIconPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ICON_OPTIONS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          onClick={() => onChange(id)}
          className={cn(
            "w-9 h-9 rounded-lg border flex items-center justify-center transition-all focus:outline-none",
            value === id
              ? "border-transparent text-white shadow-sm"
              : "border-sf-border bg-sf-surface text-sf-weak hover:border-sf-border hover:text-sf-text"
          )}
          style={value === id ? { backgroundColor: previewColor } : {}}
        >
          <Icon className="w-4 h-4" strokeWidth={1.7} />
        </button>
      ))}
    </div>
  );
}

// ── ObjectIconPreview ──────────────────────────────────────────────────────

/** Live preview of icon + color for the custom object creation form */
interface ObjectIconPreviewProps {
  iconId: string;
  color: string;
  label?: string;
}

export function ObjectIconPreview({ iconId, color, label }: ObjectIconPreviewProps) {
  return (
    <div className="flex items-center gap-3">
      <ObjectIcon iconId={iconId} color={color} size="lg" />
      {label && (
        <div>
          <p className="text-sm font-semibold text-sf-text">{label}</p>
          <p className="text-xs text-sf-weak">カスタムオブジェクト</p>
        </div>
      )}
    </div>
  );
}
