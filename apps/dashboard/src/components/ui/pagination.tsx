'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  labels: {
    prev: string;
    next: string;
    first: string;
    last: string;
    pageRange: (start: number, end: number, total: number) => string;
    pageSize?: string;
  };
  className?: string;
};

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  labels,
  className,
}: Props) {
  if (totalPages <= 1 && totalItems <= pageSize) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-wrap items-center justify-center gap-3 pt-4', className)}
    >
      {onPageSizeChange && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {labels.pageSize}
          <select
            className="h-8 rounded-lg border border-border bg-card px-2 text-xs"
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            aria-label={labels.pageSize}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={String(opt)}>{opt}</option>
            ))}
          </select>
        </label>
      )}

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 rounded-lg p-0"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          aria-label={labels.first}
        >
          <ChevronsLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-lg"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          aria-label={labels.prev}
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          <span className="sr-only sm:not-sr-only sm:ms-1">{labels.prev}</span>
        </Button>

        <span className="px-2 text-sm text-muted-foreground" aria-live="polite">
          {labels.pageRange(start, end, totalItems)}
        </span>

        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-lg"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          aria-label={labels.next}
        >
          <span className="sr-only sm:not-sr-only sm:me-1">{labels.next}</span>
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 rounded-lg p-0"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label={labels.last}
        >
          <ChevronsRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </nav>
  );
}
