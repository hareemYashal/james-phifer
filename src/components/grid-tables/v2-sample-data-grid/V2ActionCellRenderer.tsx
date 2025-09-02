import React from "react";
import type { ICellRendererParams } from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export const V2ActionCellRenderer: React.FC<ICellRendererParams> = ({ data, api }) => {
    const onDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (data && api) {
            // Use confirm dialog to prevent accidental deletion
            if (window.confirm('Are you sure you want to delete this row?')) {
                api.applyTransaction({ remove: [data] });
            }
        }
    };

    return (
        <div className="flex justify-center items-center h-full">
            <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                onKeyDown={(e) => {
                    // Prevent Enter key from triggering button click
                    if (e.key === 'Enter') {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                }}
                tabIndex={-1} // Remove from tab order to prevent accidental focus
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 rounded-full"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
};



