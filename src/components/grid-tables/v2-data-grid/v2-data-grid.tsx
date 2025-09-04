"use client";

import { useMemo, forwardRef, useImperativeHandle, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import styles from "./V2DataGrid.module.css";
import { ColumnToggle } from "./ColumnToggle";

// Extracted components and utilities
import { V2DataGridHeader } from "./V2DataGridHeader";
import { getV2DataColumnDefs, defaultColDef } from "./grid-config";
import { useV2DataGrid } from "@/hooks/useV2DataGrid";

ModuleRegistry.registerModules([AllCommunityModule]);

interface V2DataGridProps {
    extractedFields?: any[];
    onFieldChange?: (index: number, value: string) => void;
    onRemoveField?: (index: number) => void;
    onExportData?: (data: any[]) => void;
}

export const V2DataGrid = forwardRef<
    { handleExportData: () => void; getCurrentData: () => any[] },
    V2DataGridProps
>(function V2DataGrid({
    extractedFields = [],
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
    } = useV2DataGrid({
        extractedFields,
        onFieldChange,
        onRemoveField,
        onExportData,
    });

    // Column visibility state
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

    // Get column definitions and manage visibility
    const columnDefs = useMemo(() => {
        const cols = getV2DataColumnDefs(onFieldChange);
        return cols.map(col => ({
            ...col,
            hide: col.field ? columnVisibility[col.field] === false : false
        }));
    }, [onFieldChange, columnVisibility]);

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
        <Card>
            <V2DataGridHeader
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
                                pagination={false}
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
