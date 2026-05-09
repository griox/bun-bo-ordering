'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function AdminPagination({
    currentPage,
    totalPages,
    onPageChange,
    className,
}: PaginationProps) {
    const safeTotalPages = isNaN(totalPages) ? 0 : totalPages;
    if (safeTotalPages <= 1) return null;

    const renderPageButtons = () => {
        const pages = [];
        const maxVisible = 5;

        if (safeTotalPages <= maxVisible) {
            for (let i = 0; i < safeTotalPages; i++) {
                pages.push(i);
            }
        } else {
            // Logic for ellipsis
            pages.push(0);
            if (currentPage > 2) pages.push('ellipsis-start');

            const start = Math.max(1, currentPage - 1);
            const end = Math.min(safeTotalPages - 2, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < safeTotalPages - 3) pages.push('ellipsis-end');
            if (!pages.includes(safeTotalPages - 1)) pages.push(safeTotalPages - 1);
        }

        return pages.map((p, idx) => {
            if (typeof p === 'string') {
                return (
                    <div key={`ellipsis-${idx}`} className="flex items-center justify-center size-9 text-gray-400">
                        <MoreHorizontal className="size-4" />
                    </div>
                );
            }

            return (
                <Button
                    key={p}
                    variant={currentPage === p ? 'default' : 'ghost'}
                    size="icon"
                    className={cn(
                        "size-9 rounded-xl text-xs font-bold transition-all",
                        currentPage === p 
                            ? "bg-red-500 text-white shadow-md hover:bg-red-600" 
                            : "text-gray-500 hover:bg-gray-100"
                    )}
                    onClick={() => onPageChange(p)}
                >
                    {p + 1}
                </Button>
            );
        });
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-xl border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 transition-all"
                disabled={currentPage === 0}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <ChevronLeft className="size-4 text-gray-600" />
            </Button>

            <div className="flex items-center gap-1">
                {renderPageButtons()}
            </div>

            <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-xl border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 transition-all"
                disabled={currentPage >= safeTotalPages - 1}
                onClick={() => onPageChange(currentPage + 1)}
            >
                <ChevronRight className="size-4 text-gray-600" />
            </Button>
        </div>
    );
}
