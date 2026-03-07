'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import Pagination from './pagination';
import { Search } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  searchable?: boolean;
  searchKeys?: string[];
  pageSize?: number;
  loading?: boolean;
}

export default function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  emptyIcon,
  searchable = false,
  searchKeys = [],
  pageSize = 10,
  loading = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = search
    ? data.filter((item) =>
        searchKeys.some((key) =>
          String((item as any)[key]).toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3.5 flex items-center gap-4 animate-pulse">
              <div className="w-9 h-9 bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted w-1/3" />
                <div className="h-2.5 bg-muted w-1/5" />
              </div>
              <div className="h-5 bg-muted w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border overflow-hidden">
      {searchable && (
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}
      {paginated.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          {emptyIcon}
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                        column.className
                      )}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-muted/50'
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn('px-4 py-3.5 text-sm text-foreground', column.className)}
                      >
                        {column.render
                          ? column.render(item)
                          : String((item as any)[column.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-border">
            {paginated.map((item) => {
              const actionCol = columns.find((c) => !c.label);
              const dataCols = columns.filter((c) => c.label);
              return (
                <div
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'px-4 py-4 flex flex-col gap-2',
                    onRowClick && 'cursor-pointer active:bg-muted/50'
                  )}
                >
                  {/* First column rendered prominently */}
                  {dataCols[0] && (
                    <div>
                      {dataCols[0].render
                        ? dataCols[0].render(item)
                        : <span className="font-medium text-foreground text-sm">{String((item as any)[dataCols[0].key] ?? '')}</span>}
                    </div>
                  )}
                  {/* Remaining columns as label: value rows */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {dataCols.slice(1).map((column) => (
                      <div key={column.key} className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{column.label}</span>
                        <div className="text-sm text-foreground">
                          {column.render
                            ? column.render(item)
                            : String((item as any)[column.key] ?? '')}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Actions row */}
                  {actionCol && (
                    <div className="flex justify-end pt-1">
                      {actionCol.render ? actionCol.render(item) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={pageSize}
              totalItems={filtered.length}
            />
          )}
        </>
      )}
    </div>
  );
}
