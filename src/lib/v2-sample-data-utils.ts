import type { ColDef } from "ag-grid-community";

// Data interfaces for V2 Sample Data Grid - now dynamic
export interface V2SampleDataRowData {
    id: string;
    [key: string]: any; // Allow dynamic properties
}

// Generate dynamic column definitions based on actual data structure
export const generateDynamicColumnDefs = (sampleDataArray: any[], ActionCellRenderer?: any): ColDef[] => {
    if (!sampleDataArray || sampleDataArray.length === 0) {
        return [];
    }

    const firstItem = sampleDataArray[0];
    const columnDefs: ColDef[] = [];

    // Extract all keys from the first object to create columns
    Object.keys(firstItem).forEach((key, index) => {
        columnDefs.push({
            field: key,
            headerName: key,
            cellDataType: "text",
            width: Math.max(120, Math.min(200, key.length * 10 + 80)), // Dynamic width based on content
            filter: "agTextColumnFilter",
            sortable: true,
            editable: true,
            headerTooltip: key,
            // Pin the first column to the left for better UX
            ...(index === 0 ? { pinned: "left" } : {})
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

// Transform data for AG Grid - now fully dynamic
export const transformV2SampleData = (
    sampleDataArray: any[]
): V2SampleDataRowData[] => {
    if (!sampleDataArray || sampleDataArray.length === 0) {
        return [];
    }

    return sampleDataArray.map((item, index) => {
        const transformedItem: V2SampleDataRowData = {
            id: `sample_${index}_${Date.now()}`,
        };

        // Dynamically transform all properties from the source data - use keys directly
        Object.keys(item).forEach(key => {
            transformedItem[key] = item[key] || "";
        });

        return transformedItem;
    });
};

// Helper function to create a new empty row with all the dynamic fields
export const createEmptyRow = (sampleDataArray: any[]): V2SampleDataRowData => {
    if (!sampleDataArray || sampleDataArray.length === 0) {
        return {
            id: `new_${Date.now()}`,
        };
    }

    const firstItem = sampleDataArray[0];
    const emptyRow: V2SampleDataRowData = {
        id: `new_${Date.now()}`,
    };

    // Create empty fields for all columns found in the data
    Object.keys(firstItem).forEach(key => {
        emptyRow[key] = "";
    });

    return emptyRow;
};
