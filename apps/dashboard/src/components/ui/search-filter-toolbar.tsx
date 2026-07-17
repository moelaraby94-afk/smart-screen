'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterOption = {
  value: string;
  label: string;
};

type Props = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  filters?: Array<{
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    ariaLabel?: string;
  }>;
  onClear?: () => void;
  clearLabel?: string;
  className?: string;
  children?: React.ReactNode;
};

export function SearchFilterToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  filters = [],
  onClear,
  clearLabel = 'Clear',
  className,
  children,
}: Props) {
  const hasActiveFilters = searchValue.trim() || filters.some((f) => f.value && f.value !== 'all');

  return (
    <div
      className={cn('flex flex-wrap items-center gap-3', className)}
      role="search"
    >
      <div className="relative min-w-[180px] flex-1">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          className="ps-8"
          placeholder={searchPlaceholder}
          aria-label={searchAriaLabel}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {filters.map((filter, i) => (
        <select
          key={i}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          aria-label={filter.ariaLabel}
        >
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}

      {children}

      {hasActiveFilters && onClear && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={onClear}
        >
          <X className="me-1 h-3.5 w-3.5" />
          {clearLabel}
        </Button>
      )}
    </div>
  );
}
