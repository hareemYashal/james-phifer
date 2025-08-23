import { useState, useEffect, useCallback, useRef } from "react";
import type { AgGridReact } from "ag-grid-react";
import type {
  GridReadyEvent,
  SelectionChangedEvent,
  CellValueChangedEvent,
} from "ag-grid-community";
import { transformSampleData, type SampleDataRowData, type NonSampleFieldData } from "@/lib/sample-data-utils";

interface UseSampleDataGridProps {
  categorizedSections?: {
    collectedSampleDataInfo: any[];
  };
}

export const useSampleDataGrid = ({ categorizedSections }: UseSampleDataGridProps) => {
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

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      console.log("Cell value changed:", event);
      // Update the local state when cells are edited
      const updatedData = sampleData.map((row) =>
        row.id === event.data.id
          ? { ...row, [event.colDef.field!]: event.newValue }
          : row
      );
      setSampleData(updatedData);
    },
    [sampleData]
  );

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

    // Update React state to persist the new row
    const updatedData = [...sampleData, newRow];
    setSampleData(updatedData);

    // Start editing the new row after state update
    setTimeout(() => {
      gridRef.current?.api.startEditingCell({
        rowIndex: updatedData.length - 1,
        colKey: "customerSampleId",
      });
    }, 100);
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
