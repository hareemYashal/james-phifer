import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export const ActionsCellRenderer = (params: any) => {
  const { onRemoveField } = params.context || {};

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this row?')) {
      // Check if this is a newly added row (originalIndex === -1)
      if (params.data.originalIndex === -1) {
        // Use AG Grid transaction API for new rows
        if (params.api) {
          params.api.applyTransaction({ remove: [params.data] });
        }
      } else if (
        onRemoveField &&
        params.data.sectionType !== undefined &&
        params.data.originalIndex !== undefined
      ) {
        // Use field removal for existing rows
        onRemoveField(params.data.sectionType, params.data.originalIndex);
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 rounded-full"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
