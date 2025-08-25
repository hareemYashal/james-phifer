"use client";

import { useMemo, forwardRef, useImperativeHandle } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import styles from "./CompanyContactGrid.module.css";

// Extracted components and utilities
import { CompanyContactGridHeader } from "./CompanyContactGridHeader";
import { getCompanyContactColumnDefs, defaultColDef } from "./grid-config";
import { useCompanyContactGrid } from "@/hooks/useCompanyContactGrid";

ModuleRegistry.registerModules([AllCommunityModule]);

interface CompanyContactGridProps {
  categorizedSections?: {
    companyLocationInfo: any[];
    contactProjectInfo: any[];
    dataDeliverables: any[];
    containerInfo: any[];
  };
  onFieldChange?: (sectionType: string, index: number, value: string) => void;
  onRemoveField?: (sectionType: string, index: number) => void;
  onExportData?: (data: any[]) => void;
}

export const CompanyContactGrid = forwardRef<
  { handleExportData: () => void; getCurrentData: () => any[] },
  CompanyContactGridProps
>(function CompanyContactGrid({
  categorizedSections = {
    companyLocationInfo: [],
    contactProjectInfo: [],
    dataDeliverables: [],
    containerInfo: [],
  },
  onFieldChange,
  onRemoveField,
  onExportData,
}, ref) {
  const {
    gridRef,
    companyContactData,
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
  } = useCompanyContactGrid({
    categorizedSections,
    onFieldChange,
    onRemoveField,
    onExportData,
  });

  const columnDefs = useMemo(
    () => getCompanyContactColumnDefs(onFieldChange),
    [onFieldChange]
  );

  // Expose functions to parent via ref
  useImperativeHandle(ref, () => ({
    handleExportData,
    getCurrentData,
  }), [handleExportData, getCurrentData]);

  return (
    <Card>
      <CompanyContactGridHeader
        selectedRows={selectedRows}
        onExport={handleExport}
        onDeleteSelected={handleDeleteSelected}
      />
      <CardContent>
        <div className="space-y-4">
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

          {/* AG Grid */}
          <div className="w-full overflow-hidden border rounded-lg">
            <div
              className={`ag-theme-quartz ${styles.grid} ${styles.gridWithBorders} ${styles.gridHeight}`}
            >
              <AgGridReact
                ref={gridRef}
                theme="legacy"
                rowData={companyContactData}
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
                enterNavigatesVertically={true}
                enterNavigatesVerticallyAfterEdit={true}
                stopEditingWhenCellsLoseFocus={true}
                context={{ onRemoveField }}
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
