import { formatEntityTypeToDisplayName } from "@/lib/utils";

// Data interfaces
export interface SampleDataRowData {
  id: string;
  customerSampleId: string;
  matrix: string;
  grab: string; // Added grab field
  compositeStartDate: string;
  compositeStartTime: string;
  method: string;
  sectionType?: string;
  originalIndex?: number;
}

export interface NonSampleFieldData {
  id: string;
  fieldName: string;
  value: string;
  confidence: number;
  sectionType: string;
  originalIndex: number;
}

// Transform data for AG Grid (matching custom table logic exactly)
export const transformSampleData = (
  collectedSampleDataInfo: any[]
): {
  sampleRows: SampleDataRowData[];
  nonSampleFields: NonSampleFieldData[];
} => {
  // Group items by sample number (1-10) and separate non-sample fields
  const groupedSamples: Record<string, any> = {};
  const nonSampleFields: NonSampleFieldData[] = [];

  // Helper function to extract grab type from matrix value
  const extractGrabFromMatrix = (matrixValue: string): { matrix: string; grab: string } => {
    // Remove any spaces
    const cleanValue = matrixValue.replace(/\s+/g, "");
    
    // First 2 chars are matrix, rest is grab
    const matrix = cleanValue.length >= 2 ? cleanValue.substring(0, 2) : cleanValue;
    const grab = cleanValue.length > 2 ? cleanValue.substring(2) : "";
    
    return { matrix, grab };
  };

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
        const matrixValue = matrix?.value || "";
        const { matrix: extractedMatrix, grab: extractedGrab } = extractGrabFromMatrix(matrixValue);
        
        allSampleRows.push({
          id: `${sampleNum}-analysis-request-fallback`,
          customerSampleId: sampleId?.value || "",
          matrix: extractedMatrix,
          grab: extractedGrab,
          compositeStartDate: startDate?.value || "",
          compositeStartTime: startTime?.value || "",
          method: analysisRequest.value || "",
          sectionType: "collectedSampleDataInfo",
          originalIndex: analysisRequest.originalIndex,
        });
      } else {
        const matrixValue = matrix?.value || "";
        const { matrix: extractedMatrix, grab: extractedGrab } = extractGrabFromMatrix(matrixValue);
        
        allSampleRows.push({
          id: `${sampleNum}-default`,
          customerSampleId: sampleId?.value || "",
          matrix: extractedMatrix,
          grab: extractedGrab,
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
        const matrixValue = matrix?.value || "";
        const { matrix: extractedMatrix, grab: extractedGrab } = extractGrabFromMatrix(matrixValue);
        
        allSampleRows.push({
          id: `${sampleNum}-${method.analysisNum}-${methodIndex}`,
          customerSampleId: sampleId?.value || "",
          matrix: extractedMatrix,
          grab: extractedGrab,
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
