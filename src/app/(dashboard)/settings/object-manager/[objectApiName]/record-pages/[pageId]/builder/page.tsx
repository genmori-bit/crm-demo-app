"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

interface ComponentInstance {
  id: string;
  componentType: string;
  region: string;
  sortOrder: number;
  config: Record<string, unknown>;
}

interface PageDef {
  id: string;
  objectApiName: string;
  label: string;
  status: string;
  template: string;
  components: ComponentInstance[];
}

const COMPONENT_LABELS: Record<string, string> = {
  RECORD_HEADER: "レコードヘッダー",
  HIGHLIGHT_PANEL: "ハイライトパネル",
  FIELD_SECTION: "項目セクション",
  RELATED_LIST: "関連リスト",
  ACTIVITY_TIMELINE: "活動タイムライン",
  TASK_LIST: "タスク",
  NOTES: "メモ",
  FILES: "ファイル",
  TABS: "タブ",
  RICH_TEXT: "リッチテキスト",
  SEPARATOR: "区切り線",
  DETAIL_INFO: "詳細情報",
  KPI_CARD: "KPIカード",
  REPORT_CHART: "レポートグラフ",
  MA_ENGAGEMENT_SUMMARY: "MAエンゲージメント",
  MA_LEAD_LIST: "関連リード",
  ACCOUNT_HEALTH: "取引先ヘルス",
  ACCOUNT_TEAM: "取引先チーム",
  ACCOUNT_HIERARCHY: "取引先階層",
  STAKEHOLDER_MAP: "関係者マップ",
  INSIGHT_CARD: "インサイト",
  CUSTOM_RELATED_LIST: "カスタム関連リスト",
};

const COMPONENT_ICONS: Record<string, string> = {
  RECORD_HEADER: "🏷", HIGHLIGHT_PANEL: "⭐", FIELD_SECTION: "📋",
  RELATED_LIST: "🔗", ACTIVITY_TIMELINE: "⏱", TASK_LIST: "✓",
  NOTES: "📓", FILES: "📎", TABS: "📑", RICH_TEXT: "📝",
  SEPARATOR: "➖", DETAIL_INFO: "ℹ️", KPI_CARD: "📊",
  REPORT_CHART: "📈", MA_ENGAGEMENT_SUMMARY: "📧", MA_LEAD_LIST: "👤",
  ACCOUNT_HEALTH: "💚", ACCOUNT_TEAM: "👥", ACCOUNT_HIERARCHY: "🏢",
  STAKEHOLDER_MAP: "🗺", INSIGHT_CARD: "💡", CUSTOM_RELATED_LIST: "🔀",
};

const PALETTE: { category: string; items: { type: string; label: string }[] }[] = [
  { category: "基本", items: [
    { type: "RICH_TEXT", label: "リッチテキスト" },
    { type: "TABS", label: "タブ" },
    { type: "FIELD_SECTION", label: "項目セクション" },
    { type: "SEPARATOR", label: "区切り線" },
  ]},
  { category: "レコード", items: [
    { type: "RECORD_HEADER", label: "レコードヘッダー" },
    { type: "HIGHLIGHT_PANEL", label: "ハイライトパネル" },
    { type: "DETAIL_INFO", label: "詳細情報" },
  ]},
  { category: "関連", items: [
    { type: "RELATED_LIST", label: "関連リスト" },
    { type: "ACTIVITY_TIMELINE", label: "活動タイムライン" },
    { type: "TASK_LIST", label: "タスク" },
    { type: "NOTES", label: "メモ" },
    { type: "FILES", label: "ファイル" },
    { type: "CUSTOM_RELATED_LIST", label: "カスタム関連リスト" },
  ]},
  { category: "分析", items: [
    { type: "KPI_CARD", label: "KPIカード" },
    { type: "REPORT_CHART", label: "レポートグラフ" },
  ]},
  { category: "マーケティング", items: [
    { type: "MA_ENGAGEMENT_SUMMARY", label: "MAエンゲージメント" },
    { type: "MA_LEAD_LIST", label: "関連リード" },
  ]},
  { category: "取引先", items: [
    { type: "ACCOUNT_HEALTH", label: "取引先ヘルス" },
    { type: "ACCOUNT_TEAM", label: "取引先チーム" },
    { type: "ACCOUNT_HIERARCHY", label: "取引先階層" },
    { type: "STAKEHOLDER_MAP", label: "関係者マップ" },
    { type: "INSIGHT_CARD", label: "インサイト" },
  ]},
];

