import React from "react";
import type { ICellRendererParams } from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export const ActionCellRenderer: React.FC<ICellRendererParams> = ({ data, api }) => {
  const onDelete = () => {
    if (data && api) {
      api.applyTransaction({ remove: [data] });
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
