import Link from "next/link";
import { LightningCard, LightningCardHeader } from "./lightning-card";
import { Button } from "./button";

interface RelatedListColumn<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
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
}: RelatedListProps<T>) {
  return (
    <LightningCard>
      <LightningCardHeader
        title={`${title} (${items.length})`}
        icon={icon}
        action={
          newHref ? (
            <Link href={newHref}>
              <Button variant="neutral" size="xs">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {newLabel}
              </Button>
            </Link>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-sf-weak">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" role="grid" aria-label={title}>
            <thead>
              <tr className="border-b border-sf-border bg-sf-bg/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="text-left px-4 py-2 font-semibold text-sf-weak uppercase tracking-wide"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sf-border">
              {items.map((row) => (
                <tr key={getRowKey(row)} className="hover:bg-sf-bg/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2 text-sf-text">
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
