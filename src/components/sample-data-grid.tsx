"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { themeQuartz } from "ag-grid-community";
import type {
  ColDef,
  GridReadyEvent,
  SelectionChangedEvent,
  CellValueChangedEvent,
} from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Download } from "lucide-react";

ModuleRegistry.registerModules([AllCommunityModule]);

// Data interface
interface SampleDataRowData {
  id: string;
  customerSampleId: string;
  matrix: string;
  compositeStartDate: string;
  compositeStartTime: string;
  method: string;
}

interface SampleDataGridProps {
  categorizedSections?: {
    collectedSampleDataInfo: any[];
  };
  onFieldChange?: (sectionType: string, index: number, value: string) => void;
  onRemoveField?: (sectionType: string, index: number) => void;
}

// Custom cell renderers
const ActionsCellRenderer = (params: any) => {
  const { onRemoveField } = params.context || {};

  const onDelete = () => {
    if (
      onRemoveField &&
      params.data.sectionType !== undefined &&
      params.data.originalIndex !== undefined
    ) {
      onRemoveField(params.data.sectionType, params.data.originalIndex);
    }
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Helper function to transform data
const transformSampleData = (
  collectedSampleDataInfo: any[]
): SampleDataRowData[] => {
  // Group sample data by sample ID
  const sampleGroups: { [key: string]: any } = {};

  collectedSampleDataInfo.forEach((item) => {
    const type = item.type;

    // Extract sample number from field names like 'customer_sample_id_1', 'customer_sample_id_1_matrix', etc.
    const sampleMatch = type.match(/customer_sample_id_(\d+)(?:_(.+))?/);
    if (sampleMatch) {
      const sampleNum = sampleMatch[1];
      const fieldType = sampleMatch[2] || "id";

      if (!sampleGroups[sampleNum]) {
        sampleGroups[sampleNum] = {
          id: `sample_${sampleNum}`,
          customerSampleId: "",
          matrix: "",
          compositeStartDate: "",
          compositeStartTime: "",
          method: "",
        };
      }

      if (fieldType === "id" || !fieldType) {
        sampleGroups[sampleNum].customerSampleId = item.value || "";
      } else if (fieldType === "matrix") {
        sampleGroups[sampleNum].matrix = item.value || "";
      } else if (fieldType === "comp") {
        // Handle composite date/time - you might need to parse this
        const compValue = item.value || "";
        if (compValue.includes(" ")) {
          const [date, time] = compValue.split(" ");
          sampleGroups[sampleNum].compositeStartDate = date;
          sampleGroups[sampleNum].compositeStartTime = time;
        } else {
          sampleGroups[sampleNum].compositeStartDate = compValue;
        }
      }
    }
  });

  return Object.values(sampleGroups).filter((group) => group.customerSampleId);
};

export function SampleDataGrid({
  categorizedSections = {
    collectedSampleDataInfo: [],
  },
  onFieldChange,
  onRemoveField,
}: SampleDataGridProps) {
  const [sampleData, setSampleData] = useState<SampleDataRowData[]>([]);
  const [selectedRows, setSelectedRows] = useState<SampleDataRowData[]>([]);
  const [quickFilterText, setQuickFilterText] = useState("");

  // Column definitions
  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "customerSampleId",
        headerName: "Customer Sample ID",
        width: 180,
        pinned: "left",
        filter: "agTextColumnFilter",
        sortable: true,
        editable: true,
      },
      {
        field: "matrix",
        headerName: "Matrix",
        width: 120,
        filter: "agTextColumnFilter",
        sortable: true,
        editable: true,
      },
      {
        field: "compositeStartDate",
        headerName: "Composite Start(Date)",
        width: 180,
        filter: "agDateColumnFilter",
        sortable: true,
        editable: true,
      },
      {
        field: "compositeStartTime",
        headerName: "Composite Start(Time)",
        width: 180,
        filter: "agTextColumnFilter",
        sortable: true,
        editable: true,
      },
      {
        field: "method",
        headerName: "Method",
        width: 120,
        filter: "agTextColumnFilter",
        sortable: true,
        editable: true,
      },
      {
        headerName: "Actions",
        width: 100,
        cellRenderer: ActionsCellRenderer,
        pinned: "right",
        sortable: false,
        filter: false,
      },
    ],
    []
  );

  // Default column properties
  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      minWidth: 100,
      flex: 1,
    }),
    []
  );

  // Load data when categorizedSections changes
  useEffect(() => {
    if (categorizedSections) {
      const sampleTransformed = transformSampleData(
        categorizedSections.collectedSampleDataInfo || []
      );

      // If no real sample data, add some sample data
      if (sampleTransformed.length === 0) {
        const sampleDataRows: SampleDataRowData[] = [
          {
            id: "sample_1",
            customerSampleId: "MW-01",
            matrix: "GW G",
            compositeStartDate: "4-6-24",
            compositeStartTime: "8:00",
            method: "TCL 8260",
          },
          {
            id: "sample_2",
            customerSampleId: "MW-01",
            matrix: "GW G",
            compositeStartDate: "4-6-24",
            compositeStartTime: "8:00",
            method: "TCL 8270",
          },
          {
            id: "sample_3",
            customerSampleId: "MW-01",
            matrix: "GW G",
            compositeStartDate: "4-6-24",
            compositeStartTime: "8:00",
            method: "8015",
          },
          {
            id: "sample_4",
            customerSampleId: "MW-02",
            matrix: "GWG",
            compositeStartDate: "4-6-24",
            compositeStartTime: "8:15",
            method: "TCL 8270",
          },
          {
            id: "sample_5",
            customerSampleId: "MW-02",
            matrix: "GWG",
            compositeStartDate: "4-6-24",
            compositeStartTime: "8:15",
            method: "8015",
          },
          {
            id: "sample_6",
            customerSampleId: "MW-22",
            matrix: "GWG",
            compositeStartDate: "4-6-24",
            compositeStartTime: "8:30",
            method: "TCL 8270",
          },
          {
            id: "sample_7",
            customerSampleId: "MW-22",
            matrix: "GWG",
            compositeStartDate: "4-6-24",
            compositeStartTime: "8:30",
            method: "8015",
          },
          {
            id: "sample_8",
            customerSampleId: "Sw-12",
            matrix: "SWG",
            compositeStartDate: "4-6-24",
            compositeStartTime: "9:00",
            method: "TAL 6020",
          },
          {
            id: "sample_9",
            customerSampleId: "Sw-32",
            matrix: "SWG",
            compositeStartDate: "4-6-24",
            compositeStartTime: "9:30",
            method: "",
          },
          {
            id: "sample_10",
            customerSampleId: "SS-01",
            matrix: "SSC",
            compositeStartDate: "4-7-24",
            compositeStartTime: "11:00",
            method: "",
          },
        ];
        setSampleData(sampleDataRows);
      } else {
        setSampleData(sampleTransformed);
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
  }, []);

  // Action handlers
  const handleExport = () => {
    console.log("Exporting sample data...", sampleData);
  };

  const handleDeleteSelected = () => {
    if (selectedRows.length > 0) {
      // Handle sample data deletion if needed
      setSelectedRows([]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Collected Sample Data Information and Analysis Request</span>
          <div className="flex gap-2">
            <Button onClick={handleExport} size="sm" variant="outline">
              <Download className="h-4 w-4" />
              Export
            </Button>
            {selectedRows.length > 0 && (
              <Button
                onClick={handleDeleteSelected}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedRows.length})
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {selectedRows.length > 0 && (
            <Badge variant="secondary">
              {selectedRows.length} row{selectedRows.length !== 1 ? "s" : ""}{" "}
              selected
            </Badge>
          )}

          {/* AG Grid */}
          <div className="w-full overflow-hidden border rounded-lg">
            <div style={{ height: "400px", width: "100%" }}>
              <AgGridReact
                theme={themeQuartz}
                rowData={sampleData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
                onCellValueChanged={onCellValueChanged}
                rowSelection="multiple"
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                quickFilterText={quickFilterText}
                animateRows={true}
                loading={false}
                suppressHorizontalScroll={false}
                context={{ onRemoveField }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
