"use client";

import { useMemo, forwardRef, useImperativeHandle, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import styles from "./V2SampleDataGrid.module.css";

// Extracted components and utilities
import { V2SampleDataGridHeader } from "./V2SampleDataGridHeader";
import { getColumnDefs, defaultColDef } from "./grid-config";
import { useV2SampleDataGrid } from "@/hooks/useV2SampleDataGrid";
import { Input } from "@/components/ui/input";
import { ColumnToggle } from "./ColumnToggle";

ModuleRegistry.registerModules([AllCommunityModule]);

interface V2SampleDataGridProps {
    sampleDataArray?: any[];
    onExportData?: (sampleData: any[]) => void;
}

export const V2SampleDataGrid = forwardRef<
    { handleExportData: () => void; getCurrentData: () => { sampleData: any[] } },
    V2SampleDataGridProps
>(function V2SampleDataGrid({
    sampleDataArray = [],
    onExportData,
}, ref) {
    const {
        gridRef,
        sampleData,
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
    } = useV2SampleDataGrid({ sampleDataArray, onExportData });

    // Column visibility state
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

    // Get column definitions and manage visibility
    const columnDefs = useMemo(() => {
        const cols = getColumnDefs(sampleDataArray);
        return cols.map(col => ({
            ...col,
            hide: col.field ? columnVisibility[col.field] === false : false
        }));
    }, [sampleDataArray, columnVisibility]);

    // Handle column visibility toggle
    const handleColumnToggle = (field: string, visible: boolean) => {
        setColumnVisibility(prev => ({
            ...prev,
            [field]: visible
        }));
    };

    // Expose functions to parent via ref
    useImperativeHandle(ref, () => ({
        handleExportData,
        getCurrentData,
    }), [handleExportData, getCurrentData]);

    return (
        <Card className="w-full shadow-lg border-0 bg-white">
            <V2SampleDataGridHeader
                selectedRows={selectedRows}
                onExport={handleExport}
                onDeleteSelected={handleDeleteSelected}
            />
            <CardContent>
                <div className="space-y-4">
                    {/* Quick Filter */}
                    <div className="flex items-center gap-4 mt-5">
                        <Input
                            placeholder="Quick filter..."
                            value={quickFilterText}
                            onChange={(e) => setQuickFilterText(e.target.value)}
                            className="max-w-sm"
                        />
                        <ColumnToggle
                            columns={columnDefs.map(col => ({
                                field: col.field || '',
                                headerName: (col.headerName as string) || col.field || ''
                            }))}
                            visibleMap={columnVisibility}
                            onToggle={handleColumnToggle}
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
                    <div className="w-full border border-gray-200 rounded-xl shadow-sm">
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
                                pagination={false}
                                quickFilterText={quickFilterText}
                                animateRows={true}
                                loading={false}
                                suppressHorizontalScroll={false}
                                alwaysShowHorizontalScroll={true}
                                enterNavigatesVertically={true}
                                enterNavigatesVerticallyAfterEdit={true}
                                domLayout="autoHeight"
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

