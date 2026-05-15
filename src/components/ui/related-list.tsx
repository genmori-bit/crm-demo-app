import Link from "next/link";
import { LightningCard, LightningCardHeader } from "./lightning-card";
import { Button } from "./button";
import { EmptyState } from "./empty-state";

interface RelatedListColumn<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  width?: string;
}

interface RelatedListProps<T> {
  title: string;
  icon?: React.ReactNode;
  items: T[];
  columns: RelatedListColumn<T>[];
  newHref?: string;
  newLabel?: string;
  emptyMessage?: string;
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export function RelatedList<T>({
  title,
  icon,
  items,
  columns,
  newHref,
  newLabel = "新規",
  emptyMessage = "データがありません",
  getRowKey,
  onRowClick,
}: RelatedListProps<T>) {
  return (
    <LightningCard>
      <LightningCardHeader
        title={title}
        count={items.length}
        icon={icon}
        action={
          newHref ? (
            <Link href={newHref}>
              <Button variant="neutral" size="xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {newLabel}
              </Button>
            </Link>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <EmptyState compact title={emptyMessage} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" role="grid" aria-label={title}>
            <thead>
              <tr className="border-b border-sf-border bg-sf-bg/60">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap"
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className={`border-b border-sf-border/60 last:border-0 transition-colors ${onRowClick ? "cursor-pointer hover:bg-info-light/30" : "hover:bg-sf-bg/50"}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2.5 text-sf-text">
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </LightningCard>
  );
}
