import type { ColDef } from "ag-grid-community";
import { ConfidenceCellRenderer } from "./ConfidenceCellRenderer";
import { ActionsCellRenderer } from "./ActionsCellRenderer";

// Column definitions for CompanyContactGrid
export const getCompanyContactColumnDefs = (onFieldChange?: (sectionType: string, index: number, value: string) => void): ColDef[] => [
  {
    field: "fieldName",
    headerName: "Field Name",
    width: 200,
    pinned: "left",
    filter: "agTextColumnFilter",
    sortable: true,
    editable: true,
  },
  {
    field: "value",
    headerName: "Value",
    width: 300,
    filter: "agTextColumnFilter",
    sortable: true,
    editable: true,
    onCellValueChanged: (params) => {
      // Skip callback for newly added rows to prevent deletion
      if (params.data.originalIndex === -1) {
        return;
      }

      if (
        onFieldChange &&
        params.data.sectionType &&
        params.data.originalIndex !== undefined
      ) {
        onFieldChange(
          params.data.sectionType,
          params.data.originalIndex,
          params.newValue
        );
      }
    },
  },
  {
    field: "section",
    headerName: "Section",
    width: 200,
    filter: "agSetColumnFilter",
    sortable: true,
    editable: true,
    cellEditor: "agSelectCellEditor",
    cellEditorParams: {
      values: ["Company & Location Information", "Contact & Project Information", "Data Deliverables", "Container Information"]
    },
  },
  {
    headerName: "Actions",
    colId: "actions",
    width: 100,
    cellRenderer: ActionsCellRenderer,
    pinned: "right",
    sortable: false,
    filter: false,
    resizable: false,
  },
];

// Default column properties
export const defaultColDef: ColDef = {
  resizable: true,
  sortable: true,
  filter: true,
  minWidth: 100,
  flex: 1,
};
