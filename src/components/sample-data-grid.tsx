"use client";

import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import styles from "./SampleDataGrid.module.css";

// Extracted components and utilities
import { SampleDataGridHeader } from "./sample-data-grid/SampleDataGridHeader";
import { NonSampleFields } from "./sample-data-grid/NonSampleFields";
import { getColumnDefs, defaultColDef } from "./sample-data-grid/grid-config";
import { useSampleDataGrid } from "@/hooks/useSampleDataGrid";

ModuleRegistry.registerModules([AllCommunityModule]);

interface SampleDataGridProps {
  categorizedSections?: {
    collectedSampleDataInfo: any[];
  };
  onFieldChange?: (sectionType: string, index: number, value: string) => void;
  onRemoveField?: (sectionType: string, index: number) => void;
}

export function SampleDataGrid({
  categorizedSections = {
    collectedSampleDataInfo: [],
  },
  onFieldChange,
  onRemoveField,
}: SampleDataGridProps) {
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
  } = useSampleDataGrid({ categorizedSections });

  const columnDefs = useMemo(() => getColumnDefs(), []);

  return (
    <Card className="w-full shadow-lg border-0 bg-white">
      <SampleDataGridHeader
        selectedRows={selectedRows}
        onAddRow={handleAddRow}
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