function getRegionsForTemplate(template: string): { id: string; label: string }[] {
  switch (template) {
    case "TABS_WITH_RIGHT_SIDEBAR":
      return [
        { id: "header", label: "ヘッダー" },
        { id: "tab:overview", label: "タブ: 概要" },
        { id: "tab:details", label: "タブ: 詳細" },
        { id: "tab:related", label: "タブ: 関連" },
        { id: "tab:activity", label: "タブ: 活動" },
        { id: "sidebar", label: "右サイドバー" },
      ];
    case "HEADER_RIGHT_SIDEBAR":
      return [
        { id: "header", label: "ヘッダー" },
        { id: "main", label: "メイン" },
        { id: "sidebar", label: "右サイドバー" },
      ];
    case "HEADER_TWO_COLUMNS":
      return [
        { id: "header", label: "ヘッダー" },
        { id: "main-left", label: "左カラム" },
        { id: "main-right", label: "右カラム" },
      ];
    default:
      return [
        { id: "header", label: "ヘッダー" },
        { id: "main", label: "メイン" },
      ];
  }
}

export default function PageBuilderPage() {
  const { objectApiName, pageId } = useParams<{ objectApiName: string; pageId: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [pageDef, setPageDef] = useState<PageDef | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState("main");
  const [saving, setSaving] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState("");
  const [configDraft, setConfigDraft] = useState<Record<string, unknown>>({});

  const load = useCallback(() => {
    fetch(`/api/record-pages/${pageId}`)
      .then((r) => r.json())
      .then((data: PageDef) => {
        setPageDef(data);
        const regions = getRegionsForTemplate(data.template);
        if (regions.length > 0) setSelectedRegion(regions[0].id);
        setLoading(false);
      });
  }, [pageId]);

  useEffect(() => { load(); }, [load]);

  const selectedComponent = pageDef?.components.find((c) => c.id === selectedComponentId) ?? null;

  useEffect(() => {
    if (selectedComponent) setConfigDraft(selectedComponent.config ?? {});
  }, [selectedComponentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addComponent = async (type: string) => {
    if (!pageDef) return;
    const sortOrder = pageDef.components.filter((c) => c.region === selectedRegion).length;
    const res = await fetch(`/api/record-pages/${pageId}/components`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ componentType: type, region: selectedRegion, sortOrder, config: {} }),
    });
    if (res.ok) {
      showToast(`${COMPONENT_LABELS[type] ?? type} を追加しました`, "success");
      load();
    }
  };

  const deleteComponent = async (compId: string) => {
    await fetch(`/api/record-pages/${pageId}/components/${compId}`, { method: "DELETE" });
    if (selectedComponentId === compId) setSelectedComponentId(null);
    load();
  };

  const moveComponent = async (compId: string, direction: "up" | "down") => {
    const comp = pageDef?.components.find((x) => x.id === compId);
    if (!comp) return;
    const regionComps = (pageDef?.components ?? [])
      .filter((c) => c.region === comp.region)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = regionComps.findIndex((c) => c.id === compId);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === regionComps.length - 1) return;
    const swapWith = direction === "up" ? regionComps[idx - 1] : regionComps[idx + 1];
    await Promise.all([
      fetch(`/api/record-pages/${pageId}/components/${compId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: swapWith.sortOrder }),
      }),
      fetch(`/api/record-pages/${pageId}/components/${swapWith.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: regionComps[idx].sortOrder }),
      }),
    ]);
    load();
  };

  const saveConfig = async () => {
    if (!selectedComponentId) return;
    await fetch(`/api/record-pages/${pageId}/components/${selectedComponentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: configDraft }),
    });
    showToast("設定を保存しました", "success");
    load();
  };

  const publish = async () => {
    setSaving(true);
    const res = await fetch(`/api/record-pages/${pageId}/publish`, { method: "POST" });
    if (res.ok) {
      showToast("ページを有効化しました", "success");
      load();
    } else {
      showToast("有効化に失敗しました", "error");
    }
    setSaving(false);
  };

  if (loading || !pageDef) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-sf-weak text-sm">読み込み中...</div>
    </div>
  );

  const regions = getRegionsForTemplate(pageDef.template);
  const filteredPalette = PALETTE.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) =>
      !paletteSearch || item.label.includes(paletteSearch) || item.type.toLowerCase().includes(paletteSearch.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-sf-bg">
      {/* Top bar */}
      <div className="bg-sf-surface border-b border-sf-border px-4 py-2.5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/settings/object-manager/${objectApiName}/record-pages`)} className="text-sf-weak hover:text-sf-text transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <p className="text-xs text-sf-weak">{objectApiName} · レコードページ</p>
            <h1 className="text-sm font-bold text-sf-text leading-tight">{pageDef.label}</h1>
          </div>
          <Badge variant={pageDef.status === "ACTIVE" ? "success" : "muted"}>
            {pageDef.status === "ACTIVE" ? "有効" : pageDef.status === "DRAFT" ? "下書き" : "アーカイブ"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="neutral" size="sm" onClick={() => router.push(`/settings/object-manager/${objectApiName}/record-pages/${pageId}/assignments`)}>
            割り当て
          </Button>
          {pageDef.status !== "ACTIVE" && (
            <Button size="sm" onClick={publish} disabled={saving}>
              {saving ? "有効化中..." : "有効化"}
            </Button>
          )}
        </div>
      </div>

      {/* 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Component palette */}
        <div className="w-56 bg-sf-surface border-r border-sf-border flex flex-col shrink-0 overflow-hidden">
          <div className="p-2 border-b border-sf-border shrink-0">
            <input
              type="search"
              placeholder="コンポーネントを検索..."
              className="w-full h-7 px-2.5 text-xs border border-sf-border rounded-sf focus:outline-none focus:border-primary-500 bg-white"
              value={paletteSearch}
              onChange={(e) => setPaletteSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {filteredPalette.map((cat) => (
              <div key={cat.category}>
                <p className="px-3 py-1.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider">{cat.category}</p>
                {cat.items.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => addComponent(item.type)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-sf-text hover:bg-info-light/50 hover:text-primary-600 transition-colors text-left group"
                    title={`${selectedRegion} に追加`}
                  >
                    <span className="text-base leading-none shrink-0">{COMPONENT_ICONS[item.type] ?? "🔲"}</span>
                    <span className="flex-1 truncate">{item.label}</span>
                    <svg className="w-3 h-3 text-sf-weak group-hover:text-primary-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Region selector */}
          <div className="bg-sf-surface border-b border-sf-border px-4 py-1.5 flex items-center gap-2 shrink-0 overflow-x-auto">
            <span className="text-xs text-sf-weak shrink-0">追加先:</span>
            {regions.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r.id)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap ${selectedRegion === r.id ? "bg-primary-500 text-white border-primary-500" : "border-sf-border text-sf-weak hover:border-primary-400 hover:text-sf-text"}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Canvas body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {regions.map((region) => {
              const regionComps = pageDef.components
                .filter((c) => c.region === region.id)
                .sort((a, b) => a.sortOrder - b.sortOrder);
              return (
                <div key={region.id} className={`rounded-sf border-2 transition-colors ${selectedRegion === region.id ? "border-primary-400" : "border-sf-border/60"}`}>
                  <div className={`px-3 py-1.5 flex items-center justify-between rounded-t-sf ${selectedRegion === region.id ? "bg-primary-50 border-b border-primary-200" : "bg-sf-bg border-b border-sf-border/60"}`}>
                    <span className="text-xs font-semibold text-sf-weak uppercase tracking-wide">{region.label}</span>
                    <span className="text-xs text-sf-weak">{regionComps.length} 個</span>
                  </div>
                  <div className="p-2 space-y-1.5 min-h-[60px]">
                    {regionComps.length === 0 ? (
                      <div
                        className="flex items-center justify-center h-12 border-2 border-dashed border-sf-border/60 rounded-sf text-xs text-sf-weak cursor-pointer hover:border-primary-400 hover:text-primary-500 transition-colors"
                        onClick={() => setSelectedRegion(region.id)}
                      >
                        クリックして選択 → 左パネルからコンポーネントを追加
                      </div>
                    ) : (
                      regionComps.map((comp, idx) => (
                        <div
                          key={comp.id}
                          onClick={() => setSelectedComponentId(comp.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-sf border cursor-pointer transition-all ${selectedComponentId === comp.id ? "border-primary-500 bg-info-light/30 shadow-sm" : "border-sf-border bg-white hover:border-primary-300 hover:bg-sf-bg/50"}`}
                        >
                          <span className="text-base leading-none shrink-0">{COMPONENT_ICONS[comp.componentType] ?? "🔲"}</span>
                          <span className="flex-1 text-sm text-sf-text font-medium">{COMPONENT_LABELS[comp.componentType] ?? comp.componentType}</span>
                          {comp.config.title ? (
                            <span className="text-xs text-sf-weak truncate max-w-[120px]">{String(comp.config.title)}</span>
                          ) : null}
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => moveComponent(comp.id, "up")} disabled={idx === 0} className="w-6 h-6 flex items-center justify-center text-sf-weak hover:text-sf-text disabled:opacity-30 hover:bg-sf-bg rounded transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
                            </button>
                            <button onClick={() => moveComponent(comp.id, "down")} disabled={idx === regionComps.length - 1} className="w-6 h-6 flex items-center justify-center text-sf-weak hover:text-sf-text disabled:opacity-30 hover:bg-sf-bg rounded transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                            </button>
                            <button onClick={() => deleteComponent(comp.id)} className="w-6 h-6 flex items-center justify-center text-sf-weak hover:text-danger hover:bg-danger-light rounded transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel: Properties */}
        <div className="w-64 bg-sf-surface border-l border-sf-border flex flex-col shrink-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-sf-border shrink-0">
            <p className="text-xs font-semibold text-sf-weak uppercase tracking-wider">プロパティ</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!selectedComponent ? (
              <div className="p-4 text-xs text-sf-weak text-center mt-8">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>
                コンポーネントを選択してください
              </div>
            ) : (
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-sf-border/60">
                  <span className="text-lg">{COMPONENT_ICONS[selectedComponent.componentType] ?? "🔲"}</span>
                  <div>
                    <p className="text-sm font-semibold text-sf-text">{COMPONENT_LABELS[selectedComponent.componentType] ?? selectedComponent.componentType}</p>
                    <p className="text-xs text-sf-weak">{selectedComponent.region}</p>
                  </div>
                </div>

                {/* Config fields based on type */}
                {selectedComponent.componentType === "FIELD_SECTION" && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-sf-weak block mb-1">セクションタイトル</label>
                      <input className="w-full h-7 px-2 text-xs border border-sf-border rounded-sf focus:outline-none focus:border-primary-500" value={String(configDraft.title ?? "")} onChange={(e) => setConfigDraft((p) => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-sf-weak block mb-1">カラム数</label>
                      <select className="w-full h-7 px-2 text-xs border border-sf-border rounded-sf focus:outline-none focus:border-primary-500" value={String(configDraft.columns ?? "2")} onChange={(e) => setConfigDraft((p) => ({ ...p, columns: Number(e.target.value) }))}>
                        <option value="1">1カラム</option>
                        <option value="2">2カラム</option>
                        <option value="3">3カラム</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="collapsible" checked={Boolean(configDraft.collapsible)} onChange={(e) => setConfigDraft((p) => ({ ...p, collapsible: e.target.checked }))} className="rounded" />
                      <label htmlFor="collapsible" className="text-xs text-sf-text">折りたたみ可能</label>
                    </div>
                  </>
                )}

                {selectedComponent.componentType === "RELATED_LIST" && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-sf-weak block mb-1">タイトル</label>
                      <input className="w-full h-7 px-2 text-xs border border-sf-border rounded-sf focus:outline-none focus:border-primary-500" value={String(configDraft.title ?? "")} onChange={(e) => setConfigDraft((p) => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-sf-weak block mb-1">関連オブジェクト</label>
                      <input className="w-full h-7 px-2 text-xs border border-sf-border rounded-sf focus:outline-none focus:border-primary-500" value={String(configDraft.relatedObject ?? "")} onChange={(e) => setConfigDraft((p) => ({ ...p, relatedObject: e.target.value }))} placeholder="例: contacts" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-sf-weak block mb-1">最大表示件数</label>
                      <input type="number" className="w-full h-7 px-2 text-xs border border-sf-border rounded-sf focus:outline-none focus:border-primary-500" value={String(configDraft.maxRows ?? "10")} onChange={(e) => setConfigDraft((p) => ({ ...p, maxRows: Number(e.target.value) }))} />
                    </div>
                  </>
                )}

                {selectedComponent.componentType === "RICH_TEXT" && (
                  <div>
                    <label className="text-xs font-semibold text-sf-weak block mb-1">コンテンツ</label>
                    <textarea className="w-full px-2 py-1.5 text-xs border border-sf-border rounded-sf focus:outline-none focus:border-primary-500 resize-none" rows={5} value={String(configDraft.content ?? "")} onChange={(e) => setConfigDraft((p) => ({ ...p, content: e.target.value }))} />
                  </div>
                )}

                {selectedComponent.componentType === "KPI_CARD" && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-sf-weak block mb-1">ラベル</label>
                      <input className="w-full h-7 px-2 text-xs border border-sf-border rounded-sf focus:outline-none focus:border-primary-500" value={String(configDraft.label ?? "")} onChange={(e) => setConfigDraft((p) => ({ ...p, label: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-sf-weak block mb-1">フィールド</label>
                      <input className="w-full h-7 px-2 text-xs border border-sf-border rounded-sf focus:outline-none focus:border-primary-500" value={String(configDraft.field ?? "")} onChange={(e) => setConfigDraft((p) => ({ ...p, field: e.target.value }))} placeholder="例: openPipelineAmount" />
                    </div>
                  </>
                )}

                {!["FIELD_SECTION", "RELATED_LIST", "RICH_TEXT", "KPI_CARD"].includes(selectedComponent.componentType) && (
                  <div>
                    <label className="text-xs font-semibold text-sf-weak block mb-1">設定 (JSON)</label>
                    <textarea
                      className="w-full px-2 py-1.5 text-xs font-mono border border-sf-border rounded-sf focus:outline-none focus:border-primary-500 resize-none"
                      rows={6}
                      value={JSON.stringify(configDraft, null, 2)}
                      onChange={(e) => { try { setConfigDraft(JSON.parse(e.target.value)); } catch { /* invalid JSON, ignore */ } }}
                    />
                  </div>
                )}

                <Button size="sm" className="w-full" onClick={saveConfig}>設定を保存</Button>
                <Button size="sm" variant="danger" className="w-full" onClick={() => deleteComponent(selectedComponent.id)}>削除</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
