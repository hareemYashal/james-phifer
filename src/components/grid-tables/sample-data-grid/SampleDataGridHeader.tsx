import React from "react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Download, Trash2 } from "lucide-react";
import type { SampleDataRowData } from "@/lib/sample-data-utils";

interface SampleDataGridHeaderProps {
  selectedRows: SampleDataRowData[];
  onExport: () => void;
  onDeleteSelected: () => void;
}

export const SampleDataGridHeader: React.FC<SampleDataGridHeaderProps> = ({
  selectedRows,
  onExport,
  onDeleteSelected,
}) => {
  return (
    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
          <span className="text-lg font-semibold text-gray-800">
            Sample Data Information
          </span>
        </div>
        <div className="flex gap-2">
          <Button onClick={onExport} size="sm" variant="outline">
            <Download className="h-4 w-4" />
            Export
          </Button>
          {selectedRows.length > 0 && (
            <Button
              onClick={onDeleteSelected}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedRows.length})
            </Button>
          )}
        </div>
      </CardTitle>
    </CardHeader>
  );
};
