'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  /** Singular/plural label shown as "of N <label>". Defaults to 'records'. */
  itemLabel?: string;
  className?: string;
}

/**
 * Shared, compact pagination control for client-side paginated tables.
 * Renders nothing when there is only one page, so it is always safe to mount.
 */
export function TablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  itemLabel = 'records',
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  const visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1),
  );

  return (
    <div
      className={cn(
        'flex items-center justify-between mt-4 bg-muted/60 p-2 rounded-lg border border-border',
        className,
      )}
    >
      <div className="text-sm text-muted-foreground ml-2">
        Showing <span className="font-medium">{startIndex}</span> to{' '}
        <span className="font-medium">{endIndex}</span> of{' '}
        <span className="font-medium">{totalItems}</span> {itemLabel}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {visiblePages.map((p, idx) => (
            <div key={p} className="flex items-center">
              {idx > 0 && visiblePages[idx - 1] !== p - 1 && (
                <span className="px-1 text-muted-foreground text-xs">...</span>
              )}
              <Button
                variant={currentPage === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(p)}
                className={cn(
                  'h-8 w-8 p-0',
                  currentPage === p ? 'font-bold' : '',
                )}
                aria-label={`Go to page ${p}`}
                aria-current={currentPage === p ? 'page' : undefined}
              >
                {p}
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Pure helper to slice an array for a given page. Clamps the page to valid bounds.
 */
export function paginateArray<T>(items: T[], page: number, pageSize: number): T[] {
  if (pageSize <= 0) return items;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const clamped = Math.min(Math.max(1, page), totalPages);
  const start = (clamped - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
