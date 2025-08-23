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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Download, Plus, RefreshCw } from "lucide-react";

ModuleRegistry.registerModules([AllCommunityModule]);

// Sample data interface
interface RowData {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  startDate: string;
  status: "Active" | "Inactive" | "Pending";
  performance: number;
  projects: number;
}

// Custom cell renderers
const StatusCellRenderer = (params: any) => {
  const status = params.value;
  const variant =
    status === "Active"
      ? "default"
      : status === "Inactive"
      ? "destructive"
      : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
};

const SalaryCellRenderer = (params: any) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(params.value);
};

const PerformanceCellRenderer = (params: any) => {
  const value = params.value;
  const color =
    value >= 80
      ? "text-green-600"
      : value >= 60
      ? "text-yellow-600"
      : "text-red-600";
  return <span className={color}>{value}%</span>;
};

const ActionsCellRenderer = (params: any) => {
  const onEdit = () => {
    console.log("Edit row:", params.data);
  };

  const onDelete = () => {
    console.log("Delete row:", params.data);
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={onEdit}>
        Edit
      </Button>
      <Button size="sm" variant="destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Generate sample data
const generateSampleData = (): RowData[] => {
  const departments = [
    "Engineering",
    "Marketing",
    "Sales",
    "HR",
    "Finance",
    "Operations",
  ];
  const positions = [
    "Manager",
    "Senior",
    "Junior",
    "Lead",
    "Director",
    "Analyst",
  ];
  const statuses: ("Active" | "Inactive" | "Pending")[] = [
    "Active",
    "Inactive",
    "Pending",
  ];

  return Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    email: `employee${i + 1}@company.com`,
    department: departments[Math.floor(Math.random() * departments.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
    salary: Math.floor(Math.random() * 100000) + 40000,
    startDate: new Date(
      2020 + Math.floor(Math.random() * 4),
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    )
      .toISOString()
      .split("T")[0],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    performance: Math.floor(Math.random() * 40) + 60,
    projects: Math.floor(Math.random() * 10) + 1,
  }));
};

export function DataGrid() {
  const [rowData, setRowData] = useState<RowData[]>([]);
  const [selectedRows, setSelectedRows] = useState<RowData[]>([]);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [loading, setLoading] = useState(true);

  // Column definitions with advanced features
  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 100,
        pinned: "left",
        checkboxSelection: true,
        headerCheckboxSelection: true,
      },
      {
        field: "name",
        headerName: "Name",
        width: 180,
        pinned: "left",
        filter: "agTextColumnFilter",
        sortable: true,
        editable: true,
      },
      {
        field: "email",
        headerName: "Email",
        width: 250,
        filter: "agTextColumnFilter",
        sortable: true,
        editable: true,
      },
      {
        field: "department",
        headerName: "Department",
        width: 150,
        filter: "agSetColumnFilter",
        sortable: true,
        editable: true,
      },
      {
        field: "position",
        headerName: "Position",
        width: 140,
        filter: "agSetColumnFilter",
        sortable: true,
        editable: true,
      },
      {
        field: "salary",
        headerName: "Salary",
        width: 140,
        filter: "agNumberColumnFilter",
        sortable: true,
        editable: true,
        cellRenderer: SalaryCellRenderer,
        type: "numericColumn",
      },
      {
        field: "startDate",
        headerName: "Start Date",
        width: 150,
        filter: "agDateColumnFilter",
        sortable: true,
        editable: true,
        cellEditor: "agDateCellEditor",
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        filter: "agSetColumnFilter",
        sortable: true,
        editable: true,
        cellRenderer: StatusCellRenderer,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["Active", "Inactive", "Pending"],
        },
      },
      {
        field: "performance",
        headerName: "Performance",
        width: 140,
        filter: "agNumberColumnFilter",
        sortable: true,
        editable: true,
        cellRenderer: PerformanceCellRenderer,
        type: "numericColumn",
      },
      {
        field: "projects",
        headerName: "Projects",
        width: 120,
        filter: "agNumberColumnFilter",
        sortable: true,
        editable: true,
        type: "numericColumn",
      },
      {
        headerName: "Actions",
        width: 180,
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
      floatingFilter: true,
      minWidth: 100,
    }),
    []
  );

  // Load data on component mount
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setRowData(generateSampleData());
      setLoading(false);
    }, 1000);
  }, []);

  // Grid event handlers
  const onGridReady = useCallback((params: GridReadyEvent) => {
    // params.api.sizeColumnsToFit()
  }, []);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    setSelectedRows(event.api.getSelectedRows());
  }, []);

  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    console.log("Cell value changed:", event);
  }, []);

  // Action handlers
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setRowData(generateSampleData());
      setLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    // In a real app, you'd implement CSV/Excel export
    console.log(
      "Exporting data...",
      selectedRows.length > 0 ? selectedRows : rowData
    );
  };

  const handleDeleteSelected = () => {
    if (selectedRows.length > 0) {
      setRowData((prev) =>
        prev.filter(
          (row) => !selectedRows.some((selected) => selected.id === row.id)
        )
      );
      setSelectedRows([]);
    }
  };

  const handleAddNew = () => {
    const newRow: RowData = {
      id: Math.max(...rowData.map((r) => r.id)) + 1,
      name: "New Employee",
      email: "new@company.com",
      department: "Engineering",
      position: "Junior",
      salary: 50000,
      startDate: new Date().toISOString().split("T")[0],
      status: "Pending",
      performance: 75,
      projects: 1,
    };
    setRowData((prev) => [newRow, ...prev]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Employee Data Grid</span>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button onClick={handleAddNew} size="sm">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
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
            <div style={{ height: "600px", width: "100%" }}>
              <AgGridReact
                theme={themeQuartz}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
                onCellValueChanged={onCellValueChanged}
                rowSelection="multiple"
                suppressRowClickSelection={true}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                quickFilterText={quickFilterText}
                animateRows={true}
                loading={loading}
                suppressHorizontalScroll={false}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
