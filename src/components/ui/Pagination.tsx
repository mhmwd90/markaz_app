import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  pageSize?: number;
}

export function Pagination({ page, totalPages, onPageChange, total, pageSize }: PaginationProps) {
  if (totalPages <= 1) return null;
  const start = total && pageSize ? (page - 1) * pageSize + 1 : 0;
  const end = total && pageSize ? Math.min(page * pageSize, total) : 0;

  return (
    <div className="flex items-center justify-between gap-2 px-1 py-3">
      {total != null && (
        <p className="text-sm text-slate-500">
          {total > 0 ? `Showing ${start}–${end} of ${total}` : "No results"}
        </p>
      )}
      <div className="ms-auto flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className={cn("rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800")}
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={cn("rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 text-sm text-slate-600 dark:text-slate-400">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={cn("rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className={cn("rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800")}
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
