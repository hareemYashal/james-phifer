import type { ColDef } from "ag-grid-community";
import { V2ActionCellRenderer } from "./V2ActionCellRenderer";
import { generateDynamicColumnDefs } from "@/lib/v2-sample-data-utils";
import type { ExtractedField } from "@/lib/sample-data-extraction-utils";

// Dynamic column definitions for V2 Sample Data Grid
export const getColumnDefs = (extractedFields?: ExtractedField[]): ColDef[] => {
  // If no data is provided, return empty array
  if (!extractedFields || extractedFields.length === 0) {
    return [];
  }

  // Generate dynamic columns based on the extracted fields
  return generateDynamicColumnDefs(extractedFields, V2ActionCellRenderer);
};

// Fallback static column definitions (kept for reference/fallback)

// Default column properties
export const defaultColDef: ColDef = {
  resizable: true,
  sortable: true,
  filter: true,
  suppressSizeToFit: true,
};
