"use client";

import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  };
  onFieldChange?: (sectionType: string, index: number, value: string) => void;
  onRemoveField?: (sectionType: string, index: number) => void;
}

export function CompanyContactGrid({
  categorizedSections = {
    companyLocationInfo: [],
    contactProjectInfo: [],
  },
  onFieldChange,
  onRemoveField,
}: CompanyContactGridProps) {
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
  } = useCompanyContactGrid({
    categorizedSections,
    onFieldChange,
    onRemoveField,
  });

  const columnDefs = useMemo(
    () => getCompanyContactColumnDefs(onFieldChange),
    [onFieldChange]
  );

  return (
    <Card>
      <CompanyContactGridHeader
        selectedRows={selectedRows}
        onAddRow={handleAddRow}
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
                context={{ onRemoveField }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
