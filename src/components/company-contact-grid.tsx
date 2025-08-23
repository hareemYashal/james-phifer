"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { themeQuartz } from "ag-grid-community";
import type {
  ColDef,
  GridReadyEvent,
  SelectionChangedEvent,
} from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Download } from "lucide-react";
import { formatEntityTypeToDisplayName } from "@/lib/utils";

ModuleRegistry.registerModules([AllCommunityModule]);

// Data interface
interface CompanyContactRowData {
  id: string;
  fieldName: string;
  value: string;
  confidence: number;
  section: string;
  sectionType?: string;
  originalIndex?: number;
}

interface CompanyContactGridProps {
  categorizedSections?: {
    companyLocationInfo: any[];
    contactProjectInfo: any[];
  };
  onFieldChange?: (sectionType: string, index: number, value: string) => void;
  onRemoveField?: (sectionType: string, index: number) => void;
}

// Custom cell renderers
const ConfidenceCellRenderer = (params: any) => {
  const confidence = params.value;
  const percentage = Math.round(confidence * 100);
  const color =
    percentage >= 90
      ? "text-green-600"
      : percentage >= 70
      ? "text-yellow-600"
      : "text-red-600";
  return <span className={color}>{percentage}%</span>;
};

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
const transformCompanyContactData = (
  companyLocationInfo: any[],
  contactProjectInfo: any[]
): CompanyContactRowData[] => {
  const combinedData: CompanyContactRowData[] = [];

  // Add company location info
  companyLocationInfo.forEach((item, index) => {
    combinedData.push({
      id: `company_${index}`,
      fieldName: formatEntityTypeToDisplayName(item.type),
      value: item.value || "",
      confidence: item.confidence || 0.9,
      section: "Company & Location Information",
      sectionType: "companyLocationInfo",
      originalIndex: index,
    });
  });

  // Add contact project info
  contactProjectInfo.forEach((item, index) => {
    combinedData.push({
      id: `contact_${index}`,
      fieldName: formatEntityTypeToDisplayName(item.type),
      value: item.value || "",
      confidence: item.confidence || 0.9,
      section: "Contact & Project Information",
      sectionType: "contactProjectInfo",
      originalIndex: index,
    });
  });

  return combinedData;
};

export function CompanyContactGrid({
  categorizedSections = {
    companyLocationInfo: [],
    contactProjectInfo: [],
  },
  onFieldChange,
  onRemoveField,
}: CompanyContactGridProps) {
  const [companyContactData, setCompanyContactData] = useState<
    CompanyContactRowData[]
  >([]);
  const [selectedRows, setSelectedRows] = useState<CompanyContactRowData[]>([]);
  const [quickFilterText, setQuickFilterText] = useState("");

  // Column definitions
  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "fieldName",
        headerName: "Field Name",
        width: 200,
        pinned: "left",
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        field: "value",
        headerName: "Value",
        width: 300,
        filter: "agTextColumnFilter",
        sortable: true,
        editable: true,
        onCellValueChanged: (params) => {
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
        field: "confidence",
        headerName: "Confidence",
        width: 120,
        filter: "agNumberColumnFilter",
        sortable: true,
        cellRenderer: ConfidenceCellRenderer,
        type: "numericColumn",
      },
      {
        field: "section",
        headerName: "Section",
        width: 200,
        filter: "agSetColumnFilter",
        sortable: true,
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
    [onFieldChange]
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
      const companyContactTransformed = transformCompanyContactData(
        categorizedSections.companyLocationInfo || [],
        categorizedSections.contactProjectInfo || []
      );

      // If no real data, add some sample data to show the table working
      if (companyContactTransformed.length === 0) {
        const sampleCompanyData: CompanyContactRowData[] = [
          {
            id: "sample_1",
            fieldName: "Company Name",
            value: "Pinnacle Consultants",
            confidence: 1.0,
            section: "Company & Location Information",
            sectionType: "companyLocationInfo",
            originalIndex: 0,
          },
          {
            id: "sample_2",
            fieldName: "Street Address",
            value: "32 Hill Road Greer sc 29602",
            confidence: 1.0,
            section: "Company & Location Information",
            sectionType: "companyLocationInfo",
            originalIndex: 1,
          },
          {
            id: "sample_3",
            fieldName: "Customer Project #",
            value: "P-102",
            confidence: 1.0,
            section: "Company & Location Information",
            sectionType: "companyLocationInfo",
            originalIndex: 2,
          },
          {
            id: "sample_4",
            fieldName: "Project Name",
            value: "WellInvestigation",
            confidence: 1.0,
            section: "Company & Location Information",
            sectionType: "companyLocationInfo",
            originalIndex: 3,
          },
          {
            id: "sample_5",
            fieldName: "Contact/Report To",
            value: "Ted Jeffcoat",
            confidence: 1.0,
            section: "Contact & Project Information",
            sectionType: "contactProjectInfo",
            originalIndex: 0,
          },
          {
            id: "sample_6",
            fieldName: "Phone #",
            value: "803-232-XXXX",
            confidence: 1.0,
            section: "Contact & Project Information",
            sectionType: "contactProjectInfo",
            originalIndex: 1,
          },
        ];
        setCompanyContactData(sampleCompanyData);
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

  // Action handlers
  const handleExport = () => {
    console.log("Exporting company contact data...", companyContactData);
  };

  const handleDeleteSelected = () => {
    if (selectedRows.length > 0 && onRemoveField) {
      selectedRows.forEach((row) => {
        if (row.sectionType && row.originalIndex !== undefined) {
          onRemoveField(row.sectionType, row.originalIndex);
        }
      });
      setSelectedRows([]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Company & Location + Contact & Project Information</span>
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
          {/* Quick Filter */}
          <div className="flex items-center gap-4">
            <Input
              placeholder="Quick filter..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="max-w-sm"
            />
            {selectedRows.length > 0 && (
              <Badge variant="secondary">
                {selectedRows.length} row{selectedRows.length !== 1 ? "s" : ""}{" "}
                selected
              </Badge>
            )}
          </div>

          {/* AG Grid */}
          <div className="w-full overflow-hidden border rounded-lg">
            <div style={{ height: "400px", width: "100%" }}>
              <AgGridReact
                theme={themeQuartz}
                rowData={companyContactData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
                rowSelection="multiple"
                suppressRowClickSelection={true}
                quickFilterText={quickFilterText}
                animateRows={true}
                context={{ onRemoveField }}
                enterNavigatesVertically={true}
                enterNavigatesVerticallyAfterEdit={true}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
