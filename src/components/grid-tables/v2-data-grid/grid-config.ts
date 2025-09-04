import type { ColDef } from "ag-grid-community";
import { ConfidenceCellRenderer } from "./ConfidenceCellRenderer";
import { ActionsCellRenderer } from "./ActionsCellRenderer";

// Column definitions for V2DataGrid
export const getV2DataColumnDefs = (
  onFieldChange?: (index: number, value: string) => void
): ColDef[] => [
  {
    field: "fieldName",
    headerName: "Field Name",
    width: 250,
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
  },
  // {
  //     field: "type",
  //     headerName: "Type",
  //     width: 150,
  //     filter: "agSetColumnFilter",
  //     sortable: true,
  //     editable: false,
  // },
  // {
  //     field: "section",
  //     headerName: "Section",
  //     width: 200,
  //     filter: "agSetColumnFilter",
  //     sortable: true,
  //     editable: false,
  // },
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
