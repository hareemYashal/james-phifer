import type { ExtractedField } from "./sample-data-extraction-utils";

// Data interfaces
export interface V2DataRowData {
  id: string;
  fieldName: string;
  value: string;
  confidence: number;
  section: string;
  type?: string;
  originalIndex?: number;
}

// Helper function to transform extracted_fields data (non-sample fields)
export const transformV2Data = (
  extractedFields: ExtractedField[]
): V2DataRowData[] => {
  const combinedData: V2DataRowData[] = [];

  console.log("transformV2Data input:", extractedFields.length, "fields");

  // Filter out sample_field and analysis_checkbox types as they are handled separately
  const nonSampleFields = extractedFields.filter(
    (field) =>
      field.type !== "sample_field" && field.type !== "analysis_checkbox"
  );

  // Transform non-sample extracted fields into grid rows
  nonSampleFields.forEach((field, index) => {
    // Determine section based on field type
    let section = "General Information";
    if (field.type === "checkbox") {
      section = "Checkboxes";
    } else if (field.type === "field") {
      section = "Form Fields";
    }

    combinedData.push({
      id: `field_${index}`,
      fieldName: field.key || "",
      value: field.value || "",
      confidence: 0.95, // Default confidence since it's not in the data
      section: section,
      type: field.type || "",
      originalIndex: index,
    });
  });

  console.log("transformV2Data output:", combinedData.length, "rows");
  return combinedData;
};
