import { useState, useEffect, useCallback, useRef } from "react";
import type { AgGridReact } from "ag-grid-react";
import type {
  GridReadyEvent,
  SelectionChangedEvent,
  CellValueChangedEvent,
} from "ag-grid-community";
import {
  transformSampleData,
  type SampleDataRowData,
  type NonSampleFieldData,
} from "@/lib/sample-data-utils";

interface UseSampleDataGridProps {
  categorizedSections?: {
    collectedSampleDataInfo: any[];
  };
}

export const useSampleDataGrid = ({
  categorizedSections,
}: UseSampleDataGridProps) => {
  const gridRef = useRef<AgGridReact>(null);
  const [sampleData, setSampleData] = useState<SampleDataRowData[]>([]);
  const [nonSampleData, setNonSampleData] = useState<NonSampleFieldData[]>([]);
  const [selectedRows, setSelectedRows] = useState<SampleDataRowData[]>([]);
  const [quickFilterText, setQuickFilterText] = useState("");

  // Load data when categorizedSections changes
  useEffect(() => {
    if (categorizedSections) {
      const { sampleRows, nonSampleFields } = transformSampleData(
        categorizedSections.collectedSampleDataInfo || []
      );
      setNonSampleData(nonSampleFields);
      setSampleData(sampleRows);
    }
  }, [categorizedSections]);

  // Grid event handlers
  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
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
    const newRow: SampleDataRowData = {
      id: `new_${Date.now()}`,
      customerSampleId: "",
      matrix: "",
      compositeStartDate: "",
      compositeStartTime: "",
      method: "",
    };

    // Use AG Grid's transaction API to add row without full re-render
    if (gridRef.current?.api) {
      const transaction = { add: [newRow] };
      gridRef.current.api.applyTransaction(transaction);

      // Update React state
      setSampleData((prev) => [...prev, newRow]);

      // Start editing the new row
      setTimeout(() => {
        if (gridRef.current?.api) {
          const rowIndex = gridRef.current.api.getDisplayedRowCount() - 1;
          gridRef.current.api.ensureIndexVisible(rowIndex);
          gridRef.current.api.startEditingCell({
            rowIndex,
            colKey: "customerSampleId",
          });
        }
      }, 50);
    }
  }, []);

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
  };
};
