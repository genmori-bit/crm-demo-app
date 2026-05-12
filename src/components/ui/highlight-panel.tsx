interface HighlightField {
  label: string;
  value: React.ReactNode;
}

interface HighlightPanelProps {
  fields: HighlightField[];
}

export function HighlightPanel({ fields }: HighlightPanelProps) {
  return (
    <div className="border-t border-sf-border bg-sf-bg/50 px-6 py-3">
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        {fields.map((field) => (
          <div key={field.label} className="min-w-0">
            <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">
              {field.label}
            </dt>
            <dd className="text-sm font-medium text-sf-text">{field.value ?? "-"}</dd>
          </div>
        ))}
      </div>
    </div>
  );
}
