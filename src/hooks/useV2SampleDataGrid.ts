import { useState, useEffect, useCallback, useRef } from "react";
import type { AgGridReact } from "ag-grid-react";
import type {
  GridReadyEvent,
  SelectionChangedEvent,
  CellValueChangedEvent,
  ColDef,
} from "ag-grid-community";
import {
  transformV2SampleData,
  createEmptyRow,
  type V2SampleDataRowData,
} from "@/lib/v2-sample-data-utils";
import type { ExtractedField } from "@/lib/sample-data-extraction-utils";

interface UseV2SampleDataGridProps {
  extractedFields?: ExtractedField[];
  onExportData?: (sampleData: any[]) => void;
}

export const useV2SampleDataGrid = ({
  extractedFields,
  onExportData,
}: UseV2SampleDataGridProps) => {
  const gridRef = useRef<AgGridReact>(null);
  const [sampleData, setSampleData] = useState<V2SampleDataRowData[]>([]);
  const [selectedRows, setSelectedRows] = useState<V2SampleDataRowData[]>([]);
  const [quickFilterText, setQuickFilterText] = useState("");

  // Load data when extractedFields changes
  useEffect(() => {
    if (extractedFields && extractedFields.length > 0) {
      const transformedData = transformV2SampleData(extractedFields);
      setSampleData(transformedData);
    }
  }, [extractedFields]);

  // Export function to get current data directly from grid
  const handleExportData = useCallback(() => {
    if (gridRef.current?.api) {
      // Get ALL rows from grid (including newly added ones)
      const allSampleRows: any[] = [];
      gridRef.current.api.forEachNode((node) => {
        allSampleRows.push(node.data);
      });

      // Call the callback AND return the data
      if (onExportData) {
        onExportData(allSampleRows);
      }
      return { sampleData: allSampleRows };
    }
    return { sampleData: [] };
  }, [onExportData]);

  // Function to get current data synchronously
  const getCurrentData = useCallback(() => {
    if (gridRef.current?.api) {
      const allSampleRows: any[] = [];
      gridRef.current.api.forEachNode((node) => {
        allSampleRows.push(node.data);
      });
      return { sampleData: allSampleRows };
    }
    return { sampleData }; // Fallback to state
  }, [sampleData]);

  // Grid event handlers
  const onGridReady = useCallback((params: GridReadyEvent) => {
    // Ensure horizontal scrollbar appears when needed
    params.api.setGridOption("alwaysShowHorizontalScroll", false);
    params.api.setGridOption("suppressHorizontalScroll", false);
  }, []);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    setSelectedRows(event.api.getSelectedRows());
  }, []);

  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    console.log("Cell value changed:", event);
  }, []);

  // Action handlers
  const handleExport = useCallback(() => {
    console.log("Exporting sample data...", sampleData);
  }, [sampleData]);

  const handleAddRow = useCallback(() => {
    // Create a new row with dynamic fields based on the existing sample data
    const newRow = createEmptyRow(sampleData);

    // Use AG Grid's transaction API to add row without full re-render
    if (gridRef.current?.api) {
      const transaction = { add: [newRow] };
      gridRef.current.api.applyTransaction(transaction);

      // Update React state
      setSampleData((prev) => [...prev, newRow]);

      // Start editing the new row - use the first available column
      setTimeout(() => {
        if (gridRef.current?.api) {
          const rowIndex = gridRef.current.api.getDisplayedRowCount() - 1;
          gridRef.current.api.ensureIndexVisible(rowIndex);

          // Get the first editable column
          const columnDefs = gridRef.current.api.getColumnDefs();
          const firstEditableColumn = columnDefs?.find((col) => {
            // Check if it's a ColDef (not ColGroupDef) and has the properties we need
            return (
              "field" in col &&
              "editable" in col &&
              col.editable !== false &&
              col.field
            );
          }) as ColDef | undefined;

          if (firstEditableColumn?.field) {
            gridRef.current.api.startEditingCell({
              rowIndex,
              colKey: firstEditableColumn.field,
            });
          }
        }
      }, 50);
    }
  }, [sampleData]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedRows.length > 0) {
      const selectedIds = selectedRows.map((row) => row.id);
      const updatedData = sampleData.filter(
        (row) => !selectedIds.includes(row.id)
      );
      setSampleData(updatedData);
      setSelectedRows([]);
    }
  }, [selectedRows, sampleData]);

  return {
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
  };
};
