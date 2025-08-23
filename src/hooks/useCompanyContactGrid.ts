import {
  transformCompanyContactData,
  type CompanyContactRowData,
} from "@/lib/company-contact-utils";
import type {
  CellValueChangedEvent,
  GridReadyEvent,
  SelectionChangedEvent,
} from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseCompanyContactGridProps {
  categorizedSections?: {
    companyLocationInfo: any[];
    contactProjectInfo: any[];
  };
  onFieldChange?: (sectionType: string, index: number, value: string) => void;
  onRemoveField?: (sectionType: string, index: number) => void;
}

export const useCompanyContactGrid = ({
  categorizedSections,
  onFieldChange,
  onRemoveField,
}: UseCompanyContactGridProps) => {
  const gridRef = useRef<AgGridReact>(null);
  const [companyContactData, setCompanyContactData] = useState<
    CompanyContactRowData[]
  >([]);
  const [selectedRows, setSelectedRows] = useState<CompanyContactRowData[]>([]);
  const [quickFilterText, setQuickFilterText] = useState("");

  // Load data when categorizedSections changes
  useEffect(() => {
    if (categorizedSections) {
      const companyContactTransformed = transformCompanyContactData(
        categorizedSections.companyLocationInfo || [],
        categorizedSections.contactProjectInfo || []
      );

      setCompanyContactData(companyContactTransformed);
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
      if (
        event.colDef.field === "value" &&
        onFieldChange &&
        event.data.sectionType &&
        event.data.originalIndex !== undefined
      ) {
        onFieldChange(
          event.data.sectionType,
          event.data.originalIndex,
          event.newValue
        );
      }
    },
    [onFieldChange]
  );

  // Action handlers
  const handleExport = useCallback(() => {
    console.log("Exporting company contact data...", companyContactData);
  }, [companyContactData]);

  const handleAddRow = useCallback(() => {
    const newRow: CompanyContactRowData = {
      id: `new_${Date.now()}`,
      fieldName: "",
      value: "",
      confidence: 1.0,
      section: "Company & Location Information",
      sectionType: "companyLocationInfo",
      originalIndex: -1, // Mark as new row
    };

    // Use AG Grid's transaction API to add row without full re-render
    if (gridRef.current?.api) {
      const transaction = { add: [newRow] };
      gridRef.current.api.applyTransaction(transaction);

      // Update React state
      setCompanyContactData((prev) => [...prev, newRow]);

      // Start editing the new row
      setTimeout(() => {
        if (gridRef.current?.api) {
          const rowIndex = gridRef.current.api.getDisplayedRowCount() - 1;
          gridRef.current.api.ensureIndexVisible(rowIndex);
          gridRef.current.api.startEditingCell({
            rowIndex,
            colKey: "fieldName",
          });
        }
      }, 50);
    }
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedRows.length > 0 && onRemoveField) {
      selectedRows.forEach((row) => {
        if (row.sectionType && row.originalIndex !== undefined) {
          onRemoveField(row.sectionType, row.originalIndex);
        }
      });
      setSelectedRows([]);
    }
  }, [selectedRows, onRemoveField]);

  return {
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
  };
};
