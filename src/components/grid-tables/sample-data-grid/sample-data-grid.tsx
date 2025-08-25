"use client";

import { useMemo, forwardRef, useImperativeHandle } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import styles from "./SampleDataGrid.module.css";

// Extracted components and utilities
import { SampleDataGridHeader } from "./SampleDataGridHeader";
import { NonSampleFields } from "./NonSampleFields";
import { getColumnDefs, defaultColDef } from "./grid-config";
import { useSampleDataGrid } from "@/hooks/useSampleDataGrid";
import { Input } from "@/components/ui/input";

ModuleRegistry.registerModules([AllCommunityModule]);

interface SampleDataGridProps {
  categorizedSections?: {
    collectedSampleDataInfo: any[];
  };
  onFieldChange?: (sectionType: string, index: number, value: string) => void;
  onRemoveField?: (sectionType: string, index: number) => void;
  onExportData?: (sampleData: any[], nonSampleData: any[]) => void;
}

export const SampleDataGrid = forwardRef<
  { handleExportData: () => void; getCurrentData: () => { sampleData: any[]; nonSampleData: any[] } },
  SampleDataGridProps
>(function SampleDataGrid({
  categorizedSections = {
    collectedSampleDataInfo: [],
  },
  onFieldChange,
  onRemoveField,
  onExportData,
}, ref) {
  const {
    gridRef,
    sampleData,
    nonSampleData,
    selectedRows,
    quickFilterText,
    setQuickFilterText,
    onGridReady,
    onSelectionChanged,
    onCellValueChanged,
    handleExport,
    handleAddRow,
    handleDeleteSelected,
    handleExportData,
    getCurrentData,
  } = useSampleDataGrid({ categorizedSections, onExportData });

  const columnDefs = useMemo(() => getColumnDefs(), []);

  // Expose functions to parent via ref
  useImperativeHandle(ref, () => ({
    handleExportData,
    getCurrentData,
  }), [handleExportData, getCurrentData]);

  return (
    <Card className="w-full shadow-lg border-0 bg-white">
      <SampleDataGridHeader
        selectedRows={selectedRows}
        onExport={handleExport}
        onDeleteSelected={handleDeleteSelected}
      />
      <CardContent>
        <div className="space-y-4">
          <NonSampleFields
            nonSampleData={nonSampleData}
            onFieldChange={onFieldChange}
            onRemoveField={onRemoveField}
          />

          {/* Quick Filter */}
          <div className="flex items-center gap-4">
            <Input
              placeholder="Quick filter..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="max-w-sm"
            />
            {selectedRows.length > 0 && (
              <Badge variant="secondary">
                {selectedRows.length} row{selectedRows.length !== 1 ? "s" : ""}{" "}
                selected
              </Badge>
            )}
          </div>

          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 border-blue-200"
              >
                {selectedRows.length} row{selectedRows.length !== 1 ? "s" : ""}{" "}
                selected
              </Badge>
            </div>
          )}

          {/* AG Grid */}
          <div className="w-full overflow-hidden border border-gray-200 rounded-xl shadow-sm">
            <div
              className={`ag-theme-quartz ${styles.grid} ${styles.gridWithBorders} ${styles.gridHeight}`}
            >
              <AgGridReact
                ref={gridRef}
                theme="legacy"
                rowData={sampleData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
                onCellValueChanged={onCellValueChanged}
                rowSelection="multiple"
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                quickFilterText={quickFilterText}
                animateRows={true}
                loading={false}
                suppressHorizontalScroll={false}
                context={{ onRemoveField }}
                enterNavigatesVertically={true}
                enterNavigatesVerticallyAfterEdit={true}
              />
            </div>
            {/* Add Row Button at Bottom */}
            <div className="flex justify-center py-4 border-t">
              <Button onClick={handleAddRow} size="sm" variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
