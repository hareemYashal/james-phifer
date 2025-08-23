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
    <div className="flex gap-2">
      <Button 
        size="sm" 
        variant="destructive" 
        onClick={onDelete}
        onKeyDown={(e) => {
          // Prevent Enter key from triggering button click
          if (e.key === 'Enter') {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
        tabIndex={-1} // Remove from tab order to prevent accidental focus
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
