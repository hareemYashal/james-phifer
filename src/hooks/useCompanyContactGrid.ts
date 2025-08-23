import { useState, useEffect, useCallback, useRef } from "react";
import type { AgGridReact } from "ag-grid-react";
import type {
  GridReadyEvent,
  SelectionChangedEvent,
  CellValueChangedEvent,
} from "ag-grid-community";
import { 
  transformCompanyContactData, 
  getSampleCompanyContactData,
  type CompanyContactRowData 
} from "@/lib/company-contact-utils";

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
  onRemoveField 
}: UseCompanyContactGridProps) => {
  const gridRef = useRef<AgGridReact>(null);
  const [companyContactData, setCompanyContactData] = useState<CompanyContactRowData[]>([]);
  const [selectedRows, setSelectedRows] = useState<CompanyContactRowData[]>([]);
  const [quickFilterText, setQuickFilterText] = useState("");

  // Load data when categorizedSections changes
  useEffect(() => {
    if (categorizedSections) {
      const companyContactTransformed = transformCompanyContactData(
        categorizedSections.companyLocationInfo || [],
        categorizedSections.contactProjectInfo || []
      );

      // If no real data, add some sample data to show the table working
      if (companyContactTransformed.length === 0) {
        setCompanyContactData(getSampleCompanyContactData());
      } else {
        setCompanyContactData(companyContactTransformed);
      }
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
    
    // Update the local state when cells are edited
    const updatedData = companyContactData.map(row => 
      row.id === event.data.id ? { ...row, [event.colDef.field!]: event.newValue } : row
    );
    setCompanyContactData(updatedData);

    // Call the original onFieldChange callback for value field only
    if (event.colDef.field === "value" && onFieldChange && 
        event.data.sectionType && event.data.originalIndex !== undefined) {
      onFieldChange(
        event.data.sectionType,
        event.data.originalIndex,
        event.newValue
      );
    }
  }, [companyContactData, onFieldChange]);

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

    // Update React state to persist the new row
    const updatedData = [...companyContactData, newRow];
    setCompanyContactData(updatedData);

    // Start editing the new row after state update
    setTimeout(() => {
      gridRef.current?.api.startEditingCell({
        rowIndex: updatedData.length - 1,
        colKey: "fieldName",
      });
    }, 100);
  }, [companyContactData]);

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
