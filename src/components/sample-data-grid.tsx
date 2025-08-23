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
  ICellRendererParams,
} from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Download } from "lucide-react";
import { formatEntityTypeToDisplayName } from "@/lib/utils";

ModuleRegistry.registerModules([AllCommunityModule]);

// Data interface
interface SampleDataRowData {
  id: string;
  customerSampleId: string;
  matrix: string;
  compositeStartDate: string;
  compositeStartTime: string;
  method: string;
  sectionType?: string;
  originalIndex?: number;
}

interface NonSampleFieldData {
  id: string;
  fieldName: string;
  value: string;
  confidence: number;
  sectionType: string;
  originalIndex: number;
}

interface SampleDataGridProps {
  categorizedSections?: {
    collectedSampleDataInfo: any[];
  };
  onFieldChange?: (sectionType: string, index: number, value: string) => void;
  onRemoveField?: (sectionType: string, index: number) => void;
}

// Custom cell renderers
const ActionCellRenderer: React.FC<ICellRendererParams> = ({ data, api }) => {
  const onDelete = () => {
    if (data && api) {
      api.applyTransaction({ remove: [data] });
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 rounded-full"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Transform data for AG Grid (matching custom table logic exactly)
const transformSampleData = (
  collectedSampleDataInfo: any[]
): {
  sampleRows: SampleDataRowData[];
  nonSampleFields: NonSampleFieldData[];
} => {
  // Group items by sample number (1-10) and separate non-sample fields
  const groupedSamples: Record<string, any> = {};
  const nonSampleFields: NonSampleFieldData[] = [];

  collectedSampleDataInfo.forEach((item, index) => {
    const type = item.type;
    let sampleNumber = "";

    // Extract sample number from field type (matching custom table logic exactly)
    if (type.includes("customer_sample_id_")) {
      const match = type.match(/customer_sample_id_(\d+)(?:_.*)?/);
      if (match) {
        sampleNumber = match[1];
      }
    } else if (type.includes("sample_id_")) {
      const match = type.match(/sample_id_(\d+)_/);
      if (match) {
        sampleNumber = match[1];
      }
    } else if (type.includes("analysis_request_")) {
      const match = type.match(/analysis_request_(\d+)/);
      if (match) {
        sampleNumber = match[1];
      }
    } else if (type.match(/^Sample\d{2}_analysis\d{1,2}$/)) {
      const match = type.match(/^Sample(\d{2})_analysis\d{1,2}$/);
      if (match) {
        sampleNumber = match[1];
      }
    } else {
      // Handle non-sample specific fields like collected_name, collector_signature
      nonSampleFields.push({
        id: `non_sample_${index}`,
        fieldName: formatEntityTypeToDisplayName(type),
        value: item.value || "",
        confidence: item.confidence || 0.9,
        sectionType: "collectedSampleDataInfo",
        originalIndex: index,
      });
    }

    if (sampleNumber) {
      if (!groupedSamples[sampleNumber]) {
        groupedSamples[sampleNumber] = {};
      }
      groupedSamples[sampleNumber][type] = { ...item, originalIndex: index };
    }
  });

  const sampleNumbers = Object.keys(groupedSamples).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );
  const allSampleRows: SampleDataRowData[] = [];

  // Function to separate date and time from combined values (matching custom table)
  const separateDateTime = (value: string) => {
    if (!value) return { date: "", time: "" };
    const datePattern = /^(\d{1,2}[-\/]\d{1,2}[-\/]\d{2})(.*)$/;
    const match = value.match(datePattern);
    if (match) {
      return { date: match[1], time: match[2] };
    }
    return { date: "", time: value };
  };

  sampleNumbers.forEach((sampleNum) => {
    const sample = groupedSamples[sampleNum];
    const sampleId = sample[`customer_sample_id_${sampleNum}`];
    const matrix = sample[`customer_sample_id_${sampleNum}_matrix`];
    const rawStartDate = sample[`customer_sample_id_${sampleNum}_start_date`];
    const rawStartTime = sample[`customer_sample_id_${sampleNum}_start_time`];
    const analysisRequest = sample[`analysis_request_${sampleNum}`];

    // Process startDate and startTime (matching custom table logic)
    let startDate = rawStartDate;
    let startTime = rawStartTime;
    if (rawStartDate?.value) {
      const separated = separateDateTime(rawStartDate.value);
      if (separated.date) {
        startDate = { ...rawStartDate, value: separated.date };
        if (separated.time && !rawStartTime?.value) {
          startTime = {
            ...rawStartDate,
            value: separated.time,
            type: `customer_sample_id_${sampleNum}_start_time`,
            originalIndex: -1,
          };
        }
      }
    }

    // Only process if at least one field exists for this sample
    const hasData =
      sampleId || matrix || startDate || startTime || analysisRequest;
    if (!hasData) return;

    // Find all active analysis methods for this sample (matching custom table logic)
    const activeAnalysisMethods: any[] = [];

    // Check each analysis method (01-10)
    for (let i = 1; i <= 10; i++) {
      const analysisNum = i.toString().padStart(2, "0");
      const fieldType = `Sample${sampleNum.padStart(
        2,
        "0"
      )}_analysis${analysisNum}`;
      let analysisField = sample[fieldType];

      if (!analysisField && groupedSamples[sampleNum.padStart(2, "0")]) {
        analysisField = groupedSamples[sampleNum.padStart(2, "0")][fieldType];
      }

      if (analysisField) {
        const methodValue = analysisField.value || "";
        activeAnalysisMethods.push({
          methodValue,
          analysisField,
          analysisNum,
        });
      }
    }

    // If no active analysis methods, check for fallback analysis_request
    if (activeAnalysisMethods.length === 0) {
      if (analysisRequest) {
        allSampleRows.push({
          id: `${sampleNum}-analysis-request-fallback`,
          customerSampleId: sampleId?.value || "",
          matrix: matrix?.value || "",
          compositeStartDate: startDate?.value || "",
          compositeStartTime: startTime?.value || "",
          method: analysisRequest.value || "",
          sectionType: "collectedSampleDataInfo",
          originalIndex: analysisRequest.originalIndex,
        });
      } else {
        allSampleRows.push({
          id: `${sampleNum}-default`,
          customerSampleId: sampleId?.value || "",
          matrix: matrix?.value || "",
          compositeStartDate: startDate?.value || "",
          compositeStartTime: startTime?.value || "",
          method: "",
          sectionType: "collectedSampleDataInfo",
          originalIndex: sampleId?.originalIndex || 0,
        });
      }
    } else {
      // Create a row for each active analysis method
      activeAnalysisMethods.forEach((method, methodIndex) => {
        allSampleRows.push({
          id: `${sampleNum}-${method.analysisNum}-${methodIndex}`,
          customerSampleId: sampleId?.value || "",
          matrix: matrix?.value || "",
          compositeStartDate: startDate?.value || "",
          compositeStartTime: startTime?.value || "",
          method: method.methodValue,
          sectionType: "collectedSampleDataInfo",
          originalIndex: method.analysisField.originalIndex,
        });
      });
    }
  });

  return { sampleRows: allSampleRows, nonSampleFields };
};

export function SampleDataGrid({
  categorizedSections = {
    collectedSampleDataInfo: [],
  },
  onFieldChange,
  onRemoveField,
}: SampleDataGridProps) {
  const [sampleData, setSampleData] = useState<SampleDataRowData[]>([]);
  const [nonSampleData, setNonSampleData] = useState<NonSampleFieldData[]>([]);
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
        cellRenderer: ActionCellRenderer,
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
      const { sampleRows, nonSampleFields } = transformSampleData(
        categorizedSections.collectedSampleDataInfo || []
      );

      setNonSampleData(nonSampleFields);

      // If no real sample data, add some sample data
      if (sampleRows.length === 0) {
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
        setSampleData(sampleRows);
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
    <Card className="w-full shadow-lg border-0 bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
            <span className="text-lg font-semibold text-gray-800">
              Sample Data Information
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedRows.length > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (gridRef.current?.api) {
                    gridRef.current.api.applyTransaction({
                      remove: selectedRows,
                    });
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedRows.length})
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Non-sample fields */}
          {nonSampleData.length > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-6 w-1 bg-slate-500 rounded-full"></div>
                <h4 className="text-sm font-semibold text-gray-800">
                  General Information
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nonSampleData.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm"
                  >
                    <label className="text-xs font-medium text-gray-700 min-w-[100px]">
                      {field.fieldName}:
                    </label>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) =>
                        onFieldChange?.(
                          field.sectionType,
                          field.originalIndex,
                          e.target.value
                        )
                      }
                      className="flex-1 text-xs border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        onRemoveField?.(field.sectionType, field.originalIndex)
                      }
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 border-blue-200"
              >
                {selectedRows.length} row{selectedRows.length !== 1 ? "s" : ""}{" "}
                selected
              </Badge>
            </div>
          )}

          {/* AG Grid */}
          <div className="w-full overflow-hidden border border-gray-200 rounded-xl shadow-sm">
            <div
              style={{ height: "400px", width: "100%" }}
              className="ag-theme-alpine"
            >
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
