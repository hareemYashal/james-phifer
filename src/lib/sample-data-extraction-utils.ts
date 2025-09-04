// Sample data extraction utilities for processing extracted_fields
export interface ExtractedField {
  key: string;
  value: string;
  type: string;
  sample_id?: string;
  analysis_name?: string;
  checkbox_type?: string;
  page?: number;
  method?: string;
}

export interface SampleDataRow {
  id: string;
  sampleId: string;
  [key: string]: any;
}

// Field mappings for sample data columns
export const SAMPLE_FIELD_MAPPINGS: Record<string, string> = {
  customer_sample_id: "Customer Sample ID",
  matrix_type: "Matrix",
  grab: "Comp/Grab",
  composite_start_date: "Composite Start Date",
  composite_start_time: "Composite Start Time",
  collected_as_composite_end_date: "Composite or Collected End Date",
  collected_as_composite_end_time: "Composite or Collected End Time",
  num_cont: "# Cont",
  result: "Residual Chloride Result",
  units: "Residual Chloride Units",
  sample_comment: "Sample Comment",
};

/**
 * Extract sample data from extracted_fields array
 * Groups sample fields by sample_id and creates proper sample data rows
 */
export const extractSampleDataFromFields = (
  extractedFields: ExtractedField[]
): SampleDataRow[] => {
  //   console.log(
  //     "Starting sample data extraction from",
  //     extractedFields.length,
  //     "fields"
  //   );

  // Filter for sample_field type entries
  const sampleFields = extractedFields.filter(
    (field) => field.type === "sample_field" && field.sample_id
  );

  //   console.log("Found", sampleFields.length, "sample fields");

  // Group by sample_id
  const sampleGroups: Record<string, ExtractedField[]> = {};
  sampleFields.forEach((field) => {
    if (field.sample_id) {
      if (!sampleGroups[field.sample_id]) {
        sampleGroups[field.sample_id] = [];
      }
      sampleGroups[field.sample_id].push(field);
    }
  });

  //   console.log(
  //     "Grouped into",
  //     Object.keys(sampleGroups).length,
  //     "sample groups"
  //   );

  // Convert groups to sample data rows
  const sampleDataRows: SampleDataRow[] = [];

  Object.entries(sampleGroups).forEach(([sampleId, fields]) => {
    const sampleRow: SampleDataRow = {
      id: `sample_${sampleId}_${Date.now()}`,
      sampleId: sampleId,
    };

    // Process each field in the group
    fields.forEach((field) => {
      // Extract the field type from the key (remove sample_id suffix)
      const keyParts = field.key.split("_");
      // Remove the sample_id part (last part that matches the sample_id)
      const sampleIdParts = sampleId.toLowerCase().replace(/[^a-z0-9]/g, "");
      const keyWithoutSampleId = keyParts
        .filter(
          (part) =>
            !sampleId
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .includes(part.replace(/[^a-z0-9]/g, ""))
        )
        .join("_");

      // Map to display column name
      const displayName =
        SAMPLE_FIELD_MAPPINGS[keyWithoutSampleId] || keyWithoutSampleId;
      sampleRow[displayName] = field.value || "";
    });

    sampleDataRows.push(sampleRow);
  });

  // Also extract analysis requests (checkboxes)
  const analysisFields = extractedFields.filter(
    (field) =>
      field.type === "analysis_checkbox" &&
      field.sample_id &&
      field.value === "checked"
  );

  // Group analysis requests by sample_id
  const analysisGroups: Record<string, string[]> = {};
  analysisFields.forEach((field) => {
    if (field.sample_id && field.analysis_name) {
      if (!analysisGroups[field.sample_id]) {
        analysisGroups[field.sample_id] = [];
      }
      analysisGroups[field.sample_id].push(field.analysis_name);
    }
  });

  // Add analysis requests to sample rows
  sampleDataRows.forEach((row) => {
    const analysisRequests = analysisGroups[row.sampleId] || [];
    row["Analysis Request"] = analysisRequests.join(", ") || "";
  });

  console.log("Created", sampleDataRows.length, "sample data rows");
  return sampleDataRows;
};

/**
 * Get all unique column names from sample data
 */
export const getSampleDataColumns = (sampleData: SampleDataRow[]): string[] => {
  const columnSet = new Set<string>();

  sampleData.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (key !== "id" && key !== "sampleId") {
        columnSet.add(key);
      }
    });
  });

  // Return in a consistent order
  const columns = Array.from(columnSet).sort();

  // Put Customer Sample ID first if it exists
  if (columns.includes("Customer Sample ID")) {
    const filtered = columns.filter((col) => col !== "Customer Sample ID");
    return ["Customer Sample ID", ...filtered];
  }

  return columns;
};

/**
 * Create an empty sample row with all the expected columns
 */
export const createEmptySampleRow = (
  existingSampleData: SampleDataRow[]
): SampleDataRow => {
  const columns = getSampleDataColumns(existingSampleData);
  const emptyRow: SampleDataRow = {
    id: `new_sample_${Date.now()}`,
    sampleId: `NEW_${Date.now()}`,
  };

  columns.forEach((column) => {
    emptyRow[column] = "";
  });

  return emptyRow;
};
