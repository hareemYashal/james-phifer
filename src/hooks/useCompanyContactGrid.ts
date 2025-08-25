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
    dataDeliverables: any[];
    containerInfo: any[];
  };
  onFieldChange?: (sectionType: string, index: number, value: string) => void;
  onRemoveField?: (sectionType: string, index: number) => void;
  onExportData?: (data: any[]) => void;
}

export const useCompanyContactGrid = ({
  categorizedSections,
  onFieldChange,
  onRemoveField,
  onExportData,
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
        categorizedSections.contactProjectInfo || [],
        categorizedSections.dataDeliverables || [],
        categorizedSections.containerInfo || []
      );

      setCompanyContactData(companyContactTransformed);
    }
  }, [categorizedSections]);

  // Export function to get current data directly from grid
  const handleExportData = useCallback(() => {
    if (gridRef.current?.api) {
      // Get ALL rows from grid (including newly added ones)
      const allRows: any[] = [];
      gridRef.current.api.forEachNode((node) => {
        allRows.push(node.data);
      });

      // Call the callback AND return the data
      if (onExportData) {
        onExportData(allRows);
      }
      return allRows;
    }
    return [];
  }, [onExportData]);

  // Function to get current data synchronously
  const getCurrentData = useCallback(() => {
    if (gridRef.current?.api) {
      const allRows: any[] = [];
      gridRef.current.api.forEachNode((node) => {
        allRows.push(node.data);
      });
      return allRows;
    }
    return companyContactData; // Fallback to state
  }, [companyContactData]);

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

      // Skip callback for newly added rows to prevent deletion
      if (event.data.originalIndex === -1) {
        console.log("Skipping onFieldChange for new row");
        return;
      }

      if (
        event.colDef.field === "value" &&
        onFieldChange &&
        event.data.sectionType &&
        event.data.originalIndex !== undefined
      ) {
        console.log("Calling onFieldChange for existing row");
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

    console.log('Adding new row:', newRow);

    // Use AG Grid's transaction API to add row without full re-render
    if (gridRef.current?.api) {
      const transaction = { add: [newRow] };
      gridRef.current.api.applyTransaction(transaction);

      // Update React state
      setCompanyContactData((prev) => {
        const updated = [...prev, newRow];
        console.log('Updated company contact data:', updated);
        return updated;
      });

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
    if (selectedRows.length > 0) {
      selectedRows.forEach((row) => {
        // Handle newly added rows (originalIndex === -1) with transaction API
        if (row.originalIndex === -1) {
          if (gridRef.current?.api) {
            gridRef.current.api.applyTransaction({ remove: [row] });
          }
        } else if (onRemoveField && row.sectionType && row.originalIndex !== undefined) {
          // Handle existing rows with field removal
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
    handleExportData,
    getCurrentData,
  };
};
