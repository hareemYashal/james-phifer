import type { ColDef } from "ag-grid-community";
import {
  extractSampleDataFromFields,
  getSampleDataColumns,
  type ExtractedField,
} from "./sample-data-extraction-utils";

// Data interfaces for V2 Sample Data Grid - now dynamic
export interface V2SampleDataRowData {
  id: string;
  [key: string]: any; // Allow dynamic properties
}

// Generate dynamic column definitions based on extracted sample data
export const generateDynamicColumnDefs = (
  extractedFields: ExtractedField[],
  ActionCellRenderer?: any
): ColDef[] => {
  // Extract sample data from extracted fields
  const sampleData = extractSampleDataFromFields(extractedFields);

  if (!sampleData || sampleData.length === 0) {
    return [];
  }

  // Get all unique columns from the sample data
  const columns = getSampleDataColumns(sampleData);
  const columnDefs: ColDef[] = [];

  // Create column definitions for each column
  columns.forEach((columnName, index) => {
    columnDefs.push({
      field: columnName,
      //capitalize the first letter of each word
      headerName: columnName
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      cellDataType: "text",
      width: Math.max(120, Math.min(250, columnName.length * 10 + 80)), // Dynamic width based on content
      filter: "agTextColumnFilter",
      sortable: true,
      editable: true,
      headerTooltip: columnName,
      // Pin the Customer Sample ID column to the left for better UX
      ...(columnName === "Customer Sample ID" ? { pinned: "left" } : {}),
    });
  });

  // Add Actions column at the end if ActionCellRenderer is provided
  if (ActionCellRenderer) {
    columnDefs.push({
      headerName: "Actions",
      colId: "actions",
      width: 100,
      cellRenderer: ActionCellRenderer,
      pinned: "right",
      sortable: false,
      filter: false,
      resizable: false,
      headerTooltip: "Row actions",
    });
  }

  return columnDefs;
};

// Transform extracted fields to AG Grid sample data format
export const transformV2SampleData = (
  extractedFields: ExtractedField[]
): V2SampleDataRowData[] => {
  if (!extractedFields || extractedFields.length === 0) {
    return [];
  }

  // Extract sample data using the new utility
  const sampleData = extractSampleDataFromFields(extractedFields);

  return sampleData.map((item) => {
    const transformedItem: V2SampleDataRowData = {
      id: item.id,
    };

    // Transform all properties from the sample data
    Object.keys(item).forEach((key) => {
      if (key !== "id" && key !== "sampleId") {
        transformedItem[key] = item[key] || "";
      }
    });

    return transformedItem;
  });
};

// Helper function to create a new empty row with all the dynamic fields
export const createEmptyRow = (
  existingSampleData: V2SampleDataRowData[]
): V2SampleDataRowData => {
  if (!existingSampleData || existingSampleData.length === 0) {
    return {
      id: `new_${Date.now()}`,
    };
  }

  const firstItem = existingSampleData[0];
  const emptyRow: V2SampleDataRowData = {
    id: `new_${Date.now()}`,
  };

  // Create empty fields for all columns found in the existing data
  Object.keys(firstItem).forEach((key) => {
    if (key !== "id") {
      emptyRow[key] = "";
    }
  });

  return emptyRow;
};
