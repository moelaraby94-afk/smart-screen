/** Admin tables — Nimbus clean cards, primary accent */
export const adminGlassTable = {
  wrap:
    'vc-card-surface overflow-hidden rounded-2xl border border-border bg-card',
  theadRow:
    'border-0 bg-muted/25 hover:bg-muted/25',
  th: 'h-11 align-middle font-semibold text-[11px] uppercase tracking-[0.1em] text-primary',
  tbodyRow:
    'border-border transition-colors duration-150 hover:bg-muted/30 data-[state=selected]:bg-muted/40',
  tbodyRowClickable:
    'border-border cursor-pointer transition-colors duration-150 hover:bg-muted/35',
  statusCell: 'align-middle',
  statusInner: 'flex justify-center',
} as const;
