import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getPageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // If total pages are 7 or less, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Show ellipsis or numbers after first page
      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show current page and surrounding pages
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }

      // Show ellipsis or numbers before last page
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className="flex items-center justify-center space-x-1.5 bg-white rounded-lg p-1.5 shadow-sm"
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-md transition-all duration-200",
          "hover:bg-gray-100 hover:text-gray-900",
          "focus:ring-2 focus:ring-gray-200 focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        )}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center space-x-1.5">
        {getPageNumbers().map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <div
                key={`ellipsis-${index}`}
                className="flex items-center justify-center w-9 h-9"
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </div>
            );
          }

          return (
            <Button
              key={page}
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-md text-sm font-medium transition-all duration-200",
                currentPage === page
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                "focus:ring-2 focus:ring-gray-200 focus:outline-none"
              )}
              onClick={() => onPageChange(page as number)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-md transition-all duration-200",
          "hover:bg-gray-100 hover:text-gray-900",
          "focus:ring-2 focus:ring-gray-200 focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        )}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
} 